<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated',
                'error' => 'unauthenticated',
            ], 401);
        }

        $rolesArray = explode(',', $roles);
        $rolesArray = array_map('trim', $rolesArray);

        if ($user->hasAnyRole($rolesArray)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Forbidden. You do not have the required role.',
            'error' => 'forbidden',
            'required_roles' => $rolesArray,
        ], 403);
    }
}