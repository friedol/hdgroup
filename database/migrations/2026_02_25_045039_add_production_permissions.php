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
        \App\Models\Permission::create([
            'name' => 'Manage Productions',
            'slug' => 'manage_productions',
            'module' => 'Manufacturing',
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \App\Models\Permission::where('slug', 'manage_productions')->delete();
    }
};
