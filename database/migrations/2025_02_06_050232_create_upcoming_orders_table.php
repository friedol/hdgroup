<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('upcoming_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_name')->unique();
            $table->boolean('is_published')->default(false);
            $table->timestamp('published_date');
            $table->timestamps();
        });
        Schema::create('upcoming_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('upcoming_order_id')->constrained('upcoming_orders')->onDelete('cascade');
            $table->foreignId('product_management_id')->constrained();
            $table->string('product_name');
            $table->integer('product_quantity');
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {

        Schema::dropIfExists('upcoming_orders');
        Schema::dropIfExists('upcoming_products');
    }
};
