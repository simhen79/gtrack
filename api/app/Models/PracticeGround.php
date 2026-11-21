<?php

namespace App\Models;

use App\Models\Concerns\BelongsToGolfer;
use Database\Factories\PracticeGroundFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/** A named place where the golfer practises. Archived rather than deleted, so sessions played there keep it. */
class PracticeGround extends Model
{
    /** @use HasFactory<PracticeGroundFactory> */
    use BelongsToGolfer, HasFactory, HasUuids;

    /** The relations PracticeGroundData reads. */
    public const WITH = ['facilities', 'features'];

    protected $fillable = ['name', 'note', 'archived_at'];

    protected function casts(): array
    {
        return ['archived_at' => 'datetime'];
    }

    /**
     * @return BelongsToMany<Facility, $this>
     */
    public function facilities(): BelongsToMany
    {
        return $this->belongsToMany(Facility::class, 'practice_ground_facility')->orderBy('position');
    }

    /**
     * @return BelongsToMany<Feature, $this>
     */
    public function features(): BelongsToMany
    {
        return $this->belongsToMany(Feature::class, 'practice_ground_feature')
            ->join('facilities as feature_facility', 'feature_facility.id', '=', 'features.facility_id')
            ->orderBy('feature_facility.position')
            ->orderBy('features.position');
    }

    /**
     * Replaces the ground's Facilities and features. Each feature is stored under its own
     * Facility, which the composite key needs the ground to have.
     *
     * @param  list<string>  $facilityIds
     * @param  list<string>  $featureIds
     */
    public function saveFacilities(array $facilityIds, array $featureIds): void
    {
        $this->features()->detach();
        $this->facilities()->sync($facilityIds);
        $this->features()->attach(
            Feature::whereIn('id', $featureIds)->pluck('facility_id', 'id')
                ->map(fn (string $facilityId) => ['facility_id' => $facilityId])
                ->all(),
        );
    }
}
