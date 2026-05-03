<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Breed extends Model
{
    public $translatable = ['name', 'description'];
    public $casts = ['is_active' => 'boolean'];

    public function species()
    {
        return $this->belongsTo(Species::class);
    }
}