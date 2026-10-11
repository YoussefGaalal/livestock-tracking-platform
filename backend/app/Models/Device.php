<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    public $translatable = ['name'];

    protected $fillable = [
        'device_id',
        'name',
        'type',
        'serial_number',
        'firmware_version',
        'battery_level',
        'signal_strength',
        'status',
        'update_interval',
        'advanced_tracking',
        'animal_id',
        'owner_id',
        'gps_lat',
        'gps_lng',
        'last_ping',
    ];

    protected $hidden = [
        'api_token',
    ];

    /**
     * Issue a new ingestion token for this device. Only the hash is stored,
     * so the returned plain-text token can't be recovered later.
     */
    public function issueApiToken(): string
    {
        $token = \Illuminate\Support\Str::random(48);
        $this->forceFill(['api_token' => hash('sha256', $token)])->save();

        return $token;
    }

    public static function findByApiToken(?string $token): ?self
    {
        return $token ? static::where('api_token', hash('sha256', $token))->first() : null;
    }

    protected $casts = [
        'battery_level' => 'integer',
        'signal_strength' => 'integer',
        'advanced_tracking' => 'boolean',
        'last_ping' => 'datetime',
    ];

    public function animal()
    {
        return $this->belongsTo(Animal::class, 'animal_id', 'id');
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}