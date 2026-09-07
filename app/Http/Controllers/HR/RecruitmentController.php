<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\Department;
use App\Models\JobPosition;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RecruitmentController extends Controller
{
    public function index(Request $request)
    {
        $jobPositions = JobPosition::with('department:id,name')
            ->withCount('candidates')
            ->latest()
            ->get();

        $candidates = Candidate::with('jobPosition:id,title')
            ->latest()
            ->paginate(15);

        $departments = Department::select('id', 'name')->get();

        $metrics = [
            'open_positions' => JobPosition::where('status', 'open')->count(),
            'total_candidates' => Candidate::count(),
            'interviews' => Candidate::where('stage', 'Interview')->count(),
            'hired' => Candidate::where('stage', 'Hired')->count(),
        ];

        return Inertia::render('Staff/Recruitment/Index', [
            'jobPositions' => $jobPositions,
            'candidates' => $candidates,
            'departments' => $departments,
            'metrics' => $metrics,
        ]);
    }

    public function storePosition(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'job_type' => 'required|string',
            'vacancies' => 'required|integer|min:1',
            'min_salary' => 'nullable|numeric',
            'max_salary' => 'nullable|numeric',
            'description' => 'nullable|string',
        ]);

        JobPosition::create($validated);

        return redirect()->back()->with('success', 'Job position posted successfully.');
    }

    public function storeCandidate(Request $request)
    {
        $validated = $request->validate([
            'job_position_id' => 'required|exists:job_positions,id',
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        Candidate::create($validated);

        return redirect()->back()->with('success', 'Candidate added to pipeline.');
    }

    public function updateCandidateStage(Request $request, Candidate $candidate)
    {
        $validated = $request->validate([
            'stage' => 'required|string',
        ]);

        $candidate->update(['stage' => $validated['stage']]);

        return redirect()->back()->with('success', 'Candidate stage updated.');
    }
}
