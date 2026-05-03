<?php

namespace App\Http\Middleware;

use App\Services\FeatureGate;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckFeatureAccess
{
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'error' => 'Unauthenticated',
                'message' => 'Please login to access this feature.',
            ], 401);
        }

        if ($user->hasRole('Admin')) {
            return $next($request);
        }

        $access = FeatureGate::canAccessFeature($user, $feature);

        if (!$access['allowed']) {
            return response()->json([
                'error' => 'Feature not available',
                'message' => $access['message'],
                'current_tier' => $access['upgrade_required'] ?? 'Unknown',
                'feature' => $feature,
            ], 403);
        }

        return $next($request);
    }
}