<?php

use App\Models\Round;

it('lets a golfer with no Baselines add one inline at their first Round, and makes it their default', function () {
    $this->actingAs(golfer())
        ->post('/rounds', roundFields(['new_baseline' => 'Scratch']))
        ->assertRedirect('/rounds');

    $this->get('/rounds')->assertInertia(fn ($page) => $page
        ->component('rounds/index')
        ->has('rounds', 1)
        ->where('rounds.0.course_name', 'Royal Johannesburg East')
        ->where('rounds.0.baseline', 'Scratch')
        ->where('rounds.0.sg_total', '-1.90'));

    $this->get('/rounds/create')->assertInertia(fn ($page) => $page
        ->component('rounds/edit')
        ->has('baselines', 1)
        ->where('baselines.0.name', 'Scratch')
        ->where('baselines.0.is_default', true));
});

it('pre-fills a new Round with the course and handicap details of the last Round', function () {
    $this->actingAs(golfer());
    $this->post('/rounds', roundFields(['new_baseline' => 'Scratch', 'played_on' => '2026-11-01', 'course_name' => 'Older Course']));
    $this->post('/rounds', roundFields(['new_baseline' => 'Tour', 'played_on' => '2026-11-15', 'holes' => 9, 'par' => 36, 'tees' => 'Blue', 'handicap_index' => '11.8', 'course_handicap' => 6]));
    $tour = $this->get('/rounds/create')->inertiaProps('baselines.1');

    $this->travelTo('2026-11-17 22:30', fn () => $this->get('/rounds/create')->assertInertia(fn ($page) => $page
        ->where('round.id', null)
        ->where('round.played_on', '2026-11-18')
        ->where('round.course_name', 'Royal Johannesburg East')
        ->where('round.holes', 9)
        ->where('round.tees', 'Blue')
        ->where('round.par', 36)
        ->where('round.handicap_index', '11.8')
        ->where('round.course_handicap', 6)
        ->where('round.baseline_id', $tour['id'])
        ->where('round.score', null)
        ->where('round.sg_putting', null)));
});

it('starts a golfer\'s first Round with nothing carried over but 18 holes', function () {
    $this->actingAs(golfer())->get('/rounds/create')->assertInertia(fn ($page) => $page
        ->where('round.course_name', '')
        ->where('round.holes', 18)
        ->where('round.handicap_index', null)
        ->where('round.baseline_id', null)
        ->has('baselines', 0));
});

it('refuses a Round missing required fields and names each one', function () {
    $this->actingAs(golfer())
        ->post('/rounds', ['tees' => 'White'])
        ->assertSessionHasErrors([
            'played_on' => 'The date field is required.',
            'course_name' => 'The course field is required.',
            'holes' => 'The holes field is required.',
            'score' => 'The Score field is required.',
            'handicap_index' => 'The Handicap Index field is required.',
            'course_handicap' => 'The Course Handicap field is required.',
            'baseline_id' => 'Pick a Baseline or add a new one.',
            'sg_off_the_tee' => 'The Off the Tee field is required.',
            'sg_approach' => 'The Approach field is required.',
            'sg_short_game' => 'The Short Game field is required.',
            'sg_putting' => 'The Putting field is required.',
        ]);

    $this->get('/rounds')->assertInertia(fn ($page) => $page->has('rounds', 0));
});

it('saves a Round without tees or par', function () {
    $this->actingAs(golfer())
        ->post('/rounds', roundFields(['new_baseline' => 'Scratch', 'tees' => null, 'par' => null]))
        ->assertSessionHasNoErrors();

    $this->get('/rounds')->assertInertia(fn ($page) => $page->has('rounds', 1));
});

it('refuses holes other than 9 or 18, and Strokes Gained past two decimals', function (array $bad, string $field) {
    $this->actingAs(golfer())
        ->post('/rounds', roundFields(['new_baseline' => 'Scratch', ...$bad]))
        ->assertSessionHasErrors($field);
})->with([
    'holes 12' => [['holes' => 12], 'holes'],
    'three decimals' => [['sg_approach' => '-1.255'], 'sg_approach'],
    'not a number' => [['sg_putting' => '1,05'], 'sg_putting'],
    'two decimal points' => [['sg_putting' => '1.2.3'], 'sg_putting'],
]);

it('refuses a Baseline that belongs to another golfer', function () {
    $other = golfer();
    $this->actingAs($other)->post('/rounds', roundFields(['new_baseline' => 'Theirs']));
    $theirs = $this->get('/rounds/create')->inertiaProps('baselines.0.id');

    $this->actingAs(golfer())
        ->post('/rounds', roundFields(['baseline_id' => $theirs]))
        ->assertSessionHasErrors('baseline_id');
});

it('opens a saved Round for editing and saves the change', function () {
    $this->actingAs(golfer());
    $id = enterRound();
    $baseline = $this->get("/rounds/{$id}/edit")->assertInertia(fn ($page) => $page
        ->component('rounds/edit')
        ->where('round.id', $id)
        ->where('round.score', 84)
        ->where('round.sg_approach', '-2.10'))
        ->inertiaProps('round.baseline_id');

    $this->put("/rounds/{$id}", roundFields(['baseline_id' => $baseline, 'score' => 81, 'sg_approach' => '-0.75']))
        ->assertRedirect('/rounds');

    $this->get("/rounds/{$id}/edit")->assertInertia(fn ($page) => $page
        ->where('round.score', 81)
        ->where('round.sg_approach', '-0.75'));
});

it('returns an Edit Round that wasn’t saved to its form, with each field’s own error', function () {
    $this->actingAs(golfer());
    $id = enterRound();
    $baseline = $this->get("/rounds/{$id}/edit")->inertiaProps('round.baseline_id');

    $this->from("/rounds/{$id}/edit")->followingRedirects()
        ->put("/rounds/{$id}", roundFields(['baseline_id' => $baseline, 'score' => null, 'sg_putting' => '1,05']))
        ->assertInertia(fn ($page) => $page
            ->component('rounds/edit')
            ->where('round.id', $id)
            ->where('errors.score', 'The Score field is required.')
            ->has('errors.sg_putting')
            ->missing('errors.course_name'));
});

it('deletes a Round', function () {
    $this->actingAs(golfer());
    $id = enterRound();

    $this->delete("/rounds/{$id}")->assertRedirect('/rounds');

    $this->get('/rounds')->assertInertia(fn ($page) => $page->has('rounds', 0));
    $this->get("/rounds/{$id}/edit")->assertNotFound();
});

it('never shows, opens, changes or deletes another golfer\'s Round', function () {
    assertGolferIsolation(
        fn () => Round::factory()->create(),
        fn (Round $round) => [
            test()->get("/rounds/{$round->id}/edit"),
            test()->put("/rounds/{$round->id}", roundFields(['new_baseline' => 'Mine'])),
            test()->delete("/rounds/{$round->id}"),
        ],
    );

    $this->get('/rounds')->assertInertia(fn ($page) => $page->has('rounds', 0));
});

it('offers the courses of the golfer\'s earlier Rounds, newest first, with the tees played at each', function () {
    $this->actingAs(golfer());
    enterRound(['played_on' => '2026-10-01', 'course_name' => 'Houghton', 'tees' => 'Blue']);
    $baseline = $this->get('/rounds/create')->inertiaProps('round.baseline_id');
    foreach ([
        ['played_on' => '2026-10-08', 'course_name' => 'Royal Johannesburg East', 'tees' => 'White'],
        ['played_on' => '2026-10-15', 'course_name' => 'Houghton', 'tees' => 'White'],
        ['played_on' => '2026-10-22', 'course_name' => 'Houghton', 'tees' => null],
        ['played_on' => '2026-10-29', 'course_name' => 'Houghton', 'tees' => 'Blue'],
    ] as $round) {
        $this->post('/rounds', roundFields(['baseline_id' => $baseline, ...$round]))->assertSessionHasNoErrors();
    }

    $this->get('/rounds/create')->assertInertia(fn ($page) => $page->where('courses', [
        ['name' => 'Houghton', 'tees' => ['Blue', 'White']],
        ['name' => 'Royal Johannesburg East', 'tees' => ['White']],
    ]));
    $id = $this->get('/rounds')->inertiaProps('rounds.0.id');
    $this->get("/rounds/{$id}/edit")->assertInertia(fn ($page) => $page->has('courses', 2));

    $this->actingAs(golfer())->get('/rounds/create')->assertInertia(fn ($page) => $page->where('courses', []));
});
