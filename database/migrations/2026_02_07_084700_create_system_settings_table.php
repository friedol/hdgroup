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
        Schema::create('system_settings', function (Blueprint $col) {
            $col->id();
            $col->string('company_name')->default('Afribomba');
            $col->string('company_email')->nullable();
            $col->string('company_phone')->nullable();
            $col->text('company_address')->nullable();
            $col->string('company_logo')->nullable();
            $col->string('company_favicon')->nullable();
            $col->string('currency_symbol')->default('Tsh');
            $col->string('currency_code')->default('TZS');
            $col->text('footer_text')->nullable();
            $col->timestamps();
        });

        // Insert default settings
        \DB::table('system_settings')->insert([
            'company_name' => 'Afribomba',
            'currency_symbol' => 'Tsh',
            'currency_code' => 'TZS',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
