<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('animal_group_geofence', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('animal_group_id');
            $table->unsignedBigInteger('geofence_id');
            $table->timestamps();
            
            $table->foreign('animal_group_id')->references('id')->on('animal_groups')->onDelete('cascade');
            $table->foreign('geofence_id')->references('id')->on('geofences')->onDelete('cascade');
            
            $table->unique(['animal_group_id', 'geofence_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('animal_group_geofence');
    }
};
