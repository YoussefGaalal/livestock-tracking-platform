<?php

namespace App\Http\Middleware;

use App\Models\Device;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authenticates GPS trackers posting telemetry. Each device sends its own
 * token in the X-Device-Token header (issue one with `php artisan devices:issue-token`).
 */
class AuthenticateDevice
{
    public function handle(Request $request, Closure $next): Response
    {
        $device = Device::findByApiToken($request->header('X-Device-Token'));

        if (!$device) {
            return response()->json(['message' => 'Invalid or missing device token', 'error' => 'invalid_device_token'], 401);
        }

        $request->attributes->set('device', $device);

        return $next($request);
    }
}
