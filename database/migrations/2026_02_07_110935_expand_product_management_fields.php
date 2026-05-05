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
        Schema::table('product_managements', function (Blueprint $table) {
            $table->string('sku')->nullable()->after('product_name');
            $table->string('barcode')->nullable()->after('sku');
            $table->string('brand')->nullable()->after('barcode');
            $table->string('product_type')->nullable()->after('brand');
            
            $table->unsignedBigInteger('buying_unit_id')->nullable()->after('product_type');
            $table->integer('qty_in_buying_unit')->nullable()->after('buying_unit_id');
            $table->decimal('cost_per_base_unit', 15, 2)->nullable()->after('qty_in_buying_unit');
            
            $table->integer('reorder_point')->nullable()->after('level');
            $table->integer('low_stock_threshold')->nullable()->after('reorder_point');
            
            $table->string('material')->nullable()->after('low_stock_threshold');
            $table->decimal('weight', 10, 2)->nullable()->after('material');
            $table->string('weight_unit')->nullable()->after('weight');
            $table->decimal('length', 10, 2)->nullable()->after('weight_unit');
            $table->decimal('width', 10, 2)->nullable()->after('length');
            $table->decimal('height', 10, 2)->nullable()->after('width');
            $table->string('dimension_unit')->nullable()->after('height');
            $table->decimal('volume', 10, 2)->nullable()->after('dimension_unit');
            $table->string('volume_unit')->nullable()->after('volume');
            
            $table->json('sale_units')->nullable()->after('volume_unit');
            $table->json('specifications')->nullable()->after('sale_units');
            
            $table->boolean('is_featured')->default(false)->after('is_enabled');
            $table->boolean('is_public')->default(true)->after('is_featured');
            
            $table->foreign('buying_unit_id')->references('id')->on('units')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_managements', function (Blueprint $table) {
            $table->dropForeign(['buying_unit_id']);
            $table->dropColumn([
                'sku', 'barcode', 'brand', 'product_type', 'buying_unit_id', 
                'qty_in_buying_unit', 'cost_per_base_unit', 'reorder_point', 
                'low_stock_threshold', 'material', 'weight', 'weight_unit', 
                'length', 'width', 'height', 'dimension_unit', 'volume', 
                'volume_unit', 'sale_units', 'specifications', 'is_featured', 
                'is_public'
            ]);
        });
    }
};
