<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('follow_up_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Seller
            $table->date('follow_up_date');
            $table->string('action')->nullable(); // WhatsApp, Phone, etc.
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['customer_id', 'follow_up_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('follow_up_logs');
    }
};
