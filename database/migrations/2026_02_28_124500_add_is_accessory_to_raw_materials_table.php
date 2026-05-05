<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('raw_materials', function (Blueprint $table) {
            $table->boolean('is_accessory')->default(false)->after('is_roll');
        });
    }

    public function down()
    {
        Schema::table('raw_materials', function (Blueprint $table) {
            $table->dropColumn('is_accessory');
        });
    }
};
