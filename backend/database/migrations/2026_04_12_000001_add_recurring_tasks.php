<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->boolean('is_recurring')->default(false)->after('completed_at');
            $table->enum('recurrence_type', ['daily', 'weekly', 'monthly', 'custom'])->nullable()->after('is_recurring');
            $table->integer('recurrence_interval')->default(1)->after('recurrence_type');
            $table->json('recurrence_days')->nullable()->after('recurrence_interval');
            $table->timestamp('next_due_date')->nullable()->after('recurrence_days');
            $table->boolean('is_predefined')->default(false)->after('next_due_date');
        });

        Schema::create('predefined_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('task_type', ['inspection', 'medical', 'feeding', 'movement', 'other'])->default('other');
            $table->foreignId('animal_id')->nullable()->constrained('animals')->onDelete('set null');
            $table->boolean('is_recurring')->default(false);
            $table->enum('recurrence_type', ['daily', 'weekly', 'monthly', 'custom'])->nullable();
            $table->integer('recurrence_interval')->default(1);
            $table->json('recurrence_days')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn([
                'is_recurring',
                'recurrence_type',
                'recurrence_interval',
                'recurrence_days',
                'next_due_date',
                'is_predefined',
            ]);
        });
        
        Schema::dropIfExists('predefined_tasks');
    }
};
