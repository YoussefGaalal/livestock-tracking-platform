<?php

namespace App\Http\Controllers\Api\Health;

use App\Http\Controllers\Controller;
use App\Models\MedicalRecord;
use App\Models\Animal;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MedicalRecordController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        $query = MedicalRecord::with(['animal']);

        if ($userRole === 'Admin') {
        } elseif ($userRole === 'Owner') {
            $query->where('owner_id', $userId);
        } elseif ($userRole === 'Manager') {
            $managedUsers = \App\Models\User::where('managed_by', $userId)->pluck('id')->toArray();
            $managedUsers[] = $userId;
            $query->whereIn('owner_id', $managedUsers);
        } else {
            $animalIds = Animal::where('owner_id', $userId)->pluck('id')->toArray();
            $query->whereIn('animal_id', $animalIds);
        }

        if ($request->has('type') && $request->type !== 'all') {
            $query->where('record_type', $request->type);
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('animal_id') && $request->animal_id !== 'all') {
            $query->where('animal_id', $request->animal_id);
        }

        if ($request->has('date_from')) {
            $query->where('record_date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('record_date', '<=', $request->date_to);
        }

        $records = $query->orderBy('record_date', 'desc')->paginate(20);

        return response()->json($records);
    }

    public function show(Request $request, MedicalRecord $medicalRecord): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        if ($userRole !== 'Admin' && $medicalRecord->owner_id !== $userId) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        $medicalRecord->load(['animal']);

        return response()->json(['data' => $medicalRecord]);
    }

    public function store(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        if (!in_array($userRole, ['Admin', 'Owner', 'Manager'])) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        $validated = $request->validate([
            'animal_id' => 'required|exists:animals,id',
            'record_type' => 'required|in:vaccination,checkup,surgery,treatment,emergency',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'record_date' => 'required|date',
            'veterinarian' => 'nullable|string|max:255',
            'medication' => 'nullable|string|max:255',
            'dosage' => 'nullable|string|max:100',
            'status' => 'nullable|in:scheduled,in_progress,completed,cancelled',
            'notes' => 'nullable|string',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'next_follow_up' => 'nullable|date|after:record_date',
        ]);

        $animal = Animal::find($validated['animal_id']);

        if ($userRole !== 'Admin' && $animal->owner_id !== $userId) {
            return response()->json(['message' => 'Unauthorized to add record for this animal', 'error' => 'unauthorized'], 403);
        }

        $recordData = $validated;
        unset($recordData['attachment']);
        $recordData['owner_id'] = $userId;
        $recordData['status'] = $recordData['status'] ?? 'completed';

        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('medical-records', 'public');
            $recordData['attachment_url'] = '/storage/' . $path;
        }

        $record = MedicalRecord::create($recordData);

        return response()->json([
            'message' => 'Medical record created successfully',
            'data' => $record->load(['animal']),
        ], 201);
    }

    public function update(Request $request, MedicalRecord $medicalRecord): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        if ($userRole !== 'Admin' && $medicalRecord->owner_id !== $userId) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        $validated = $request->validate([
            'record_type' => 'nullable|in:vaccination,checkup,surgery,treatment,emergency',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'record_date' => 'nullable|date',
            'veterinarian' => 'nullable|string|max:255',
            'medication' => 'nullable|string|max:255',
            'dosage' => 'nullable|string|max:100',
            'status' => 'nullable|in:scheduled,in_progress,completed,cancelled',
            'notes' => 'nullable|string',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'next_follow_up' => 'nullable|date',
        ]);

        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('medical-records', 'public');
            $validated['attachment_url'] = '/storage/' . $path;
        }

        $medicalRecord->update($validated);

        return response()->json([
            'message' => 'Medical record updated successfully',
            'data' => $medicalRecord->load(['animal']),
        ]);
    }

    public function destroy(Request $request, MedicalRecord $medicalRecord): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        if ($userRole !== 'Admin' && $medicalRecord->owner_id !== $userId) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        $medicalRecord->delete();

        return response()->json(['message' => 'Medical record deleted successfully']);
    }

    public function stats(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        $query = MedicalRecord::query();

        if ($userRole === 'Admin') {
        } elseif ($userRole === 'Owner') {
            $query->where('owner_id', $userId);
        } elseif ($userRole === 'Manager') {
            $managedUsers = \App\Models\User::where('managed_by', $userId)->pluck('id')->toArray();
            $managedUsers[] = $userId;
            $query->whereIn('owner_id', $managedUsers);
        } else {
            $animalIds = Animal::where('owner_id', $userId)->pluck('id')->toArray();
            $query->whereIn('animal_id', $animalIds);
        }

        $stats = [
            'total' => $query->count(),
            'vaccinations' => (clone $query)->where('record_type', 'vaccination')->count(),
            'checkups' => (clone $query)->where('record_type', 'checkup')->count(),
            'surgeries' => (clone $query)->where('record_type', 'surgery')->count(),
            'treatments' => (clone $query)->where('record_type', 'treatment')->count(),
            'emergencies' => (clone $query)->where('record_type', 'emergency')->count(),
            'scheduled' => (clone $query)->where('status', 'scheduled')->count(),
            'in_progress' => (clone $query)->where('status', 'in_progress')->count(),
            'completed' => (clone $query)->where('status', 'completed')->count(),
        ];

        return response()->json(['data' => $stats]);
    }
}