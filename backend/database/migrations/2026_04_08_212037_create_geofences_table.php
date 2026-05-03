<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('geofences', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('coordinates');
            $table->string('color', 7)->default('#D4AF37');
            $table->enum('alert_type', ['entry', 'exit', 'both'])->default('both');
            $table->boolean('is_active')->default(true);
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('geofence_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('geofence_id')->constrained('geofences')->cascadeOnDelete();
            $table->foreignId('animal_id')->constrained('animals')->cascadeOnDelete();
            $table->enum('type', ['entry', 'exit']);
            $table->timestamp('triggered_at');
            $table->boolean('is_acknowledged')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('geofence_alerts');
        Schema::dropIfExists('geofences');
    }
};
