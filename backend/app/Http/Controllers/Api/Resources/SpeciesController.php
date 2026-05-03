<?php

namespace App\Http\Controllers\Api\Resources;

use App\Http\Controllers\Controller;
use App\Models\Species;
use App\Models\Breed;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SpeciesController extends Controller
{
    public function index(): JsonResponse
    {
        $species = Species::with('breeds')->where('is_active', true)->get();
        return response()->json(['data' => $species]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:species,name',
            'description' => 'nullable|string',
        ]);

        $species = Species::create($validated);
        return response()->json(['data' => $species, 'message' => 'Species created'], 201);
    }

    public function update(Request $request, Species $species): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|unique:species,name,' . $species->id,
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $species->update($validated);
        return response()->json(['data' => $species, 'message' => 'Species updated']);
    }

    public function destroy(Species $species): JsonResponse
    {
        $species->delete();
        return response()->json(['message' => 'Species deleted']);
    }

    public function storeBreed(Request $request, Species $species): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:breeds,name,species_id,' . $species->id,
            'description' => 'nullable|string',
        ]);

        $breed = $species->breeds()->create($validated);
        return response()->json(['data' => $breed, 'message' => 'Breed created'], 201);
    }

    public function updateBreed(Request $request, Breed $breed): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $breed->update($validated);
        return response()->json(['data' => $breed, 'message' => 'Breed updated']);
    }

    public function destroyBreed(Breed $breed): JsonResponse
    {
        $breed->delete();
        return response()->json(['message' => 'Breed deleted']);
    }
}