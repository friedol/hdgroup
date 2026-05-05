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
        Schema::table('branches', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('name');
        });

        // Populate existing slugs
        \App\Models\Branch::all()->each(function ($branch) {
            $branch->slug = \Illuminate\Support\Str::slug($branch->name);
            $branch->save();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
