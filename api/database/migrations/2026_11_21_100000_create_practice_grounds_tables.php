<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A golfer's Practice Grounds, with the Facilities each has and those Facilities' features.
 * Composite keys keep a feature on a Facility the ground has: taking the Facility away
 * takes its features with it, and a feature can't sit under another Facility.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_grounds', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('note')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
        });

        Schema::table('features', function (Blueprint $table) {
            $table->unique(['facility_id', 'id']);
        });

        Schema::create('practice_ground_facility', function (Blueprint $table) {
            $table->foreignUuid('practice_ground_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('facility_id')->constrained()->restrictOnDelete();

            $table->primary(['practice_ground_id', 'facility_id']);
        });

        Schema::create('practice_ground_feature', function (Blueprint $table) {
            $table->uuid('practice_ground_id');
            $table->uuid('facility_id');
            $table->uuid('feature_id');

            $table->primary(['practice_ground_id', 'feature_id']);
            $table->foreign(['practice_ground_id', 'facility_id'])
                ->references(['practice_ground_id', 'facility_id'])->on('practice_ground_facility')
                ->cascadeOnDelete();
            $table->foreign(['facility_id', 'feature_id'])
                ->references(['facility_id', 'id'])->on('features')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_ground_feature');
        Schema::dropIfExists('practice_ground_facility');

        Schema::table('features', function (Blueprint $table) {
            $table->dropUnique(['facility_id', 'id']);
        });

        Schema::dropIfExists('practice_grounds');
    }
};
