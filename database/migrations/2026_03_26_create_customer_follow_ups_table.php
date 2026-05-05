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
        Schema::create('customer_follow_ups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            
            // Purchase history
            $table->integer('total_orders')->default(0);
            $table->decimal('total_spent', 12, 2)->default(0);
            $table->integer('average_days_between_orders')->nullable();
            $table->date('last_order_date')->nullable();
            
            // Predictions
            $table->date('next_expected_order_date')->nullable();
            $table->enum('follow_up_status', ['new', 'upcoming', 'due', 'overdue'])->default('new');
            
            // Manual override
            $table->date('manual_follow_up_date')->nullable();
            $table->text('manual_follow_up_notes')->nullable();
            
            // Frequency tracking
            $table->string('reorder_pattern')->nullable(); // e.g., "14_days", "weekly", "monthly"
            $table->integer('reorder_cycle_days')->nullable(); // calculated average
            
            // Customer insights
            $table->json('frequently_purchased_products')->nullable(); // array of product names/ids
            $table->integer('follow_up_count')->default(0); // number of times contacted
            $table->date('last_follow_up_date')->nullable();
            
            // Priority scoring
            $table->integer('priority_score')->default(0); // calculated based on spending & frequency
            $table->enum('priority_tier', ['high', 'medium', 'low'])->default('medium');
            
            // Status
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['branch_id', 'follow_up_status']);
            $table->index(['branch_id', 'next_expected_order_date']);
            $table->index(['branch_id', 'priority_score']);
            $table->index('customer_id');
            $table->unique(['customer_id', 'branch_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_follow_ups');
    }
};
