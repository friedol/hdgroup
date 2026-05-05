<?php

namespace App\Http\Controllers;

use App\Models\PromoCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PromoCodeController extends Controller
{
    public function index()
    {
        $promoCodes = PromoCode::latest()->get();

        return Inertia::render('Admin/PromoCodes/Index', [
            'promoCodes' => $promoCodes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'nullable|string|max:40|unique:promo_codes,code',
            'discount_type' => 'required|in:percentage,fixed',
            'discount_value' => 'required|numeric|min:0.01',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
            'usage_limit_per_user' => 'nullable|integer|min:1',
            'usage_limit_global' => 'nullable|integer|min:1',
            'is_active' => 'nullable|boolean',
            'auto_generate' => 'nullable|boolean',
        ]);

        $validated['code'] = strtoupper($validated['code'] ?? '');
        if (($validated['auto_generate'] ?? false) || empty($validated['code'])) {
            $validated['code'] = $this->generateUniqueCode();
        }

        unset($validated['auto_generate']);

        PromoCode::create(array_merge($validated, [
            'created_by' => Auth::id(),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]));

        return back()->with('success', 'Promo code created successfully.');
    }

    public function update(Request $request, PromoCode $promoCode)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:40|unique:promo_codes,code,' . $promoCode->id,
            'discount_type' => 'required|in:percentage,fixed',
            'discount_value' => 'required|numeric|min:0.01',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
            'usage_limit_per_user' => 'nullable|integer|min:1',
            'usage_limit_global' => 'nullable|integer|min:1',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['code'] = strtoupper($validated['code']);
        $promoCode->update($validated);

        return back()->with('success', 'Promo code updated successfully.');
    }

    public function destroy(PromoCode $promoCode)
    {
        $promoCode->delete();

        return back()->with('success', 'Promo code deleted successfully.');
    }

    protected function generateUniqueCode(): string
    {
        do {
            $code = 'HD-' . Str::upper(Str::random(8));
        } while (PromoCode::where('code', $code)->exists());

        return $code;
    }
}
