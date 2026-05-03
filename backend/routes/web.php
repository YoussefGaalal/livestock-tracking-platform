<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return ['Laravel' => app()->version()];
});

Route::get('/{path?}', function () {
    return response()->file(public_path('app/index.html'));
})->where('path', '^(?!api|app|storage).*$');
