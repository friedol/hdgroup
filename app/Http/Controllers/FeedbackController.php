<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    public function index()
    {
        $d['feedbacks'] = Feedback::latest()->paginate(20);
        $d['totalFeedbacks'] = Feedback::count();
        $d['todayFeedbacks'] = Feedback::whereDate('created_at', \Carbon\Carbon::today())->count();
        $d['inquiryInbox'] = Feedback::whereNotNull('inquire')->count();

        return \Inertia\Inertia::render('Admin/Comments/All', $d);
    }


    public function destroy(string $id)
    {
        $unit = Feedback::findOrFail($id);
        try {
            $unit->delete();
            return response()->json(['success' => 'Feedback Deleted  successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred. Please try again.'], 500);
        }
    }
}
