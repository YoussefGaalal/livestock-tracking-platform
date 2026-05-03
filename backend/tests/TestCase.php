<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Use MySQL for testing (matches production)
        config(['database.default' => 'mysql']);
        
        $this->seedDatabase();
    }

    protected function seedDatabase(): void
    {
        $this->seedSubscriptionTiers();
        $this->seedPermissions();
    }

    protected function seedPermissions(): void
    {
        $roles = ['Admin', 'Owner', 'Veterinarian', 'Shepherd', 'Manager'];
        foreach ($roles as $role) {
            \Spatie\Permission\Models\Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        $permissions = [
            'manage_animals',
            'manage_devices',
            'manage_users',
            'manage_geofences',
            'manage_auctions',
            'manage_medical_records',
            'manage_tasks',
            'manage_vaccinations',
            'view_reports',
            'export_data',
        ];

        foreach ($permissions as $permission) {
            \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
    }

    protected function seedSubscriptionTiers(): void
    {
        \App\Models\SubscriptionTier::create([
            'name' => 'Free',
            'slug' => 'free',
            'max_animals' => 10,
            'max_devices' => 5,
            'max_users' => 2,
            'has_geofencing' => false,
            'has_auctions' => false,
            'price_monthly' => 0,
        ]);

        \App\Models\SubscriptionTier::create([
            'name' => 'Basic',
            'slug' => 'basic',
            'max_animals' => 50,
            'max_devices' => 25,
            'max_users' => 10,
            'has_geofencing' => true,
            'has_auctions' => true,
            'price_monthly' => 29.99,
        ]);

        \App\Models\SubscriptionTier::create([
            'name' => 'Premium',
            'slug' => 'premium',
            'max_animals' => 200,
            'max_devices' => 100,
            'max_users' => 50,
            'has_geofencing' => true,
            'has_auctions' => true,
            'price_monthly' => 99.99,
        ]);
    }

    protected function createUser(array $overrides = []): \App\Models\User
    {
        $tierId = $overrides['subscription_tier_id'] ?? 2;
        
        $user = \App\Models\User::create([
            'name' => $overrides['name'] ?? 'Test User',
            'email' => $overrides['email'] ?? 'test@example.com',
            'password' => bcrypt('password123'),
            'phone' => $overrides['phone'] ?? '+1234567890',
            'is_active' => true,
            'subscription_tier_id' => $tierId,
        ]);
        
        $user->assignRole($overrides['role'] ?? 'Owner');
        
        return $user;
    }

    protected function createAnimal(array $overrides = []): \App\Models\Animal
    {
        static $counter = 0;
        $counter++;
        return \App\Models\Animal::create([
            'animal_id' => $overrides['animal_id'] ?? 'ANI' . str_pad($counter, 4, '0', STR_PAD_LEFT),
            'species' => $overrides['species'] ?? 'Sheep',
            'breed' => $overrides['breed'] ?? 'Merino',
            'date_of_birth' => $overrides['date_of_birth'] ?? now()->subYears(2),
            'gender' => $overrides['gender'] ?? 'Male',
            'color_markings' => $overrides['color_markings'] ?? 'White',
            'current_weight' => $overrides['current_weight'] ?? 50.00,
            'owner_id' => $overrides['owner_id'] ?? $this->user->id ?? $this->createUser()->id,
        ]);
    }

    protected function createGeofence(array $overrides = []): \App\Models\Geofence
    {
        return \App\Models\Geofence::create([
            'name' => $overrides['name'] ?? 'Test Geofence',
            'coordinates' => $overrides['coordinates'] ?? [
                [31.0, 29.0],
                [31.0, 30.0],
                [32.0, 30.0],
                [32.0, 29.0],
            ],
            'color' => $overrides['color'] ?? '#ff0000',
            'alert_type' => $overrides['alert_type'] ?? 'entry',
            'is_active' => $overrides['is_active'] ?? true,
            'owner_id' => $overrides['owner_id'] ?? $this->user->id ?? $this->createUser()->id,
        ]);
    }

    protected function createDevice(array $overrides = []): \App\Models\Device
    {
        return \App\Models\Device::create([
            'device_id' => $overrides['device_id'] ?? 'DEV001',
            'model' => $overrides['model'] ?? 'Tracker Pro',
            'battery_level' => $overrides['battery_level'] ?? 100,
            'is_active' => $overrides['is_active'] ?? true,
            'owner_id' => $overrides['owner_id'] ?? $this->user->id ?? $this->createUser()->id,
        ]);
    }

    protected function authAs(\App\Models\User $user): void
    {
        $this->user = $user;
        $user->refresh();
        $this->actingAs($user);
    }
}