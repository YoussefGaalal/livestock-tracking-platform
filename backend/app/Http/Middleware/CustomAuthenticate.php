<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Laravel\Sanctum\PersonalAccessToken;
use App\Models\User;

class CustomAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        
        if (!$token) {
            return response()->json(['message' => 'Unauthenticated', 'error' => 'no_token'], 401);
        }
        
        // Find token without loading Spatie relationships
        $tokenRecord = PersonalAccessToken::findToken($token);
        
        if (!$tokenRecord) {
            return response()->json(['message' => 'Invalid token', 'error' => 'invalid_token'], 401);
        }
        
        // Find user by ID directly - don't use $request->user()
        $user = User::find($tokenRecord->tokenable_id);
        
        if (!$user || !$user->is_active) {
            return response()->json(['message' => 'User not found or inactive', 'error' => 'unauthorized'], 401);
        }
        
        // Set user on request manually without triggering Spatie
        $request->setUserResolver(function () use ($user) {
            return $user;
        });
        
        return $next($request);
    }
}