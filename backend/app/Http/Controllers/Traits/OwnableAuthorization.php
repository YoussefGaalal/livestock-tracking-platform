<?php

namespace App\Http\Controllers\Traits;

use App\Models\User;
use Illuminate\Http\Request;

trait OwnableAuthorization
{
    private function getUserId(Request $request): ?string
    {
        if ($request->user()) {
            return (string) $request->user()->id;
        }
        return $request->header('X-User-Id');
    }

    private function getUserRole(Request $request): ?string
    {
        if ($request->user()) {
            return $request->user()->getPrimaryRoleName();
        }
        return $request->header('X-User-Role');
    }

    private function getUser(Request $request): ?User
    {
        $userId = $this->getUserId($request);
        return $userId ? User::find($userId) : null;
    }

    protected function canAccessOwner(Request $request, ?int $ownerId): bool
    {
        $user = $this->getUser($request);
        
        if (!$user) {
            return $ownerId === null;
        }

        if ($user->hasRole('Admin')) {
            return true;
        }

        if ($ownerId === null) {
            return true;
        }

        if ($user->hasRole('Owner') && $ownerId == $user->id) {
            return true;
        }

        if ($user->hasRole('Doctor') && $ownerId == $user->id) {
            return true;
        }

        if ($user->hasAnyRole(['Manager', 'Shepherd'])) {
            if ($user->managed_by) {
                return $ownerId == $user->managed_by;
            }
        }

        return false;
    }

    protected function canModifyOwner(Request $request, ?int $ownerId): bool
    {
        $user = $this->getUser($request);
        
        if (!$user) {
            return $ownerId === null;
        }

        if ($user->hasRole('Admin')) {
            return true;
        }

        if ($ownerId === null) {
            return true;
        }

        if ($user->hasRole('Owner') && $ownerId == $user->id) {
            return true;
        }

        if ($user->hasRole('Doctor') && $ownerId == $user->id) {
            return true;
        }

        if ($user->hasRole('Manager')) {
            if ($user->managed_by) {
                return $ownerId == $user->managed_by;
            }
        }

        return false;
    }

    protected function filterByOwner(Request $request, $query)
    {
        $user = $this->getUser($request);

        if (!$user) {
            return $query;
        }

        if ($user->hasRole('Admin')) {
            return $query;
        }

        $userId = $user->id;
        if (!$userId) {
            return $query->where('id', 0);
        }

        if ($user->hasRole('Owner')) {
            return $query->where('owner_id', $userId);
        }

        if ($user->hasRole('Doctor')) {
            return $query->where('owner_id', $userId);
        }

        if ($user->hasAnyRole(['Manager', 'Shepherd'])) {
            if ($user->managed_by) {
                return $query->where('owner_id', $user->managed_by);
            }
            return $query->where('id', 0);
        }

        return $query;
    }

    protected function canAccessAsOwner(Request $request): bool
    {
        $user = $this->getUser($request);
        return $user && $user->hasAnyRole(['Admin', 'Owner', 'Manager']);
    }

    protected function canCreateAsOwner(Request $request): bool
    {
        $user = $this->getUser($request);
        return $user && $user->hasAnyRole(['Admin', 'Owner', 'Manager']);
    }
}