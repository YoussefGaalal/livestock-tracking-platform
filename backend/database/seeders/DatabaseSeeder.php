<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seeds reference data plus the demo accounts and their livestock.
     * Every seeder is idempotent, so this is also what runs on each deploy.
     */
    public function run(): void
    {
        $this->call([
            SubscriptionTierSeeder::class,
            RoleSeeder::class,
            UserSeeder::class,
            LanguageSeeder::class,
            DemoDataSeeder::class,
        ]);
    }
}
