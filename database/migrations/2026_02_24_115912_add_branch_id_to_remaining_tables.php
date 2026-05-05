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
            'carts',
            'categories',
            'comments',
            'customers',
            'feedbacks',
            'inventory_logs',
            'order_containers',
            'posts',
            'product_managements_images',
            'units'
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
            'carts',
            'categories',
            'comments',
            'customers',
            'feedbacks',
            'inventory_logs',
            'order_containers',
            'posts',
            'product_managements_images',
            'units'
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
