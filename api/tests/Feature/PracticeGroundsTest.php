<?php

use App\Models\Facility;
use App\Models\Feature;
use App\Models\PracticeGround;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

function facilityId(string $key): string
{
    return Facility::where('key', $key)->value('id');
}

function featureId(string $facilityKey, string $key): string
{
    return Feature::where('facility_id', facilityId($facilityKey))->where('key', $key)->value('id');
}

/**
 * A Practice Ground as the editor posts it, linking reference rows by id.
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function practiceGroundFields(array $overrides = []): array
{
    return [
        'name' => 'Home club',
        'note' => 'The chipping green slopes back to front.',
        'facility_ids' => [facilityId('range_bay'), facilityId('putting_green')],
        'feature_ids' => [featureId('range_bay', 'target_flags'), featureId('putting_green', 'slopes')],
        ...$overrides,
    ];
}

it('saves a named Practice Ground with its Facilities, their features and a note', function () {
    $this->actingAs(golfer())
        ->post('/practice-grounds', practiceGroundFields())
        ->assertRedirect('/practice-grounds');

    $this->get('/practice-grounds')->assertInertia(fn (Assert $page) => $page
        ->component('practice-grounds/index')
        ->has('practice_grounds', 1)
        ->where('practice_grounds.0.name', 'Home club')
        ->where('practice_grounds.0.note', 'The chipping green slopes back to front.')
        ->where('practice_grounds.0.facility_ids', [facilityId('range_bay'), facilityId('putting_green')])
        ->where('practice_grounds.0.feature_ids', [featureId('range_bay', 'target_flags'), featureId('putting_green', 'slopes')])
        ->where('practice_grounds.0.archived_at', null)
        ->has('facilities', 4)
        ->where('editing', null));
});

it('refuses a chipping-area feature on a Practice Ground with a putting green but no chipping area', function () {
    $this->actingAs(golfer());
    $this->post('/practice-grounds', practiceGroundFields(['facility_ids' => [facilityId('putting_green')], 'feature_ids' => []]));
    $id = $this->get('/practice-grounds')->inertiaProps('practice_grounds.0.id');

    $this->from("/practice-grounds/{$id}/edit")
        ->put("/practice-grounds/{$id}", practiceGroundFields([
            'facility_ids' => [facilityId('putting_green')],
            'feature_ids' => [featureId('chipping_area', 'green_with_hole')],
        ]))
        ->assertRedirect("/practice-grounds/{$id}/edit")
        ->assertSessionHasErrors(['feature_ids' => 'Pick features only on the Facilities this Practice Ground has.']);

    $this->get("/practice-grounds/{$id}/edit")->assertInertia(fn (Assert $page) => $page
        ->where('editing.id', $id)
        ->where('editing.facility_ids', [facilityId('putting_green')])
        ->where('editing.feature_ids', []));
});

it('saves an edited Practice Ground in place, dropping a Facility\'s features with it', function () {
    $this->actingAs(golfer());
    $this->post('/practice-grounds', practiceGroundFields());
    $id = $this->get('/practice-grounds')->inertiaProps('practice_grounds.0.id');

    $this->put("/practice-grounds/{$id}", practiceGroundFields([
        'name' => 'Home club, back range',
        'note' => null,
        'facility_ids' => [facilityId('putting_green'), facilityId('practice_bunker')],
        'feature_ids' => [featureId('putting_green', 'course_18')],
    ]))->assertRedirect('/practice-grounds');

    $this->get('/practice-grounds')->assertInertia(fn (Assert $page) => $page
        ->has('practice_grounds', 1)
        ->where('practice_grounds.0.id', $id)
        ->where('practice_grounds.0.name', 'Home club, back range')
        ->where('practice_grounds.0.note', null)
        ->where('practice_grounds.0.facility_ids', [facilityId('putting_green'), facilityId('practice_bunker')])
        ->where('practice_grounds.0.feature_ids', [featureId('putting_green', 'course_18')]));
});

it('opens the editor empty to add a Practice Ground', function () {
    $this->actingAs(golfer())->get('/practice-grounds/create')->assertInertia(fn (Assert $page) => $page
        ->component('practice-grounds/index')
        ->where('adding', true)
        ->where('editing', null));
});

it('hides an archived Practice Ground from the list but still loads it, and restores it', function () {
    $this->actingAs(golfer());
    $this->post('/practice-grounds', practiceGroundFields(['name' => 'Old municipal course']));
    $this->post('/practice-grounds', practiceGroundFields(['name' => 'Home club']));
    $id = $this->get('/practice-grounds')->inertiaProps('practice_grounds.1.id');

    $this->post("/practice-grounds/{$id}/archive")->assertRedirect('/practice-grounds');

    $this->get('/practice-grounds')->assertInertia(fn (Assert $page) => $page
        ->has('practice_grounds', 1)
        ->where('practice_grounds.0.name', 'Home club')
        ->has('archived', 1)
        ->where('archived.0.id', $id)
        ->where('archived.0.archived_at', fn (?string $at) => $at !== null));
    $this->get("/practice-grounds/{$id}/edit")->assertInertia(fn (Assert $page) => $page
        ->where('editing.name', 'Old municipal course')
        ->where('editing.facility_ids', [facilityId('range_bay'), facilityId('putting_green')]));

    $this->post("/practice-grounds/{$id}/restore")->assertRedirect('/practice-grounds');

    $this->get('/practice-grounds')->assertInertia(fn (Assert $page) => $page
        ->has('practice_grounds', 2)
        ->has('archived', 0));
});

it('never shows, opens, changes, archives or restores another golfer\'s Practice Ground', function () {
    assertGolferIsolation(
        fn () => PracticeGround::factory()->create(),
        fn (PracticeGround $ground) => [
            test()->get("/practice-grounds/{$ground->id}/edit"),
            test()->put("/practice-grounds/{$ground->id}", practiceGroundFields()),
            test()->post("/practice-grounds/{$ground->id}/archive"),
            test()->post("/practice-grounds/{$ground->id}/restore"),
        ],
    );

    $this->get('/practice-grounds')->assertInertia(fn (Assert $page) => $page
        ->has('practice_grounds', 0)
        ->has('archived', 0));
});

it('lets the phone save, list, load and edit Practice Grounds with the Facilities to pick from', function () {
    Notification::fake();
    $phone = fromPhone(phoneToken(golfer()));

    $id = $phone->postJson('/api/practice-grounds', practiceGroundFields())
        ->assertCreated()
        ->assertJsonPath('name', 'Home club')
        ->json('id');

    $phone->getJson('/api/practice-grounds')
        ->assertOk()
        ->assertJsonCount(1, 'practice_grounds')
        ->assertJsonPath('practice_grounds.0.id', $id)
        ->assertJsonPath('practice_grounds.0.feature_ids', [featureId('range_bay', 'target_flags'), featureId('putting_green', 'slopes')])
        ->assertJsonCount(0, 'archived')
        ->assertJsonCount(4, 'facilities')
        ->assertJsonPath('facilities.0.key', 'range_bay');

    $phone->putJson("/api/practice-grounds/{$id}", practiceGroundFields(['name' => 'Home club, back range', 'facility_ids' => [], 'feature_ids' => []]))
        ->assertOk()
        ->assertJsonPath('name', 'Home club, back range')
        ->assertJsonPath('facility_ids', []);

    $phone->getJson("/api/practice-grounds/{$id}")->assertOk()->assertJsonPath('name', 'Home club, back range');
});

it('refuses the phone a chipping-area feature on a Practice Ground without the chipping area', function () {
    Notification::fake();

    fromPhone(phoneToken(golfer()))
        ->postJson('/api/practice-grounds', practiceGroundFields([
            'facility_ids' => [facilityId('putting_green')],
            'feature_ids' => [featureId('chipping_area', 'rough')],
        ]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['feature_ids' => 'Pick features only on the Facilities this Practice Ground has.']);
});

it('hides an archived Practice Ground from the phone\'s list but still loads it by id', function () {
    Notification::fake();
    $phone = fromPhone(phoneToken(golfer()));
    $id = $phone->postJson('/api/practice-grounds', practiceGroundFields())->json('id');

    $phone->postJson("/api/practice-grounds/{$id}/archive")->assertOk()->assertJsonPath('archived_at', fn (?string $at) => $at !== null);

    $phone->getJson('/api/practice-grounds')
        ->assertJsonCount(0, 'practice_grounds')
        ->assertJsonPath('archived.0.id', $id);
    $phone->getJson("/api/practice-grounds/{$id}")->assertOk()->assertJsonPath('name', 'Home club');

    $phone->postJson("/api/practice-grounds/{$id}/restore")->assertOk()->assertJsonPath('archived_at', null);
    $phone->getJson('/api/practice-grounds')->assertJsonCount(1, 'practice_grounds');
});

it('never gives the phone another golfer\'s Practice Ground, nor lets it change one', function () {
    assertGolferIsolation(
        fn () => PracticeGround::factory()->create(),
        fn (PracticeGround $ground) => [
            test()->getJson("/api/practice-grounds/{$ground->id}"),
            test()->putJson("/api/practice-grounds/{$ground->id}", practiceGroundFields()),
            test()->postJson("/api/practice-grounds/{$ground->id}/archive"),
            test()->postJson("/api/practice-grounds/{$ground->id}/restore"),
        ],
    );

    $this->getJson('/api/practice-grounds')->assertJsonCount(0, 'practice_grounds')->assertJsonCount(0, 'archived');
});
