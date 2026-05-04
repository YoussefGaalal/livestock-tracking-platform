<?php

/**
 * Standalone script to generate bootstrap/cache/packages.php
 * Scans composer's installed.json for Laravel service providers and aliases.
 * Does NOT bootstrap the Laravel app — no circular dependency, no APP_KEY needed.
 */

$vendorDir  = __DIR__ . '/vendor';
$cacheDir   = __DIR__ . '/bootstrap/cache';
$outputFile = $cacheDir . '/packages.php';

// Read composer's installed packages list (supports both Composer v1 and v2)
$installedJson = $vendorDir . '/composer/installed.json';
if (!file_exists($installedJson)) {
    echo "vendor/composer/installed.json not found — skipping package discovery.\n";
    exit(0);
}

$installed = json_decode(file_get_contents($installedJson), true);
$packages  = $installed['packages'] ?? $installed; // v2 wraps in 'packages' key

$providers = [];
$aliases   = [];

foreach ($packages as $package) {
    $extra  = $package['extra']  ?? [];
    $laravel = $extra['laravel'] ?? [];

    foreach ($laravel['providers'] ?? [] as $provider) {
        $providers[] = $provider;
    }
    foreach ($laravel['aliases'] ?? [] as $alias => $class) {
        $aliases[$alias] = $class;
    }
}

// Ensure cache directory exists and is writable
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0777, true);
}

$manifest = ['providers' => $providers, 'aliases' => $aliases];
$content  = '<?php return ' . var_export($manifest, true) . ';' . PHP_EOL;

file_put_contents($outputFile, $content);

echo "Generated bootstrap/cache/packages.php — "
    . count($providers) . " providers, "
    . count($aliases)   . " aliases.\n";
