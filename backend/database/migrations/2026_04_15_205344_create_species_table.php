<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('species', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('breeds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('species_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed default species
        DB::table('species')->insert([
            ['name' => 'Camel', 'description' => 'Camels', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Goat', 'description' => 'Goats', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Sheep', 'description' => 'Sheep', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Cow', 'description' => 'Cattle', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Dog', 'description' => 'Dogs', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Seed default breeds
        DB::table('breeds')->insert([
            ['species_id' => 1, 'name' => 'Majaheem', 'created_at' => now(), 'updated_at' => now()],
            ['species_id' => 1, 'name' => 'Wadhah', 'created_at' => now(), 'updated_at' => now()],
            ['species_id' => 1, 'name' => 'Suhail', 'created_at' => now(), 'updated_at' => now()],
            ['species_id' => 1, 'name' => 'Maqatir', 'created_at' => now(), 'updated_at' => now()],
            ['species_id' => 1, 'name' => 'Shalal', 'created_at' => now(), 'updated_at' => now()],
            ['species_id' => 2, 'name' => 'Boer', 'created_at' => now(), 'updated_at' => now()],
            ['species_id' => 2, 'name' => 'Nubian', 'created_at' => now(), 'updated_at' => now()],
            ['species_id' => 2, 'name' => 'Saanen', 'created_at' => now(), 'updated_at' => now()],
            ['species_id' => 3, 'name' => 'Awassi', 'created_at' => now(), 'updated_at' => now()],
            ['species_id' => 3, 'name' => 'Najdi', 'created_at' => now(), 'updated_at' => now()],
            ['species_id' => 4, 'name' => 'Holstein', 'created_at' => now(), 'updated_at' => now()],
            ['species_id' => 4, 'name' => 'Jersey', 'created_at' => now(), 'updated_at' => now()],
            ['species_id' => 5, 'name' => 'Saluki', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('breeds');
        Schema::dropIfExists('species');
    }
};