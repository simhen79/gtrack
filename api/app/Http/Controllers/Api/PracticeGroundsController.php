<?php

namespace App\Http\Controllers\Api;

use App\Data\PracticeGroundData;
use App\Data\PracticeGroundsData;
use App\Http\Controllers\Controller;
use App\Http\Requests\PracticeGroundRequest;
use App\Models\PracticeGround;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/** The phone reads and edits Practice Grounds as the web does. An archived one still loads by id. */
class PracticeGroundsController extends Controller
{
    public function index(): PracticeGroundsData
    {
        return PracticeGroundsData::current();
    }

    public function store(PracticeGroundRequest $request): PracticeGroundData
    {
        $ground = DB::transaction(function () use ($request) {
            $ground = PracticeGround::create($request->safe()->only('name', 'note'));
            $ground->saveFacilities($request->validated('facility_ids'), $request->validated('feature_ids'));

            return $ground;
        });

        return $this->show($ground);
    }

    public function show(PracticeGround $practiceGround): PracticeGroundData
    {
        return PracticeGroundData::fromGround($practiceGround->load(PracticeGround::WITH));
    }

    public function update(PracticeGroundRequest $request, PracticeGround $practiceGround): PracticeGroundData
    {
        DB::transaction(function () use ($request, $practiceGround) {
            $practiceGround->update($request->safe()->only('name', 'note'));
            $practiceGround->saveFacilities($request->validated('facility_ids'), $request->validated('feature_ids'));
        });

        return $this->show($practiceGround);
    }

    public function archive(PracticeGround $practiceGround): JsonResponse
    {
        $practiceGround->update(['archived_at' => now()]);

        return $this->answerOk($practiceGround);
    }

    public function restore(PracticeGround $practiceGround): JsonResponse
    {
        $practiceGround->update(['archived_at' => null]);

        return $this->answerOk($practiceGround);
    }

    /** laravel-data answers a POST with 201 Created, but archiving and restoring create nothing: answer 200. */
    private function answerOk(PracticeGround $practiceGround): JsonResponse
    {
        return response()->json($this->show($practiceGround));
    }
}
