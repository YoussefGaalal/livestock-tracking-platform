<?php

namespace Tests\Feature\Auction;

use Tests\TestCase;
use App\Models\Auction;
use App\Models\Animal;

class AuctionCrudTest extends TestCase
{
    protected $owner;
    protected $otherUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = $this->createUser(['email' => 'owner@test.com', 'subscription_tier_id' => 3]);
        $this->otherUser = $this->createUser(['email' => 'other@test.com', 'subscription_tier_id' => 3]);
        $this->owner->givePermissionTo([
            'manage_animals', 'manage_auctions', 'manage_devices', 
            'manage_geofences', 'view_reports', 'export_data'
        ]);
        $this->withoutMiddleware(\App\Http\Middleware\CheckSubscriptionLimits::class);
        $this->authAs($this->owner);
    }

    protected function createAuction(array $overrides = []): \App\Models\Auction
    {
        $animal = $overrides['animal'] ?? $this->createAnimal(['owner_id' => $this->owner->id]);
        return \App\Models\Auction::create([
            'animal_id' => $animal->id,
            'owner_id' => $overrides['owner_id'] ?? $this->owner->id,
            'title' => $overrides['title'] ?? 'Test Auction ' . uniqid(),
            'starting_price' => $overrides['starting_price'] ?? 100,
            'current_price' => $overrides['current_price'] ?? 100,
            'reserve_price' => $overrides['reserve_price'] ?? null,
            'status' => $overrides['status'] ?? 'active',
            'start_time' => $overrides['start_time'] ?? now(),
            'end_time' => $overrides['end_time'] ?? now()->addDays(7),
        ]);
    }

    protected function createAnimal(array $overrides = []): \App\Models\Animal
    {
        return \App\Models\Animal::create([
            'animal_id' => $overrides['animal_id'] ?? 'ANI' . uniqid(),
            'name' => $overrides['name'] ?? 'Test Animal',
            'species' => $overrides['species'] ?? 'Sheep',
            'breed' => $overrides['breed'] ?? 'Merino',
            'date_of_birth' => $overrides['date_of_birth'] ?? now()->subYears(2),
            'gender' => $overrides['gender'] ?? 'Male',
            'color_markings' => $overrides['color_markings'] ?? 'White',
            'current_weight' => $overrides['current_weight'] ?? 50.00,
            'owner_id' => $overrides['owner_id'] ?? $this->owner->id,
        ]);
    }

    public function test_owner_can_list_auctions(): void
    {
        $this->createAuction();
        $this->createAuction(['title' => 'Auction 2']);

        $response = $this->getJson('/api/auctions');

        $response->assertStatus(200);
    }

    public function test_owner_can_view_auction(): void
    {
        $auction = $this->createAuction();

        $response = $this->getJson("/api/auctions/{$auction->id}");

        $response->assertStatus(200);
    }

    public function test_owner_can_update_auction(): void
    {
        $auction = $this->createAuction();

        $response = $this->putJson("/api/auctions/{$auction->id}", [
            'title' => 'Updated Auction',
            'starting_price' => 150,
            'duration_hours' => 168,
        ]);

        $response->assertStatus(200);
    }

    public function test_owner_can_delete_auction(): void
    {
        $auction = $this->createAuction();

        $response = $this->deleteJson("/api/auctions/{$auction->id}");

        $response->assertStatus(200);
    }
}