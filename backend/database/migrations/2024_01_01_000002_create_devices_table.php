<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('device_id')->unique();
            $table->string('name')->nullable();
            $table->string('type')->nullable();
            $table->string('serial_number')->unique()->nullable();
            $table->string('firmware_version')->default('v2.4');
            $table->integer('battery_level')->default(100);
            $table->integer('signal_strength')->nullable();
            $table->enum('status', ['online', 'offline', 'low_signal'])->default('offline');
            $table->integer('update_interval')->default(15);
            $table->boolean('advanced_tracking')->default(false);
            $table->foreignId('animal_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('gps_lat', 10, 7)->nullable();
            $table->decimal('gps_lng', 10, 7)->nullable();
            $table->timestamp('last_ping')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
