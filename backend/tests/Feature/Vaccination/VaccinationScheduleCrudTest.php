<?php

namespace Tests\Feature\Vaccination;

use Tests\TestCase;

class VaccinationScheduleCrudTest extends TestCase
{
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = $this->createUser(['email' => 'owner@example.com']);
        $this->user->givePermissionTo(['manage_animals', 'manage_vaccinations']);
        $this->authAs($this->user);
    }

    public function test_owner_can_list_vaccinations(): void
    {
        $response = $this->getJson('/api/vaccination-schedules');

        $response->assertStatus(200);
    }

    public function test_owner_can_get_vaccination_stats(): void
    {
        $response = $this->getJson('/api/vaccination-schedules/stats');

        $response->assertStatus(200);
    }
}