<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\SubscriptionTier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Demo accounts use a well-known password locally. In production they are only
        // created when DEMO_USER_PASSWORD is set, so a deploy never ships guessable logins.
        $password = env('DEMO_USER_PASSWORD') ?: (app()->environment('production') ? null : 'password');

        if (!$password) {
            $this->command?->warn('UserSeeder: skipped demo users (set DEMO_USER_PASSWORD to create them).');
            return;
        }

        $freeTier = SubscriptionTier::where('slug', 'free')->first();
        $starterTier = SubscriptionTier::where('slug', 'starter')->first();
        
        $users = [
            [
                'name' => 'Admin User',
                'email' => 'admin@oasis.com',
                'password' => Hash::make($password),
                'role' => 'Admin',
                'is_active' => true,
                'phone' => '+971500000001',
                'subscription_tier_id' => $starterTier?->id,
            ],
            [
                'name' => 'Khalid Al-Rashid',
                'email' => 'khalid@oasis.com',
                'password' => Hash::make($password),
                'role' => 'Owner',
                'is_active' => true,
                'phone' => '+971500000002',
                'subscription_tier_id' => $starterTier?->id,
            ],
            [
                'name' => 'Ahmad Hassan',
                'email' => 'ahmad@oasis.com',
                'password' => Hash::make($password),
                'role' => 'Owner',
                'is_active' => true,
                'phone' => '+971500000003',
                'subscription_tier_id' => $starterTier?->id,
            ],
            [
                'name' => 'Saeed Al-Maktoum',
                'email' => 'saeed@oasis.com',
                'password' => Hash::make($password),
                'role' => 'Owner',
                'is_active' => true,
                'phone' => '+971500000004',
                'subscription_tier_id' => $starterTier?->id,
            ],
            [
                'name' => 'Fatima Al-Said',
                'email' => 'fatima@oasis.com',
                'password' => Hash::make($password),
                'role' => 'Manager',
                'is_active' => true,
                'phone' => '+971500000005',
                'subscription_tier_id' => $freeTier?->id,
            ],
        ];

        foreach ($users as $userData) {
            $roleName = $userData['role'];
            unset($userData['role']);
            
            $user = User::updateOrCreate(['email' => $userData['email']], $userData);
            $spatieRole = Role::where('name', $roleName)->first();
            if ($spatieRole) {
                $user->syncRoles([$spatieRole]);
            }
        }
    }
}
