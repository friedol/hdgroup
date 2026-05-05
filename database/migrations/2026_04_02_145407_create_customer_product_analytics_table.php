<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_product_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->integer('avg_reorder_interval')->nullable();
            $table->date('last_purchase_date')->nullable();
            $table->date('next_expected_purchase_date')->nullable();
            $table->integer('total_quantity_bought')->default(0);
            $table->timestamps();

            $table->unique(['customer_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_product_analytics');
    }
};
