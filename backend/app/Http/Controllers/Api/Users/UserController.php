<?php

namespace App\Http\Controllers\Api\Users;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    private function getAuthUser(Request $request): ?User
    {
        $user = $request->user();
        if ($user) {
            return $user;
        }
        
        $userId = $request->header('X-User-Id');
        if ($userId) {
            return User::find($userId);
        }
        
        $token = $request->bearerToken();
        if ($token) {
            $tokenRecord = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
            if ($tokenRecord) {
                return User::find($tokenRecord->tokenable_id);
            }
        }
        
        return null;
    }
    
    private function getAuthRole(Request $request): string
    {
        $user = $request->user();
        if ($user) {
            return $user->getPrimaryRoleName();
        }
        
        $roleHeader = $request->header('X-User-Role');
        if ($roleHeader) {
            return $roleHeader;
        }
        
        $authUser = $this->getAuthUser($request);
        if ($authUser) {
            return $authUser->getPrimaryRoleName();
        }
        
        return 'Owner';
    }
    
    private function isAdmin(Request $request): bool
    {
        return $this->getAuthRole($request) === 'Admin';
    }
    
    private function canAccessUser(Request $request, User $targetUser): bool
    {
        $authUser = $this->getAuthUser($request);
        if (!$authUser) {
            return false;
        }
        
        $role = $this->getAuthRole($request);
        
        if ($role === 'Admin') {
            return true;
        }
        
        if (($role === 'Owner' || $role === 'Veterinarian') && $targetUser->managed_by == $authUser->id) {
            return true;
        }
        
        if ($authUser->id == $targetUser->id) {
            return true;
        }
        
        return false;
    }
    
private function filterByRole(Request $request, $query)
    {
        $authUser = $this->getAuthUser($request);
        if (!$authUser) {
            return $query->where('id', 0);
        }
        
        $role = $this->getAuthRole($request);
        
        if ($role === 'Admin') {
            return $query;
        }
        
        if ($role === 'Owner' || $role === 'Veterinarian') {
            return $query->where('managed_by', $authUser->id);
        }
        
        return $query->where('id', 0);
    }
    
    private function canListUsers(Request $request): bool
    {
        $role = $this->getAuthRole($request);
        // Only Admin and Owner can list all users
        return in_array($role, ['Admin', 'Owner']);
    }
    
    public function index(Request $request): JsonResponse
    {
        if (!$this->canListUsers($request)) {
            return response()->json(['message' => 'Forbidden. You do not have permission to list users.', 'error' => 'forbidden'], 403);
        }
        
        $query = User::query()->with('subscriptionTier');
        $query = $this->filterByRole($request, $query);
        
        $users = $query->paginate(15)->map(function ($user) {
            $userArray = $user->toArray();
            $userArray['role'] = $user->getRoleNames()->first() ?? 'Shepherd';
            return $userArray;
        });
        
        return response()->json($users);
    }

    public function show(Request $request, User $user): JsonResponse
    {
        if (!$this->canAccessUser($request, $user)) {
            return response()->json(['message' => 'Unauthorized to view this user', 'error' => 'unauthorized'], 403);
        }
        
        $user->load('subscriptionTier');
        
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'location' => $user->location,
            'role' => $user->getPrimaryRoleName(),
            'roles' => $user->getRoleNames()->toArray(),
            'is_active' => $user->is_active,
            'avatar_url' => $user->avatar_url,
            'subscription_tier_id' => $user->subscription_tier_id,
            'subscription_tier' => $user->subscriptionTier,
            'managed_by' => $user->managed_by,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = $this->getAuthUser($request);
        $authRole = $this->getAuthRole($request);
        
        if (!$authUser) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 401);
        }
        
        if ($authRole !== 'Admin' && $authRole !== 'Owner') {
            return response()->json(['message' => 'Unauthorized to create users. Only Admin and Owner can add team members.', 'error' => 'unauthorized'], 403);
        }
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string',
            'location' => 'nullable|string',
            'role' => 'sometimes|string|in:Admin,Owner,Doctor,Shepherd,Manager',
            'is_active' => 'nullable|boolean',
            'password' => 'nullable|string|min:8',
            'subscription_tier_id' => 'nullable|exists:subscription_tiers,id',
        ]);

        $requestedRole = $validated['role'] ?? 'Shepherd';
        
        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password'] ?? 'Welcome123'),
            'phone' => $validated['phone'] ?? null,
            'location' => $validated['location'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ];
        
        if ($authRole === 'Owner') {
            if (!in_array($requestedRole, ['Doctor', 'Shepherd'])) {
                return response()->json(['message' => 'Owner can only add Doctor or Shepherd roles'], 403);
            }
            $userData['managed_by'] = $authUser->id;
        } elseif ($authRole === 'Admin') {
            if ($request->has('managed_by') && $request->managed_by) {
                $userData['managed_by'] = $request->managed_by;
            }
            if ($request->has('subscription_tier_id') && $request->subscription_tier_id) {
                $userData['subscription_tier_id'] = $request->subscription_tier_id;
            }
        }
        
        $user = User::create($userData);
        
        $user->assignRole($requestedRole);
        
        if ($request->hasFile('avatar_url')) {
            $file = $request->file('avatar_url');
            $filename = 'avatar_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('public/avatars', $filename, 'local');
            $user->avatar_url = '/storage/' . str_replace('public/', '', $path);
            $user->save();
        }

        return response()->json(['user' => $user, 'message' => 'User created successfully'], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        if (!$this->canAccessUser($request, $user)) {
            return response()->json(['message' => 'Unauthorized to update this user', 'error' => 'unauthorized'], 403);
        }
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string',
            'location' => 'nullable|string',
            'role' => 'sometimes|in:Admin,Owner,Doctor,Shepherd,Manager',
            'is_active' => 'nullable|boolean',
            'password' => 'nullable|string|min:8',
            'managed_by' => 'nullable|exists:users,id',
            'subscription_tier_id' => 'nullable|exists:subscription_tiers,id',
        ]);
        
        $role = $this->getAuthRole($request);
        
        if ($role === 'Admin') {
            // Admin can change anything
        } elseif ($role === 'Owner') {
            // Owner can assign Doctor/Shepherd roles to managed users
            if (isset($validated['role']) && $validated['role']) {
                if (!in_array($validated['role'], ['Doctor', 'Shepherd'])) {
                    return response()->json(['message' => 'Owner can only assign Doctor or Shepherd roles'], 403);
                }
                $user->syncRoles([$validated['role']]);
                unset($validated['role']);
            }
            unset($validated['subscription_tier_id']);
            unset($validated['managed_by']);
        } else {
            unset($validated['role']);
            unset($validated['subscription_tier_id']);
            unset($validated['managed_by']);
        }
        
        if (isset($validated['role']) && $validated['role']) {
            $user->syncRoles([$validated['role']]);
            unset($validated['role']);
        }
        
        if (isset($validated['managed_by']) && $validated['managed_by'] === null) {
            $user->update(['managed_by' => null]);
            unset($validated['managed_by']);
        }

        if (isset($validated['password']) && $validated['password']) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        if (!empty($validated)) {
            $user->update($validated);
        }

        return response()->json(['user' => $user->fresh(), 'message' => 'User updated successfully']);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if (!$this->canAccessUser($request, $user)) {
            return response()->json(['message' => 'Unauthorized to delete this user', 'error' => 'unauthorized'], 403);
        }
        
        if ($user->avatar_url && Storage::disk('local')->exists(str_replace('/storage/', '', $user->avatar_url))) {
            Storage::disk('local')->delete(str_replace('/storage/', '', $user->avatar_url));
        }
        
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
    
    public function toggleStatus(Request $request, User $user): JsonResponse
    {
        if (!$this->canAccessUser($request, $user)) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }
        
        $user->update(['is_active' => !$user->is_active]);
        
        return response()->json([
            'user' => $user->fresh(),
            'message' => $user->is_active ? 'User activated' : 'User deactivated'
        ]);
    }
}