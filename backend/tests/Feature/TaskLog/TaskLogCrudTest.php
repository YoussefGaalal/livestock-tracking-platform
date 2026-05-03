<?php

namespace Tests\Feature\TaskLog;

use Tests\TestCase;

class TaskLogCrudTest extends TestCase
{
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = $this->createUser(['email' => 'owner@example.com']);
        $this->user->givePermissionTo(['manage_tasks']);
        $this->authAs($this->user);
    }

    public function test_owner_can_list_task_logs(): void
    {
        $response = $this->getJson('/api/task-logs');

        $response->assertStatus(200);
    }

    public function test_owner_can_get_my_logs(): void
    {
        $response = $this->getJson('/api/task-logs/my');

        $response->assertStatus(200);
    }
}