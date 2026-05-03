<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Geofence extends Model
{
    public $translatable = ['name'];

    protected $fillable = [
        'name',
        'coordinates',
        'color',
        'alert_type',
        'is_active',
        'owner_id',
    ];

    protected $casts = [
        'coordinates' => 'array',
        'is_active' => 'boolean',
    ];

    protected $appends = ['coordinates_array'];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function alerts()
    {
        return $this->hasMany(GeofenceAlert::class);
    }

    public function animals(): BelongsToMany
    {
        return $this->belongsToMany(Animal::class, 'animal_geofence')
            ->withTimestamps();
    }

    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(AnimalGroup::class, 'animal_group_geofence')
            ->withTimestamps();
    }

    public function getCoordinatesArrayAttribute()
    {
        $coords = $this->attributes['coordinates'] ?? null;
        if (is_string($coords)) {
            $coords = json_decode($coords, true);
        }
        return $coords;
    }

    public function containsPoint($lat, $lng)
    {
        $coordinates = $this->coordinates_array ?? $this->coordinates;
        if (is_string($coordinates)) {
            $coordinates = json_decode($coordinates, true);
        }
        if (!$coordinates || !is_array($coordinates) || count($coordinates) < 3) {
            return false;
        }

        $x = $lng;
        $y = $lat;
        $n = count($coordinates);
        $inside = false;

        for ($i = 0, $j = $n - 1; $i < $n; $j = $i++) {
            $xi = $coordinates[$i][1];
            $yi = $coordinates[$i][0];
            $xj = $coordinates[$j][1];
            $yj = $coordinates[$j][0];

            $intersect = (($yi > $y) != ($yj > $y)) &&
                ($x < ($xj - $xi) * ($y - $yi) / ($yj - $yi) + $xi);

            if ($intersect) {
                $inside = !$inside;
            }
        }

        return $inside;
    }
}