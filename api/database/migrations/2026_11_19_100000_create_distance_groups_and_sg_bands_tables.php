<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Reference tables: the distance groups Focus works in, and the finer distance
 * bands a Round's Approach and Putting Strokes Gained can be entered by.
 * Distances are in metres, from `min_metres` up to `max_metres`, open-ended when null.
 */
return new class extends Migration
{
    /** Each group, its bands, as [min, max] metres. */
    private const BANDS = [
        'approach' => [
            [[50, 100], [[50, 75], [75, 100]]],
            [[100, 150], [[100, 125], [125, 150]]],
            [[150, null], [[150, 175], [175, 200], [200, null]]],
        ],
        'putting' => [
            [[0, 1], [[0, 1]]],
            [[1, 3], [[1, 2], [2, 3]]],
            [[3, 5], [[3, 4], [4, 5]]],
            [[5, null], [[5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, null]]],
        ],
    ];

    public function up(): void
    {
        Schema::create('distance_groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('sg_category');
            $table->unsignedTinyInteger('position');
            $table->unsignedSmallInteger('min_metres');
            $table->unsignedSmallInteger('max_metres')->nullable();
            $table->timestamps();

            $table->unique(['sg_category', 'position']);
        });

        Schema::create('sg_bands', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('sg_category');
            $table->unsignedTinyInteger('position');
            $table->foreignUuid('distance_group_id')->nullable()->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('min_metres');
            $table->unsignedSmallInteger('max_metres')->nullable();
            $table->timestamps();

            $table->unique(['sg_category', 'position']);
        });

        foreach (self::BANDS as $category => $groups) {
            $bandPosition = 0;

            foreach ($groups as $groupPosition => [[$groupMin, $groupMax], $bands]) {
                $groupId = (string) Str::uuid7();
                DB::table('distance_groups')->insert([
                    'id' => $groupId,
                    'sg_category' => $category,
                    'position' => $groupPosition + 1,
                    'min_metres' => $groupMin,
                    'max_metres' => $groupMax,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                foreach ($bands as [$min, $max]) {
                    DB::table('sg_bands')->insert([
                        'id' => (string) Str::uuid7(),
                        'sg_category' => $category,
                        'position' => ++$bandPosition,
                        'distance_group_id' => $groupId,
                        'min_metres' => $min,
                        'max_metres' => $max,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('sg_bands');
        Schema::dropIfExists('distance_groups');
    }
};
