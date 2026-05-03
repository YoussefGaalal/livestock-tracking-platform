<?php

namespace Tests\Feature\Geofence;

use Tests\TestCase;
use App\Models\Geofence;

class GeofenceCrudTest extends TestCase
{
    protected $user;
    protected $otherUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = $this->createUser();
        $this->otherUser = $this->createUser(['email' => 'other@example.com']);
        $this->user->givePermissionTo(['manage_animals', 'manage_geofences', 'manage_devices']);
        $this->withoutMiddleware(\App\Http\Middleware\CheckSubscriptionLimits::class);
        $this->authAs($this->user);
    }

    public function test_owner_can_create_geofence(): void
    {
        $response = $this->postJson('/api/geofences', [
            'name' => 'Test Pasture',
            'coordinates' => json_encode([
                [31.0, 29.0],
                [31.0, 30.0],
                [32.0, 30.0],
                [32.0, 29.0],
            ]),
            'color' => '#ff0000',
            'alert_type' => 'entry',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('geofences', ['name' => 'Test Pasture']);
    }

    public function test_owner_can_list_their_geofences(): void
    {
        $this->createGeofence(['owner_id' => $this->user->id]);
        $this->createGeofence(['owner_id' => $this->user->id]);

        $response = $this->getJson('/api/geofences');

        $response->assertStatus(200);
    }

    public function test_owner_can_view_geofence(): void
    {
        $geofence = $this->createGeofence(['owner_id' => $this->user->id]);

        $response = $this->getJson("/api/geofences/{$geofence->id}");

        $response->assertStatus(200);
    }

    public function test_owner_can_update_geofence(): void
    {
        $geofence = $this->createGeofence(['owner_id' => $this->user->id]);

        $response = $this->putJson("/api/geofences/{$geofence->id}", [
            'name' => 'Updated Pasture',
            'color' => '#00ff00',
            'coordinates' => json_encode($geofence->coordinates),
        ]);

        $response->assertStatus(200);
    }

    public function test_owner_can_delete_geofence(): void
    {
        $geofence = $this->createGeofence(['owner_id' => $this->user->id]);

        $response = $this->deleteJson("/api/geofences/{$geofence->id}");

        $response->assertStatus(200);
    }

    public function test_geofence_validation_works(): void
    {
        $response = $this->postJson('/api/geofences', [
            'name' => 'Test Geofence',
            'coordinates' => json_encode([
                [31.0, 29.0],
                [31.0, 30.0],
            ]),
        ]);

        $response->assertStatus(201);
    }
}