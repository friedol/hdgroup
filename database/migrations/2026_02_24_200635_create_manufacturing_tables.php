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
        Schema::create('product_specifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('gsm')->nullable();
            $table->decimal('width_cm', 10, 2)->nullable();
            $table->decimal('length_m', 10, 2)->nullable();
            $table->string('color')->nullable();
            $table->decimal('weight_per_roll', 10, 2)->nullable();
            $table->string('batch_no')->nullable();
            $table->string('supplier_reference')->nullable();
            $table->timestamps();
        });

        Schema::create('bills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('finished_product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('bill_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bill_id')->constrained('bills')->onDelete('cascade');
            $table->foreignId('raw_material_id')->constrained('products')->onDelete('cascade');
            $table->decimal('quantity_required', 15, 4);
            $table->string('unit')->nullable();
            $table->timestamps();
        });

        Schema::create('productions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('finished_product_id')->constrained('products')->onDelete('cascade');
            $table->decimal('quantity_produced', 15, 4);
            $table->date('production_date');
            $table->decimal('total_material_cost', 15, 2);
            $table->decimal('cost_per_unit', 15, 2);
            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('pending');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('production_material_usage', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_id')->constrained('productions')->onDelete('cascade');
            $table->foreignId('raw_material_id')->constrained('products')->onDelete('cascade');
            $table->decimal('quantity_used', 15, 4);
            $table->decimal('cost_at_time', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_material_usage');
        Schema::dropIfExists('productions');
        Schema::dropIfExists('bill_items');
        Schema::dropIfExists('bills');
        Schema::dropIfExists('product_specifications');
    }
};
