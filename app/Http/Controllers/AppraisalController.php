<?php

namespace App\Http\Controllers;

use App\Models\Appraisal;
use App\Models\AppraisalCycle;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AppraisalController extends Controller
{
    protected function isHrAdmin(): bool
    {
        $user = Auth::user();

        return $user->hasRole(['CEO', 'HR', 'Super Admin']) || $user->hasPermissionTo('manage hr');
    }

    public function index()
    {
        $user = Auth::user();
        $isAdmin = $this->isHrAdmin();

        $cycles = AppraisalCycle::orderByDesc('start_date')->get();

        $myAppraisals = Appraisal::with('cycle', 'reviewer')
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        $reviewAssignments = Appraisal::with('cycle', 'user')
            ->where('reviewer_id', $user->id)
            ->latest()
            ->get();

        $allAppraisals = $isAdmin
            ? Appraisal::with('cycle', 'user', 'reviewer')->latest()->get()
            : [];

        $employees = $isAdmin ? User::orderBy('name')->get(['id', 'name']) : [];

        return Inertia::render('HR/Appraisals/Index', [
            'cycles' => $cycles,
            'my_appraisals' => $myAppraisals,
            'review_assignments' => $reviewAssignments,
            'all_appraisals' => $allAppraisals,
            'employees' => $employees,
            'is_admin' => $isAdmin,
        ]);
    }

    public function storeCycle(Request $request)
    {
        if (! $this->isHrAdmin()) {
            return back()->withErrors(['error' => 'You are not authorized to create appraisal cycles.']);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'required|in:draft,active,closed',
        ]);

        AppraisalCycle::create($validated);

        return back()->with('success', 'Appraisal cycle created.');
    }

    public function storeAppraisal(Request $request)
    {
        if (! $this->isHrAdmin()) {
            return back()->withErrors(['error' => 'You are not authorized to assign appraisals.']);
        }

        $validated = $request->validate([
            'appraisal_cycle_id' => 'required|exists:appraisal_cycles,id',
            'user_id' => 'required|exists:users,id',
            'reviewer_id' => 'required|exists:users,id',
            'goals' => 'nullable|string|max:1000',
        ]);

        Appraisal::create(array_merge($validated, ['status' => 'pending']));

        return back()->with('success', 'Appraisal assigned.');
    }

    public function update(Request $request, Appraisal $appraisal)
    {
        $user = Auth::user();
        if ($appraisal->reviewer_id !== $user->id && ! $this->isHrAdmin()) {
            return back()->withErrors(['error' => 'Only the assigned reviewer can fill this appraisal.']);
        }

        $validated = $request->validate([
            'goals' => 'nullable|string|max:1000',
            'achievements' => 'nullable|string|max:1000',
            'strengths' => 'nullable|string|max:1000',
            'areas_for_improvement' => 'nullable|string|max:1000',
            'rating' => 'required|integer|min:1|max:5',
        ]);

        $appraisal->update(array_merge($validated, [
            'status' => 'submitted',
            'submitted_at' => now(),
        ]));

        return back()->with('success', 'Appraisal submitted.');
    }

    public function acknowledge(Request $request, Appraisal $appraisal)
    {
        if ($appraisal->user_id !== Auth::id()) {
            return back()->withErrors(['error' => 'You can only acknowledge your own appraisal.']);
        }

        if ($appraisal->status !== 'submitted') {
            return back()->withErrors(['error' => 'This appraisal is not ready to be acknowledged.']);
        }

        $validated = $request->validate([
            'employee_comments' => 'nullable|string|max:1000',
        ]);

        $appraisal->update([
            'employee_comments' => $validated['employee_comments'] ?? null,
            'status' => 'acknowledged',
            'acknowledged_at' => now(),
        ]);

        return back()->with('success', 'Appraisal acknowledged.');
    }
}
