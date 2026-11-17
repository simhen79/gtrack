<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rounds', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('baseline_id')->constrained()->restrictOnDelete();
            $table->date('played_on');
            $table->string('course_name');
            $table->string('tees')->nullable();
            $table->unsignedTinyInteger('holes');
            $table->unsignedTinyInteger('par')->nullable();
            $table->unsignedSmallInteger('score');
            $table->decimal('handicap_index', 3, 1);
            $table->smallInteger('course_handicap');
            $table->decimal('sg_off_the_tee', 5, 2);
            $table->decimal('sg_approach', 5, 2);
            $table->decimal('sg_short_game', 5, 2);
            $table->decimal('sg_putting', 5, 2);
            $table->timestamps();

            $table->index(['user_id', 'played_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rounds');
    }
};
