<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auctions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('animal_id')->constrained()->onDelete('cascade');
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->decimal('starting_price', 12, 2);
            $table->decimal('current_price', 12, 2)->nullable();
            $table->decimal('reserve_price', 12, 2)->nullable();
            $table->enum('status', ['draft', 'active', 'ended', 'sold', 'cancelled'])->default('draft');
            $table->text('description')->nullable();
            $table->string('title');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->foreignId('winner_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auctions');
    }
};
