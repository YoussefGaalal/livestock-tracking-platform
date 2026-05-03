<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Animal extends Model
{
    protected $fillable = [
        'animal_id',
        'name',
        'species',
        'breed',
        'date_of_birth',
        'gender',
        'color_markings',
        'current_weight',
        'identification_photo',
        'baseline_temperature',
        'normal_heart_rate',
        'owner_id',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'current_weight' => 'decimal:2',
        'baseline_temperature' => 'decimal:1',
        'normal_heart_rate' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($animal) {
            if (empty($animal->animal_id)) {
                $year = date('Y');
                $latest = static::where('animal_id', 'like', "OA-{$year}-%")
                    ->orderByDesc('animal_id')
                    ->first();
                
                $nextNum = 1;
                if ($latest) {
                    $parts = explode('-', $latest->animal_id);
                    $nextNum = intval($parts[2] ?? 0) + 1;
                }
                
                $animal->animal_id = "OA-{$year}-" . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function device()
    {
        return $this->hasOne(Device::class, 'animal_id');
    }

    public function locationHistory(): HasOne
    {
        return $this->hasOne(LocationHistory::class)->latestOfMany();
    }

    public function geofences(): BelongsToMany
    {
        return $this->belongsToMany(Geofence::class, 'animal_geofence')
            ->withTimestamps();
    }

    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(AnimalGroup::class, 'animal_group_member')
            ->withTimestamps();
    }
}
