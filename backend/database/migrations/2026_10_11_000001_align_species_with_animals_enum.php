<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The species lookup table was seeded with Cow/Dog, but animals.species only
 * accepts Camel, Goat, Sheep, Horse, Cattle and Donkey (see the 2026_05_04
 * enum migration). Bring the lookup table in line so the UI only offers
 * species the database will accept.
 */
return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('species')->where('name', 'Cow')->update(['name' => 'Cattle', 'updated_at' => $now]);
        DB::table('species')->where('name', 'Dog')->update(['is_active' => false, 'updated_at' => $now]);

        $breeds = [
            'Camel'  => ['Dromedary', 'Racing Dromedary'],
            'Goat'   => ['Damascus', 'Arabian Goat'],
            'Horse'  => ['Arabian', 'Thoroughbred', 'Akhal-Teke'],
            'Donkey' => ['Arabian Donkey', 'Hassawi'],
            'Cattle' => ['Brahman', 'Friesian'],
        ];

        foreach ($breeds as $species => $names) {
            $speciesId = DB::table('species')->where('name', $species)->value('id')
                ?? DB::table('species')->insertGetId([
                    'name' => $species,
                    'description' => $species,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

            foreach ($names as $name) {
                if (!DB::table('breeds')->where('species_id', $speciesId)->where('name', $name)->exists()) {
                    DB::table('breeds')->insert([
                        'species_id' => $speciesId,
                        'name' => $name,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        DB::table('species')->whereIn('name', ['Horse', 'Donkey'])->delete();
        DB::table('species')->where('name', 'Cattle')->update(['name' => 'Cow']);
        DB::table('species')->where('name', 'Dog')->update(['is_active' => true]);
    }
};
