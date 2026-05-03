<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSubscription extends Model
{
    protected $fillable = [
        'user_id',
        'tier_id',
        'status',
        'started_at',
        'trial_ends_at',
        'ends_at',
        'cancelled_at',
        'billing_cycle',
        'payment_method',
        'payment_reference',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'trial_ends_at' => 'datetime',
        'ends_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tier(): BelongsTo
    {
        return $this->belongsTo(SubscriptionTier::class, 'tier_id');
    }

    public function isOnTrial(): bool
    {
        return $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function isExpired(): bool
    {
        return $this->ends_at && $this->ends_at->isPast();
    }

    public function daysRemaining(): ?int
    {
        if ($this->trial_ends_at && $this->isOnTrial()) {
            return now()->diffInDays($this->trial_ends_at, false);
        }
        if ($this->ends_at) {
            return now()->diffInDays($this->ends_at, false);
        }
        return null;
    }
}
