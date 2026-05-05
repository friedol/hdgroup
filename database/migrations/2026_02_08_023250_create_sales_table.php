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
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->unsignedBigInteger('user_id'); // Cashier
            $table->decimal('total_amount', 15, 2);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('payable_amount', 15, 2);
            $table->string('payment_method')->default('Cash'); // Cash, Card, Mobile Money, Bank Transfer, Credit/Loan
            $table->string('payment_status')->default('Paid'); // Paid, Partially Paid, Unpaid
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('user_id')->references('id')->on('users');
            $table->foreign('customer_id')->references('id')->on('users'); // Customers are in users table
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
