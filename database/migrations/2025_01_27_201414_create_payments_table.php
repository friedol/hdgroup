<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('loans')->onDelete('cascade'); // Foreign key to the loans table
            $table->decimal('amount_paid', 15, 2); // Amount of payment
            $table->date('payment_date'); // Date of the payment
            $table->string('payment_method')->nullable(); // Optional payment method (e.g., cash, card)
            $table->string('reference')->nullable(); // Optional reference for payment
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('payments');
    }
};
