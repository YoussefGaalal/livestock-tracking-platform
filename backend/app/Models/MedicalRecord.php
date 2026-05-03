<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicalRecord extends Model
{
    public $translatable = ['title', 'description', 'notes'];

    protected $fillable = [
        'animal_id',
        'owner_id',
        'record_type',
        'title',
        'description',
        'record_date',
        'veterinarian',
        'medication',
        'dosage',
        'status',
        'notes',
        'attachment_url',
        'next_follow_up',
    ];

    protected $casts = [
        'record_date' => 'date',
        'next_follow_up' => 'date',
    ];

    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function scopeForOwner($query, $ownerId)
    {
        return $query->where('owner_id', $ownerId);
    }

    public function scopeByType($query, $type)
    {
        if ($type && $type !== 'all') {
            return $query->where('record_type', $type);
        }
        return $query;
    }

    public function scopeByStatus($query, $status)
    {
        if ($status && $status !== 'all') {
            return $query->where('status', $status);
        }
        return $query;
    }
}