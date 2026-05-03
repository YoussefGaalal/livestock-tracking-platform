<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('animals', function (Blueprint $table) {
            $table->id();
            $table->string('animal_id')->unique();
            $table->enum('species', ['Camel', 'Goat', 'Sheep']);
            $table->string('breed')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['Male', 'Female']);
            $table->text('color_markings')->nullable();
            $table->decimal('current_weight', 8, 2)->nullable();
            $table->string('identification_photo')->nullable();
            $table->decimal('baseline_temperature', 4, 1)->nullable();
            $table->integer('normal_heart_rate')->nullable();
            $table->unsignedBigInteger('owner_id')->nullable();
            $table->string('device_id')->nullable();
            $table->timestamps();

            $table->foreign('owner_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('animals');
    }
};
