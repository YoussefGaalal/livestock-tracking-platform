<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Species extends Model
{
    public $translatable = ['name', 'description'];
    public $casts = ['is_active' => 'boolean'];

    public function breeds()
    {
        return $this->hasMany(Breed::class);
    }
}