<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VaccinationSchedule extends Model
{
    use HasFactory;

    public $translatable = ['vaccine_name', 'vaccination_type', 'notes', 'veterinarian', 'clinic'];

    protected $fillable = [
        'animal_id',
        'owner_id',
        'vaccine_name',
        'vaccination_type',
        'assigned_to',
        'reminder_enabled',
        'reminder_days',
        'manufacturer',
        'batch_number',
        'dose_number',
        'total_doses',
        'scheduled_date',
        'administered_date',
        'veterinarian',
        'clinic',
        'next_due_date',
        'status',
        'notes',
        'attachment_url',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'administered_date' => 'date',
        'next_due_date' => 'date',
        'reminder_enabled' => 'boolean',
        'reminder_days' => 'integer',
    ];

    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    public function scopeAdministered($query)
    {
        return $query->where('status', 'administered');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'overdue');
    }

    public function scopeForOwner($query, $ownerId)
    {
        return $query->where('owner_id', $ownerId);
    }

    public function scopeForAnimal($query, $animalId)
    {
        return $query->where('animal_id', $animalId);
    }

    public function scopeUpcoming($query, $days = 30)
    {
        return $query->whereBetween('scheduled_date', [now(), now()->addDays($days)]);
    }

    public function markAsAdministered(array $data = []): bool
    {
        $this->status = 'administered';
        $this->administered_date = now()->toDateString();
        
        foreach ($data as $key => $value) {
            if (in_array($key, ['veterinarian', 'clinic', 'batch_number', 'notes', 'attachment_url'])) {
                $this->$key = $value;
            }
        }

        if ($this->dose_number < $this->total_doses) {
            self::create([
                'animal_id' => $this->animal_id,
                'owner_id' => $this->owner_id,
                'vaccine_name' => $this->vaccine_name,
                'manufacturer' => $this->manufacturer,
                'dose_number' => $this->dose_number + 1,
                'total_doses' => $this->total_doses,
                'scheduled_date' => $this->next_due_date ?? now()->addMonth(),
                'veterinarian' => $this->veterinarian,
                'clinic' => $this->clinic,
                'status' => 'scheduled',
            ]);
        }

        return $this->save();
    }

    public function checkOverdue(): bool
    {
        if ($this->status === 'scheduled' && $this->scheduled_date < now()->toDateString()) {
            $this->status = 'overdue';
            $this->save();
            return true;
        }
        return false;
    }
}