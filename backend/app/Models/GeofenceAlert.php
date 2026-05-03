<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeofenceAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'geofence_id',
        'animal_id',
        'device_id',
        'type',
        'latitude',
        'longitude',
        'is_acknowledged',
        'triggered_at',
        'notification_sent',
        'notification_sent_at',
    ];

    protected $casts = [
        'is_acknowledged' => 'boolean',
        'triggered_at' => 'datetime',
    ];

    public function geofence(): BelongsTo
    {
        return $this->belongsTo(Geofence::class);
    }

    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }
}
