<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Reference tables: the Facilities a Drill or Game needs, and the features each
 * Facility can have. `key` is how the Catalogue content format names them.
 */
return new class extends Migration
{
    /** Each Facility: key, name, pace in seconds per ball, and its features as key => name. */
    private const FACILITIES = [
        ['range_bay', 'Range bay', 40, ['mats' => 'Mats', 'grass' => 'Grass', 'target_flags' => 'Target flags', 'distance_signs' => 'Distance signs']],
        ['chipping_area', 'Chipping area', 75, ['green_with_hole' => 'Green with a hole', 'rough' => 'Rough', 'slopes' => 'Slopes']],
        ['putting_green', 'Putting green', 30, ['slopes' => 'Slopes', 'course_18' => '18-hole course']],
        ['practice_bunker', 'Practice bunker', 60, []],
    ];

    public function up(): void
    {
        Schema::create('facilities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('key')->unique();
            $table->string('name');
            $table->unsignedTinyInteger('position');
            $table->unsignedSmallInteger('seconds_per_ball');
            $table->timestamps();
        });

        Schema::create('features', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('facility_id')->constrained()->restrictOnDelete();
            $table->string('key');
            $table->string('name');
            $table->unsignedTinyInteger('position');
            $table->timestamps();

            $table->unique(['facility_id', 'key']);
        });

        foreach (self::FACILITIES as $position => [$key, $name, $pace, $features]) {
            $facilityId = (string) Str::uuid7();
            DB::table('facilities')->insert([
                'id' => $facilityId,
                'key' => $key,
                'name' => $name,
                'position' => $position + 1,
                'seconds_per_ball' => $pace,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach (array_keys($features) as $featurePosition => $featureKey) {
                DB::table('features')->insert([
                    'id' => (string) Str::uuid7(),
                    'facility_id' => $facilityId,
                    'key' => $featureKey,
                    'name' => $features[$featureKey],
                    'position' => $featurePosition + 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('features');
        Schema::dropIfExists('facilities');
    }
};
