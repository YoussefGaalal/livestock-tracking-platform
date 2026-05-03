<?php

namespace App\Services;

use App\Models\User;
use App\Models\Animal;
use App\Models\Device;
use App\Models\Geofence;
use App\Models\Task;
use Illuminate\Database\Eloquent\Builder;

class RoleFilterService
{
    /**
     * Filter data based on user role
     * 
     * @param User $user - The authenticated user
     * @param string $entity - The entity type (animals, devices, tasks, etc)
     * @return Builder - Filtered query
     */
    public static function filter(User $user, string $entity): Builder
    {
        $role = $user->role;
        $userId = $user->id;
        
        // Admin sees all
        if ($role === 'Admin') {
            return self::getModel($entity)->newQuery();
        }
        
        // Owner sees their own data
        if ($role === 'Owner') {
            return self::getModel($entity)
                ->where('owner_id', $userId);
        }
        
        // Manager/Doctor/Shepherd see assigned data
        $assignedEntityIds = self::getAssignedIds($user, $entity);
        
        return self::getModel($entity)->whereIn('id', $assignedEntityIds);
    }
    
    /**
     * Get model by entity name
     */
    private static function getModel(string $entity): Builder
    {
        return match($entity) {
            'animals' => Animal::query(),
            'devices' => Device::query(),
            'geofences' => Geofence::query(),
            'tasks' => Task::query(),
            default => Animal::query(),
        };
    }
    
    /**
     * Get IDs assigned to user based on role
     */
    private static function getAssignedIds(User $user, string $entity): array
    {
        $userId = $user->id;
        
        // Get user's assigned items from their profile
        $assignedAnimals = $user->assigned_animals 
            ? json_decode($user->assigned_animals, true) ?? []
            : [];
        
        $assignedTasks = $user->assigned_tasks 
            ? json_decode($user->assigned_tasks, true) ?? []
            : [];
        
        return match($entity) {
            'animals' => $assignedAnimals,
            'tasks' => $assignedTasks,
            default => [],
        };
    }
    
    /**
     * Check if user can access a specific route
     */
    public static function canAccess(User $user, string $permission): bool
    {
        $role = $user->role;
        
        // Permission map: role => allowed permissions
        $permissions = [
            'Admin' => ['dashboard', 'animals', 'devices', 'geofences', 'tasks', 'medical', 'users', 'settings', 'reports', 'subscription', 'roles'],
            'Owner' => ['dashboard', 'animals', 'devices', 'geofences', 'tasks', 'medical', 'users', 'subscription', 'reports'],
            'Manager' => ['dashboard', 'animals', 'tasks', 'medical', 'reports'],
            'Doctor' => ['dashboard', 'animals', 'tasks', 'medical'],
            'Shepherd' => ['dashboard', 'animals', 'tasks'],
        ];
        
        $allowed = $permissions[$role] ?? [];
        
        return in_array($permission, $allowed);
    }
    
    /**
     * Get accessible routes for a user role
     */
    public static function getAccessibleRoutes(User $user): array
    {
        $role = $user->role;
        
        $routes = [
            'Admin' => ['/dashboard', '/animals', '/devices', '/geofences', '/tasks', '/medical-records', '/users', '/settings', '/reports', '/subscription', '/roles'],
            'Owner' => ['/dashboard', '/animals', '/devices', '/geofences', '/tasks', '/medical-records', '/users', '/subscription', '/reports'],
            'Manager' => ['/dashboard', '/animals', '/tasks', '/reports'],
            'Doctor' => ['/dashboard', '/animals', '/tasks', '/medical-records'],
            'Shepherd' => ['/dashboard', '/animals', '/tasks'],
        ];
        
        return $routes[$role] ?? [];
    }
}