<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;

class CheckOnlineShop
{
    public function handle(Request $request, Closure $next)
    {
        $enabled = Setting::getValue('online_shop_enabled', '1');

        if ($enabled !== '1' && $enabled !== true && $enabled !== 1) {
            return redirect()->route('login');
        }

        return $next($request);
    }
}
