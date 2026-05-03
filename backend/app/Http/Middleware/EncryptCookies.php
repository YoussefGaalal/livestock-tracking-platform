<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Cookie\Middleware\EncryptCookies as BaseEncryptCookies;

class EncryptCookies extends BaseEncryptCookies
{
    public function handle($request, Closure $next)
    {
        if (function_exists('openssl_cipher_iv_length')) {
            return parent::handle($request, $next);
        }
        $response = $next($request);
        return $response;
    }
}