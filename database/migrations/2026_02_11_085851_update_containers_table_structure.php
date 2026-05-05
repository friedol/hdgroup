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
        Schema::table('containers', function (Blueprint $table) {
            // Add system-calculated fields
            $table->decimal('current_weight', 10, 2)->default(0)->after('max_payload');
            $table->decimal('current_cbm', 10, 2)->default(0)->after('current_weight');
            $table->decimal('utilization_percent', 5, 2)->default(0)->after('current_cbm');
            
            // Add status enum
            $table->enum('status', ['AVAILABLE', 'LOADING', 'FULL', 'DISPATCHED', 'MAINTENANCE'])
                  ->default('AVAILABLE')
                  ->after('utilization_percent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('containers', function (Blueprint $table) {
            $table->dropColumn(['current_weight', 'current_cbm', 'utilization_percent', 'status']);
        });
    }
};
