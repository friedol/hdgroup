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
        Schema::table('orders', function (Blueprint $table) {
            // Add manifest_id to link to logistics_manifests
            $table->unsignedBigInteger('manifest_id')->nullable()->after('id');
            
            // Add calculated item totals (snapshot of weight/cbm at time of adding)
            $table->decimal('total_weight', 10, 2)->default(0)->after('quantity');
            $table->decimal('total_cbm', 10, 2)->default(0)->after('total_weight');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['manifest_id', 'total_weight', 'total_cbm']);
        });
    }
};
