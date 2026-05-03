<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionTier extends Model
{
    public $translatable = ['name', 'description'];

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price_monthly',
        'price_yearly',
        'trial_days',
        'max_animals',
        'max_devices',
        'max_users',
        'has_geofencing',
        'has_auctions',
        'has_advanced_reports',
        'has_api_access',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'price_monthly' => 'decimal:2',
        'price_yearly' => 'decimal:2',
        'trial_days' => 'integer',
        'max_animals' => 'integer',
        'max_devices' => 'integer',
        'max_users' => 'integer',
        'has_geofencing' => 'boolean',
        'has_auctions' => 'boolean',
        'has_advanced_reports' => 'boolean',
        'has_api_access' => 'boolean',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'subscription_tier_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(UserSubscription::class, 'tier_id');
    }

    public function isFree(): bool
    {
        return $this->price_monthly == 0 && $this->price_yearly == 0;
    }

    public function isTrialActive(int $trialDays): bool
    {
        return $trialDays > 0;
    }
}