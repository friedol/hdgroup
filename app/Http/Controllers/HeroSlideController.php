<?php

namespace App\Http\Controllers;

use App\Models\HeroSlide;
use App\Models\Branch;
use Illuminate\Http\Request;

class HeroSlideController extends Controller
{
    public function index()
    {
        $slides = HeroSlide::where('is_ad', false)
            ->orderBy('page_type')
            ->orderBy('sort_order')
            ->get();

        return \Inertia\Inertia::render('Admin/HeroSlides/Index', compact('slides'));
    }

    public function create()
    {
        $branches = Branch::where('is_active', true)->orderBy('name')->get();

        return \Inertia\Inertia::render('Admin/HeroSlides/Create', compact('branches'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string'],
            'page_type' => ['required', 'string', 'max:50'],
            'sort_order' => ['nullable', 'integer'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'button_link' => ['nullable', 'string', 'max:255'],
            'image' => ['required', 'file', 'image', 'max:4096'],
        ]);

        $validated['title'] = $this->resolveTitle($validated['title'] ?? null, 'Hero Slide');

        $imagePath = $request->file('image')->store('hero-slides', 'public');

        $branchId = $validated['branch_id'] ?? $this->currentBranchId();

        HeroSlide::create([
            'branch_id' => $branchId,
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'] ?? null,
            'page_type' => $validated['page_type'],
            'sort_order' => $validated['sort_order'] ?? 0,
            'button_text' => $validated['button_text'] ?? null,
            'button_link' => $validated['button_link'] ?? null,
            'image_path' => $imagePath,
            'is_active' => $request->boolean('is_active', true),
            'is_ad' => false,
        ]);

        return redirect()->route('admin.hero-slides.index')
            ->with('message_flash', 'Hero slide created successfully.');
    }

    public function show(HeroSlide $heroSlide)
    {
        $this->authorizeBranch($heroSlide);
        $heroSlide->load('branch');

        return \Inertia\Inertia::render('Admin/HeroSlides/Show', compact('heroSlide'));
    }

    public function edit(HeroSlide $heroSlide)
    {
        $this->authorizeBranch($heroSlide);
        $branches = Branch::where('is_active', true)->orderBy('name')->get();

        return \Inertia\Inertia::render('Admin/HeroSlides/Edit', compact('heroSlide', 'branches'));
    }

    public function update(Request $request, HeroSlide $heroSlide)
    {
        $this->authorizeBranch($heroSlide);

        $validated = $request->validate([
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string'],
            'page_type' => ['required', 'string', 'max:50'],
            'sort_order' => ['nullable', 'integer'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'button_link' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'file', 'image', 'max:4096'],
        ]);

        $validated['title'] = $this->resolveTitle($validated['title'] ?? null, $heroSlide->title ?: 'Hero Slide');

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('hero-slides', 'public');
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['is_ad'] = false;

        if (isset($validated['branch_id'])) {
            $validated['branch_id'] = $validated['branch_id'] ?: $this->currentBranchId();
        }

        $heroSlide->update($validated);

        return redirect()->route('admin.hero-slides.index')
            ->with('message_flash', 'Hero slide updated successfully.');
    }

    public function destroy(Request $request, $heroSlide)
    {
        $heroSlide = HeroSlide::withoutGlobalScopes()->findOrFail($heroSlide);
        $this->authorizeBranch($heroSlide);
        $heroSlide->delete();

        if ($request->expectsJson()) {
            return response()->json(['message' => 'Hero slide deleted successfully.']);
        }

        return redirect()->route('admin.hero-slides.index')
            ->with('message_flash', 'Hero slide deleted successfully.');
    }

    public function updateSortOrder(Request $request)
    {
        $validated = $request->validate([
            'slides' => ['required', 'array'],
            'slides.*' => ['integer', 'exists:hero_slides,id'],
        ]);

        foreach ($validated['slides'] as $index => $slideId) {
            HeroSlide::find($slideId)->update(['sort_order' => $index]);
        }

        return response()->json(['success' => true, 'message' => 'Sort order updated']);
    }

    protected function currentBranchId(): ?int
    {
        $user = auth()->user();
        if ($user && $user->branch_id) {
            return $user->branch_id;
        }

        return session('active_branch_id');
    }

    protected function authorizeBranch(HeroSlide $heroSlide): void
    {
        $currentBranchId = $this->currentBranchId();
        if ($heroSlide->branch_id && $currentBranchId && $heroSlide->branch_id !== $currentBranchId) {
            abort(403);
        }
    }

    protected function resolveTitle(?string $title, string $fallback): string
    {
        $title = trim((string) $title);

        return $title !== '' ? $title : $fallback;
    }
}

