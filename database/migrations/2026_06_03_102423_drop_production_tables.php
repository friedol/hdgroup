<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::dropIfExists('production_material_usage');
        Schema::dropIfExists('production_metrics');
        Schema::dropIfExists('production_benchmarks');
        Schema::dropIfExists('production_orders');
        Schema::dropIfExists('productions');
        Schema::dropIfExists('bom_items');
        Schema::dropIfExists('boms');

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No rolling back this migration as it permanently deletes the production tables.
    }
};
