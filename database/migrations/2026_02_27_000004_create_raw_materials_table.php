<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raw_materials', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name');
            $table->string('category')->nullable();
            $table->string('base_unit', 50);
            $table->decimal('cost_per_unit', 10, 2);
            $table->decimal('current_stock', 10, 4)->default(0);
            $table->decimal('minimum_stock', 10, 4)->default(0);
            $table->string('supplier')->nullable();
            $table->boolean('status')->default(true);
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
            
            // Indexes
            $table->index(['branch_id', 'status'], 'raw_materials_branch_status');
            $table->index(['branch_id', 'category'], 'raw_materials_branch_category');
        });

        // Create stock movements table for audit trail
        Schema::create('raw_material_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('raw_material_id')->constrained('raw_materials')->onDelete('cascade');
            $table->enum('type', ['IN', 'OUT', 'ADJUSTMENT']);
            $table->decimal('quantity', 10, 4);
            $table->string('reference')->nullable(); // Production ID, Purchase ID, etc.
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
            
            $table->index(['raw_material_id', 'type'], 'movements_material_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raw_material_movements');
        Schema::dropIfExists('raw_materials');
    }
};
