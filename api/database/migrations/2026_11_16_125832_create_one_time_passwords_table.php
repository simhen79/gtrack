<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('one_time_passwords', function (Blueprint $table) {
            $table->id();

            $table->string('password');
            $table->text('origin_properties')->nullable();

            $table->dateTime('expires_at')->index();
            $table->uuidMorphs('authenticatable');
            $table->unsignedTinyInteger('failed_attempts')->default(0);

            $table->timestamps();
        });
    }
};
