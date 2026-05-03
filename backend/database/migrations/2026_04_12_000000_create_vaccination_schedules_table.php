<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vaccination_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('animal_id')->constrained()->onDelete('cascade');
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->string('vaccine_name');
            $table->string('manufacturer')->nullable();
            $table->string('batch_number')->nullable();
            $table->integer('dose_number')->default(1);
            $table->integer('total_doses')->default(1);
            $table->date('scheduled_date');
            $table->date('administered_date')->nullable();
            $table->string('veterinarian')->nullable();
            $table->string('clinic')->nullable();
            $table->date('next_due_date')->nullable();
            $table->enum('status', ['scheduled', 'administered', 'overdue', 'cancelled'])->default('scheduled');
            $table->text('notes')->nullable();
            $table->string('attachment_url')->nullable();
            $table->timestamps();

            $table->index(['animal_id', 'status']);
            $table->index(['owner_id', 'status']);
            $table->index('scheduled_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vaccination_schedules');
    }
};
