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
        Schema::table('branch_sms_configs', function (Blueprint $table) {
            // Add Beem-specific fields
            $table->string('api_secret_key')->nullable()->after('api_key');
            $table->string('app_id')->nullable()->after('api_secret_key');
            // Rename gateway_url to be more flexible for different providers
            // This allows it to be used for Beem, custom gateways, etc.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branch_sms_configs', function (Blueprint $table) {
            $table->dropColumn(['api_secret_key', 'app_id']);
        });
    }
};
