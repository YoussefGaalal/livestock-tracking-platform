<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('geofence_alerts', function (Blueprint $table) {
            $table->unsignedBigInteger('device_id')->nullable()->after('animal_id');
            $table->decimal('latitude', 10, 7)->nullable()->after('device_id');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });
    }

    public function down(): void
    {
        Schema::table('geofence_alerts', function (Blueprint $table) {
            $table->dropColumn(['device_id', 'latitude', 'longitude']);
        });
    }
};
