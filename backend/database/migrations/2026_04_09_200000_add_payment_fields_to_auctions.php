<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('auctions', function (Blueprint $table) {
            $table->string('payment_proof_url')->nullable()->after('winner_id');
            $table->timestamp('payment_expires_at')->nullable()->after('payment_proof_url');
            $table->timestamp('payment_verified_at')->nullable()->after('payment_expires_at');
            $table->string('payment_status', 20)->default('pending')->after('payment_verified_at');
            $table->text('payment_notes')->nullable()->after('payment_status');
            $table->unsignedBigInteger('verified_by')->nullable()->after('payment_notes');
            $table->unsignedBigInteger('second_winner_id')->nullable()->after('verified_by');
        });
    }

    public function down(): void
    {
        Schema::table('auctions', function (Blueprint $table) {
            $table->dropColumn([
                'payment_proof_url',
                'payment_expires_at',
                'payment_verified_at',
                'payment_status',
                'payment_notes',
                'verified_by',
                'second_winner_id',
            ]);
        });
    }
};
