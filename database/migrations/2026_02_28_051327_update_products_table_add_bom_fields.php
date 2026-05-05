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
        Schema::table('products', function (Blueprint $table) {
            // Already added 'product_type' in another migration? Let's make sure it handles raw_material, finished_product, etc.
            // If it already exists, we might need to change it. Let's add has_bom.
            if (!Schema::hasColumn('products', 'has_bom')) {
                $table->boolean('has_bom')->default(false)->after('product_type');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'has_bom')) {
                $table->dropColumn('has_bom');
            }
        });
    }
};
