<?php

return [

    'stripe' => [
        // Fallback when no key has been saved under Settings → Stripe
        'secret' => env('STRIPE_SECRET'),
    ],

];
