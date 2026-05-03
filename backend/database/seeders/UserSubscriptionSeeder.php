<?php

namespace Database\Seeders;

use App\Models\UserSubscription;
use App\Models\User;
use App\Models\SubscriptionTier;
use Illuminate\Database\Seeder;

class UserSubscriptionSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('role', 'Owner')->limit(5)->get();
        $tiers = SubscriptionTier::all();

        foreach ($users as $index => $user) {
            $tier = $tiers->random();
            
            UserSubscription::create([
                'user_id' => $user->id,
                'tier_id' => $tier->id,
                'status' => $index % 3 === 0 ? 'pending_payment' : 'active',
                'started_at' => now(),
                'ends_at' => $tier->trial_days > 0 ? now()->addDays($tier->trial_days) : now()->addDays(30),
                'billing_cycle' => 'monthly',
                'payment_method' => $index % 3 === 0 ? 'bank_transfer' : 'card',
                'payment_reference' => $index % 3 === 0 ? 'BT-' . strtoupper(uniqid()) : 'CARD-' . strtoupper(uniqid()),
            ]);
        }
    }
}
