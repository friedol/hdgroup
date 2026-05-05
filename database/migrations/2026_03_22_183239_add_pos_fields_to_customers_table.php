<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('whatsapp_no')->nullable()->after('alternative_phone');
            $table->string('company_name')->nullable()->after('whatsapp_no');
            $table->text('business_address')->nullable()->after('company_name');
            $table->unsignedBigInteger('brought_by')->nullable()->after('business_address'); // user_id of the salesperson
            $table->boolean('is_walking_customer')->default(false)->after('brought_by');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['whatsapp_no', 'company_name', 'business_address', 'brought_by', 'is_walking_customer']);
        });
    }
};
