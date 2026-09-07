<?php

namespace App\Http\Controllers;

use App\Models\Candidate;
use App\Models\JobOpening;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CareersController extends Controller
{
    public const JOB_CATEGORIES = [
        'Administration',
        'Human Resources',
        'Finance',
        'Procurement',
        'Sales & Marketing',
        'Engineering',
        'Welding',
        'Fabrication',
        'Drivers',
        'Machine Operators',
        'Electricians',
        'Store Keepers',
        'Project Managers',
        'ICT',
        'Cleaners',
        'Security',
        'Internships',
        'Other',
    ];

    public function index()
    {
        $jobOpenings = JobOpening::where('status', 'open')
            ->where(function ($q) {
                $q->whereNull('closing_date')->orWhere('closing_date', '>=', now()->toDateString());
            })
            ->orderByDesc('created_at')
            ->get(['id', 'title', 'slug', 'image_path', 'department', 'description', 'requirements', 'employment_type', 'location', 'salary_range_min', 'salary_range_max', 'closing_date', 'created_at']);

        return Inertia::render('Careers/Index', [
            'job_openings' => $jobOpenings,
        ]);
    }

    public function applyPage(Request $request)
    {
        $jobOpening = null;
        if ($request->filled('job')) {
            $jobOpening = JobOpening::where('slug', $request->query('job'))
                ->where('status', 'open')
                ->first(['id', 'title', 'slug', 'image_path', 'department', 'description', 'requirements']);
        }

        return Inertia::render('Careers/Apply', [
            'categories' => self::JOB_CATEGORIES,
            'job_opening' => $jobOpening,
        ]);
    }

    public function generalApply(Request $request)
    {
        $validated = $request->validate([
            'job_opening_id' => 'nullable|exists:job_openings,id',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'address_line1' => 'nullable|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female',

            'applied_category' => 'required_without:job_opening_id|nullable|string|max:100',
            'years_experience' => 'nullable|integer|min:0|max:80',
            'expected_salary' => 'nullable|string|max:100',
            'available_from' => 'nullable|date',

            'education_level' => 'nullable|string|max:100',
            'school_name' => 'nullable|string|max:255',
            'course' => 'nullable|string|max:255',
            'graduation_year' => 'nullable|integer|min:1950|max:2100',

            'skills' => 'nullable|array',

            'prev_employer' => 'nullable|string|max:255',
            'prev_position' => 'nullable|string|max:255',
            'employment_start_date' => 'nullable|date',
            'employment_end_date' => 'nullable|date',
            'employment_responsibilities' => 'nullable|string|max:2000',

            'referee_first_name' => 'nullable|string|max:255',
            'referee_middle_name' => 'nullable|string|max:255',
            'referee_last_name' => 'nullable|string|max:255',
            'referee_relationship' => 'nullable|string|max:100',
            'referee_company' => 'nullable|string|max:255',
            'referee_phone' => 'nullable|string|max:20',
            'referee_email' => 'nullable|email|max:255',

            'resume' => 'nullable|file|mimes:pdf,doc,docx|max:5120',
            'national_id' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'academic_certificates' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'passport_photo' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
            'signature' => 'required|file|mimes:png,jpg,jpeg|max:2048',

            'can_ride_motorcycle' => 'required|boolean',
            'motorcycle_city_experience' => 'nullable|boolean',
            'willing_kigamboni' => 'required|boolean',
            'has_driving_license' => 'required|boolean',
            'willing_overtime' => 'required|boolean',
            'worked_fabrication_before' => 'required|boolean',

            'agreement' => 'required|accepted',
        ]);

        $resumePath = $request->hasFile('resume')
            ? $request->file('resume')->store('hr/resumes', 'public')
            : null;
        $nationalIdPath = $request->hasFile('national_id')
            ? $request->file('national_id')->store('hr/national-ids', 'public')
            : null;
        $academicCertificatesPath = $request->hasFile('academic_certificates')
            ? $request->file('academic_certificates')->store('hr/certificates', 'public')
            : null;
        $passportPhotoPath = $request->hasFile('passport_photo')
            ? $request->file('passport_photo')->store('hr/passport-photos', 'public')
            : null;
        $signaturePath = $request->file('signature')->store('hr/signatures', 'public');

        Candidate::create([
            'job_opening_id' => $validated['job_opening_id'] ?? null,
            'applied_category' => $validated['applied_category'] ?? null,
            'name' => trim($validated['first_name'].' '.$validated['last_name']),
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'],
            'resume_path' => $resumePath,
            'source' => isset($validated['job_opening_id']) ? 'website' : 'website_general',
            'stage' => 'applied',
            'address_line1' => $validated['address_line1'] ?? null,
            'address_line2' => $validated['address_line2'] ?? null,
            'city' => $validated['city'] ?? null,
            'state' => $validated['state'] ?? null,
            'postal_code' => $validated['postal_code'] ?? null,
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'years_experience' => $validated['years_experience'] ?? null,
            'expected_salary' => $validated['expected_salary'] ?? null,
            'available_from' => $validated['available_from'] ?? null,
            'education_level' => $validated['education_level'] ?? null,
            'school_name' => $validated['school_name'] ?? null,
            'course' => $validated['course'] ?? null,
            'graduation_year' => $validated['graduation_year'] ?? null,
            'skills' => $validated['skills'] ?? null,
            'prev_employer' => $validated['prev_employer'] ?? null,
            'prev_position' => $validated['prev_position'] ?? null,
            'employment_start_date' => $validated['employment_start_date'] ?? null,
            'employment_end_date' => $validated['employment_end_date'] ?? null,
            'employment_responsibilities' => $validated['employment_responsibilities'] ?? null,
            'referee_first_name' => $validated['referee_first_name'] ?? null,
            'referee_middle_name' => $validated['referee_middle_name'] ?? null,
            'referee_last_name' => $validated['referee_last_name'] ?? null,
            'referee_relationship' => $validated['referee_relationship'] ?? null,
            'referee_company' => $validated['referee_company'] ?? null,
            'referee_phone' => $validated['referee_phone'] ?? null,
            'referee_email' => $validated['referee_email'] ?? null,
            'national_id_path' => $nationalIdPath,
            'academic_certificates_path' => $academicCertificatesPath,
            'passport_photo_path' => $passportPhotoPath,
            'signature_path' => $signaturePath,
            'can_ride_motorcycle' => $validated['can_ride_motorcycle'],
            'motorcycle_city_experience' => $validated['motorcycle_city_experience'] ?? null,
            'willing_kigamboni' => $validated['willing_kigamboni'],
            'has_driving_license' => $validated['has_driving_license'],
            'willing_overtime' => $validated['willing_overtime'],
            'worked_fabrication_before' => $validated['worked_fabrication_before'],
            'agreement' => true,
        ]);

        return back()->with('success', 'Your application has been submitted successfully. We will be in touch if you are shortlisted.');
    }
}
