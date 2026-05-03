<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('phone')->nullable();
            $table->string('location')->nullable();
            $table->string('avatar_url')->nullable();
            $table->enum('role', ['Admin', 'Manager', 'Owner', 'Shepherd', 'Doctor'])->default('Owner');
            $table->string('language')->default('en');
            $table->unsignedBigInteger('subscription_tier_id')->nullable();
            $table->enum('subscription_status', ['Active', 'Pending', 'Suspended'])->default('Active');
            $table->unsignedBigInteger('managed_by')->nullable();
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
