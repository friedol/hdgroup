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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->string('unique_id')->unique();
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->string('customer_phone')->nullable();
            $table->decimal('amount_due', 15, 2);
            $table->decimal('amount_paid', 15, 2)->default(0);
            $table->date('payment_date')->nullable();
            $table->date('invoice_date');
            $table->enum('status', ['Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'])->default('Pending');
            $table->unsignedBigInteger('sale_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('set null');
            $table->foreign('sale_id')->references('id')->on('sales')->onDelete('set null');
            $table->index('unique_id');
            $table->index('customer_name');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
