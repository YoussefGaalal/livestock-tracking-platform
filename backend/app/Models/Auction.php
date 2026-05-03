<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Auction extends Model
{
    use HasFactory;

    public $translatable = ['title', 'description'];

    protected $fillable = [
        'animal_id',
        'owner_id',
        'starting_price',
        'current_price',
        'reserve_price',
        'status',
        'description',
        'title',
        'starts_at',
        'ends_at',
        'ended_at',
        'winner_id',
        'second_winner_id',
        'payment_proof_url',
        'payment_expires_at',
        'payment_verified_at',
        'payment_status',
        'payment_notes',
        'verified_by',
    ];

    protected $casts = [
        'starting_price' => 'decimal:2',
        'current_price' => 'decimal:2',
        'reserve_price' => 'decimal:2',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'ended_at' => 'datetime',
        'payment_expires_at' => 'datetime',
        'payment_verified_at' => 'datetime',
    ];

    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'winner_id');
    }

    public function secondWinner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'second_winner_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class)->orderBy('amount', 'desc');
    }

    public function highestBid()
    {
        return $this->bids()->orderBy('amount', 'desc')->first();
    }

    public function secondHighestBid()
    {
        return $this->bids()->orderBy('amount', 'desc')->skip(1)->first();
    }

    public function bidCount()
    {
        return $this->bids()->count();
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && 
               (!$this->ends_at || $this->ends_at->isFuture());
    }

    public function isPendingPayment(): bool
    {
        return $this->status === 'sold' && $this->payment_status === 'pending';
    }

    public function paymentExpired(): bool
    {
        return $this->payment_expires_at && $this->payment_expires_at->isPast();
    }

    public function timeRemaining(): ?string
    {
        if (!$this->ends_at) return null;
        
        $diff = now()->diff($this->ends_at);
        
        if ($diff->days > 0) {
            return "{$diff->days}d {$diff->h}h";
        }
        if ($diff->h > 0) {
            return "{$diff->h}h {$diff->i}m";
        }
        if ($diff->i > 0) {
            return "{$diff->i}m {$diff->s}s";
        }
        return "{$diff->s}s";
    }
}