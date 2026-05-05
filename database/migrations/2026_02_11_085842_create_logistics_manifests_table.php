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
        Schema::create('logistics_manifests', function (Blueprint $table) {
            $table->id();
            $table->string('unique_id')->unique(); // Manifest ID (e.g., MAN-2024-001)
            $table->string('manifest_name')->nullable(); // Optional readable name
            
            // Parent Container Relation
            $table->unsignedBigInteger('container_id');
            // $table->foreign('container_id')->references('id')->on('containers')->onDelete('cascade'); 
            // Note: Foreign key constraint can be strict, but for now just linking ID.
            
            // Status Tracking
            $table->enum('status', ['DRAFT', 'ACTIVE', 'CANCELLED', 'DISPATCHED'])->default('DRAFT');
            
            // System Calculated Aggregates
            $table->decimal('total_weight', 10, 2)->default(0); // Sum of all items weight
            $table->decimal('total_cbm', 10, 2)->default(0);    // Sum of all items volume
            
            $table->string('created_by')->nullable(); // Staff name/ID
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('logistics_manifests');
    }
};
