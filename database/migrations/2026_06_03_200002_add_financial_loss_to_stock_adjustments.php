<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_adjustments', function (Blueprint $table) {
            $table->decimal('financial_loss_value', 15, 2)->nullable()->after('quantity');
            $table->string('damage_category')->nullable()->after('financial_loss_value');
        });
    }

    public function down(): void
    {
        Schema::table('stock_adjustments', function (Blueprint $table) {
            $table->dropColumn(['financial_loss_value', 'damage_category']);
        });
    }
};
