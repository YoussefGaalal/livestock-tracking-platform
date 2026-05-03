<?php

namespace App\Http\Controllers\Api\Tasks;

use App\Http\Controllers\Controller;
use App\Models\PredefinedTask;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PredefinedTaskController extends Controller
{
    private function filterByRole(Request $request, $query)
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        if ($userRole === 'Admin') {
            return $query;
        }

        if ($userRole === 'Owner') {
            return $query->where('owner_id', $userId);
        }

        if ($userRole === 'Manager') {
            $managedUserIds = User::where('managed_by', $userId)->pluck('id')->toArray();
            $managedUserIds[] = $userId;
            return $query->whereIn('owner_id', $managedUserIds);
        }

        return $query->where('owner_id', 0);
    }

    public function index(Request $request): JsonResponse
    {
        $query = PredefinedTask::query();
        $query = $this->filterByRole($request, $query);

        $tasks = $query->orderBy('title', 'asc')->get();

        return response()->json(['data' => $tasks]);
    }

    public function store(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        if (!in_array($userRole, ['Admin', 'Owner', 'Manager'])) {
            return response()->json(['message' => 'Unauthorized to create predefined tasks', 'error' => 'unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'task_type' => 'nullable|in:inspection,medical,feeding,movement,other',
            'is_recurring' => 'nullable|boolean',
            'recurrence_pattern' => 'nullable|string|in:daily,weekly,monthly,custom',
            'recurrence_interval' => 'nullable|integer|min:1|max:365',
        ]);

        $validated['owner_id'] = $userId;

        $predefinedTask = PredefinedTask::create($validated);

        return response()->json([
            'message' => 'Predefined task created successfully',
            'data' => $predefinedTask,
        ], 201);
    }

    public function show(Request $request, PredefinedTask $predefinedTask): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');
        $authUser = $request->user();

        if ($authUser) {
            $userRole = $authUser->getPrimaryRoleName();
        }

        if ($userRole !== 'Admin' && $predefinedTask->owner_id != $userId) {
            $manager = User::find($userId);
            if (!$manager || !$manager->hasRole('Manager') || !in_array($predefinedTask->owner_id, User::where('managed_by', $userId)->pluck('id')->toArray())) {
                return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
            }
        }

        return response()->json(['data' => $predefinedTask]);
    }

    public function update(Request $request, PredefinedTask $predefinedTask): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        if ($userRole !== 'Admin' && $predefinedTask->owner_id != $userId) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'task_type' => 'nullable|in:inspection,medical,feeding,movement,other',
            'is_recurring' => 'nullable|boolean',
            'recurrence_pattern' => 'nullable|string|in:daily,weekly,monthly,custom',
            'recurrence_interval' => 'nullable|integer|min:1|max:365',
        ]);

        $predefinedTask->update($validated);

        return response()->json([
            'message' => 'Predefined task updated successfully',
            'data' => $predefinedTask,
        ]);
    }

    public function destroy(Request $request, PredefinedTask $predefinedTask): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        if ($userRole !== 'Admin' && $predefinedTask->owner_id != $userId) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        $predefinedTask->delete();

        return response()->json(['message' => 'Predefined task deleted successfully']);
    }
}