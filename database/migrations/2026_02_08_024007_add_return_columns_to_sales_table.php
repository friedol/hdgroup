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
        Schema::table('sales', function (Blueprint $table) {
            $table->boolean('is_return')->default(false)->after('payment_status');
            $table->unsignedBigInteger('returned_from_id')->nullable()->after('is_return');
            $table->foreign('returned_from_id')->references('id')->on('sales')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['returned_from_id']);
            $table->dropColumn(['is_return', 'returned_from_id']);
        });
    }
};
