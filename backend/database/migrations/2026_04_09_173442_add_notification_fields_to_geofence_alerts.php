<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('geofence_alerts', function (Blueprint $table) {
            $table->boolean('notification_sent')->default(false)->after('is_acknowledged');
            $table->timestamp('notification_sent_at')->nullable()->after('notification_sent');
        });
    }

    public function down(): void
    {
        Schema::table('geofence_alerts', function (Blueprint $table) {
            $table->dropColumn(['notification_sent', 'notification_sent_at']);
        });
    }
};
