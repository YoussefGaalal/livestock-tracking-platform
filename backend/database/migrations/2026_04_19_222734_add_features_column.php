<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('subscription_tiers', function (Blueprint $table) {
            if (!Schema::hasColumn('subscription_tiers', 'has_ai_assistant')) {
                $table->boolean('has_ai_assistant')->default(false)->after('has_api_access');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscription_tiers', function (Blueprint $table) {
            $table->dropColumn(['has_api_access', 'has_ai_assistant']);
        });
    }
};
