<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('medical_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('animal_id')->constrained()->onDelete('cascade');
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->string('record_type'); // vaccination, checkup, surgery, treatment, emergency
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('record_date');
            $table->string('veterinarian')->nullable();
            $table->string('medication')->nullable();
            $table->string('dosage')->nullable();
            $table->string('status')->default('completed'); // scheduled, in_progress, completed, cancelled
            $table->string('notes')->nullable();
            $table->string('attachment_url')->nullable();
            $table->date('next_follow_up')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medical_records');
    }
};
