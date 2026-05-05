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
        Schema::create('production_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->unsignedBigInteger('store_id')->nullable()->comment('Store to receive finished goods');
            $table->unsignedBigInteger('bom_id');
            $table->decimal('quantity_to_produce', 10, 4);
            $table->enum('status', ['draft', 'approved', 'in_progress', 'completed', 'cancelled'])->default('draft');
            $table->decimal('total_cost', 15, 2)->default(0)->comment('Calculated cost of raw materials sum');
            
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_orders');
    }
};
