<?php

use App\Auth\CurrentGolfer;
use App\Models\Baseline;
use App\Models\GameVersion;
use App\Models\Round;
use App\Models\Setting;
use App\Models\SgBand;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(fn () => Notification::fake());

// No assertGolferIsolation here: the endpoint takes no record id, only the signed-in
// golfer's own account. The second golfer's rows surviving is checked below instead.

/**
 * Every row in the database that points at this user, whichever column names
 * them: a golfer-owned `user_id`, or a morph id such as a token's or a role's.
 *
 * @return array<string, int> row counts by table, only where there are rows
 */
function rowsOwnedBy(User $user): array
{
    $columns = DB::table('information_schema.columns')
        ->where('table_schema', DB::getDatabaseName())
        ->whereIn('column_name', ['user_id', 'tokenable_id', 'authenticatable_id', 'model_id'])
        ->get(['table_name as table', 'column_name as column']);

    return $columns
        ->mapWithKeys(fn ($column) => [$column->table => DB::table($column->table)->where($column->column, $user->id)->count()])
        ->filter()
        ->all();
}

/**
 * A Baseline, a Round on it with advanced stats, settings defaulting to it, and a
 * Variation written for them, as a golfer builds them up.
 */
function withGolferData(User $user): User
{
    app(CurrentGolfer::class)->set($user);
    $baseline = Baseline::factory()->create();
    Round::factory()->for($baseline)->create()->saveAdvancedStats(['penalties' => 1], [SgBand::value('id') => '-0.25']);
    Setting::sole()->forceFill(['default_baseline_id' => $baseline->id])->save();
    GameVersion::factory()->published()->create()->variations()->make(['wording' => 'Aim at the left flag', 'is_plain' => false])
        ->forceFill(['user_id' => $user->id])
        ->save();
    app(CurrentGolfer::class)->clear();

    return $user;
}

it('shows the Settings page', function () {
    $this->actingAs(golfer())->get('/settings')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('settings/index'));
});

it('deletes every row the golfer owns and leaves shared rows and other golfers alone', function () {
    $golfer = withGolferData(golfer());
    $other = withGolferData(golfer());
    $session = signInWithCode($golfer);
    phoneToken($golfer);
    $this->postJson('/api/login/code', ['email' => $golfer->email]); // a code they never used
    expect(rowsOwnedBy($golfer))->toHaveKeys(['rounds', 'round_stats', 'round_sg_bands', 'baselines', 'settings', 'sessions', 'personal_access_tokens', 'one_time_passwords', 'model_has_roles', 'variations']);
    $otherRows = rowsOwnedBy($other);

    fromBrowser($session)->delete('/settings/account', ['confirm' => true])->assertRedirect('/login');

    expect(User::find($golfer->id))->toBeNull()
        ->and(rowsOwnedBy($golfer))->toBe([])
        ->and(rowsOwnedBy($other))->toBe($otherRows)
        ->and(Role::pluck('name')->sort()->values()->all())->toBe(['admin', 'golfer']);
});

it('rejects the deleted account\'s web session and phone token', function () {
    $golfer = golfer();
    $session = signInWithCode($golfer);
    $token = phoneToken($golfer);

    fromBrowser($session)->delete('/settings/account', ['confirm' => true])->assertRedirect('/login');

    fromBrowser($session)->get('/')->assertRedirect('/login');
    fromPhone($token)->getJson('/api/me')->assertUnauthorized();
});

it('asks for the deletion to be confirmed first', function () {
    $golfer = golfer();
    $this->actingAs($golfer);

    $this->delete('/settings/account')->assertSessionHasErrors('confirm');
    $this->delete('/settings/account', ['confirm' => false])->assertSessionHasErrors('confirm');

    expect($golfer->fresh())->not->toBeNull();
});

it('refuses to delete the last admin', function () {
    $admin = admin();
    User::factory()->disabled()->create()->assignRole('admin');

    $this->actingAs($admin)->delete('/settings/account', ['confirm' => true])->assertSessionHasErrors('account');

    expect($admin->fresh())->not->toBeNull();
});

it('lets one of two admins delete their account', function () {
    $admin = admin();
    admin();

    fromBrowser(signInWithCode($admin))->delete('/settings/account', ['confirm' => true])->assertRedirect('/login');

    expect($admin->fresh())->toBeNull();
});
