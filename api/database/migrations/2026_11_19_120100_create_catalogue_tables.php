<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The Catalogue: Games, whose versions go draft → published → retired, and Drills,
 * edited in place. Games and Drills keep text ULIDs; everything else is UUIDv7.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->timestamps();
        });

        Schema::create('game_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // VARCHAR, not the CHAR a ULID column gets: MariaDB won't generate a column from a
            // CHAR, whose value depends on the PAD_CHAR_TO_FULL_LENGTH mode.
            $table->string('game_id', 26);
            $table->foreign('game_id')->references('id')->on('games')->cascadeOnDelete();
            $table->unsignedSmallInteger('version');
            $table->string('status');
            $table->string('origin');
            $table->string('name');
            $table->string('sg_category');
            $table->unsignedSmallInteger('balls')->nullable();
            $table->unsignedSmallInteger('estimated_minutes')->nullable();
            $table->unsignedSmallInteger('seconds_per_ball')->nullable();
            $table->text('rules');
            $table->text('scoring');
            $table->string('score_better');
            $table->string('score_entry');
            $table->text('source_concept')->nullable();
            $table->string('source_url')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('retired_at')->nullable();
            $table->timestamps();

            // One published version per Game: the Game id only while published, unique.
            $table->string('published_game_id', 26)->nullable()
                ->storedAs("if(status = 'published', game_id, null)")
                ->unique();
            $table->unique(['game_id', 'version']);
        });

        Schema::create('drills', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->string('sg_category');
            $table->unsignedSmallInteger('balls')->nullable();
            $table->unsignedSmallInteger('estimated_minutes')->nullable();
            $table->unsignedSmallInteger('seconds_per_ball')->nullable();
            $table->text('setup');
            $table->text('source_concept')->nullable();
            $table->string('source_url')->nullable();
            $table->timestamp('retired_at')->nullable();
            $table->timestamps();
        });

        foreach (['game_version' => 'foreignUuid', 'drill' => 'foreignUlid'] as $owner => $foreign) {
            foreach (['facility', 'feature', 'distance_group'] as $link) {
                Schema::create("{$owner}_{$link}", function (Blueprint $table) use ($owner, $foreign, $link) {
                    $table->{$foreign}("{$owner}_id")->constrained()->cascadeOnDelete();
                    $table->foreignUuid("{$link}_id")->constrained()->restrictOnDelete();

                    $table->primary(["{$owner}_id", "{$link}_id"]);
                });
            }
        }

        // A Game version's Open fields (what its Variations may change) and its pad's values, in order.
        Schema::create('open_fields', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('game_version_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('position');
            $table->string('name');

            $table->unique(['game_version_id', 'position']);
        });

        Schema::create('pad_values', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('game_version_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('position');
            $table->smallInteger('value');

            $table->unique(['game_version_id', 'position']);
        });

        Schema::create('variations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('game_version_id')->constrained()->restrictOnDelete();
            // Null on the shared plain Variation; the golfer for an LLM-written one.
            $table->foreignUuid('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->text('wording');
            $table->string('miss_direction')->nullable();
            $table->boolean('is_plain');
            $table->timestamp('retired_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('variations');
        Schema::dropIfExists('pad_values');
        Schema::dropIfExists('open_fields');

        foreach (['game_version', 'drill'] as $owner) {
            foreach (['facility', 'feature', 'distance_group'] as $link) {
                Schema::dropIfExists("{$owner}_{$link}");
            }
        }

        Schema::dropIfExists('drills');
        Schema::dropIfExists('game_versions');
        Schema::dropIfExists('games');
    }
};
