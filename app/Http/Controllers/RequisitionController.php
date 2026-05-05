<?php

namespace App\Http\Controllers;

use App\Models\Requisition;
use Illuminate\Http\Request;

class RequisitionController extends Controller
{
    public function index(Request $request)
    {
        $requisitions = Requisition::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return \Inertia\Inertia::render('Admin/Requisitions/Index', compact('requisitions'));
    }

    public function create()
    {
        $issueTypes = [
            'it_support' => 'IT Support',
            'inventory' => 'Inventory / Stock',
            'finance' => 'Finance / Payments',
            'hr' => 'HR / Staff',
            'maintenance' => 'Maintenance',
            'customer' => 'Customer Issue',
            'other' => 'Other',
        ];

        $priorities = [
            'low' => 'Low',
            'normal' => 'Normal',
            'high' => 'High',
            'urgent' => 'Urgent',
        ];

        return \Inertia\Inertia::render('Admin/Requisitions/Create', compact('issueTypes', 'priorities'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'issue_type' => ['required', 'string', 'max:50'],
            'subject' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string', 'max:5000'],
            'priority' => ['required', 'string', 'max:20'],
            'attachment' => ['nullable', 'file', 'max:4096'],
        ]);

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('requisitions', 'public');
        }

        $requisition = Requisition::create([
            'user_id' => $request->user()->id,
            'issue_type' => $validated['issue_type'],
            'subject' => $validated['subject'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'status' => 'open',
            'attachment_path' => $attachmentPath,
        ]);

        return redirect()
            ->route('requisitions.show', $requisition)
            ->with('success', 'Requisition submitted successfully.');
    }

    public function show(Request $request, Requisition $requisition)
    {
        abort_unless($requisition->user_id === $request->user()->id, 403);

        return \Inertia\Inertia::render('Admin/Requisitions/Show', compact('requisition'));
    }
}

