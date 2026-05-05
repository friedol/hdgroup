<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_adjustments', function (Blueprint $table) {
            if (!Schema::hasColumn('stock_adjustments', 'print_type')) {
                $table->string('print_type')->nullable()->after('variant_color');
            }
        });

        Schema::table('product_variants', function (Blueprint $table) {
            if (!Schema::hasColumn('product_variants', 'plain_qty')) {
                $table->decimal('plain_qty', 15, 2)->default(0)->after('qty');
            }

            if (!Schema::hasColumn('product_variants', 'printed_qty')) {
                $table->decimal('printed_qty', 15, 2)->default(0)->after('plain_qty');
            }
        });

        // Backfill existing variant stock into plain_qty by default so old data remains usable.
        DB::statement('UPDATE product_variants SET plain_qty = qty WHERE plain_qty = 0');
    }

    public function down(): void
    {
        Schema::table('stock_adjustments', function (Blueprint $table) {
            if (Schema::hasColumn('stock_adjustments', 'print_type')) {
                $table->dropColumn('print_type');
            }
        });

        Schema::table('product_variants', function (Blueprint $table) {
            if (Schema::hasColumn('product_variants', 'plain_qty')) {
                $table->dropColumn('plain_qty');
            }

            if (Schema::hasColumn('product_variants', 'printed_qty')) {
                $table->dropColumn('printed_qty');
            }
        });
    }
};
