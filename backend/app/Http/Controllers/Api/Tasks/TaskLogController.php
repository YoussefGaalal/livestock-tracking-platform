<?php

namespace App\Http\Controllers\Api\Tasks;

use App\Models\TaskLog;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Controller;

class TaskLogController extends Controller
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

    public function index(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        $query = TaskLog::with(['task', 'user']);

        if ($userRole === 'Admin' || $userRole === 'Owner') {
        } elseif ($userRole === 'Manager') {
            $managedUserIds = User::where('managed_by', $userId)->pluck('id')->toArray();
            $managedUserIds[] = $userId;
            $query->whereHas('task', function ($q) use ($managedUserIds) {
                $q->whereIn('owner_id', $managedUserIds)
                  ->orWhereIn('assigned_to', $managedUserIds);
            });
        } else {
            $query->where('user_id', $userId);
        }

        if ($request->has('task_id')) {
            $query->where('task_id', $request->task_id);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('log_type') && $request->log_type !== 'all') {
            $query->where('log_type', $request->log_type);
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(30);

        return response()->json($logs);
    }

    public function store(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        if ($userRole !== 'Shepherd') {
            return response()->json(['message' => 'Only shepherds can submit task logs'], 403);
        }

        $validated = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'log_type' => 'required|in:checkpoint,photo,note,location_update,status_change',
            'description' => 'required|string|max:2000',
            'location_lat' => 'nullable|numeric',
            'location_lng' => 'nullable|numeric',
            'photo' => 'nullable|file|mimes:jpeg,png,jpg|max:5120',
            'voice_note' => 'nullable|file|mimes:webm,mp3,wav|max:10240',
        ]);

        $task = Task::find($validated['task_id']);

        if (!$this->canAccessTask($request, $task)) {
            return response()->json(['message' => 'Unauthorized to submit logs for this task', 'error' => 'unauthorized'], 403);
        }

        if ($task->assigned_to != $userId) {
            return response()->json(['message' => 'You can only submit logs for tasks assigned to you', 'error' => 'unauthorized'], 403);
        }

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photo = $request->file('photo');
            $filename = time() . '_' . $userId . '_' . uniqid() . '.' . $photo->getClientOriginalExtension();
            $photoPath = $photo->storeAs('task-logs', $filename, 'public');
        }

        $voiceNotePath = null;
        if ($request->hasFile('voice_note')) {
            $voice = $request->file('voice_note');
            $filename = time() . '_' . $userId . '_voice_' . uniqid() . '.webm';
            $voiceNotePath = $voice->storeAs('task-logs', $filename, 'public');
        }

        $log = TaskLog::create([
            'task_id' => $validated['task_id'],
            'user_id' => $userId,
            'log_type' => $validated['log_type'],
            'description' => $validated['description'],
            'location_lat' => $validated['location_lat'] ?? null,
            'location_lng' => $validated['location_lng'] ?? null,
            'photo_path' => $photoPath,
            'voice_note_path' => $voiceNotePath,
            'status' => 'submitted',
        ]);

        if ($task->status === 'pending') {
            $task->update(['status' => 'in_progress']);
        }

        return response()->json([
            'message' => 'Task log submitted successfully',
            'log' => $log->load(['task', 'user']),
        ], 201);
    }

    public function show(Request $request, TaskLog $taskLog): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        if ($userRole === 'Admin') {
        } elseif ($userRole === 'Owner' || $userRole === 'Manager') {
            if ($taskLog->task->owner_id != $userId && $taskLog->task->assigned_to != $userId) {
                $managedUsers = User::where('managed_by', $userId)->pluck('id')->toArray();
                if (!in_array($taskLog->task->owner_id, $managedUsers)) {
                    return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
                }
            }
        } else {
            if ($taskLog->user_id != $userId && $taskLog->task->assigned_to != $userId) {
                return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
            }
        }

        return response()->json(['data' => $taskLog->load(['task', 'user'])]);
    }

    public function update(Request $request, TaskLog $taskLog): JsonResponse
    {
        $userRole = $request->header('X-User-Role');

        if ($userRole !== 'Admin' && $userRole !== 'Owner' && $userRole !== 'Manager') {
            return response()->json(['message' => 'Only managers can update log status', 'error' => 'unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'nullable|in:submitted,reviewed,approved,rejected',
            'notes' => 'nullable|string|max:1000',
        ]);

        $taskLog->update($validated);

        return response()->json([
            'message' => 'Log updated successfully',
            'log' => $taskLog->load(['task', 'user']),
        ]);
    }

    public function destroy(Request $request, TaskLog $taskLog): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        if ($userRole === 'Admin' || $taskLog->task->owner_id == $userId) {
            if ($taskLog->photo_path) {
                Storage::disk('public')->delete($taskLog->photo_path);
            }
            $taskLog->delete();
            return response()->json(['message' => 'Log deleted successfully']);
        }

        return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
    }

    public function logsForTask(Request $request, Task $task): JsonResponse
    {
        if (!$this->canAccessTask($request, $task)) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        $logs = TaskLog::where('task_id', $task->id)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $logs]);
    }

    public function myLogs(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-Id');

        $query = TaskLog::with(['task', 'user'])
            ->where('user_id', $userId);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('log_type') && $request->log_type !== 'all') {
            $query->where('log_type', $request->log_type);
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(30);

        return response()->json($logs);
    }

    public function archive(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        $query = TaskLog::with(['task', 'user']);

        if ($userRole === 'Admin') {
        } elseif ($userRole === 'Owner') {
            $query->whereHas('task', function ($q) use ($userId) {
                $q->where('owner_id', $userId);
            });
        } elseif ($userRole === 'Manager') {
            $managedUserIds = User::where('managed_by', $userId)->pluck('id')->toArray();
            $managedUserIds[] = $userId;
            $query->whereHas('task', function ($q) use ($managedUserIds) {
                $q->whereIn('owner_id', $managedUserIds);
            });
        } else {
            $query->where('user_id', $userId);
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('log_type') && $request->log_type !== 'all') {
            $query->where('log_type', $request->log_type);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhereHas('task', function ($tq) use ($search) {
                      $tq->where('title', 'like', "%{$search}%");
                  })
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(50);

        return response()->json($logs);
    }
}