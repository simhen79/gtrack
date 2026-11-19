<?php

namespace App\Http\Controllers\Api;

use App\Data\CatalogueData;
use App\Data\DrillData;
use App\Data\GameVersionData;
use App\Enums\GameStatus;
use App\Http\Controllers\Controller;
use App\Models\Drill;
use App\Models\GameVersion;

class CatalogueController extends Controller
{
    /** Never Drafts, and nothing retired. */
    public function index(): CatalogueData
    {
        return new CatalogueData(
            GameVersion::with(GameVersionData::WITH)->status(GameStatus::Published)->orderBy('name')->get()
                ->map(GameVersionData::fromVersion(...))->all(),
            Drill::with('facilities', 'features', 'distanceGroups')->whereNull('retired_at')->orderBy('name')->get()
                ->map(DrillData::fromDrill(...))->all(),
        );
    }
}
