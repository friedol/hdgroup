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
        Schema::table('orders', function (Blueprint $table) {
            // 1. Drop the foreign key constraint first
            // Note: Use try-catch or check existence if unsure of name, 
            // but standard is orders_product_id_foreign
            $table->dropForeign(['product_id']);
            
            // 2. Change column to string
            $table->string('product_id')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Reverting would require compatibility checks, 
            // but for structure:
            // $table->unsignedBigInteger('product_id')->change();
            // $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });
    }
};
