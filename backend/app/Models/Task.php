<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Task extends Model
{
    public $translatable = ['title', 'description'];

    protected $fillable = [
        'owner_id',
        'assigned_to',
        'animal_id',
        'geofence_id',
        'title',
        'description',
        'priority',
        'status',
        'task_type',
        'due_date',
        'completed_at',
        'notes',
        'is_recurring',
        'recurrence_type',
        'recurrence_interval',
        'recurrence_days',
        'next_due_date',
        'is_predefined',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'completed_at' => 'datetime',
        'next_due_date' => 'datetime',
        'is_recurring' => 'boolean',
        'is_predefined' => 'boolean',
        'recurrence_days' => 'array',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class);
    }

    public function geofence(): BelongsTo
    {
        return $this->belongsTo(Geofence::class);
    }

    public function isOverdue(): bool
    {
        return $this->due_date && $this->due_date->isPast() && $this->status !== 'completed';
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    public function scopeByOwner($query, $ownerId)
    {
        return $query->where('owner_id', $ownerId);
    }

    public function calculateNextDueDate(): ?Carbon
    {
        if (!$this->is_recurring) {
            return null;
        }

        $fromDate = $this->due_date ?? now();

        switch ($this->recurrence_type) {
            case 'daily':
                return $fromDate->copy()->addDays($this->recurrence_interval);
            case 'weekly':
                return $fromDate->copy()->addWeeks($this->recurrence_interval);
            case 'monthly':
                return $fromDate->copy()->addMonths($this->recurrence_interval);
            case 'custom':
                $days = $this->recurrence_days ?? [];
                foreach ($days as $day) {
                    $nextDate = $fromDate->copy()->next($day);
                    if ($nextDate->greaterThan(now())) {
                        return $nextDate;
                    }
                }
                return $fromDate->copy()->addDays($this->recurrence_interval);
            default:
                return null;
        }
    }

    public function createNextOccurrence(): ?self
    {
        if (!$this->is_recurring) {
            return null;
        }

        $nextDueDate = $this->calculateNextDueDate();
        if (!$nextDueDate) {
            return null;
        }

        return self::create([
            'owner_id' => $this->owner_id,
            'assigned_to' => $this->assigned_to,
            'animal_id' => $this->animal_id,
            'geofence_id' => $this->geofence_id,
            'title' => $this->title,
            'description' => $this->description,
            'priority' => $this->priority,
            'task_type' => $this->task_type,
            'due_date' => $nextDueDate,
            'is_recurring' => $this->is_recurring,
            'recurrence_type' => $this->recurrence_type,
            'recurrence_interval' => $this->recurrence_interval,
            'recurrence_days' => $this->recurrence_days,
            'is_predefined' => $this->is_predefined,
        ]);
    }
}