<?php

namespace Tests\Feature\Species;

use Tests\TestCase;

class SpeciesTest extends TestCase
{
    public function test_can_list_species(): void
    {
        $response = $this->getJson('/api/species');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name']
                ]
            ]);
    }

    public function test_species_includes_common_animals(): void
    {
        $response = $this->getJson('/api/species');

        $response->assertStatus(200);
        $species = $response->json('data');
        $speciesNames = collect($species)->pluck('name')->toArray();
        
        $this->assertContains('Sheep', $speciesNames);
        $this->assertContains('Goat', $speciesNames);
        $this->assertContains('Cattle', $speciesNames);
    }
}