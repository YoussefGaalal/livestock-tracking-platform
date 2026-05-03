<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_tiers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('price_monthly', 10, 2)->default(0);
            $table->decimal('price_yearly', 10, 2)->default(0);
            $table->integer('trial_days')->default(0);
            $table->integer('max_animals')->default(0);
            $table->integer('max_devices')->default(0);
            $table->integer('max_users')->default(0);
            $table->boolean('has_geofencing')->default(false);
            $table->boolean('has_auctions')->default(false);
            $table->boolean('has_advanced_reports')->default(false);
            $table->boolean('has_api_access')->default(false);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_tiers');
    }
};
