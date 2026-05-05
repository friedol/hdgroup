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
        Schema::table('raw_materials', function (Blueprint $table) {
            $table->decimal('weight_kg', 10, 2)->nullable()->after('roll_status');
        });
    }

    public function down(): void
    {
        Schema::table('raw_materials', function (Blueprint $table) {
            $table->dropColumn('weight_kg');
        });
    }
};
