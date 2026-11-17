<?php

namespace App\Models;

use App\Models\Concerns\BelongsToGolfer;
use Database\Factories\RoundFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Round extends Model
{
    /** @use HasFactory<RoundFactory> */
    use BelongsToGolfer, HasFactory, HasUuids;

    /** The four SG Category values, in entry order. */
    public const SG_FIELDS = ['sg_off_the_tee', 'sg_approach', 'sg_short_game', 'sg_putting'];

    protected $fillable = [
        'baseline_id', 'played_on', 'course_name', 'tees', 'holes', 'par', 'score',
        'handicap_index', 'course_handicap', ...self::SG_FIELDS,
    ];

    protected function casts(): array
    {
        return [
            'played_on' => 'date',
            'holes' => 'integer',
            'par' => 'integer',
            'score' => 'integer',
            'course_handicap' => 'integer',
            'handicap_index' => 'decimal:1',
            'sg_off_the_tee' => 'decimal:2',
            'sg_approach' => 'decimal:2',
            'sg_short_game' => 'decimal:2',
            'sg_putting' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Baseline, $this>
     */
    public function baseline(): BelongsTo
    {
        return $this->belongsTo(Baseline::class);
    }

    /** Summed in hundredths so float rounding never shows. */
    public function sgTotal(): string
    {
        $hundredths = array_sum(array_map(fn (string $field) => (int) round($this->{$field} * 100), self::SG_FIELDS));

        return number_format($hundredths / 100, 2, '.', '');
    }
}
