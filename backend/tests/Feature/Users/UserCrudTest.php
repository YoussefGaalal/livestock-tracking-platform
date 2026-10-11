<?php

namespace Tests\Feature\Users;

use Tests\TestCase;
use App\Models\User;

class UserCrudTest extends TestCase
{
    protected $teamOwner;
    protected $otherOwner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->teamOwner = $this->createUser(['email' => 'admin@example.com']);
        $this->otherOwner = $this->createUser(['email' => 'owner@example.com']);
        $this->withoutMiddleware(\App\Http\Middleware\CheckSubscriptionLimits::class);
        $this->authAs($this->teamOwner);
    }

    public function test_owner_can_list_users(): void
    {
        $response = $this->getJson('/api/users');

        $response->assertStatus(200);
    }

    private function createTeamMember(string $role = 'Shepherd'): User
    {
        $member = $this->createUser(['email' => 'member@example.com', 'role' => $role]);
        $member->update(['managed_by' => $this->teamOwner->id]);

        return $member;
    }

    public function test_owner_can_view_user(): void
    {
        $member = $this->createTeamMember();

        $this->getJson("/api/users/{$member->id}")
            ->assertStatus(200)
            ->assertJsonPath('email', 'member@example.com')
            ->assertJsonPath('role', 'Shepherd');
    }

    public function test_owner_cannot_view_user_outside_their_team(): void
    {
        $this->getJson("/api/users/{$this->otherOwner->id}")->assertStatus(403);
    }

    public function test_owner_can_update_user(): void
    {
        $member = $this->createTeamMember();

        $this->putJson("/api/users/{$member->id}", ['name' => 'Renamed Member'])->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => $member->id, 'name' => 'Renamed Member']);
    }

    public function test_owner_cannot_promote_team_member_to_admin(): void
    {
        $member = $this->createTeamMember();

        $this->putJson("/api/users/{$member->id}", ['role' => 'Admin'])->assertStatus(403);
        $this->assertFalse($member->fresh()->hasRole('Admin'));
    }

    public function test_owner_can_toggle_user_status(): void
    {
        $member = $this->createTeamMember();

        $this->patchJson("/api/users/{$member->id}/toggle-status")->assertStatus(200);
        $this->assertFalse((bool) $member->fresh()->is_active);
    }
}