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

    'allowed_origins' => ['http://localhost:52164', 'http://localhost:56507', 'http://localhost:62781', 'http://localhost:55109', 'http://localhost:8080', 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:54263', 'http://localhost:50097', 'http://localhost:49824', 'http://127.0.0.1:52164', 'http://127.0.0.1:56507', 'http://127.0.0.1:62781', 'http://127.0.0.1:55109', 'http://127.0.0.1:8080', 'http://127.0.0.1:5173', '*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => true,

];
