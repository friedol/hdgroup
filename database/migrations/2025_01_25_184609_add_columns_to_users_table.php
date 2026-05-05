<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('cargo')->nullable()->after('profile');
            $table->string('district')->nullable()->after('cargo');
            $table->string('street')->nullable()->after('district');
            $table->string('village')->nullable()->after('street');
            $table->string('box_name')->nullable()->after('village');
            $table->string('kata')->nullable()->after('box_name');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
};
