<?php

namespace Tests\Feature\Device;

use Tests\TestCase;
use App\Models\Device;

class DeviceCrudTest extends TestCase
{
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = $this->createUser(['email' => 'owner@example.com']);
        $this->user->givePermissionTo([
            'manage_animals', 'manage_devices', 'manage_users', 
            'manage_geofences'
        ]);
        $this->authAs($this->user);
    }

    public function test_owner_can_create_device(): void
    {
        $response = $this->postJson('/api/devices', [
            'name' => 'Test Tracker',
            'type' => 'GPS Tracker',
            'status' => 'online',
            'battery_level' => 100,
        ]);

        $response->assertStatus(201);
    }

    public function test_owner_can_list_devices(): void
    {
        $this->createDevice(['owner_id' => $this->user->id, 'device_id' => 'DEV-001']);
        $this->createDevice(['owner_id' => $this->user->id, 'device_id' => 'DEV-002']);

        $response = $this->getJson('/api/devices');

        $response->assertStatus(200);
    }

    public function test_owner_can_view_device(): void
    {
        $device = $this->createDevice(['owner_id' => $this->user->id, 'device_id' => 'DEV-003']);

        $response = $this->getJson("/api/devices/{$device->id}");

        $response->assertStatus(200);
    }

    public function test_owner_can_update_device(): void
    {
        $device = $this->createDevice(['owner_id' => $this->user->id, 'device_id' => 'DEV-004']);

        $response = $this->putJson("/api/devices/{$device->id}", [
            'name' => 'Updated Tracker',
            'battery_level' => 90,
        ]);

        $response->assertStatus(200);
    }

    public function test_owner_can_delete_device(): void
    {
        $device = $this->createDevice(['owner_id' => $this->user->id, 'device_id' => 'DEV-005']);

        $response = $this->deleteJson("/api/devices/{$device->id}");

        $response->assertStatus(200);
    }
}