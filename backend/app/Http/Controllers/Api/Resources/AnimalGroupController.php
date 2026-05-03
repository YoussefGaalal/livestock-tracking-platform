<?php

namespace App\Http\Controllers\Api\Resources;

use App\Models\AnimalGroup;
use App\Models\Animal;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Traits\OwnableAuthorization;
use App\Http\Controllers\Controller;

class AnimalGroupController extends Controller
{
    use OwnableAuthorization;

    public function index(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');
        
        $query = AnimalGroup::with(['owner']);
        $query = $this->filterByOwner($request, $query);
        
        $groups = $query->withCount('animals')->orderBy('created_at', 'desc')->get();
        
        $groups = $groups->map(function($group) use ($userId, $userRole) {
            $filteredAnimals = $group->animals->filter(function($animal) use ($userId, $userRole) {
                if ($userRole === 'Admin') return true;
                if ($userRole === 'Owner') return $animal->owner_id == $userId;
                if ($userRole === 'Manager') {
                    $user = User::find($userId);
                    return $user && $user->managed_by && $animal->owner_id == $user->managed_by;
                }
                return $animal->owner_id == $userId;
            });
            $group->setRelation('animals', $filteredAnimals);
            $group->animals_count = $filteredAnimals->count();
            return $group;
        });
        
        return response()->json(['data' => $groups]);
    }

    public function store(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');
        
        if (!in_array($userRole, ['Admin', 'Owner', 'Manager'])) {
            return response()->json(['message' => 'Unauthorized to create animal groups', 'error' => 'unauthorized'], 403);
        }
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'animal_ids' => 'nullable|array',
            'animal_ids.*' => 'exists:animals,id',
        ]);

        $ownerId = null;
        if ($userRole === 'Owner') {
            $ownerId = $userId;
        } elseif ($userRole === 'Manager') {
            $user = User::find($userId);
            $ownerId = $user->managed_by ?? $userId;
        } elseif ($userRole === 'Admin') {
            $ownerId = $request->input('owner_id');
        }

        $animalIds = $validated['animal_ids'] ?? [];
        if ($userRole === 'Admin' && $ownerId && !empty($animalIds)) {
            $ownedAnimalIds = Animal::whereIn('id', $animalIds)
                ->where('owner_id', $ownerId)
                ->pluck('id')
                ->toArray();
            $animalIds = $ownedAnimalIds;
        }
        
        $group = AnimalGroup::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'color' => $validated['color'] ?? '#D4AF37',
            'owner_id' => $ownerId,
        ]);

        if (!empty($animalIds)) {
            $group->animals()->attach($animalIds);
        }

        return response()->json([
            'message' => 'Animal group created successfully',
            'data' => $group->load('animals'),
        ], 201);
    }

    public function show(Request $request, AnimalGroup $animalGroup): JsonResponse
    {
        if (!$this->canAccessOwner($request, $animalGroup->owner_id)) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }
        
        $animalGroup->load(['animals.device', 'owner']);
        return response()->json(['data' => $animalGroup]);
    }

    public function update(Request $request, AnimalGroup $animalGroup): JsonResponse
    {
        $userRole = $request->header('X-User-Role');
        $userId = $request->header('X-User-Id');
        
        if ($userRole !== 'Admin') {
            if (!$this->canAccessOwner($request, $animalGroup->owner_id)) {
                return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
            }
        }
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'animal_ids' => 'nullable|array',
            'animal_ids.*' => 'exists:animals,id',
            'owner_id' => 'nullable|exists:users,id',
        ]);

        $updateData = [
            'name' => $validated['name'] ?? $animalGroup->name,
            'description' => $validated['description'] ?? $animalGroup->description,
            'color' => $validated['color'] ?? $animalGroup->color,
        ];

        if ($userRole === 'Admin' && isset($validated['owner_id']) && $validated['owner_id'] !== '') {
            $updateData['owner_id'] = $validated['owner_id'];
        }

        $animalGroup->update($updateData);

        $animalIds = $validated['animal_ids'] ?? null;
        if ($userRole === 'Admin' && $animalGroup->owner_id && $animalIds !== null) {
            $ownedAnimalIds = Animal::whereIn('id', $animalIds)
                ->where('owner_id', $animalGroup->owner_id)
                ->pluck('id')
                ->toArray();
            $animalIds = $ownedAnimalIds;
        }

        if ($animalIds !== null) {
            $animalGroup->animals()->sync($animalIds);
        }

        return response()->json([
            'message' => 'Animal group updated successfully',
            'data' => $animalGroup->load('animals'),
        ]);
    }

    public function destroy(Request $request, AnimalGroup $animalGroup): JsonResponse
    {
        if (!$this->canAccessOwner($request, $animalGroup->owner_id)) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }
        
        $animalGroup->delete();
        return response()->json(['message' => 'Animal group deleted successfully']);
    }

    public function addAnimals(Request $request, AnimalGroup $animalGroup): JsonResponse
    {
        if (!$this->canAccessOwner($request, $animalGroup->owner_id)) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }
        
        $validated = $request->validate([
            'animal_ids' => 'required|array',
            'animal_ids.*' => 'exists:animals,id',
        ]);

        $userRole = $request->header('X-User-Role');
        if ($userRole === 'Admin' && $animalGroup->owner_id) {
            $ownedAnimals = Animal::whereIn('id', $validated['animal_ids'])
                ->where('owner_id', $animalGroup->owner_id)
                ->pluck('id')
                ->toArray();
            $animalGroup->animals()->syncWithoutDetaching($ownedAnimals);
        } else {
            $animalGroup->animals()->syncWithoutDetaching($validated['animal_ids']);
        }
        
        return response()->json([
            'message' => 'Animals added to group',
            'data' => $animalGroup->load('animals'),
        ]);
    }

    public function removeAnimals(Request $request, AnimalGroup $animalGroup): JsonResponse
    {
        if (!$this->canAccessOwner($request, $animalGroup->owner_id)) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }
        
        $validated = $request->validate([
            'animal_ids' => 'required|array',
            'animal_ids.*' => 'exists:animals,id',
        ]);

        $animalGroup->animals()->detach($validated['animal_ids']);
        
        return response()->json([
            'message' => 'Animals removed from group',
            'data' => $animalGroup->load('animals'),
        ]);
    }

    public function availableAnimals(Request $request, AnimalGroup $animalGroup): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');
        
        $query = Animal::with('device');
        
        if ($userRole === 'Admin') {
            if ($animalGroup->owner_id) {
                $query->where('owner_id', $animalGroup->owner_id);
            }
        } elseif ($userRole === 'Owner') {
            $query->where('owner_id', $userId);
        } elseif ($userRole === 'Manager') {
            $user = User::find($userId);
            if ($user && $user->managed_by) {
                $query->where('owner_id', $user->managed_by);
            } else {
                $query->where('id', 0);
            }
        } else {
            $query->where('owner_id', $userId);
        }

        $assignedIds = $animalGroup->animals()->pluck('animals.id');
        $available = $query->whereNotIn('id', $assignedIds)->get();
        
        return response()->json(['data' => $available]);
    }
}