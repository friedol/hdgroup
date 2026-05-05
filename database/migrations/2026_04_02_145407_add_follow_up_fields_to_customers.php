<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->integer('total_orders')->default(0);
            $table->decimal('total_spent', 15, 2)->default(0);
            $table->integer('avg_reorder_interval')->nullable();
            $table->date('last_order_date')->nullable();
            $table->date('next_expected_order_date')->nullable();
            $table->date('manual_follow_up_date')->nullable();
            $table->string('follow_up_status')->default('New Customer');
            $table->integer('priority_ranking')->default(0);

            $table->index('next_expected_order_date');
            $table->index('follow_up_status');
            $table->index('priority_ranking');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'total_orders',
                'total_spent',
                'avg_reorder_interval',
                'last_order_date',
                'next_expected_order_date',
                'manual_follow_up_date',
                'follow_up_status',
                'priority_ranking'
            ]);
        });
    }
};
