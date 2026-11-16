<?php

use App\Auth\CurrentGolfer;
use App\Auth\NoCurrentGolfer;
use App\Models\Concerns\BelongsToGolfer;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;

/**
 * A stand-in golfer-owned model until real ones exist. Remove this file's fixture
 * once Rounds arrive: assertGolferIsolation() on their endpoints takes over.
 */
class ScopeFixtureNote extends Model
{
    use BelongsToGolfer, HasUuids;

    protected $table = 'scope_fixture_notes';

    protected $guarded = [];
}

beforeEach(function () {
    // Temporary tables don't commit the RefreshDatabase transaction on MariaDB.
    DB::statement('DROP TEMPORARY TABLE IF EXISTS scope_fixture_notes');
    Schema::create('scope_fixture_notes', function (Blueprint $table) {
        $table->temporary();
        $table->uuid('id')->primary();
        $table->foreignUuid('user_id');
        $table->string('body');
        $table->timestamps();
    });

    Route::middleware(['web', 'auth'])->get('/_fixture/notes', fn () => ScopeFixtureNote::pluck('body'));
});

it('throws when a golfer-owned model is queried with no current golfer', function () {
    ScopeFixtureNote::query()->get();
})->throws(NoCurrentGolfer::class);

it('shows a signed-in golfer only their own rows', function () {
    $mine = golfer();
    $theirs = golfer();
    app(CurrentGolfer::class)->set($theirs);
    ScopeFixtureNote::create(['body' => 'theirs']);
    app(CurrentGolfer::class)->set($mine);
    ScopeFixtureNote::create(['body' => 'mine']);
    app(CurrentGolfer::class)->clear();

    $this->actingAs($mine)->get('/_fixture/notes')->assertExactJson(['mine']);
});

it('fills in the owner on create', function () {
    $golfer = golfer();
    app(CurrentGolfer::class)->set($golfer);

    expect(ScopeFixtureNote::create(['body' => 'a note'])->user_id)->toBe($golfer->id);
});
