<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('animal_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('color', 7)->default('#D4AF37');
            $table->unsignedBigInteger('owner_id')->nullable();
            $table->timestamps();
            
            $table->foreign('owner_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('animal_group_member', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('animal_group_id');
            $table->unsignedBigInteger('animal_id');
            $table->timestamps();
            
            $table->foreign('animal_group_id')->references('id')->on('animal_groups')->onDelete('cascade');
            $table->foreign('animal_id')->references('id')->on('animals')->onDelete('cascade');
            
            $table->unique(['animal_group_id', 'animal_id']);
        });

        Schema::create('animal_geofence', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('animal_id');
            $table->unsignedBigInteger('geofence_id');
            $table->timestamps();
            
            $table->foreign('animal_id')->references('id')->on('animals')->onDelete('cascade');
            $table->foreign('geofence_id')->references('id')->on('geofences')->onDelete('cascade');
            
            $table->unique(['animal_id', 'geofence_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('animal_geofence');
        Schema::dropIfExists('animal_group_member');
        Schema::dropIfExists('animal_groups');
    }
};
