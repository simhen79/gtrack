<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * The Handicap Index bands that set a golfer's starting Level in a Game, editable by an
 * admin. Each band runs from its Handicap Index up to the next band's; the first has no
 * start, so it holds everything below the second.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('starting_levels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedTinyInteger('position')->unique();
            $table->decimal('from_handicap_index', 3, 1)->nullable();
            $table->unsignedTinyInteger('level');
            $table->timestamps();
        });

        // The spec's table: below 0.0 starts at Level 5, 0.0–2.9 at 4, 3.0–9.9 at 3,
        // 10.0–19.9 at 2, and 20.0 and above at 1.
        $bands = [[null, 5], ['0.0', 4], ['3.0', 3], ['10.0', 2], ['20.0', 1]];
        DB::table('starting_levels')->insert(collect($bands)->map(fn (array $band, int $position) => [
            'id' => (string) Str::uuid7(),
            'position' => $position,
            'from_handicap_index' => $band[0],
            'level' => $band[1],
            'created_at' => now(),
            'updated_at' => now(),
        ])->all());
    }

    public function down(): void
    {
        Schema::dropIfExists('starting_levels');
    }
};
