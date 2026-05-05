<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_targets', function (Blueprint $table) {
            $table->id();
            $table->string('period_type'); // 'monthly' | 'quarterly' | 'yearly'
            $table->string('period_label'); // e.g. '2026-04', 'Q2-2026', '2026'
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // null = branch-level target
            $table->decimal('target_amount', 15, 2)->default(0); // Revenue target in KES
            $table->unsignedInteger('target_units')->default(0); // Units/orders target
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['period_type', 'period_label', 'branch_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_targets');
    }
};
