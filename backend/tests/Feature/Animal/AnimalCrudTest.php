<?php

namespace Tests\Feature\Animal;

use Tests\TestCase;
use App\Models\Animal;

class AnimalCrudTest extends TestCase
{
    protected $user;
    protected $otherUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = $this->createUser(['email' => 'owner@example.com']);
        $this->otherUser = $this->createUser(['email' => 'other@example.com']);
        $this->user->givePermissionTo([
            'manage_animals', 'manage_devices', 'manage_users', 
            'manage_geofences', 'manage_auctions'
        ]);
        $this->otherUser->givePermissionTo(['manage_animals']);
        $this->authAs($this->user);
    }

    protected function createAnimal(array $overrides = []): \App\Models\Animal
    {
        $uniqueId = uniqid('ANI');
        return \App\Models\Animal::create([
            'animal_id' => $overrides['animal_id'] ?? $uniqueId,
            'name' => $overrides['name'] ?? 'Test Animal',
            'species' => $overrides['species'] ?? 'Sheep',
            'breed' => $overrides['breed'] ?? 'Merino',
            'date_of_birth' => $overrides['date_of_birth'] ?? now()->subYears(2),
            'gender' => $overrides['gender'] ?? 'Male',
            'color_markings' => $overrides['color_markings'] ?? 'White',
            'current_weight' => $overrides['current_weight'] ?? 50.00,
            'owner_id' => $overrides['owner_id'] ?? $this->user->id,
        ]);
    }

    public function test_owner_can_create_animal(): void
    {
        $response = $this->postJson('/api/animals', [
            'name' => 'Test Sheep',
            'species' => 'Sheep',
            'breed' => 'Merino',
            'date_of_birth' => '2022-01-01',
            'gender' => 'Male',
            'color_markings' => 'White',
            'current_weight' => 50.00,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => ['id', 'animal_id', 'species'],
            ]);

        $this->assertDatabaseHas('animals', ['species' => 'Sheep']);
    }

    public function test_owner_can_list_their_animals(): void
    {
        $this->createAnimal(['owner_id' => $this->user->id]);
        $this->createAnimal(['owner_id' => $this->user->id]);
        $otherAnimal = $this->createAnimal(['owner_id' => $this->otherUser->id, 'animal_id' => 'ANI999']);

        $response = $this->getJson('/api/animals');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertGreaterThanOrEqual(2, count($data['data'] ?? $data));
    }

    public function test_owner_can_view_their_animal(): void
    {
        $animal = $this->createAnimal(['owner_id' => $this->user->id]);

        $response = $this->getJson("/api/animals/{$animal->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $animal->id);
    }

    public function test_owner_cannot_view_other_owner_animal(): void
    {
        $animal = $this->createAnimal(['owner_id' => $this->otherUser->id]);

        $response = $this->getJson("/api/animals/{$animal->id}");

        $response->assertStatus(403);
    }

    public function test_owner_can_update_their_animal(): void
    {
        $animal = $this->createAnimal(['owner_id' => $this->user->id]);

        $response = $this->putJson("/api/animals/{$animal->id}", [
            'species' => 'Goat',
            'breed' => 'Boer',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.species', 'Goat');

        $this->assertDatabaseHas('animals', [
            'id' => $animal->id,
            'species' => 'Goat',
        ]);
    }

    public function test_owner_can_delete_their_animal(): void
    {
        $animal = $this->createAnimal(['owner_id' => $this->user->id]);

        $response = $this->deleteJson("/api/animals/{$animal->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('animals', ['id' => $animal->id]);
    }

    public function test_animal_creation_requires_required_fields(): void
    {
        $response = $this->postJson('/api/animals', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['species', 'gender', 'name']);
    }

    public function test_animal_requires_valid_gender(): void
    {
        $response = $this->postJson('/api/animals', [
            'species' => 'Sheep',
            'gender' => 'Invalid',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['gender']);
    }
}