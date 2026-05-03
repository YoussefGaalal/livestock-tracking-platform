<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;
use App\Http\Middleware\CheckSubscriptionLimits;
use App\Http\Middleware\CheckFeatureAccess;
use App\Http\Middleware\CustomAuthenticate;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'limits' => CheckSubscriptionLimits::class,
            'feature' => CheckFeatureAccess::class,
            'auth' => CustomAuthenticate::class,
            'encrypt_cookies' => \App\Http\Middleware\EncryptCookies::class,
        ]);
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->report(function (\Throwable $e) {
            if (app()->environment('testing')) {
                return;
            }
            report($e);
        });
    })->create();