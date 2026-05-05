<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('raw_materials', function (Blueprint $table) {
            $table->string('barcode')->nullable()->after('sku');
            $table->string('brand')->nullable()->after('barcode');
            $table->text('description')->nullable()->after('category');
            $table->decimal('reorder_point', 10, 2)->nullable()->after('minimum_stock');
            $table->string('material')->nullable()->after('is_accessory');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('raw_materials', function (Blueprint $table) {
            $table->dropColumn([
                'barcode',
                'brand',
                'description',
                'reorder_point',
                'material'
            ]);
        });
    }
};
