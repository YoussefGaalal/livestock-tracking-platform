<?php
require 'vendor/autoload.php';
$rc = new ReflectionClass('Spatie\Translatable\Translatable');
echo "Is trait: " . ($rc->isTrait() ? 'yes' : 'no') . PHP_EOL;