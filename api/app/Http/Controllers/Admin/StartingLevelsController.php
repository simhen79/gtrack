<?php

namespace App\Http\Controllers\Admin;

use App\Data\StartingLevelData;
use App\Http\Controllers\Controller;
use App\Http\Requests\StartingLevelsRequest;
use App\Models\StartingLevel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/** The Handicap Index bands that set the Level a golfer starts a Game at. */
class StartingLevelsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/starting-levels', ['bands' => StartingLevelData::list()]);
    }

    public function update(StartingLevelsRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            StartingLevel::query()->delete();
            foreach ($request->validated('bands') as $position => $band) {
                StartingLevel::create(['position' => $position, 'from_handicap_index' => $band['from'] ?? null, 'level' => $band['level']]);
            }
        });
        $this->toast('Starting Levels saved');

        return to_route('admin.starting-levels');
    }
}
