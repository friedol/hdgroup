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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->string('type'); // Sale, Return, Adjustment, Purchase
            $table->decimal('quantity', 15, 2);
            $table->unsignedBigInteger('reference_id')->nullable(); // Sale ID, Adjustment ID, etc.
            $table->unsignedBigInteger('user_id'); // Who did the movement
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('product_id')->references('id')->on('products');
            $table->foreign('user_id')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
