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
        Schema::create('gatekeeper_logs', function (Blueprint $table) {
            $table->id();
            
            // Movement type
            $table->enum('type', ['IN', 'OUT'])->index();
            
            // Product information
            $table->foreignId('product_id')->nullable()->constrained('products')->onDelete('set null');
            $table->string('product_name');
            $table->decimal('quantity', 15, 2);
            $table->decimal('unit_price', 15, 2)->nullable();
            $table->string('unit')->default('pcs');
            
            // Handler information
            $table->unsignedBigInteger('handler_id')->nullable();
            $table->string('handler_name');
            $table->enum('handler_type', ['Registered', 'Staff', 'Supplier', 'Delivery', 'Customer'])->default('Registered');
            
            // Movement details
            $table->string('source')->nullable(); // For IN records (e.g., "Supplier: Mteja")
            $table->string('destination')->nullable(); // For OUT records (e.g., "Customer: Mteja")
            $table->text('description')->nullable();
            $table->string('reference_number')->nullable()->index(); // Invoice/Order/Export number
            $table->string('contact_info')->nullable();
            $table->string('verification_code')->nullable();
            $table->text('notes')->nullable();
            
            // Recording information
            $table->foreignId('recorded_by_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('recorded_by_name');
            
            // Status
            $table->enum('status', ['pending', 'verified', 'rejected'])->default('verified')->index();
            
            // Timestamps
            $table->dateTime('recorded_at')->index();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['type', 'recorded_at']);
            $table->index(['handler_name', 'recorded_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gatekeeper_logs');
    }
};
