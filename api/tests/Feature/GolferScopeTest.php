<?php

use App\Auth\CurrentGolfer;
use App\Auth\NoCurrentGolfer;
use App\Models\Round;

it('throws when a golfer-owned model is queried with no current golfer', function () {
    Round::query()->get();
})->throws(NoCurrentGolfer::class);

it('shows a signed-in golfer only their own rows', function () {
    $mine = golfer();
    $theirs = golfer();
    app(CurrentGolfer::class)->set($theirs);
    Round::factory()->create(['course_name' => 'Theirs']);
    app(CurrentGolfer::class)->set($mine);
    Round::factory()->create(['course_name' => 'Mine']);
    app(CurrentGolfer::class)->clear();

    $this->actingAs($mine)->get('/rounds')->assertInertia(fn ($page) => $page
        ->has('rounds', 1)
        ->where('rounds.0.course_name', 'Mine'));
});

it('fills in the owner on create', function () {
    $golfer = golfer();
    app(CurrentGolfer::class)->set($golfer);

    expect(Round::factory()->create()->user_id)->toBe($golfer->id);
});

it('refuses to create a row owned by another golfer', function () {
    app(CurrentGolfer::class)->set(golfer());

    Round::factory()->create(['user_id' => golfer()->id]);
})->throws(LogicException::class);
