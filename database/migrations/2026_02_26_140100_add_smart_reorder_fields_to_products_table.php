<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('auto_reorder_enabled')->default(false);
            $table->integer('reorder_prediction_days')->default(7);
            $table->decimal('reorder_point', 15, 2)->default(0);
            $table->decimal('economic_order_quantity', 15, 2)->default(0);
            $table->integer('lead_time_days')->default(0);
            $table->decimal('safety_stock', 15, 2)->default(0);
            $table->decimal('annual_demand', 15, 2)->default(0);
            $table->decimal('ordering_cost', 15, 2)->default(0);
            $table->decimal('holding_cost_percentage', 5, 2)->default(0.25);
        });
    }

    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'auto_reorder_enabled',
                'reorder_prediction_days',
                'reorder_point',
                'economic_order_quantity',
                'lead_time_days',
                'safety_stock',
                'annual_demand',
                'ordering_cost',
                'holding_cost_percentage'
            ]);
        });
    }
};
