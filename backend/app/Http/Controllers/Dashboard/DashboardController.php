<?php

namespace App\Http\Controllers\Dashboard;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Animal;
use App\Models\Geofence;
use App\Models\GeofenceAlert;
use App\Models\Device;
use App\Models\Task;
use Illuminate\Support\Facades\Auth;

class DashboardController extends \App\Http\Controllers\Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = Auth::id();
        
        // Get all data counts for this owner
        $totalAnimals = Animal::where('owner_id', $userId)->count();
        $healthyAnimals = Animal::where('owner_id', $userId)->where('health_status', 'healthy')->count();
        $totalGeofences = Geofence::where('owner_id', $userId)->count();
        
        // Get active alerts (critical alerts from geofence breaches)
        $activeAlerts = GeofenceAlert::whereHas('geofence', function ($query) use ($userId) {
            $query->where('owner_id', $userId);
        })->where('status', 'active')->count();
        
        // Get pending tasks
        $pendingTasks = Task::where('owner_id', $userId)->where('status', 'pending')->count();
        
        // Get total devices
        $totalDevices = Device::where('owner_id', $userId)->count();
        
        return response()->json([
            'total_animals' => $totalAnimals,
            'healthy_count' => $healthyAnimals,
            'active_alerts' => $activeAlerts,
            'total_geofences' => $totalGeofences,
            'pending_tasks' => $pendingTasks,
            'total_devices' => $totalDevices,
            'critical_alerts' => $activeAlerts,
        ]);
    }
}
