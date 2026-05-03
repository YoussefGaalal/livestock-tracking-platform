<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class AnimalGroup extends Model
{
    public $translatable = ['name', 'description'];

    protected $fillable = [
        'name',
        'description',
        'color',
        'owner_id',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function animals(): BelongsToMany
    {
        return $this->belongsToMany(Animal::class, 'animal_group_member')
            ->withTimestamps();
    }

    public function geofences(): BelongsToMany
    {
        return $this->belongsToMany(Geofence::class, 'animal_group_geofence')
            ->withTimestamps();
    }
}