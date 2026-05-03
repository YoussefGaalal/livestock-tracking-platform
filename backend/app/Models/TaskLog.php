<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskLog extends Model
{
    protected $fillable = [
        'task_id',
        'user_id',
        'log_type',
        'description',
        'location_lat',
        'location_lng',
        'photo_path',
        'voice_note_path',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForTask($query, $taskId)
    {
        return $query->where('task_id', $taskId);
    }
}
