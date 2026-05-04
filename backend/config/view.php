<?php

return [

    /*
    |--------------------------------------------------------------------------
    | View Storage Paths
    |--------------------------------------------------------------------------
    */

    'paths' => [
        resource_path('views'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Compiled View Path
    |--------------------------------------------------------------------------
    | NOTE: Do NOT use realpath() here — it returns false when the directory
    | does not yet exist (e.g. fresh Railway container before startup mkdir),
    | which causes Blade to throw "Please provide a valid cache path."
    | storage_path() always returns the absolute string, so Blade initialises
    | correctly; the directory is guaranteed to exist by the start command.
    */

    'compiled' => env('VIEW_COMPILED_PATH', storage_path('framework/views')),

];
