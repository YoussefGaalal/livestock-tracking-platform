<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscriptionLimits
{
    public function handle(Request $request, Closure $next, string $resource): Response
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        if (!$userId) {
            return $next($request);
        }

        $user = User::with('subscriptionTier')->find($userId);

        if (!$user || $user->hasRole('Admin')) {
            return $next($request);
        }

        $tier = $user->subscriptionTier;
        $isCreating = in_array($request->method(), ['POST', 'PUT', 'PATCH']);

        if (!$tier) {
            if ($isCreating) {
                return response()->json([
                    'message' => 'No subscription tier found. Please subscribe to continue.',
                    'error' => 'no_subscription'
                ], 403);
            }
            return $next($request);
        }

        if (!$isCreating) {
            return $next($request);
        }

        $limitName = '';
        $countMethod = '';
        $maxMethod = '';

        switch ($resource) {
            case 'animals':
                $limitName = 'animals';
                $countMethod = 'getAnimalCount';
                $maxMethod = 'max_animals';
                break;
            case 'devices':
                $limitName = 'devices';
                $countMethod = 'getDeviceCount';
                $maxMethod = 'max_devices';
                break;
            case 'users':
                $limitName = 'team members';
                $countMethod = 'getUserCount';
                $maxMethod = 'max_users';
                break;
            case 'geofences':
                if (!$tier->has_geofencing) {
                    return response()->json([
                        'message' => 'Geofencing is not available on your current plan.',
                        'error' => 'feature_not_available',
                        'required_tier' => 'Starter or higher'
                    ], 403);
                }
                return $next($request);
            case 'auctions':
                if (!$tier->has_auctions) {
                    return response()->json([
                        'message' => 'Auctions are not available on your current plan.',
                        'error' => 'feature_not_available',
                        'required_tier' => 'Starter or higher'
                    ], 403);
                }
                return $next($request);
            default:
                return $next($request);
        }

        $currentCount = $user->$countMethod();
        $maxAllowed = $tier->$maxMethod;

        if ($maxAllowed !== 0 && $currentCount >= $maxAllowed) {
            return response()->json([
                'message' => "You have reached your $limitName limit ({$currentCount}/{$maxAllowed}).",
                'error' => 'limit_reached',
                'current' => $currentCount,
                'max' => $maxAllowed,
                'current_plan' => $tier->name,
                'upgrade_required' => true
            ], 403);
        }

        return $next($request);
    }
}
