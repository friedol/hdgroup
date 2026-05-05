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
        Schema::create('exports', function (Blueprint $table) {
            $table->id();
            $table->string('unique_id')->nullable();

            $table->unsignedBigInteger('product_id');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->string('product_name')->nullable();

            $table->string('tin')->nullable();
            $table->string('customer_name')->nullable();
            $table->string('staff_name');
            $table->string('product_quantity');
            $table->string('product_price');
            $table->string('phone')->nullable();
            $table->string('sale_mode')->nullable();
            $table->string('payment_date')->nullable();
            $table->string('status')->nullable();
            // $table->string('product_image')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exports');
    }
};
