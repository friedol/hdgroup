<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // Branding
            ['key' => 'system_name', 'value' => 'Afribomba', 'type' => 'text', 'group' => 'branding'],
            ['key' => 'business_name', 'value' => 'Afribomba Shop', 'type' => 'text', 'group' => 'branding'],
            ['key' => 'primary_color', 'value' => '#0d6efd', 'type' => 'text', 'group' => 'branding'],
            ['key' => 'secondary_color', 'value' => '#6c757d', 'type' => 'text', 'group' => 'branding'],
            ['key' => 'font_family', 'value' => 'Roboto', 'type' => 'text', 'group' => 'branding'],
            
            // Contact Details
            ['key' => 'business_email', 'value' => 'sekosuppliers@gmail.com', 'type' => 'text', 'group' => 'contact'],
            ['key' => 'business_phone', 'value' => '+255 753 880 407', 'type' => 'text', 'group' => 'contact'],
            ['key' => 'business_address', 'value' => 'KARIAKOO, DAR ES SALAAM', 'type' => 'text', 'group' => 'contact'],
            
            // Financial & Tax
            ['key' => 'currency_symbol', 'value' => 'Tsh', 'type' => 'text', 'group' => 'financial'],
            ['key' => 'currency_code', 'value' => 'TZS', 'type' => 'text', 'group' => 'financial'],
            ['key' => 'tax_percentage', 'value' => '18', 'type' => 'number', 'group' => 'financial'],
            ['key' => 'tax_no', 'value' => '134-186-208', 'type' => 'text', 'group' => 'financial'],
            ['key' => 'bank_name', 'value' => 'NMB', 'type' => 'text', 'group' => 'financial'],
            ['key' => 'bank_account_no', 'value' => '20410021998', 'type' => 'text', 'group' => 'financial'],
            ['key' => 'bank_account_name', 'value' => 'SUKA SEKO NGOLENGOSHA', 'type' => 'text', 'group' => 'financial'],
            
            // Inventory
            ['key' => 'low_stock_alert', 'value' => '10', 'type' => 'number', 'group' => 'inventory'],
            ['key' => 'allow_negative_stock', 'value' => '0', 'type' => 'boolean', 'group' => 'inventory'],
            
            // Modules (Features)
            ['key' => 'module_pos', 'value' => '1', 'type' => 'boolean', 'group' => 'modules'],
            ['key' => 'module_accounting', 'value' => '1', 'type' => 'boolean', 'group' => 'modules'],
            ['key' => 'module_purchases', 'value' => '1', 'type' => 'boolean', 'group' => 'modules'],

            // System Preferences
            ['key' => 'date_format', 'value' => 'd/m/Y', 'type' => 'text', 'group' => 'preferences'],
            ['key' => 'timezone', 'value' => 'Africa/Dar_es_Salaam', 'type' => 'text', 'group' => 'preferences'],
            ['key' => 'language', 'value' => 'en', 'type' => 'text', 'group' => 'preferences'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
