<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        // Drop the loans table if it exists
        Schema::dropIfExists('loans');

        // Recreate the loans table
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->string('unique_id')->nullable();

            $table->string('customer_name');
            $table->string('tin')->nullable();
            $table->string('phone')->nullable();
            $table->string('product_id')->nullable();
            $table->string('product_name');
            $table->string('staff_name');
            $table->integer('product_quantity'); // Integer for numerical operations
            $table->decimal('product_price', 15, 2); // Decimal type for precision
            $table->date('payment_date');
            $table->decimal('total_amount', 15, 2); // Total loan amount
            $table->decimal('amount_paid', 15, 2)->default(0); // Amount paid so far
            $table->decimal('balance', 15, 2); // Remaining balance
            $table->enum('status', ['Pending', 'Paid', 'Partially Paid'])->default('Pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        // Drop the loans table if rolled back
        Schema::dropIfExists('loans');
    }
};
