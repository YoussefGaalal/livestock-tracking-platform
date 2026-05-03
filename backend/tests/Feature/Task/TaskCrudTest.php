<?php

namespace Tests\Feature\Task;

use Tests\TestCase;

class TaskCrudTest extends TestCase
{
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = $this->createUser(['email' => 'owner@example.com']);
        $this->user->givePermissionTo(['manage_animals', 'manage_tasks']);
        $this->authAs($this->user);
    }

    public function test_owner_can_list_tasks(): void
    {
        $response = $this->getJson('/api/tasks');

        $response->assertStatus(200);
    }

    public function test_owner_can_get_my_tasks(): void
    {
        $response = $this->getJson('/api/tasks/my');

        $response->assertStatus(200);
    }

    public function test_owner_can_get_task_stats(): void
    {
        $response = $this->getJson('/api/tasks/stats');

        $response->assertStatus(200);
    }
}