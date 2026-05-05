<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop any foreign key that relies on bill_id in bill_items if applicable
        // Or if simple setup, just rename tables.
        Schema::rename('bills', 'boms');
        Schema::rename('bill_items', 'bom_items');
        
        Schema::table('bom_items', function(Blueprint $table) {
            $table->renameColumn('bill_id', 'bom_id');
            // Adding wastage percent
            if (!Schema::hasColumn('bom_items', 'wastage_percent')) {
                $table->decimal('wastage_percent', 5, 2)->default(0)->after('quantity_required');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bom_items', function(Blueprint $table) {
            $table->renameColumn('bom_id', 'bill_id');
            if (Schema::hasColumn('bom_items', 'wastage_percent')) {
                $table->dropColumn('wastage_percent');
            }
        });
        
        Schema::rename('bom_items', 'bill_items');
        Schema::rename('boms', 'bills');
    }
};
