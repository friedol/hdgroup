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
        Schema::create('follow_up_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_follow_up_id')->constrained('customer_follow_ups')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete(); // seller/staff
            
            // Activity details
            $table->enum('activity_type', ['call', 'whatsapp', 'email', 'sms', 'in_person', 'other'])->default('call');
            $table->text('notes')->nullable();
            $table->enum('outcome', ['promised_order', 'interested', 'not_interested', 'no_response', 'rescheduled', 'other'])->nullable();
            
            // Follow-up result
            $table->boolean('resulted_in_sale')->default(false);
            $table->decimal('sale_amount', 12, 2)->nullable();
            
            // Next action
            $table->date('next_follow_up_date')->nullable();
            $table->text('next_follow_up_notes')->nullable();
            
            // Timestamp
            $table->dateTime('activity_date');
            $table->timestamps();
            
            // Indexes
            $table->index(['customer_id', 'branch_id']);
            $table->index(['branch_id', 'activity_date']);
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('follow_up_activities');
    }
};
