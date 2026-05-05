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
        Schema::table('branches', function (Blueprint $table) {
            $table->boolean('is_manufacturing_enabled')->default(false)->after('is_active');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->enum('product_type', ['trading', 'raw_material', 'manufactured'])->default('trading')->after('product_management_id');
        });

        Schema::table('product_managements', function (Blueprint $table) {
            $table->enum('product_type', ['trading', 'raw_material', 'manufactured'])->default('trading')->after('sku');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn('is_manufacturing_enabled');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('product_type');
        });

        Schema::table('product_managements', function (Blueprint $table) {
            $table->dropColumn('product_type');
        });
    }
};
