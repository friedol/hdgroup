<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Persist a snapshot of the product buying (purchase) price and selling
     * price on every transfer line so the internal transfer document/report
     * always reflects the pricing at the time of the transfer.
     */
    public function up(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            if (! Schema::hasColumn('transfers', 'buying_price')) {
                $table->decimal('buying_price', 15, 2)->nullable()->after('base_unit');
            }
            if (! Schema::hasColumn('transfers', 'selling_price')) {
                $table->decimal('selling_price', 15, 2)->nullable()->after('buying_price');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            foreach (['buying_price', 'selling_price'] as $col) {
                if (Schema::hasColumn('transfers', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
