<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Routing\Router;

class MiddlewareServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(Router $router): void
    {
        $router->aliasMiddleware('role', \App\Http\Middleware\CheckRole::class);
    }
}