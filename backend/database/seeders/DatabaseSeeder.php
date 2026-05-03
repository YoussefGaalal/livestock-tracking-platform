<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            LanguageSeeder::class,
            SubscriptionTierSeeder::class,
            UserSeeder::class,
            UserSubscriptionSeeder::class,
            RoleSeeder::class,
            UserRoleSeeder::class,
            DeviceSeeder::class,
            AnimalSeeder::class,
            AnimalGroupSeeder::class,
            GeofenceSeeder::class,
            LocationHistorySeeder::class,
            AuctionSeeder::class,
            BidSeeder::class,
            GeofenceAlertSeeder::class,
            TaskSeeder::class,
        ]);
    }
}
