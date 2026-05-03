<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class ApiAuthenticate extends Middleware
{
    protected function redirectTo($request)
    {
        if ($request->expectsJson()) {
            return null;
        }

        return route('login');
    }

    protected function unauthenticated($request, array $guards)
    {
        abort(response()->json(['message' => 'Unauthenticated'], 401));
    }
}