<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_managements', function (Blueprint $table) {
            $table->decimal('plain_selling_price', 15, 2)->nullable()->after('product_price');
            $table->decimal('printed_selling_price', 15, 2)->nullable()->after('plain_selling_price');
        });
    }

    public function down(): void
    {
        Schema::table('product_managements', function (Blueprint $table) {
            $table->dropColumn(['plain_selling_price', 'printed_selling_price']);
        });
    }
};
