<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            if (!Schema::hasColumn('deliveries', 'assignment_mode')) {
                $table->string('assignment_mode')->nullable()->after('delivery_person_id');
            }

            if (!Schema::hasColumn('deliveries', 'assigned_saler_id')) {
                $table->unsignedBigInteger('assigned_saler_id')->nullable()->after('assignment_mode');
                $table->foreign('assigned_saler_id')->references('id')->on('users')->nullOnDelete();
            }

            if (!Schema::hasColumn('deliveries', 'external_partner')) {
                $table->string('external_partner')->nullable()->after('assigned_saler_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            if (Schema::hasColumn('deliveries', 'assigned_saler_id')) {
                $table->dropForeign(['assigned_saler_id']);
                $table->dropColumn('assigned_saler_id');
            }

            if (Schema::hasColumn('deliveries', 'assignment_mode')) {
                $table->dropColumn('assignment_mode');
            }

            if (Schema::hasColumn('deliveries', 'external_partner')) {
                $table->dropColumn('external_partner');
            }
        });
    }
};
