<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vaccination_schedules', function (Blueprint $table) {
            $table->string('vaccination_type')->default('routine')->after('vaccine_name');
            $table->unsignedBigInteger('assigned_to')->nullable()->after('scheduled_date');
            $table->boolean('reminder_enabled')->default(true)->after('assigned_to');
            $table->integer('reminder_days')->default(3)->after('reminder_enabled');
            
            $table->foreign('assigned_to')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('vaccination_schedules', function (Blueprint $table) {
            $table->dropForeign(['assigned_to']);
            $table->dropColumn(['vaccination_type', 'assigned_to', 'reminder_enabled', 'reminder_days']);
        });
    }
};
