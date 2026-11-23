<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A Game version's Levels: five or none, each with its up and down targets and one
 * text value per rules placeholder. They're edited in place, with no new version.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_levels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('game_version_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('level');
            // Null only while a Draft is unfinished: the publish check refuses a missing target.
            $table->integer('up')->nullable();
            $table->integer('down')->nullable();

            $table->unique(['game_version_id', 'level']);
        });

        Schema::create('game_level_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('game_level_id')->constrained()->cascadeOnDelete();
            $table->string('key');
            $table->string('value');

            $table->unique(['game_level_id', 'key']);
        });

        Schema::table('game_versions', function (Blueprint $table) {
            // When a newer version took this one's place; a Game retired by hand has none.
            $table->timestamp('replaced_at')->nullable()->after('retired_at');
        });
    }

    public function down(): void
    {
        Schema::table('game_versions', function (Blueprint $table) {
            $table->dropColumn('replaced_at');
        });
        Schema::dropIfExists('game_level_settings');
        Schema::dropIfExists('game_levels');
    }
};
