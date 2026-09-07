<?php

namespace App\Http\Middleware;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Try the staff/admin guard first, then the customer guard
        $staffUser = $request->user();           // 'web' guard (users table)
        $customerUser = $request->user('customers'); // 'customers' guard (customers table)

        $user = $staffUser ?: $customerUser;

        // Eager-load relationships only for staff users
        if ($user instanceof User) {
            $user->loadMissing(['role', 'branch']);
        }

        $isCustomer = $user instanceof Customer;
        $permissions = ($user instanceof User) ? $user->getAllPermissionSlugs() : [];

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), ['is_customer' => $isCustomer]) : null,
                'canSwitchBranch' => ($user instanceof User) ? $user->canSwitchBranch() : false,
                'permissions' => $permissions,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'message' => fn () => $request->session()->get('message'),
                'status' => fn () => $request->session()->get('status'),
            ],
            // Always expose branches for the public shop branch-switcher.
            'branches' => Branch::where('is_active', true)
                ->get(['id', 'name', 'slug', 'address as location', 'logo', 'system_name', 'is_active']),
            'activeBranchId' => function () use ($user) {
                $branchId = session('active_branch_id') ?: ($user ? $user->branch_id : null);
                if ($branchId) {
                    return $branchId;
                }
                // Global/CEO users with no session branch — default to first active branch
                if ($user instanceof User && $user->canSwitchBranch()) {
                    $first = Branch::where('is_active', true)->first();
                    if ($first) {
                        session(['active_branch_id' => $first->id]);

                        return $first->id;
                    }
                }

                return null;
            },
            'activeBranch' => function () use ($user) {
                $branchId = session('active_branch_id') ?: ($user ? $user->branch_id : null);
                // Global/CEO with no session branch — fall back to first active branch
                if (! $branchId && $user instanceof User && $user->canSwitchBranch()) {
                    $first = Branch::where('is_active', true)->first();
                    if ($first) {
                        session(['active_branch_id' => $first->id]);
                        $branchId = $first->id;
                    }
                }
                if ($branchId) {
                    return Branch::find($branchId);
                }

                return [
                    'id' => null,
                    'name' => Setting::getValue('business_name', 'Jopo Juniours Co. Ltd'),
                    'system_name' => Setting::getValue('business_name', 'Jopo Juniours Co. Ltd'),
                    'logo' => Setting::getValue('system_logo'),
                    'address' => Setting::getValue('business_address'),
                    'slug' => null,
                    'phone' => Setting::getValue('business_phone'),
                ];
            },
            'cartCount' => function () {
                $cart = session('cart', []);

                return is_array($cart) ? count($cart) : 0;
            },
            'systemLogo' => ($logo = Setting::getValue('system_logo')) ? ($logo && str_starts_with($logo, 'http') ? $logo : asset('storage/'.$logo)) : null,
            'businessName' => Setting::getValue('business_name', Setting::getValue('system_name', 'Jopo Juniours Co. Ltd')),
            'businessWhatsapp' => Setting::getValue('business_whatsapp', Setting::getValue('business_phone')),
            'businessPhone' => Setting::getValue('business_phone'),
            'businessEmail' => Setting::getValue('business_email', 'info@hdpackaging.co.tz'),
            'businessAddress' => Setting::getValue('business_address', 'Sinza Area, Block 45-A, Dar es Salaam'),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'onlineShopEnabled' => Setting::getValue('online_shop_enabled', '1') === '1',
            'categories' => function () {
                return Category::orderBy('category_name', 'asc')->get(['id', 'category_name']);
            },
        ];
    }
}
