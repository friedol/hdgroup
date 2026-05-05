<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            if (!Schema::hasColumn('carts', 'promo_code')) {
                $table->string('promo_code')->nullable()->after('discount');
            }
            if (!Schema::hasColumn('carts', 'promo_discount_total')) {
                $table->decimal('promo_discount_total', 14, 2)->default(0)->after('promo_code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            if (Schema::hasColumn('carts', 'promo_discount_total')) {
                $table->dropColumn('promo_discount_total');
            }
            if (Schema::hasColumn('carts', 'promo_code')) {
                $table->dropColumn('promo_code');
            }
        });
    }
};
