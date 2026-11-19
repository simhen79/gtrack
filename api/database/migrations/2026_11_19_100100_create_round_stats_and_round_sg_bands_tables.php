<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A Round's optional advanced stats: one row of counts and percentages, and its
 * Strokes Gained by distance band. Both go when the Round does.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('round_stats', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('round_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('fairways_hit')->nullable();
            $table->unsignedTinyInteger('fairways_missed_left')->nullable();
            $table->unsignedTinyInteger('fairways_missed_right')->nullable();
            $table->unsignedTinyInteger('penalties')->nullable();
            $table->unsignedTinyInteger('approach_miss_long_percent')->nullable();
            $table->unsignedTinyInteger('approach_miss_short_percent')->nullable();
            $table->unsignedTinyInteger('approach_miss_left_percent')->nullable();
            $table->unsignedTinyInteger('approach_miss_right_percent')->nullable();
            $table->unsignedTinyInteger('up_and_downs_made')->nullable();
            $table->unsignedTinyInteger('up_and_downs_attempted')->nullable();
            $table->timestamps();
        });

        Schema::create('round_sg_bands', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('round_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('sg_band_id')->constrained()->restrictOnDelete();
            $table->decimal('value', 5, 2);
            $table->timestamps();

            $table->unique(['round_id', 'sg_band_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('round_sg_bands');
        Schema::dropIfExists('round_stats');
    }
};
