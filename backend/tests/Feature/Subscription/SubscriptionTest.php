<?php

namespace Tests\Feature\Subscription;

use Tests\TestCase;

class SubscriptionTest extends TestCase
{
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = $this->createUser(['email' => 'owner@example.com']);
        $this->authAs($this->user);
    }

    public function test_can_list_subscription_tiers(): void
    {
        $response = $this->getJson('/api/subscription/tiers');

        $response->assertStatus(200);
    }

    public function test_can_get_current_subscription(): void
    {
        $response = $this->getJson('/api/subscription/current');

        $response->assertStatus(200)
            ->assertJsonPath('tier.slug', 'basic')
            ->assertJsonStructure(['limits' => ['animals' => ['used', 'max'], 'devices', 'users']]);
    }
}