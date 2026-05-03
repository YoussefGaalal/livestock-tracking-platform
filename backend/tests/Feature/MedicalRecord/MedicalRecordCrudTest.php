<?php

namespace Tests\Feature\MedicalRecord;

use Tests\TestCase;

class MedicalRecordCrudTest extends TestCase
{
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = $this->createUser(['email' => 'owner@example.com']);
        $this->user->givePermissionTo(['manage_animals', 'manage_medical_records']);
        $this->authAs($this->user);
    }

    public function test_owner_can_list_medical_records(): void
    {
        $response = $this->getJson('/api/medical-records');

        $response->assertStatus(200);
    }

    public function test_owner_can_get_medical_stats(): void
    {
        $response = $this->getJson('/api/medical-records/stats');

        $response->assertStatus(200);
    }
}