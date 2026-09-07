<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            if (! Schema::hasColumn('transfers', 'unit_factor')) {
                $table->decimal('unit_factor', 10, 4)->default(1)->after('product_quantity');
            }
            if (! Schema::hasColumn('transfers', 'base_unit')) {
                $table->string('base_unit')->nullable()->after('unit_factor');
            }
        });
    }

    public function down(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            $table->dropColumn(['unit_factor', 'base_unit']);
        });
    }
};
