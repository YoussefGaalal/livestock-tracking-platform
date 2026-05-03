<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('translations', function (Blueprint $table) {
            $table->id();
            $table->string('group', 100);
            $table->string('key', 255);
            $table->string('language_code', 3);
            $table->text('value');
            $table->timestamps();

            $table->foreign('language_code')
                ->references('code')
                ->on('languages')
                ->onDelete('cascade');

            $table->unique(['group', 'key', 'language_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('translations');
    }
};