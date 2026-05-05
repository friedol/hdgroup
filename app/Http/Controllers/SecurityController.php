<?php

namespace App\Http\Controllers;

use App\Models\Session;
use Illuminate\Http\Request;

class SecurityController extends Controller
{
    public function system_logs(){
        $sessions = Session::filter(request(['search']))->orderBy('last_activity','desc')->get();
        return \Inertia\Inertia::render('Admin/Security/Logs', compact('sessions'));
    }
}
