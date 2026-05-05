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
        $tables = [
            'users',
            'products',
            'product_managements',
            'stores',
            'orders',
            'sales',
            'sale_items',
            'expenses',
            'loans',
            'payments',
            'exports',
            'transfers',
            'stock_adjustments',
            'stock_movements',
            'inventories',
            'mzigos',
            'containers',
            'logistics_manifests',
            'upcoming_orders',
            'upcoming_products'
        ];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('cascade');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'users',
            'products',
            'product_managements',
            'stores',
            'orders',
            'sales',
            'sale_items',
            'expenses',
            'loans',
            'payments',
            'exports',
            'transfers',
            'stock_adjustments',
            'stock_movements',
            'inventories',
            'mzigos',
            'containers',
            'logistics_manifests',
            'upcoming_orders',
            'upcoming_products'
        ];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropForeign(['branch_id']);
                    $table->dropColumn('branch_id');
                });
            }
        }
    }
};
