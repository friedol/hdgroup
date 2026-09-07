<?php

namespace App\Http\Controllers;

use App\Models\Candidate;
use App\Models\EmployeeContract;
use App\Models\EmployeeProfile;
use App\Models\Interview;
use App\Models\JobOpening;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class RecruitmentController extends Controller
{
    /**
     * Ordered recruitment pipeline stages (steps 5-17 of the company's documented
     * recruitment process). 'hired' is only reachable via hireCandidate(), and
     * 'rejected' can happen from any stage — both are excluded from the freeform list.
     */
    public const PIPELINE_STAGES = [
        'applied', 'screening', 'phone_screening', 'skills_assessment', 'interview',
        'reference_check', 'background_check', 'medical_exam', 'selection',
        'offer', 'contract', 'documentation', 'onboarding',
    ];

    public function index()
    {
        $jobOpenings = JobOpening::withCount('candidates')
            ->orderByDesc('created_at')
            ->get();

        $candidates = Candidate::with(['jobOpening', 'interviews.interviewer'])
            ->orderByDesc('created_at')
            ->get();

        $interviewers = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('HR/Recruitment/Index', [
            'job_openings' => $jobOpenings,
            'candidates' => $candidates,
            'interviewers' => $interviewers,
            'roles' => [
                'CEO', 'HR', 'Workshop Manager', 'CRM Officer', 'Technician',
                'Finance', 'Procurement', 'Store', 'Workshop Supervisor', 'Marketing',
            ],
        ]);
    }

    public function showCandidate(Candidate $candidate)
    {
        $candidate->load(['jobOpening', 'interviews.interviewer']);

        return Inertia::render('HR/Recruitment/Show', [
            'candidate' => $candidate,
            'interviewers' => User::orderBy('name')->get(['id', 'name']),
            'roles' => [
                'CEO', 'HR', 'Workshop Manager', 'CRM Officer', 'Technician',
                'Finance', 'Procurement', 'Store', 'Workshop Supervisor', 'Marketing',
            ],
        ]);
    }

    public function assessCandidate(Candidate $candidate)
    {
        $apiKey = config('services.gemini.key');
        if (! $apiKey) {
            return back()->withErrors(['error' => 'AI assessment is not configured. Please set GEMINI_API_KEY.']);
        }

        $candidate->load('jobOpening');
        $prompt = $this->buildAssessmentPrompt($candidate);

        try {
            $response = Http::timeout(30)
                ->retry(3, 2000) // Retry up to 3 times, with a 2 second delay, to handle random 503 High Demand errors
                ->post(
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={$apiKey}",
                    [
                        'contents' => [['parts' => [['text' => $prompt]]]],
                        'generationConfig' => ['responseMimeType' => 'application/json'],
                    ]
                );

            if (! $response->successful()) {
                Log::warning('Gemini candidate assessment failed: '.$response->body());

                return back()->withErrors(['error' => 'AI assessment failed. Please try again.']);
            }

            $text = $response->json()['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
            $result = json_decode($text, true);

            if (! is_array($result) || ! isset($result['recommendation'])) {
                return back()->withErrors(['error' => 'AI returned an unexpected response. Please try again.']);
            }

            $candidate->update([
                'ai_recommendation' => $result['recommendation'],
                'ai_score' => max(0, min(100, (int) ($result['score'] ?? 0))),
                'ai_summary' => $result['summary'] ?? null,
                'ai_strengths' => $result['strengths'] ?? [],
                'ai_concerns' => $result['concerns'] ?? [],
                'ai_assessed_at' => now(),
            ]);

            return back()->with('success', 'AI qualification assessment complete.');
        } catch (\Exception $e) {
            Log::error('Gemini candidate assessment error: '.$e->getMessage());

            return back()->withErrors(['error' => 'AI assessment failed: '.$e->getMessage()]);
        }
    }

    /**
     * Build a Gemini prompt comparing a candidate's profile against the job requirements.
     */
    private function buildAssessmentPrompt(Candidate $candidate): string
    {
        $jobContext = $candidate->jobOpening
            ? "Job Title: {$candidate->jobOpening->title}\n"
                .'Department: '.($candidate->jobOpening->department ?? 'N/A')."\n"
                .'Description: '.($candidate->jobOpening->description ?? 'N/A')."\n"
                .'Requirements: '.($candidate->jobOpening->requirements ?? 'N/A')
            : 'General application for category: '.($candidate->applied_category ?? 'N/A').' (no specific job posting — assess general fit for this trade/role at a steel fabrication company).';

        $skills = $candidate->skills ?? [];
        $skillsText = collect($skills)
            ->filter(fn ($v) => ! empty($v))
            ->map(fn ($v, $k) => is_array($v) ? "{$k}: ".implode(', ', $v) : "{$k}: {$v}")
            ->implode('; ');

        $profile = "Name: {$candidate->name}\n"
            .'Years of Experience: '.($candidate->years_experience ?? 'N/A')."\n"
            .'Education Level: '.($candidate->education_level ?? 'N/A')."\n"
            .'School: '.($candidate->school_name ?? 'N/A')."\n"
            .'Course: '.($candidate->course ?? 'N/A')."\n"
            .'Skills: '.($skillsText ?: 'N/A')."\n"
            .'Previous Employer: '.($candidate->prev_employer ?? 'N/A')."\n"
            .'Previous Position: '.($candidate->prev_position ?? 'N/A')."\n"
            .'Previous Responsibilities: '.($candidate->employment_responsibilities ?? 'N/A')."\n"
            .'Worked in fabrication before: '.($candidate->worked_fabrication_before === null ? 'N/A' : ($candidate->worked_fabrication_before ? 'Yes' : 'No'))."\n"
            .'Has driving license: '.($candidate->has_driving_license === null ? 'N/A' : ($candidate->has_driving_license ? 'Yes' : 'No'))."\n"
            .'Willing to work overtime: '.($candidate->willing_overtime === null ? 'N/A' : ($candidate->willing_overtime ? 'Yes' : 'No'))."\n"
            .'Cover Letter: '.($candidate->cover_letter ?? 'N/A');

        return "You are an experienced HR recruiter at Medani Company LTD, a steel fabrication and engineering company in Tanzania. Assess whether this candidate is qualified to be hired or invited for an interview, based on the job requirements and the candidate's profile below.

JOB CONTEXT:
{$jobContext}

CANDIDATE PROFILE:
{$profile}

Instructions:
1. Compare the candidate's education, skills, and experience against the job context.
2. Decide a recommendation: 'hire' (excellent, clear match), 'interview' (potential fit, worth talking to), or 'reject' (not a fit).
3. Give a score from 0 to 100 representing overall qualification fit.
4. Write a concise 2-3 sentence summary explaining the recommendation.
5. List up to 4 short strengths and up to 4 short concerns (arrays of short phrases, can be empty arrays).

Return ONLY a JSON object with exactly these keys: recommendation (string), score (number), summary (string), strengths (array of strings), concerns (array of strings). No markdown, no extra text.";
    }

    public function storeJob(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'department' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
            'employment_type' => 'required|in:full_time,part_time,contract,intern',
            'location' => 'nullable|string|max:255',
            'salary_range_min' => 'nullable|numeric|min:0',
            'salary_range_max' => 'nullable|numeric|min:0',
            'status' => 'required|in:draft,open,closed',
            'closing_date' => 'nullable|date',
            'image' => 'nullable|image|max:4096',
        ]);

        $slug = Str::slug($validated['title']).'-'.Str::random(6);

        $imagePath = $request->hasFile('image')
            ? $request->file('image')->store('hr/job-images', 'public')
            : null;

        JobOpening::create(array_merge($validated, [
            'slug' => $slug,
            'image_path' => $imagePath,
            'posted_by' => Auth::id(),
        ]));

        return back()->with('success', 'Job opening created.');
    }

    public function updateJob(Request $request, JobOpening $jobOpening)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'department' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
            'employment_type' => 'required|in:full_time,part_time,contract,intern',
            'location' => 'nullable|string|max:255',
            'salary_range_min' => 'nullable|numeric|min:0',
            'salary_range_max' => 'nullable|numeric|min:0',
            'status' => 'required|in:draft,open,closed',
            'closing_date' => 'nullable|date',
            'image' => 'nullable|image|max:4096',
        ]);

        if ($request->hasFile('image')) {
            if ($jobOpening->image_path) {
                Storage::disk('public')->delete($jobOpening->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('hr/job-images', 'public');
        }
        unset($validated['image']);

        $jobOpening->update($validated);

        return back()->with('success', 'Job opening updated.');
    }

    public function destroyJob(JobOpening $jobOpening)
    {
        if ($jobOpening->candidates()->exists()) {
            return back()->withErrors(['error' => 'This job opening has candidates attached to it and cannot be deleted. Close it instead.']);
        }

        $jobOpening->delete();

        return back()->with('success', 'Job opening deleted.');
    }

    public function storeCandidate(Request $request)
    {
        $validated = $request->validate([
            'job_opening_id' => 'required|exists:job_openings,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'source' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
            'resume' => 'nullable|file|mimes:pdf,doc,docx|max:5120',
        ]);

        $resumePath = null;
        if ($request->hasFile('resume')) {
            $resumePath = $request->file('resume')->store('hr/resumes', 'public');
        }

        Candidate::create([
            'job_opening_id' => $validated['job_opening_id'],
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'source' => $validated['source'] ?? 'internal',
            'notes' => $validated['notes'] ?? null,
            'resume_path' => $resumePath,
            'stage' => 'applied',
        ]);

        return back()->with('success', 'Candidate added.');
    }

    public function updateCandidateStage(Request $request, Candidate $candidate)
    {
        $validated = $request->validate([
            'stage' => 'required|in:'.implode(',', array_merge(self::PIPELINE_STAGES, ['rejected'])),
        ]);

        $candidate->update(['stage' => $validated['stage']]);

        return back()->with('success', 'Candidate stage updated.');
    }

    /**
     * Save the data-capture fields for each recruitment pipeline step
     * (phone screening, skills assessment, reference/background/medical checks,
     * selection decision, job offer, pre-employment documentation, onboarding).
     */
    public function updatePipelineData(Request $request, Candidate $candidate)
    {
        $validated = $request->validate([
            'phone_screening_notes' => 'nullable|string|max:2000',
            'skills_assessment_score' => 'nullable|integer|min:0|max:100',
            'skills_assessment_notes' => 'nullable|string|max:2000',
            'reference_check_status' => 'nullable|in:pending,verified,failed',
            'reference_check_notes' => 'nullable|string|max:2000',
            'background_check_status' => 'nullable|in:pending,verified,failed',
            'background_check_notes' => 'nullable|string|max:2000',
            'medical_exam_status' => 'nullable|in:pending,passed,failed',
            'medical_exam_notes' => 'nullable|string|max:2000',
            'selection_notes' => 'nullable|string|max:2000',
            'offer_amount' => 'nullable|numeric|min:0',
            'offer_sent_at' => 'nullable|date',
            'offer_accepted_at' => 'nullable|date',
            'documents_received' => 'nullable|array',
            'onboarding_notes' => 'nullable|string|max:2000',
            'onboarding_completed_at' => 'nullable|date',
        ]);

        $candidate->update($validated);

        return back()->with('success', 'Pipeline details saved.');
    }

    public function destroyCandidate(Candidate $candidate)
    {
        foreach ([
            $candidate->resume_path,
            $candidate->national_id_path,
            $candidate->academic_certificates_path,
            $candidate->passport_photo_path,
            $candidate->signature_path,
        ] as $path) {
            if ($path) {
                Storage::disk('public')->delete($path);
            }
        }

        $candidate->delete();

        return back()->with('success', 'Candidate deleted.');
    }

    public function hireCandidate(Request $request, Candidate $candidate)
    {
        $validated = $request->validate([
            'role' => 'required|string|exists:roles,name',
            'employee_number' => 'required|string|max:50|unique:employee_profiles',
            'department' => 'nullable|string|max:100',
            'position' => 'nullable|string|max:100',
            'employment_type' => 'required|in:full_time,part_time,contract,intern',
            'hire_date' => 'required|date',
            'basic_salary' => 'nullable|numeric|min:0',
            'probation_months' => 'nullable|integer|min:0|max:12',
            'password' => 'required|string|min:8',
        ]);

        if (User::where('email', $candidate->email)->exists()) {
            return back()->withErrors(['error' => 'A user with this email already exists.']);
        }

        if ($candidate->phone && User::where('phone', $candidate->phone)->exists()) {
            return back()->withErrors(['error' => 'A user with this phone number already exists.']);
        }

        $user = User::create([
            'name' => $candidate->name,
            'email' => $candidate->email,
            'phone' => $candidate->phone,
            'password' => Hash::make($validated['password']),
        ]);
        $user->assignRole($validated['role']);

        $probationMonths = $validated['probation_months'] ?? 3;
        $hireDate = Carbon::parse($validated['hire_date']);
        $probationEndDate = $probationMonths > 0 ? $hireDate->copy()->addMonths($probationMonths) : null;

        EmployeeProfile::create([
            'user_id' => $user->id,
            'employee_number' => $validated['employee_number'],
            'department' => $validated['department'] ?? $candidate->jobOpening?->department ?? $candidate->applied_category,
            'position' => $validated['position'] ?? $candidate->jobOpening?->title,
            'employment_type' => $validated['employment_type'],
            'hire_date' => $validated['hire_date'],
            'probation_end_date' => $probationEndDate,
            'basic_salary' => $validated['basic_salary'] ?? null,
            'status' => $probationEndDate ? 'probation' : 'active',
        ]);

        EmployeeContract::create([
            'user_id' => $user->id,
            'candidate_id' => $candidate->id,
            'contract_type' => $probationEndDate ? 'probation' : 'permanent',
            'start_date' => $validated['hire_date'],
            'end_date' => $probationEndDate,
            'salary' => $validated['basic_salary'] ?? null,
            'status' => 'active',
            'created_by' => Auth::id(),
        ]);

        $candidate->update(['stage' => 'hired']);

        return back()->with('success', $candidate->name.' has been hired and added to Employee Records.');
    }

    public function scheduleInterview(Request $request, Candidate $candidate)
    {
        $validated = $request->validate([
            'scheduled_at' => 'required|date',
            'mode' => 'required|in:in_person,phone,video',
            'location_or_link' => 'nullable|string|max:255',
            'interviewer_id' => 'nullable|exists:users,id',
        ]);

        Interview::create(array_merge($validated, [
            'candidate_id' => $candidate->id,
            'created_by' => Auth::id(),
        ]));

        if ($candidate->stage === 'applied' || $candidate->stage === 'screening') {
            $candidate->update(['stage' => 'interview']);
        }

        return back()->with('success', 'Interview scheduled.');
    }

    public function updateInterview(Request $request, Interview $interview)
    {
        $validated = $request->validate([
            'status' => 'required|in:scheduled,completed,cancelled,no_show',
            'feedback' => 'nullable|string|max:1000',
            'rating' => 'nullable|integer|min:1|max:5',
        ]);

        $interview->update($validated);

        return back()->with('success', 'Interview updated.');
    }
}
