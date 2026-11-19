<?php

namespace App\Http\Controllers\Admin;

use App\Data\DistanceGroupData;
use App\Data\DrillData;
use App\Data\FacilityData;
use App\Data\GameVersionData;
use App\Enums\GameStatus;
use App\Http\Controllers\Controller;
use App\Models\Drill;
use App\Models\GameVersion;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CatalogueController extends Controller
{
    /**
     * Each Game once, as its published version or else its latest retired one, with
     * Drafts apart for admins who manage them.
     */
    public function index(Request $request): Response
    {
        $versions = GameVersion::with(GameVersionData::WITH)->orderBy('name')->orderByDesc('version')->get();
        [$drafts, $catalogue] = $versions->partition(fn (GameVersion $version) => $version->status === GameStatus::Draft);

        return Inertia::render('admin/catalogue', [
            'games' => $catalogue->groupBy('game_id')
                ->map(fn (Collection $game) => $game->firstWhere('status', GameStatus::Published) ?? $game->first())
                ->values()
                ->map(GameVersionData::fromVersion(...)),
            'drafts' => $request->user()->can('drafts.manage') ? $drafts->values()->map(GameVersionData::fromVersion(...)) : [],
            'drills' => Drill::with(DrillData::WITH)->orderBy('name')->get()->map(DrillData::fromDrill(...)),
            'facilities' => FacilityData::list(),
            'distance_groups' => DistanceGroupData::list(),
        ]);
    }
}
