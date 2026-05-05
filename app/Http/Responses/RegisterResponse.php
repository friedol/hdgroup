<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

class RegisterResponse implements RegisterResponseContract
{
    /**
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function toResponse($request)
    {
        $user = auth()->user() ?: auth()->guard('customers')->user();

        // If the user is a Customer (from the customers table) or has the Customer Role
        if ($user instanceof \App\Models\Customer || ($user && $user->role_id == 12)) {
            return redirect()->route('home');
        }

        // Admin/Staff go to system dashboard
        return $request->wantsJson()
            ? response('', 201)
            : redirect()->intended(config('fortify.home'));
    }
}
