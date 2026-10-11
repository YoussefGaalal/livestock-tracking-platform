<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Schema builder instead of raw MODIFY so this also runs on SQLite (test suite)
        Schema::table('animals', function (Blueprint $table) {
            // Expand species ENUM to include all livestock types
            $table->enum('species', ['Camel', 'Goat', 'Sheep', 'Horse', 'Cattle', 'Donkey'])->change();

            // Normalise gender to lowercase to match seeder values
            $table->enum('gender', ['male', 'female'])->change();
        });
    }

    public function down(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            $table->enum('species', ['Camel', 'Goat', 'Sheep'])->change();
            $table->enum('gender', ['Male', 'Female'])->change();
        });
    }
};
