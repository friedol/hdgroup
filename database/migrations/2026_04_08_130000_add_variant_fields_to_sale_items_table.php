<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            if (!Schema::hasColumn('sale_items', 'variant_id')) {
                $table->unsignedBigInteger('variant_id')->nullable()->after('product_id');
                $table->foreign('variant_id')->references('id')->on('product_variants')->nullOnDelete();
            }

            if (!Schema::hasColumn('sale_items', 'variant_color')) {
                $table->string('variant_color')->nullable()->after('variant_id');
            }

            if (!Schema::hasColumn('sale_items', 'print_type')) {
                $table->string('print_type')->nullable()->after('variant_color');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            if (Schema::hasColumn('sale_items', 'variant_id')) {
                $table->dropForeign(['variant_id']);
                $table->dropColumn('variant_id');
            }

            if (Schema::hasColumn('sale_items', 'variant_color')) {
                $table->dropColumn('variant_color');
            }

            if (Schema::hasColumn('sale_items', 'print_type')) {
                $table->dropColumn('print_type');
            }
        });
    }
};