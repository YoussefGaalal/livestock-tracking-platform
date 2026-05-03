<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscription_tiers', function (Blueprint $table) {
            $table->boolean('has_medical_records')->default(false)->after('has_advanced_reports');
            $table->boolean('has_tasks')->default(false)->after('has_medical_records');
        });
    }

    public function down(): void
    {
        Schema::table('subscription_tiers', function (Blueprint $table) {
            $table->dropColumn(['has_medical_records', 'has_tasks']);
        });
    }
};