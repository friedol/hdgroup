<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_adjustments', function (Blueprint $table) {
            if (!Schema::hasColumn('stock_adjustments', 'variant_id')) {
                $table->unsignedBigInteger('variant_id')->nullable()->after('product_id');
                $table->foreign('variant_id')->references('id')->on('product_variants')->nullOnDelete();
            }

            if (!Schema::hasColumn('stock_adjustments', 'variant_color')) {
                $table->string('variant_color')->nullable()->after('variant_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('stock_adjustments', function (Blueprint $table) {
            if (Schema::hasColumn('stock_adjustments', 'variant_id')) {
                $table->dropForeign(['variant_id']);
                $table->dropColumn('variant_id');
            }

            if (Schema::hasColumn('stock_adjustments', 'variant_color')) {
                $table->dropColumn('variant_color');
            }
        });
    }
};
