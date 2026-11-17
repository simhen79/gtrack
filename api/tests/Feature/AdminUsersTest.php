<?php

use App\Mail\Invitation;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(fn () => Mail::fake());

it('lists users with their roles and last sign-in', function () {
    $admin = admin();
    $golfer = golfer();
    signInWithCode($golfer);
    $invited = User::factory()->create()->assignRole('golfer');

    $this->actingAs($admin)->get('/admin/users')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users')
            ->has('users', 3)
            ->where('users', fn ($users) => collect($users)->firstWhere('email', $golfer->email)['last_signed_in_at'] !== null
                && collect($users)->firstWhere('email', $invited->email)['last_signed_in_at'] === null
                && collect($users)->firstWhere('email', $admin->email)['roles'] === ['admin', 'golfer']));
});

it('denies the Users screen to a golfer without users.manage', function () {
    $this->actingAs(golfer())->get('/admin/users')->assertForbidden();
});

it('shares the signed-in user\'s permission names with every page', function () {
    $this->actingAs(golfer())->get('/')
        ->assertInertia(fn (Assert $page) => $page->where('auth.permissions', ['catalogue.read']));

    $this->actingAs(admin())->get('/')
        ->assertInertia(fn (Assert $page) => $page->where('auth.permissions', fn ($names) => collect($names)->sort()->values()->all() === [
            'catalogue.read', 'catalogue.write', 'drafts.manage', 'usage.read_all', 'users.manage',
        ]));
});

it('invites a golfer by email', function () {
    $this->actingAs(admin())->post('/admin/users', ['email' => 'New.Golfer@Example.com'])
        ->assertRedirect('/admin/users');

    $invited = User::where('email', 'new.golfer@example.com')->sole();
    expect($invited->getRoleNames()->all())->toBe(['golfer']);
    Mail::assertSent(Invitation::class, fn (Invitation $mail) => $mail->hasTo('new.golfer@example.com'));
});

it('refuses to invite an email that already has a user', function () {
    $golfer = golfer();

    $this->actingAs(admin())->post('/admin/users', ['email' => $golfer->email])->assertSessionHasErrors('email');

    Mail::assertNothingSent();
});

it('re-sends an unused invite', function () {
    $invited = User::factory()->create()->assignRole('golfer');

    $this->actingAs(admin())->post("/admin/users/{$invited->id}/invite")->assertRedirect('/admin/users');

    Mail::assertSent(Invitation::class, fn (Invitation $mail) => $mail->hasTo($invited->email));
});

it('does not re-send an invite that has been used', function () {
    $golfer = golfer();
    signInWithCode($golfer);

    $this->actingAs(admin())->post("/admin/users/{$golfer->id}/invite")->assertSessionHasErrors('invite');

    Mail::assertNotSent(Invitation::class);
});

it('adds and removes roles', function () {
    $golfer = golfer();
    $this->actingAs(admin());

    $this->put("/admin/users/{$golfer->id}/roles", ['roles' => ['admin', 'golfer']])->assertSessionHasNoErrors();
    expect($golfer->fresh()->hasRole('admin'))->toBeTrue();

    $this->put("/admin/users/{$golfer->id}/roles", ['roles' => ['golfer']])->assertSessionHasNoErrors();
    expect($golfer->fresh()->hasRole('admin'))->toBeFalse();
});

it('refuses a role that does not exist', function () {
    $golfer = golfer();

    $this->actingAs(admin())->put("/admin/users/{$golfer->id}/roles", ['roles' => ['owner']])->assertSessionHasErrors('roles.0');
});

it('disables a golfer, ending their web sessions at once and keeping their data', function () {
    $golfer = golfer();
    $session = signInWithCode($golfer);

    $this->actingAs(admin())->post("/admin/users/{$golfer->id}/disable")->assertRedirect('/admin/users');

    fromBrowser($session)->get('/')->assertRedirect('/login');
    expect($golfer->fresh()->disabled_at)->not->toBeNull();
});

it('re-enables a disabled golfer so they can sign in again', function () {
    $golfer = User::factory()->disabled()->create()->assignRole('golfer');

    $this->actingAs(admin())->post("/admin/users/{$golfer->id}/enable")->assertRedirect('/admin/users');

    fromBrowser(signInWithCode($golfer))->get('/')->assertOk();
});

it('refuses to remove the admin role from the last admin', function () {
    $admin = admin();

    $this->actingAs($admin)->put("/admin/users/{$admin->id}/roles", ['roles' => ['golfer']])->assertSessionHasErrors('roles');

    expect($admin->fresh()->hasRole('admin'))->toBeTrue();
});

it('refuses to disable the last admin', function () {
    $admin = admin();

    $this->actingAs($admin)->post("/admin/users/{$admin->id}/disable")->assertSessionHasErrors('disable');

    expect($admin->fresh()->disabled_at)->toBeNull();
});

it('does not count a disabled admin towards keeping one', function () {
    $admin = admin();
    User::factory()->disabled()->create()->assignRole('admin');

    $this->actingAs($admin)->post("/admin/users/{$admin->id}/disable")->assertSessionHasErrors('disable');
});

it('lets one of two admins step down', function () {
    $admin = admin();
    admin();

    $this->actingAs($admin)->put("/admin/users/{$admin->id}/roles", ['roles' => ['golfer']])->assertSessionHasNoErrors();

    expect($admin->fresh()->hasRole('admin'))->toBeFalse();
});

it('signs a disabled user out on their next request even if their session survived', function () {
    $golfer = golfer();
    $session = signInWithCode($golfer);

    // Disabled without the session rows being removed, as a different session driver would leave them.
    $golfer->forceFill(['disabled_at' => now()])->save();

    fromBrowser($session)->get('/')->assertRedirect('/login');
});
