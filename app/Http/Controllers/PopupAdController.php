<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\HeroSlide;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PopupAdController extends Controller
{
    public function index()
    {
        $ads = HeroSlide::withoutGlobalScope('branch')
            ->where('is_ad', true)
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Admin/PopupAds/Index', compact('ads'));
    }

    public function create()
    {
        $branches = Branch::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('Admin/PopupAds/Create', compact('branches'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string'],
            'page_type' => ['nullable', 'string', 'max:50'],
            'sort_order' => ['nullable', 'integer'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'button_link' => ['nullable', 'string', 'max:255'],
            'image' => ['required', 'file', 'image', 'max:4096'],
        ]);

        $validated['title'] = $this->resolveTitle($validated['title'] ?? null, 'Popup Ad');

        $imagePath = $request->file('image')->store('popup-ads', 'public');

        // null means global (all branches); only fall back to current branch when key was absent
        $branchId = array_key_exists('branch_id', $validated) ? $validated['branch_id'] : $this->currentBranchId();

        HeroSlide::withoutGlobalScopes()->create([
            'branch_id' => $branchId,
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'] ?? null,
            'page_type' => $validated['page_type'] ?? 'home',
            'sort_order' => $validated['sort_order'] ?? 0,
            'button_text' => $validated['button_text'] ?? null,
            'button_link' => $validated['button_link'] ?? null,
            'image_path' => $imagePath,
            'is_active' => $request->boolean('is_active', true),
            'is_ad' => true,
        ]);

        return redirect()->route('admin.popup-ads.index')
            ->with('message_flash', 'Popup ad created successfully.');
    }

    public function show(HeroSlide $ad)
    {
        $this->authorizeBranch($ad);
        $ad->load('branch');

        return Inertia::render('Admin/PopupAds/Show', compact('ad'));
    }

    public function edit(HeroSlide $ad)
    {
        $this->authorizeBranch($ad);
        $branches = Branch::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('Admin/PopupAds/Edit', compact('ad', 'branches'));
    }

    public function update(Request $request, HeroSlide $ad)
    {
        $this->authorizeBranch($ad);

        $validated = $request->validate([
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string'],
            'page_type' => ['nullable', 'string', 'max:50'],
            'sort_order' => ['nullable', 'integer'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'button_link' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'file', 'image', 'max:4096'],
        ]);

        $validated['title'] = $this->resolveTitle($validated['title'] ?? null, $ad->title ?: 'Popup Ad');

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('popup-ads', 'public');
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['is_ad'] = true;
        if (! isset($validated['page_type'])) {
            $validated['page_type'] = $ad->page_type ?? 'home';
        }

        // Allow explicit null so an ad can be switched to global (all branches)
        if (array_key_exists('branch_id', $validated)) {
            $validated['branch_id'] = $validated['branch_id'] ?: null;
        }

        $ad->update($validated);

        return redirect()->route('admin.popup-ads.index')
            ->with('message_flash', 'Popup ad updated successfully.');
    }

    public function destroy(Request $request, $ad)
    {
        $ad = HeroSlide::withoutGlobalScopes()->findOrFail($ad);
        $this->authorizeBranch($ad);
        $ad->delete();

        if ($request->expectsJson()) {
            return response()->json(['message' => 'Popup ad deleted successfully.']);
        }

        return redirect()->route('admin.popup-ads.index')
            ->with('message_flash', 'Popup ad deleted successfully.');
    }

    public function updateSortOrder(Request $request)
    {
        $validated = $request->validate([
            'ads' => ['required', 'array'],
            'ads.*' => ['integer', 'exists:hero_slides,id'],
        ]);

        foreach ($validated['ads'] as $index => $adId) {
            HeroSlide::withoutGlobalScopes()->find($adId)?->update(['sort_order' => $index]);
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

    protected function authorizeBranch(HeroSlide $ad): void
    {
        $currentBranchId = $this->currentBranchId();
        if ($ad->branch_id && $currentBranchId && $ad->branch_id !== $currentBranchId) {
            abort(403);
        }
    }

    protected function resolveTitle(?string $title, string $fallback): string
    {
        $title = trim((string) $title);

        return $title !== '' ? $title : $fallback;
    }
}
