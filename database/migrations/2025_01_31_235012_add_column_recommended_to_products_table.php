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
        Schema::table('exports', function (Blueprint $table) {
            $table->string('staff_recommeded')->after('status')->nullable();
        });
        Schema::table('loans', function (Blueprint $table) {
            $table->string('staff_recommeded')->after('status')->nullable();
            
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exports', function (Blueprint $table) {
            $table->dropColumn('staff_recommeded');
        });
        Schema::table('loans', function (Blueprint $table) {
            //
            $table->dropColumn('staff_recommeded');
        });
    }
};
