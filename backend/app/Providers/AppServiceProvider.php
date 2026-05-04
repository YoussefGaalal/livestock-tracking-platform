<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Foundation\MaintenanceModeManager;

class AppServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(
            \Illuminate\Contracts\Foundation\MaintenanceMode::class,
            function ($app) {
                return new MaintenanceModeManager($app);
            }
        );
    }

    public function boot()
    {
        //
    }
}
