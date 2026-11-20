<?php

namespace App\Http\Controllers;

use App\Data\BaselineData;
use App\Data\SgTrendData;
use App\Data\TrendRoundData;
use App\Enums\SgCategory;
use App\Models\Baseline;
use App\Models\Round;
use App\Models\Setting;
use App\Models\SgBand;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TrendsController extends Controller
{
    public function index(Request $request): Response
    {
        $defaultId = Setting::sole()->default_baseline_id;
        $baselines = Baseline::orderBy('name')->get();
        $baseline = $request->filled('baseline')
            ? $baselines->firstWhere('id', $request->query('baseline')) ?? abort(404)
            : $baselines->find($defaultId) ?? $baselines->first();

        $rounds = Round::with('sgBands')->where('baseline_id', $baseline?->id)->oldest('played_on')->oldest()->get();
        $bands = SgBand::inOrder()->get();

        return Inertia::render('trends/index', [
            'baselines' => $baselines->map(fn (Baseline $baseline) => new BaselineData($baseline->id, $baseline->name, $baseline->id === $defaultId)),
            'baseline_id' => $baseline?->id,
            'rounds' => $rounds->map(TrendRoundData::fromRound(...)),
            'categories' => array_map(fn (SgCategory $category) => SgTrendData::fromRounds($category, $rounds, $bands), SgCategory::cases()),
        ]);
    }
}
