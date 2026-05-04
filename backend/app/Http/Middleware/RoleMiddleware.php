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
     * 
     * @deprecated Use CheckRole middleware with Spatie instead
     */
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        // Use Spatie's role checking instead of deprecated $user->role column
        $allowedRoles = explode(',', $roles);
        $allowedRoles = array_map('trim', $allowedRoles);
        
        if ($user->hasAnyRole($allowedRoles)) {
            return $next($request);
        }
        
        return response()->json([
            'error' => 'Forbidden',
            'message' => "Access denied. Required roles: $roles. Your role: " . $user->roles->first()?->name ?? 'none'
        ], 403);
    }
}