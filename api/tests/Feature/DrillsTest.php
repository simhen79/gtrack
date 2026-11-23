<?php

use App\Models\DistanceGroup;
use App\Models\Feature;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

it('offers the Facilities, features and distance groups seeded by migration', function () {
    $this->actingAs(admin())->get('/admin/drills/create')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/drill')
            ->where('drill', null)
            ->where('facilities', fn ($facilities) => collect($facilities)->mapWithKeys(fn ($facility) => [
                $facility['name'] => collect($facility['features'])->pluck('name')->all(),
            ])->all() === [
                'Range bay' => ['Mats', 'Grass', 'Target flags', 'Distance signs'],
                'Chipping area' => ['Green with a hole', 'Rough', 'Slopes'],
                'Putting green' => ['Slopes', '18-hole course'],
                'Practice bunker' => [],
            ])
            ->where('distance_groups', fn ($groups) => collect($groups)->map(fn ($group) => "{$group['sg_category']} {$group['label']}")->all() === [
                'approach 50–100 m', 'approach 100–150 m', 'approach 150+ m',
                'putting 0–1 m', 'putting 1–3 m', 'putting 3–5 m', 'putting 5+ m',
            ]));
});

it('adds a Drill straight into the Catalogue with a text ULID', function () {
    $this->actingAs(admin())->post('/admin/drills', drillFields())->assertRedirect();

    $this->get('/admin/catalogue')->assertInertia(fn (Assert $page) => $page
        ->has('drills', 1)
        ->where('drills.0.name', 'Gate Drill')
        ->where('drills.0.id', fn (string $id) => Str::isUlid($id)));
});

it('saves an edited Drill in place, with no version', function () {
    $this->actingAs(admin())->post('/admin/drills', drillFields());
    $id = $this->get('/admin/catalogue')->inertiaProps('drills.0.id');
    $slopes = Feature::where('key', 'slopes')->whereRelation('facility', 'key', 'putting_green')->value('id');

    $this->put("/admin/drills/{$id}", drillFields([
        'name' => 'Gate Drill, one hand',
        'balls' => null,
        'estimated_minutes' => 10,
        'feature_ids' => [$slopes],
    ]))->assertRedirect()->assertSessionHasNoErrors();

    $this->get("/admin/drills/{$id}/edit")->assertInertia(fn (Assert $page) => $page
        ->where('drill.id', $id)
        ->where('drill.name', 'Gate Drill, one hand')
        ->where('drill.balls', null)
        ->where('drill.estimated_minutes', 10)
        ->where('drill.feature_ids', [$slopes])
        ->missing('drill.version'));
    $this->get('/admin/catalogue')->assertInertia(fn (Assert $page) => $page->has('drills', 1));
});

it('refuses a Drill whose features are on a Facility it does not need', function () {
    $flags = Feature::where('key', 'target_flags')->value('id');

    $this->actingAs(admin())->post('/admin/drills', drillFields(['feature_ids' => [$flags]]))
        ->assertSessionHasErrors('feature_ids');
});

it('refuses a Drill with distance groups from another SG Category', function () {
    $approach = DistanceGroup::where('sg_category', 'approach')->value('id');

    $this->actingAs(admin())->post('/admin/drills', drillFields(['distance_group_ids' => [$approach]]))
        ->assertSessionHasErrors('distance_group_ids');
});

it('needs a Drill to have balls or estimated minutes', function () {
    $this->actingAs(admin())->post('/admin/drills', drillFields(['balls' => null]))
        ->assertSessionHasErrors('balls');
});

it('returns a Drill that wasn’t saved to its form, with each field’s own error', function () {
    $this->actingAs(admin())->post('/admin/drills', drillFields());
    $id = $this->get('/admin/catalogue')->inertiaProps('drills.0.id');

    $this->from("/admin/drills/{$id}/edit")->followingRedirects()
        ->put("/admin/drills/{$id}", drillFields(['name' => '', 'balls' => null]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/drill')
            ->where('drill.id', $id)
            ->has('errors.name')
            ->has('errors.balls')
            ->missing('errors.setup'));
});
