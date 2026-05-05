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
        Schema::table('upcoming_products', function (Blueprint $table) {
            $table->string('sku', 100)->nullable()->after('product_management_id');
            $table->string('barcode', 100)->nullable()->after('sku');
            $table->string('brand', 100)->nullable()->after('category_name');
            $table->unsignedBigInteger('buying_unit_id')->nullable()->after('unit_description');
            $table->decimal('qty_in_buying_unit', 10, 2)->default(1)->after('buying_unit_id');
            $table->decimal('cost_per_base_unit', 15, 2)->nullable()->after('qty_in_buying_unit');
            $table->integer('reorder_point')->nullable()->after('product_quantity');
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
            $table->boolean('is_featured')->default(false)->after('is_published');
            $table->boolean('is_public')->default(true)->after('is_featured');
            
            // Add individual image slots to match ProductManagement
            $table->string('image_1')->nullable()->after('specifications');
            $table->string('image_2')->nullable()->after('image_1');
            $table->string('image_3')->nullable()->after('image_2');
            $table->string('image_4')->nullable()->after('image_3');
            $table->string('image_5')->nullable()->after('image_4');
            $table->unsignedBigInteger('store_id')->nullable()->after('store_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('upcoming_products', function (Blueprint $table) {
            //
        });
    }
};
