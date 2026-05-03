<?php

namespace App\Http\Controllers\Api\Tasks;

use App\Models\Task;
use App\Models\User;
use App\Models\Animal;
use App\Models\Geofence;
use App\Models\PredefinedTask;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;

class TaskController extends Controller
{
    private function canAccessTask(Request $request, Task $task): bool
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        if ($userRole === 'Admin') {
            return true;
        }

        if ($task->owner_id == $userId) {
            return true;
        }

        if ($task->assigned_to == $userId) {
            return true;
        }

        $manager = User::find($userId);
        if ($manager && $manager->hasAnyRole(['Manager', 'Owner'])) {
            $managedUsers = User::where('managed_by', $userId)->pluck('id')->toArray();
            return in_array($task->owner_id, $managedUsers) || in_array($task->assigned_to, $managedUsers);
        }

        return false;
    }

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
            return $query->where(function ($q) use ($managedUserIds) {
                $q->whereIn('owner_id', $managedUserIds)
                  ->orWhereIn('assigned_to', $managedUserIds);
            });
        }

        if ($userRole === 'Shepherd') {
            return $query->where('assigned_to', $userId);
        }

        return $query->where('id', 0);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Task::with(['owner', 'assignee', 'animal', 'geofence']);
        $query = $this->filterByRole($request, $query);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        if ($request->has('assigned_to') && $request->assigned_to !== 'all') {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->has('owner_id') && $request->owner_id !== 'all') {
            $query->where('owner_id', $request->owner_id);
        }

        if ($request->boolean('overdue')) {
            $query->where('due_date', '<', now())->where('status', '!=', 'completed');
        }

        $tasks = $query->orderBy('due_date', 'asc')->paginate(20);

        return response()->json($tasks);
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = $request->user();
        
        if ($authUser && !$authUser->hasPermissionTo('manage_tasks')) {
            return response()->json(['message' => 'Unauthorized to create tasks', 'error' => 'unauthorized'], 403);
        }
        
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        if (!$authUser && !in_array($userRole, ['Admin', 'Owner', 'Manager'])) {
            return response()->json(['message' => 'Unauthorized to create tasks', 'error' => 'unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'required|exists:users,id',
            'animal_id' => 'nullable|exists:animals,id',
            'geofence_id' => 'nullable|exists:geofences,id',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'task_type' => 'nullable|in:inspection,medical,feeding,movement,other',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'is_recurring' => 'nullable|boolean',
            'recurrence_pattern' => 'nullable|string|in:daily,weekly,monthly,custom',
            'recurrence_interval' => 'nullable|integer|min:1|max:365',
            'recurrence_end_date' => 'nullable|date|after:today',
        ]);

        $assignee = User::find($validated['assigned_to']);
        if (!$assignee) {
            return response()->json(['message' => 'Assignee not found'], 404);
        }

        if ($userRole === 'Manager') {
            $managedUsers = User::where('managed_by', $userId)->pluck('id')->toArray();
            if (!in_array($assignee->managed_by, $managedUsers) && $assignee->managed_by != $userId) {
                return response()->json(['message' => 'Cannot assign task to this user'], 403);
            }
        }

        if ($userRole === 'Owner' && $assignee->managed_by != $userId) {
            return response()->json(['message' => 'Cannot assign task to this user'], 403);
        }

        $validated['owner_id'] = $userId;
        $validated['status'] = 'pending';

        if ($request->boolean('is_recurring')) {
            $validated['is_recurring'] = true;
            $validated['recurrence_pattern'] = $request->recurrence_pattern ?? 'weekly';
            $validated['recurrence_interval'] = $request->recurrence_interval ?? 1;
            $validated['recurrence_end_date'] = $request->recurrence_end_date ?? null;
        }

        $task = Task::create($validated);

        if ($task->is_recurring) {
            $task->createNextOccurrence();
        }

        return response()->json([
            'message' => 'Task created successfully',
            'task' => $task->load(['owner', 'assignee', 'animal', 'geofence']),
        ], 201);
    }

    public function show(Request $request, Task $task): JsonResponse
    {
        if (!$this->canAccessTask($request, $task)) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        $task->load(['owner', 'assignee', 'animal', 'geofence']);

        return response()->json(['data' => $task]);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        if (!$this->canAccessTask($request, $task)) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        $userRole = $request->header('X-User-Role');
        $userId = $request->header('X-User-Id');

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'animal_id' => 'nullable|exists:animals,id',
            'geofence_id' => 'nullable|exists:geofences,id',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'status' => 'nullable|in:pending,in_progress,completed,cancelled',
            'task_type' => 'nullable|in:inspection,medical,feeding,movement,other',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        if (isset($validated['status']) && $validated['status'] === 'completed') {
            $validated['completed_at'] = now();
        }

        if ($userRole === 'Shepherd') {
            unset($validated['assigned_to'], $validated['owner_id'], $validated['title'], $validated['priority'], $validated['task_type'], $validated['due_date']);
            if (isset($validated['status']) && $validated['status'] === 'cancelled') {
                unset($validated['status']);
            }
        } elseif (in_array($userRole, ['Owner', 'Admin'])) {
            if (isset($validated['assigned_to'])) {
                $assignee = User::find($validated['assigned_to']);
                if ($assignee && $assignee->managed_by != $userId && $userRole !== 'Admin') {
                    return response()->json(['message' => 'Cannot reassign to this user'], 403);
                }
            }
        } else {
            unset($validated['assigned_to'], $validated['owner_id']);
        }

        $task->update($validated);

        return response()->json([
            'message' => 'Task updated successfully',
            'task' => $task->load(['owner', 'assignee', 'animal', 'geofence']),
        ]);
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        $authUser = $request->user();
        
        if ($authUser && !$authUser->hasPermissionTo('manage_tasks')) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }
        
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        if ($userRole === 'Shepherd') {
            return response()->json(['message' => 'Shepherds cannot delete tasks'], 403);
        }

        if ($userRole === 'Admin' || $task->owner_id == $userId) {
            $task->delete();
            return response()->json(['message' => 'Task deleted successfully']);
        }

        return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
    }

    public function myTasks(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-Id');

        $query = Task::with(['owner', 'animal', 'geofence'])
            ->where('assigned_to', $userId);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $tasks = $query->orderBy('due_date', 'asc')->paginate(20);

        return response()->json($tasks);
    }

    public function complete(Task $task): JsonResponse
    {
        $task->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Task completed',
            'task' => $task->load(['owner', 'assignee', 'animal', 'geofence']),
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        $query = Task::query();

        if ($userRole === 'Admin') {
        } elseif ($userRole === 'Owner') {
            $query->where('owner_id', $userId);
        } elseif ($userRole === 'Manager') {
            $managedUserIds = User::where('managed_by', $userId)->pluck('id')->toArray();
            $managedUserIds[] = $userId;
            $query->whereIn('owner_id', $managedUserIds);
        } else {
            $query->where('assigned_to', $userId);
        }

        $stats = [
            'total' => $query->count(),
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'in_progress' => (clone $query)->where('status', 'in_progress')->count(),
            'completed' => (clone $query)->where('status', 'completed')->count(),
            'overdue' => (clone $query)->where('due_date', '<', now())->where('status', '!=', 'completed')->count(),
            'high_priority' => (clone $query)->whereIn('priority', ['high', 'urgent'])->whereNotIn('status', ['completed', 'cancelled'])->count(),
        ];

        return response()->json($stats);
    }
}