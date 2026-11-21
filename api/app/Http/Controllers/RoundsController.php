<?php

namespace App\Http\Controllers;

use App\Data\BaselineData;
use App\Data\CourseData;
use App\Data\RoundFormData;
use App\Data\RoundSummaryData;
use App\Data\SgBandData;
use App\Http\Requests\RoundRequest;
use App\Models\Baseline;
use App\Models\Round;
use App\Models\Setting;
use App\Models\SgBand;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RoundsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('rounds/index', [
            'rounds' => Round::with('baseline', 'stats', 'sgBands')->latest('played_on')->latest()->get()->map(RoundSummaryData::fromRound(...)),
            'sg_bands' => $this->sgBands(),
        ]);
    }

    public function create(): Response
    {
        $settings = Setting::sole();

        return $this->form(RoundFormData::carriedOver(
            now($settings->timezone)->toDateString(),
            Round::latest('played_on')->latest()->first(),
            $settings->default_baseline_id,
        ), $settings);
    }

    public function store(RoundRequest $request): RedirectResponse
    {
        DB::transaction(fn () => Round::create($this->roundAttributes($request))
            ->saveAdvancedStats($request->validated('stats') ?? [], $request->validated('bands') ?? []));
        $this->toast('Round saved', $request->validated('course_name'));

        return to_route('rounds.index');
    }

    public function edit(Round $round): Response
    {
        return $this->form(RoundFormData::fromRound($round), Setting::sole());
    }

    public function update(RoundRequest $request, Round $round): RedirectResponse
    {
        DB::transaction(function () use ($request, $round) {
            $round->update($this->roundAttributes($request));
            $round->saveAdvancedStats($request->validated('stats') ?? [], $request->validated('bands') ?? []);
        });
        $this->toast('Round saved', $round->course_name);

        return to_route('rounds.index');
    }

    public function destroy(Round $round): RedirectResponse
    {
        $round->delete();
        $this->toast('Round deleted', $round->course_name);

        return to_route('rounds.index');
    }

    private function form(RoundFormData $round, Setting $settings): Response
    {
        return Inertia::render('rounds/edit', [
            'round' => $round,
            'baselines' => Baseline::orderBy('name')->get()->map(fn (Baseline $baseline) => new BaselineData(
                $baseline->id,
                $baseline->name,
                $baseline->id === $settings->default_baseline_id,
            )),
            'courses' => CourseData::played(),
            'sg_bands' => $this->sgBands(),
        ]);
    }

    /** @return Collection<int, SgBandData> */
    private function sgBands(): Collection
    {
        return SgBand::with('distanceGroup')->inOrder()->get()->map(SgBandData::fromBand(...));
    }

    /**
     * The validated Round, with a Baseline added inline when the golfer typed a new one.
     * Their first Baseline becomes their default.
     *
     * @return array<string, mixed>
     */
    private function roundAttributes(RoundRequest $request): array
    {
        $attributes = $request->safe()->except('new_baseline', 'stats', 'bands');

        if ($request->filled('new_baseline')) {
            $baseline = Baseline::create(['name' => $request->string('new_baseline')->trim()->value()]);
            $settings = Setting::sole();
            $settings->default_baseline_id ??= $baseline->id;
            $settings->save();
            $attributes['baseline_id'] = $baseline->id;
        }

        return $attributes;
    }
}
