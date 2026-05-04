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
    ->withCommands()
    ->withProviders([
        \Illuminate\Filesystem\FilesystemServiceProvider::class,
        \Illuminate\Database\DatabaseServiceProvider::class,
        \Illuminate\Database\MigrationServiceProvider::class,
        \Illuminate\Foundation\Providers\ArtisanServiceProvider::class,
        \Illuminate\Foundation\Providers\ComposerServiceProvider::class,
        \App\Providers\AppServiceProvider::class,
        \Illuminate\Cache\CacheServiceProvider::class,
        \Illuminate\Encryption\EncryptionServiceProvider::class,
        \Illuminate\Hashing\HashServiceProvider::class,
        \Illuminate\Translation\TranslationServiceProvider::class,
        \Illuminate\Validation\ValidationServiceProvider::class,
        \Illuminate\Auth\AuthServiceProvider::class,
        \Illuminate\Cookie\CookieServiceProvider::class,
        \Illuminate\Session\SessionServiceProvider::class,
        \Illuminate\View\ViewServiceProvider::class,
        \Illuminate\Mail\MailServiceProvider::class,
        \Illuminate\Queue\QueueServiceProvider::class,
        \Illuminate\Redis\RedisServiceProvider::class,
    ])
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();