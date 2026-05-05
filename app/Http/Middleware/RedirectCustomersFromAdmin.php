<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Customer;

class RedirectCustomersFromAdmin
{
    /**
     * Handle an incoming request.
     * If the authenticated user is a Customer (from customers table),
     * block access to the admin panel and redirect to the home page.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user instanceof Customer) {
            return redirect()->route('home')->with(
                'error',
                'You do not have permission to access the admin area.'
            );
        }

        return $next($request);
    }
}
