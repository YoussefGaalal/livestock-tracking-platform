<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Expand species ENUM to include all livestock types
        DB::statement("ALTER TABLE animals MODIFY COLUMN species ENUM('Camel','Goat','Sheep','Horse','Cattle','Donkey') NOT NULL");

        // Normalise gender to lowercase to match seeder values
        DB::statement("ALTER TABLE animals MODIFY COLUMN gender ENUM('male','female','Male','Female') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE animals MODIFY COLUMN species ENUM('Camel','Goat','Sheep') NOT NULL");
        DB::statement("ALTER TABLE animals MODIFY COLUMN gender ENUM('Male','Female') NOT NULL");
    }
};
