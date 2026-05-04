<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // NOTE: '*' cannot be used together with supports_credentials: true (browsers reject it).
    // List explicit origins. For local Flutter dev, any localhost port is allowed via the pattern below.
    'allowed_origins' => [
        'https://oasis-trace-production.up.railway.app',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
    ],

    'allowed_origins_patterns' => [
        // Allow any localhost port — covers Flutter debug builds on any emulator/device port
        '#^http://localhost:\d+$#',
        '#^http://127\.0\.0\.1:\d+$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => true,

];
