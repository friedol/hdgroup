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
        Schema::table('raw_materials', function (Blueprint $table) {
            // Drop current static stock trackers to enforce ledger calculation
            if (Schema::hasColumn('raw_materials', 'current_stock')) {
                $table->dropColumn('current_stock');
            }
            
            if (!Schema::hasColumn('raw_materials', 'purchase_unit')) {
                $table->string('purchase_unit', 50)->nullable()->after('base_unit');
            }
            if (!Schema::hasColumn('raw_materials', 'conversion_ratio')) {
                $table->decimal('conversion_ratio', 10, 4)->default(1)->after('purchase_unit')->comment('Multiplier to reach base unit');
            }
            if (!Schema::hasColumn('raw_materials', 'track_inventory')) {
                $table->boolean('track_inventory')->default(true)->after('status');
            }
            if (!Schema::hasColumn('raw_materials', 'sku')) {
                $table->string('sku')->nullable()->after('id')->unique();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('raw_materials', function (Blueprint $table) {
            $table->decimal('current_stock', 10, 4)->default(0);
            $table->dropColumn(['purchase_unit', 'conversion_ratio', 'track_inventory', 'sku']);
        });
    }
};
