<?php

namespace App\Http\Controllers\Api\Health;

use App\Http\Controllers\Controller;
use App\Models\VaccinationSchedule;
use App\Models\Task;
use App\Models\Animal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VaccinationScheduleController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        $query = VaccinationSchedule::with(['animal:id,name,animal_id,identification_photo', 'assignee:id,name'])->latest();

        if ($userRole === 'owner') {
            $query->where('owner_id', $userId);
        }

        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'overdue') {
                $query->where('status', 'scheduled')
                    ->where('scheduled_date', '<', now()->toDateString());
            } else {
                $query->where('status', $request->status);
            }
        }

        if ($request->has('animal_id') && $request->animal_id !== 'all') {
            $query->where('animal_id', $request->animal_id);
        }

        if ($request->has('from_date')) {
            $query->whereDate('scheduled_date', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('scheduled_date', '<=', $request->to_date);
        }

        $vaccinations = $query->paginate($request->get('per_page', 15));

        return response()->json($vaccinations);
    }

    public function stats(Request $request)
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        $query = VaccinationSchedule::query();

        if ($userRole === 'owner') {
            $query->where('owner_id', $userId);
        }

        $total = $query->count();
        $scheduled = (clone $query)->where('status', 'scheduled')->count();
        $administered = (clone $query)->where('status', 'administered')->count();
        $overdue = (clone $query)->where('status', 'scheduled')
            ->where('scheduled_date', '<', now()->toDateString())->count();
        $upcoming = (clone $query)->where('status', 'scheduled')
            ->whereBetween('scheduled_date', [now()->toDateString(), now()->addDays(7)->toDateString()])->count();

        return response()->json([
            'total' => $total,
            'scheduled' => $scheduled,
            'administered' => $administered,
            'overdue' => $overdue,
            'upcoming' => $upcoming,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'animal_id' => 'required|exists:animals,id',
            'vaccine_name' => 'required|string|max:255',
            'vaccination_type' => 'nullable|string|max:50',
            'assigned_to' => 'nullable|exists:users,id',
            'reminder_enabled' => 'nullable|boolean',
            'reminder_days' => 'nullable|integer|min:1|max:30',
            'manufacturer' => 'nullable|string|max:255',
            'batch_number' => 'nullable|string|max:255',
            'dose_number' => 'nullable|integer|min:1',
            'total_doses' => 'nullable|integer|min:1',
            'scheduled_date' => 'required|date',
            'veterinarian' => 'nullable|string|max:255',
            'clinic' => 'nullable|string|max:255',
            'next_due_date' => 'nullable|date|after:scheduled_date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $userId = $request->header('X-User-Id');

        $vaccination = VaccinationSchedule::create([
            'animal_id' => $request->animal_id,
            'owner_id' => $userId,
            'vaccine_name' => $request->vaccine_name,
            'vaccination_type' => $request->vaccination_type ?? 'routine',
            'assigned_to' => $request->assigned_to,
            'reminder_enabled' => $request->reminder_enabled ?? true,
            'reminder_days' => $request->reminder_days ?? 3,
            'manufacturer' => $request->manufacturer,
            'batch_number' => $request->batch_number,
            'dose_number' => $request->dose_number ?? 1,
            'total_doses' => $request->total_doses ?? 1,
            'scheduled_date' => $request->scheduled_date,
            'veterinarian' => $request->veterinarian,
            'clinic' => $request->clinic,
            'next_due_date' => $request->next_due_date,
            'status' => 'scheduled',
            'notes' => $request->notes,
        ]);

        if ($request->assigned_to) {
            $animal = Animal::find($request->animal_id);
            Task::create([
                'owner_id' => $userId,
                'assigned_to' => $request->assigned_to,
                'animal_id' => $request->animal_id,
                'title' => 'Vaccination: ' . $request->vaccine_name,
                'description' => 'Vaccination task for ' . ($animal->name ?? 'animal') . ' scheduled for ' . $request->scheduled_date,
                'task_type' => 'medical',
                'priority' => $request->vaccination_type === 'emergency' ? 'urgent' : 'medium',
                'due_date' => $request->scheduled_date,
                'status' => 'pending',
            ]);
        }

        return response()->json([
            'message' => 'Vaccination schedule created successfully',
            'vaccination' => $vaccination->load('animal:id,name,animal_id,identification_photo', 'assignee:id,name'),
        ], 201);
    }

    public function show(Request $request, VaccinationSchedule $vaccinationSchedule)
    {
        $this->authorizeView($request, $vaccinationSchedule);

        return response()->json([
            'vaccination' => $vaccinationSchedule->load('animal:id,name,animal_id,identification_photo', 'assignee:id,name'),
        ]);
    }

    public function update(Request $request, VaccinationSchedule $vaccinationSchedule)
    {
        $this->authorizeView($request, $vaccinationSchedule);

        if ($vaccinationSchedule->status === 'administered') {
            return response()->json(['message' => 'Cannot update administered vaccination'], 422);
        }

        $validator = Validator::make($request->all(), [
            'vaccine_name' => 'sometimes|required|string|max:255',
            'vaccination_type' => 'nullable|string|max:50',
            'assigned_to' => 'nullable|exists:users,id',
            'reminder_enabled' => 'nullable|boolean',
            'reminder_days' => 'nullable|integer|min:1|max:30',
            'manufacturer' => 'nullable|string|max:255',
            'batch_number' => 'nullable|string|max:255',
            'dose_number' => 'nullable|integer|min:1',
            'total_doses' => 'nullable|integer|min:1',
            'scheduled_date' => 'sometimes|required|date',
            'veterinarian' => 'nullable|string|max:255',
            'clinic' => 'nullable|string|max:255',
            'next_due_date' => 'nullable|date|after:scheduled_date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $vaccinationSchedule->update($request->only([
            'vaccine_name',
            'vaccination_type',
            'assigned_to',
            'reminder_enabled',
            'reminder_days',
            'manufacturer',
            'batch_number',
            'dose_number',
            'total_doses',
            'scheduled_date',
            'veterinarian',
            'clinic',
            'next_due_date',
            'notes',
        ]));

        return response()->json([
            'message' => 'Vaccination schedule updated successfully',
            'vaccination' => $vaccinationSchedule->load('animal:id,name,animal_id,identification_photo', 'assignee:id,name'),
        ]);
    }

    public function administer(Request $request, VaccinationSchedule $vaccinationSchedule)
    {
        $this->authorizeView($request, $vaccinationSchedule);

        if ($vaccinationSchedule->status === 'administered') {
            return response()->json(['message' => 'Vaccination already administered'], 422);
        }

        $vaccinationSchedule->markAsAdministered($request->only([
            'veterinarian',
            'clinic',
            'batch_number',
            'notes',
        ]));

        Task::where('assigned_to', $vaccinationSchedule->assigned_to)
            ->where('title', 'like', '%Vaccination: ' . $vaccinationSchedule->vaccine_name . '%')
            ->where('status', '!=', 'completed')
            ->update(['status' => 'completed', 'completed_at' => now()]);

        return response()->json([
            'message' => 'Vaccination marked as administered',
            'vaccination' => $vaccinationSchedule->load('animal:id,name,animal_id,identification_photo', 'assignee:id,name'),
        ]);
    }

    public function cancel(Request $request, VaccinationSchedule $vaccinationSchedule)
    {
        $this->authorizeView($request, $vaccinationSchedule);

        if ($vaccinationSchedule->status === 'administered') {
            return response()->json(['message' => 'Cannot cancel administered vaccination'], 422);
        }

        $vaccinationSchedule->update(['status' => 'cancelled']);

        Task::where('assigned_to', $vaccinationSchedule->assigned_to)
            ->where('title', 'like', '%Vaccination: ' . $vaccinationSchedule->vaccine_name . '%')
            ->where('status', '!=', 'completed')
            ->update(['status' => 'cancelled']);

        return response()->json([
            'message' => 'Vaccination schedule cancelled',
            'vaccination' => $vaccinationSchedule->load('animal:id,name,animal_id,identification_photo', 'assignee:id,name'),
        ]);
    }

    public function destroy(Request $request, VaccinationSchedule $vaccinationSchedule)
    {
        $this->authorizeView($request, $vaccinationSchedule);

        Task::where('assigned_to', $vaccinationSchedule->assigned_to)
            ->where('title', 'like', '%Vaccination: ' . $vaccinationSchedule->vaccine_name . '%')
            ->where('status', '!=', 'completed')
            ->delete();

        $vaccinationSchedule->delete();

        return response()->json(['message' => 'Vaccination schedule deleted successfully']);
    }

    protected function authorizeView(Request $request, VaccinationSchedule $vaccinationSchedule): void
    {
        $userRole = $request->header('X-User-Role');
        $userId = $request->header('X-User-Id');

        if ($userRole === 'owner' && $vaccinationSchedule->owner_id !== (int) $userId) {
            abort(403, 'Unauthorized');
        }
    }
}