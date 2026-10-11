<?php

namespace Tests\Feature\AnimalGroup;

use App\Models\AnimalGroup;
use Tests\TestCase;

class AnimalGroupCrudTest extends TestCase
{
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = $this->createUser(['email' => 'owner@example.com']);
        $this->authAs($this->user);
    }

    private function createGroup(array $overrides = []): AnimalGroup
    {
        return AnimalGroup::create(array_merge([
            'name' => 'Racing Camels',
            'description' => 'Camels in race training',
            'color' => '#D4AF37',
            'owner_id' => $this->user->id,
        ], $overrides));
    }

    public function test_owner_can_create_group(): void
    {
        $response = $this->postJson('/api/animal-groups', [
            'name' => 'Goat Herd',
            'description' => 'Breeding does',
            'color' => '#06402B',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('animal_groups', [
            'name' => 'Goat Herd',
            'owner_id' => $this->user->id,
        ]);
    }

    public function test_owner_can_list_groups(): void
    {
        $this->createGroup(['name' => 'Group A']);
        $this->createGroup(['name' => 'Group B']);

        $response = $this->getJson('/api/animal-groups');

        $response->assertStatus(200);
        $this->assertEqualsCanonicalizing(['Group A', 'Group B'], collect($response->json('data'))->pluck('name')->all());
    }

    public function test_owner_can_view_group(): void
    {
        $group = $this->createGroup();

        $response = $this->getJson("/api/animal-groups/{$group->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Racing Camels');
    }

    public function test_owner_cannot_view_another_owners_group(): void
    {
        $other = $this->createUser(['email' => 'other@example.com']);
        $group = $this->createGroup(['owner_id' => $other->id]);

        $this->getJson("/api/animal-groups/{$group->id}")->assertStatus(403);
    }

    public function test_owner_can_update_group(): void
    {
        $group = $this->createGroup();

        $response = $this->putJson("/api/animal-groups/{$group->id}", ['name' => 'Endurance Camels']);

        $response->assertStatus(200);
        $this->assertDatabaseHas('animal_groups', ['id' => $group->id, 'name' => 'Endurance Camels']);
    }

    public function test_owner_can_delete_group(): void
    {
        $group = $this->createGroup();

        $this->deleteJson("/api/animal-groups/{$group->id}")->assertStatus(200);
        $this->assertDatabaseMissing('animal_groups', ['id' => $group->id]);
    }

    public function test_owner_can_add_animals_to_group(): void
    {
        $group = $this->createGroup();
        $animal = $this->createAnimal(['owner_id' => $this->user->id]);

        $response = $this->postJson("/api/animal-groups/{$group->id}/add-animals", [
            'animal_ids' => [$animal->id],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('animal_group_member', [
            'animal_group_id' => $group->id,
            'animal_id' => $animal->id,
        ]);
    }
}
