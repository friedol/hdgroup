<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'key',
        'value',
        'type',
        'group',
    ];

    /**
     * Get setting value by key.
     */
    public static function getValue($key, $default = null, $tenant_id = null)
    {
        if ($tenant_id) {
            $value = self::where('key', $key)->where('tenant_id', $tenant_id)->value('value');
            if ($value !== null) {
                return $value;
            }
        }

        // Fallback to global setting (where tenant_id is null)
        return self::where('key', $key)->whereNull('tenant_id')->value('value') ?? $default;
    }
}
