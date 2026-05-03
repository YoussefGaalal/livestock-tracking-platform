<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     * 
     * Usage in routes:
     * ->middleware('role:Admin,Owner')
     * ->middleware('role:Admin,Owner,Manager|session')
     */
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $userRole = $user->role;
        
        // Parse roles parameter (can be comma-separated)
        $allowedRoles = explode(',', $roles);
        
        // Check if user role is allowed
        if (!in_array($userRole, $allowedRoles)) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => "Access denied. Required roles: $roles. Your role: $userRole"
            ], 403);
        }

        return $next($request);
    }
}