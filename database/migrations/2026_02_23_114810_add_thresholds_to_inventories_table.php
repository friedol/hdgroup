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
        Schema::table('inventories', function (Blueprint $table) {
            $table->decimal('reorder_level', 15, 2)->default(0)->after('qty');
            $table->decimal('overstock_threshold', 15, 2)->default(0)->after('reorder_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            $table->dropColumn(['reorder_level', 'overstock_threshold']);
        });
    }
};
