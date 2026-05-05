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
            $table->string('staff_recommeded')->after('status')->nullable();
            $table->decimal('discount')->default(0)->nullable()->after('price');
            $table->boolean('is_checked')->default(false)->after('id');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
        Schema::table('carts', function (Blueprint $table) {
            //
            $table->dropColumn('staff_recommeded');
            $table->dropColumn('discount');
            $table->dropColumn('is_checked');
        });
    }
};
