<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add delivery fields to loans table
        if (Schema::hasTable('loans')) {
            Schema::table('loans', function (Blueprint $table) {
                if (!Schema::hasColumn('loans', 'delivery_id')) {
                    $table->foreignId('delivery_id')->nullable()->after('balance')->constrained('deliveries')->onDelete('set null');
                    $table->decimal('delivery_cost', 10, 2)->default(0)->after('delivery_id');
                    $table->decimal('delivery_discount', 10, 2)->default(0)->after('delivery_cost');
                    $table->string('delivery_status')->default('pending')->after('delivery_discount');
                    $table->text('delivery_address')->nullable()->after('delivery_status');
                }
            });
        }

        // Add delivery fields to exports table
        if (Schema::hasTable('exports')) {
            Schema::table('exports', function (Blueprint $table) {
                if (!Schema::hasColumn('exports', 'delivery_id')) {
                    $table->foreignId('delivery_id')->nullable()->after('discount')->constrained('deliveries')->onDelete('set null');
                    $table->decimal('delivery_cost', 10, 2)->default(0)->after('delivery_id');
                    $table->decimal('delivery_discount', 10, 2)->default(0)->after('delivery_cost');
                    $table->string('delivery_status')->default('pending')->after('delivery_discount');
                    $table->text('delivery_address')->nullable()->after('delivery_status');
                }
            });
        }

        // Add delivery fields to myorders table
        if (Schema::hasTable('myorders')) {
            Schema::table('myorders', function (Blueprint $table) {
                if (!Schema::hasColumn('myorders', 'delivery_id')) {
                    $table->foreignId('delivery_id')->nullable()->after('total_price')->constrained('deliveries')->onDelete('set null');
                    $table->decimal('delivery_cost', 10, 2)->default(0)->after('delivery_id');
                    $table->decimal('delivery_discount', 10, 2)->default(0)->after('delivery_cost');
                    $table->string('delivery_status')->default('pending')->after('delivery_discount');
                    $table->text('delivery_address')->nullable()->after('delivery_status');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('loans')) {
            Schema::table('loans', function (Blueprint $table) {
                $table->dropConstrainedForeignId('delivery_id');
                $table->dropColumn(['delivery_cost', 'delivery_discount', 'delivery_status', 'delivery_address']);
            });
        }

        if (Schema::hasTable('exports')) {
            Schema::table('exports', function (Blueprint $table) {
                $table->dropConstrainedForeignId('delivery_id');
                $table->dropColumn(['delivery_cost', 'delivery_discount', 'delivery_status', 'delivery_address']);
            });
        }

        if (Schema::hasTable('myorders')) {
            Schema::table('myorders', function (Blueprint $table) {
                $table->dropConstrainedForeignId('delivery_id');
                $table->dropColumn(['delivery_cost', 'delivery_discount', 'delivery_status', 'delivery_address']);
            });
        }
    }
};
