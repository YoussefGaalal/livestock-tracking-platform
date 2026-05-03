<?php

namespace Database\Seeders;

use App\Models\SubscriptionTier;
use Illuminate\Database\Seeder;

class SubscriptionTierSeeder extends Seeder
{
    public function run(): void
    {
        $tiers = [
            [
                'name' => 'Free',
                'slug' => 'free',
                'description' => 'Perfect for getting started with basic tracking',
                'price_monthly' => 0,
                'price_yearly' => 0,
                'trial_days' => 0,
                'max_animals' => 5,
                'max_devices' => 5,
                'max_users' => 1,
                'has_geofencing' => true,
                'has_auctions' => true,
                'has_advanced_reports' => false,
                'has_api_access' => true,
                'has_ai_assistant' => true,
                'has_medical_records' => true,
                'has_tasks' => true,
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'For small farms with essential features',
                'price_monthly' => 99,
                'price_yearly' => 990,
                'trial_days' => 14,
                'max_animals' => 20,
                'max_devices' => 20,
                'max_users' => 3,
                'has_geofencing' => true,
                'has_auctions' => true,
                'has_advanced_reports' => false,
                'has_api_access' => true,
                'has_ai_assistant' => true,
                'has_medical_records' => true,
                'has_tasks' => true,
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Professional',
                'slug' => 'professional',
                'description' => 'For growing operations with advanced features',
                'price_monthly' => 299,
                'price_yearly' => 2990,
                'trial_days' => 30,
                'max_animals' => 100,
                'max_devices' => 100,
                'max_users' => 10,
                'has_geofencing' => true,
                'has_auctions' => true,
                'has_advanced_reports' => true,
                'has_api_access' => true,
                'has_ai_assistant' => true,
                'has_medical_records' => true,
                'has_tasks' => true,
                'sort_order' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'Complete solution for large operations',
                'price_monthly' => 799,
                'price_yearly' => 7990,
                'trial_days' => 30,
                'max_animals' => 0,
                'max_devices' => 0,
                'max_users' => 0,
                'has_geofencing' => true,
                'has_auctions' => true,
                'has_advanced_reports' => true,
                'has_api_access' => true,
                'has_ai_assistant' => true,
                'has_medical_records' => true,
                'has_tasks' => true,
                'sort_order' => 4,
                'is_active' => true,
            ],
        ];

        foreach ($tiers as $tier) {
            SubscriptionTier::updateOrCreate(
                ['slug' => $tier['slug']],
                $tier
            );
        }
    }
}
