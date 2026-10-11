<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * Resolves Stripe credentials: keys saved by an admin under Settings → Stripe
 * take precedence, falling back to the STRIPE_SECRET environment variable.
 */
class PaymentGateway
{
    public static function stripeSecret(): ?string
    {
        $stored = DB::table('settings')->where('key', 'stripe_secret_key')->value('value');

        return $stored ?: config('services.stripe.secret');
    }
}
