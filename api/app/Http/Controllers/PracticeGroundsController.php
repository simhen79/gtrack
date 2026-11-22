<?php

namespace App\Http\Controllers;

use App\Data\PracticeGroundData;
use App\Data\PracticeGroundsData;
use App\Http\Requests\PracticeGroundRequest;
use App\Models\PracticeGround;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/** One page of cards; adding or editing opens the editor over it, at its own address. */
class PracticeGroundsController extends Controller
{
    public function index(): Response
    {
        return $this->page();
    }

    public function create(): Response
    {
        return $this->page(adding: true);
    }

    public function store(PracticeGroundRequest $request): RedirectResponse
    {
        DB::transaction(fn () => PracticeGround::create($request->safe()->only('name', 'note'))
            ->saveFacilities($request->validated('facility_ids'), $request->validated('feature_ids')));

        return to_route('practice-grounds.index');
    }

    public function edit(PracticeGround $practiceGround): Response
    {
        return $this->page(editing: $practiceGround);
    }

    public function update(PracticeGroundRequest $request, PracticeGround $practiceGround): RedirectResponse
    {
        DB::transaction(function () use ($request, $practiceGround) {
            $practiceGround->update($request->safe()->only('name', 'note'));
            $practiceGround->saveFacilities($request->validated('facility_ids'), $request->validated('feature_ids'));
        });

        return to_route('practice-grounds.index');
    }

    public function archive(PracticeGround $practiceGround): RedirectResponse
    {
        $practiceGround->update(['archived_at' => now()]);

        return to_route('practice-grounds.index');
    }

    public function restore(PracticeGround $practiceGround): RedirectResponse
    {
        $practiceGround->update(['archived_at' => null]);

        return to_route('practice-grounds.index');
    }

    private function page(bool $adding = false, ?PracticeGround $editing = null): Response
    {
        return Inertia::render('practice-grounds/index', [
            ...PracticeGroundsData::current()->toArray(),
            'adding' => $adding,
            'editing' => $editing ? PracticeGroundData::fromGround($editing->load(PracticeGround::WITH)) : null,
        ]);
    }
}
