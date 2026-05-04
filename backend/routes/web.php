<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return ['Laravel' => app()->version()];
});

// Catch-all: serves the React SPA for any non-API, non-storage path.
// NOTE: 'app' is intentionally NOT excluded so that /app/dashboard etc.
// work on hard-refresh (React Router handles client-side routing internally).
Route::get('/{path?}', function () {
    $file = public_path('app/index.html');
    if (!file_exists($file)) {
        return response()->json(['message' => 'Frontend not built yet.'], 503);
    }
    return response()->file($file);
})->where('path', '^(?!api|storage).*$');
