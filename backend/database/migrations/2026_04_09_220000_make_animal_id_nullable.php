<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('location_history', function (Blueprint $table) {
            $table->unsignedBigInteger('animal_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('location_history', function (Blueprint $table) {
            $table->unsignedBigInteger('animal_id')->nullable(false)->change();
        });
    }
};
