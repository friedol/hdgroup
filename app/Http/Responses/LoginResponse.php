<?php

namespace App\Http\Responses;

use App\Models\Customer;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    /**
     * @param  Request  $request
     * @return Response
     */
    public function toResponse($request)
    {
        $user = auth()->user() ?: auth()->guard('customers')->user();

        // If the user is a Customer (from the customers table) or has the Customer Role
        if ($user instanceof Customer || ($user && $user->role_id == 12)) {
            return redirect()->route('home');
        }

        // Admin/Staff go to system dashboard
        return $request->wantsJson()
            ? response()->json(['two_factor' => false])
            : redirect()->intended(config('fortify.home'));
    }
}
