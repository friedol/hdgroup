<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('branch_store', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->foreignId('store_id')->constrained()->onDelete('cascade');
            $table->unique(['branch_id', 'store_id']);
            $table->timestamps();
        });

        // Migrate existing branch_id from stores to branch_store
        $stores = DB::table('stores')->whereNotNull('branch_id')->get();
        foreach ($stores as $store) {
            DB::table('branch_store')->insert([
                'branch_id' => $store->branch_id,
                'store_id' => $store->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branch_store');
    }
};
