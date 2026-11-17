<?php

namespace App\Models;

use App\Models\Concerns\BelongsToGolfer;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One row per golfer, created when they give a fallback Handicap Index. */
class Setting extends Model
{
    use BelongsToGolfer, HasUuids;

    protected $fillable = ['fallback_handicap_index', 'default_baseline_id'];

    protected function casts(): array
    {
        return [
            'fallback_handicap_index' => 'decimal:1',
            'llm_monthly_cap' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Baseline, $this>
     */
    public function defaultBaseline(): BelongsTo
    {
        return $this->belongsTo(Baseline::class, 'default_baseline_id');
    }
}
