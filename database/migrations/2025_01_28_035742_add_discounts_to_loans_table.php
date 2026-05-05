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
        Schema::table('loans', function (Blueprint $table) {
            //
            $table->decimal('unit_price')->default(0)->nullable()->after('product_quantity');
            $table->decimal('discount')->default(0)->nullable()->after('unit_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            //
              //
              $table->dropColumn('unit_price');
              $table->dropColumn('discount');
        });
    }
};
