<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('assigned_animals')->nullable()->after('managed_by');
            $table->json('assigned_tasks')->nullable()->after('assigned_animals');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['assigned_animals', 'assigned_tasks']);
        });
    }
};