<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_requests', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique(); // PRQ-XXXXX
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('invoice_number')->nullable(); // links to sales.invoice_number
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->string('customer_phone')->nullable();
            $table->decimal('amount_requested', 15, 2);
            $table->date('due_date')->nullable();
            $table->enum('status', ['pending', 'sent', 'paid', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'branch_id']);
            $table->index('invoice_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_requests');
    }
};
