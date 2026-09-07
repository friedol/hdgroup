<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->unsignedBigInteger('assigned_to')->nullable()->after('branch_id');
            $table->string('assigned_to_name')->nullable()->after('assigned_to');

            $table->foreign('assigned_to')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->enum('fulfillment_status', ['pending', 'picked', 'processed', 'checked'])
                ->default('pending')->after('discount');
            $table->unsignedBigInteger('fulfilled_by')->nullable()->after('fulfillment_status');
            $table->timestamp('fulfilled_at')->nullable()->after('fulfilled_by');
            $table->unsignedBigInteger('source_store_id')->nullable()->after('fulfilled_at');
            $table->string('source_store_name')->nullable()->after('source_store_id');

            $table->foreign('fulfilled_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('source_store_id')->references('id')->on('stores')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropForeign(['fulfilled_by']);
            $table->dropForeign(['source_store_id']);
            $table->dropColumn(['fulfillment_status', 'fulfilled_by', 'fulfilled_at', 'source_store_id', 'source_store_name']);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['assigned_to']);
            $table->dropColumn(['assigned_to', 'assigned_to_name']);
        });
    }
};
