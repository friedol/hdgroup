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
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->unsignedBigInteger('store_id')->nullable();
            
            // What type of product is this? (raw_material, finished_product)
            $table->string('product_type', 50)->index();
            $table->unsignedBigInteger('product_id')->index();
            
            // The type of transaction moving the stock
            $table->enum('transaction_type', [
                'purchase', 
                'production_consume', 
                'production_output', 
                'sale', 
                'transfer', 
                'adjustment',
                'refund'
            ])->index();
            
            // The actual stock movement columns
            $table->decimal('quantity_in', 10, 4)->default(0);
            $table->decimal('quantity_out', 10, 4)->default(0);
            $table->decimal('unit_cost', 15, 2)->default(0)->comment('For weighted average and valuation');
            
            // Reference to the order, sale, transfer, etc.
            $table->string('reference_type')->nullable()->index();
            $table->unsignedBigInteger('reference_id')->nullable()->index();
            
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};
