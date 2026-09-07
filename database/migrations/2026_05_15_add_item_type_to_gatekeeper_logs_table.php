<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gatekeeper_logs', function (Blueprint $table) {
            $table->string('item_type')->default('product')->after('type'); // 'product' or 'raw_material'
            $table->foreignId('raw_material_id')->nullable()->constrained('raw_materials')->onDelete('set null')->after('product_id');
        });
    }

    public function down(): void
    {
        Schema::table('gatekeeper_logs', function (Blueprint $table) {
            $table->dropForeign(['raw_material_id']);
            $table->dropColumn(['item_type', 'raw_material_id']);
        });
    }
};
