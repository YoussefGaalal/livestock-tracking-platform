<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PredefinedTask extends Model
{
    use HasFactory;

    public $translatable = ['title', 'description'];

    protected $fillable = [
        'owner_id',
        'title',
        'description',
        'priority',
        'task_type',
        'animal_id',
        'is_recurring',
        'recurrence_type',
        'recurrence_interval',
        'recurrence_days',
    ];

    protected $casts = [
        'is_recurring' => 'boolean',
        'recurrence_days' => 'array',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class);
    }

    public function getNextDueDate(): ?\Carbon\Carbon
    {
        if (!$this->is_recurring) {
            return null;
        }

        $now = now();

        switch ($this->recurrence_type) {
            case 'daily':
                return $now->copy()->addDays($this->recurrence_interval);
            case 'weekly':
                return $now->copy()->addWeeks($this->recurrence_interval);
            case 'monthly':
                return $now->copy()->addMonths($this->recurrence_interval);
            case 'custom':
                $days = $this->recurrence_days ?? [];
                foreach ($days as $day) {
                    $nextDate = $now->copy()->next($day);
                    if ($nextDate) {
                        return $nextDate;
                    }
                }
                return $now->copy()->addDays($this->recurrence_interval);
            default:
                return null;
        }
    }
}