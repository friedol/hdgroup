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
        Schema::table('carts', function (Blueprint $table) {
            $table->string('village')->nullable()->after('street');
            $table->string('box_name')->nullable()->after('village');
            $table->string('kata')->nullable()->after('box_name');
            $table->string('cargo')->nullable()->after('kata');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropColumn(['village', 'box_name', 'kata', 'cargo']);
        });
    }
};
