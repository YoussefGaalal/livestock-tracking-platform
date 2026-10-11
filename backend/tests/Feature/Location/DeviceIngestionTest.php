<?php

namespace Tests\Feature\Location;

use Tests\TestCase;

class DeviceIngestionTest extends TestCase
{
    private function trackedDevice(string $deviceId): \App\Models\Device
    {
        $owner = $this->createUser(['email' => "{$deviceId}@example.com"]);
        $animal = $this->createAnimal(['owner_id' => $owner->id]);

        return \App\Models\Device::create([
            'device_id' => $deviceId,
            'name' => "Tracker {$deviceId}",
            'owner_id' => $owner->id,
            'animal_id' => $animal->id,
        ]);
    }

    private function ping(int $deviceId, array $headers = [])
    {
        return $this->postJson('/api/location-history', [
            'device_id' => $deviceId,
            'latitude' => 24.4539,
            'longitude' => 54.3773,
        ], $headers);
    }

    public function test_ingestion_requires_a_device_token(): void
    {
        $device = $this->trackedDevice('IOT-100');

        $this->ping($device->id)->assertStatus(401);
        $this->ping($device->id, ['X-Device-Token' => 'not-a-real-token'])->assertStatus(401);
        $this->assertDatabaseCount('location_history', 0);
    }

    public function test_a_device_cannot_report_for_another_device(): void
    {
        $device = $this->trackedDevice('IOT-101');
        $other = $this->trackedDevice('IOT-102');
        $token = $device->issueApiToken();

        $this->ping($other->id, ['X-Device-Token' => $token])->assertStatus(403);
        $this->assertDatabaseCount('location_history', 0);
    }

    public function test_device_with_valid_token_records_location(): void
    {
        $device = $this->trackedDevice('IOT-103');
        $token = $device->issueApiToken();

        $this->ping($device->id, ['X-Device-Token' => $token])->assertStatus(201);

        $this->assertDatabaseHas('location_history', ['device_id' => $device->id]);
        $this->assertSame('online', $device->fresh()->status);
    }

    public function test_device_token_is_stored_hashed_and_never_serialized(): void
    {
        $device = $this->trackedDevice('IOT-104');
        $token = $device->issueApiToken();

        $this->assertSame(hash('sha256', $token), $device->fresh()->api_token);
        $this->assertArrayNotHasKey('api_token', $device->fresh()->toArray());
    }
}
