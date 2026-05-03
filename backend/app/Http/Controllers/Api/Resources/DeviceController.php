<?php

namespace App\Http\Controllers\Api\Resources;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\User;
use App\Http\Requests\StoreDeviceRequest;
use App\Http\Requests\UpdateDeviceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Traits\OwnableAuthorization;

class DeviceController extends Controller
{
    use OwnableAuthorization;

    public function index(Request $request): JsonResponse
    {
        $query = Device::query()->with('owner');
        $query = $this->filterByOwner($request, $query);
        
        $perPage = $request->integer('per_page', 15);
        $devices = $query->paginate($perPage);
        return response()->json($devices);
    }

    public function show(Request $request, Device $device): JsonResponse
    {
        if (!$this->canAccessOwner($request, $device->owner_id)) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }
        
        return response()->json($device);
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = $request->user();
        
        if ($authUser && !$authUser->hasPermissionTo('manage_devices')) {
            return response()->json(['message' => 'Unauthorized to create devices', 'error' => 'unauthorized'], 403);
        }
        
        if (!$this->canCreateAsOwner($request)) {
            return response()->json(['message' => 'Unauthorized to create devices', 'error' => 'unauthorized'], 403);
        }
        
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:online,offline,low_signal',
            'battery_level' => 'nullable|integer|min:0|max:100',
            'firmware_version' => 'nullable|string|max:50',
            'update_interval' => 'nullable|integer|min:1|max:1440',
            'advanced_tracking' => 'nullable|boolean',
            'last_seen' => 'nullable|date',
            'owner_id' => 'nullable|exists:users,id',
        ]);
        
        $data['device_id'] = 'IOT-' . str_pad(Device::count() + 1, 3, '0', STR_PAD_LEFT) . '-' . strtoupper(substr(md5(time()), 0, 1));
        
        $userRole = $this->getUserRole($request);
        $userId = $this->getUserId($request);
        
        if ($userRole === 'Admin' && empty($data['owner_id'])) {
            $data['owner_id'] = null;
        } elseif ($userRole === 'Owner' && $userId && empty($data['owner_id'])) {
            $data['owner_id'] = $userId;
        }
        
        if ($userRole === 'Manager') {
            $user = $this->getUser($request);
            if ($user && $user->managed_by) {
                $data['owner_id'] = $user->managed_by;
            }
        }
        
        $device = Device::create($data);

        return response()->json([
            'message' => 'Device created successfully',
            'device' => $device
        ], 201);
    }

    public function update(Request $request, Device $device): JsonResponse
    {
        $authUser = $request->user();
        
        if ($authUser && !$authUser->hasPermissionTo('manage_devices')) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }
        
        if (!$this->canAccessOwner($request, $device->owner_id)) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }
        
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:online,offline,low_signal',
            'battery_level' => 'nullable|integer|min:0|max:100',
            'last_seen' => 'nullable|date',
            'update_interval' => 'nullable|integer|min:1|max:1440',
            'advanced_tracking' => 'nullable|boolean',
            'animal_id' => 'nullable|exists:animals,id',
            'owner_id' => 'nullable|exists:users,id',
        ]);
        
        $device->update($data);

        return response()->json([
            'message' => 'Device updated successfully',
            'device' => $device
        ]);
    }

    public function destroy(Request $request, Device $device): JsonResponse
    {
        $authUser = $request->user();
        
        if ($authUser && !$authUser->hasPermissionTo('manage_devices')) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }
        
        if (!$this->canAccessOwner($request, $device->owner_id)) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }
        
        $device->delete();

        return response()->json(['message' => 'Device deleted successfully']);
    }
}