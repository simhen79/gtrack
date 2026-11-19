<?php

namespace App\Http\Controllers\Admin;

use App\Data\DistanceGroupData;
use App\Data\DrillData;
use App\Data\FacilityData;
use App\Http\Controllers\Controller;
use App\Http\Requests\DrillRequest;
use App\Models\Drill;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/** Drills are edited in place: no Drafts and no versions. */
class DrillsController extends Controller
{
    public function create(): Response
    {
        return $this->editor(null);
    }

    public function store(DrillRequest $request): RedirectResponse
    {
        $drill = $this->save(new Drill, $request);

        return to_route('admin.catalogue', ['item' => $drill->id]);
    }

    public function edit(Drill $drill): Response
    {
        return $this->editor($drill);
    }

    public function update(DrillRequest $request, Drill $drill): RedirectResponse
    {
        $this->save($drill, $request);

        return to_route('admin.catalogue', ['item' => $drill->id]);
    }

    /**
     * Drills are retired, never deleted. A retired Drill leaves the Catalogue.
     */
    public function retire(Drill $drill): RedirectResponse
    {
        $drill->forceFill(['retired_at' => $drill->retired_at ?? now()])->save();

        return to_route('admin.catalogue', ['item' => $drill->id]);
    }

    private function save(Drill $drill, DrillRequest $request): Drill
    {
        return DB::transaction(function () use ($drill, $request) {
            $drill->fill($request->safe()->except(['facility_ids', 'feature_ids', 'distance_group_ids']))->save();
            $drill->facilities()->sync($request->validated('facility_ids'));
            $drill->features()->sync($request->validated('feature_ids'));
            $drill->distanceGroups()->sync($request->validated('distance_group_ids'));

            return $drill;
        });
    }

    private function editor(?Drill $drill): Response
    {
        return Inertia::render('admin/drill', [
            'drill' => $drill ? DrillData::fromDrill($drill) : null,
            'facilities' => FacilityData::list(),
            'distance_groups' => DistanceGroupData::list(),
        ]);
    }
}
