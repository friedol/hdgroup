<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\HeroSlide;
use App\Models\Setting;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SystemSettingController extends Controller
{
    /**
     * Display the settings page with tabs.
     */
    public function index()
    {
        $settings = Setting::all()->groupBy('group');
        $branches = Branch::all()->map(function ($b) {
            return [
                'id' => $b->id,
                'name' => $b->name,
                'system_name' => $b->system_name,
                'email' => $b->email,
                'phone' => $b->phone,
                'logo' => $b->logo,
                'favicon' => $b->favicon,
                'address' => $b->address,
                'location' => $b->address ?? 'Unknown',
                'manager' => optional($b->manager)->staff_name ?? 'Not Assigned',
                'status' => $b->is_active ? 'Active' : 'Inactive',
                'users' => User::where('branch_id', $b->id)->count(),
            ];
        });

        $stores = Store::with('branches')->get()->map(function ($s) {
            return [
                'id' => $s->id,
                'name' => $s->store_name,
                'location' => $s->store_location,
                'branches' => $s->branches->pluck('id')->toArray(),
                'status' => 'Active',
            ];
        });
        $heroSlides = HeroSlide::orderBy('is_ad')->orderBy('sort_order')->get();

        return Inertia::render('SettingsPage', [
            'settings' => $settings,
            'initialBranches' => $branches,
            'initialStores' => $stores,
            'initialHeroSlides' => $heroSlides,
        ]);
    }

    /**
     * Update settings.
     */
    public function update(Request $request)
    {
        $tenantId = auth()->user()->tenant_id ?? null;

        foreach ($request->except('_token') as $key => $value) {
            // Handle file uploads
            if ($request->hasFile($key)) {
                $file = $request->file($key);
                $path = $file->store('settings', 'public');

                // Get old path to delete
                $oldPath = Setting::getValue($key, null, $tenantId);
                if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }

                $value = $path;
            }

            Setting::updateOrCreate(
                ['key' => $key, 'tenant_id' => $tenantId],
                ['value' => $value, 'type' => $this->guessType($key, $value), 'group' => $this->getGroup($key)]
            );

            // Clear cache for this setting
            Cache::forget('setting_'.($tenantId ?? 'global')."_$key");
        }

        return redirect()->back()->with('success', 'Settings updated successfully.');
    }

    /**
     * Guess the type of the setting.
     */
    protected function guessType($key, $value)
    {
        if (str_contains($key, 'logo') || str_contains($key, 'favicon') || str_contains($key, 'image')) {
            return 'image';
        }
        if (is_numeric($value)) {
            return 'number';
        }
        if (in_array($value, ['1', '0', 'true', 'false', true, false], true)) {
            return 'boolean';
        }
        if (str_contains($key, 'color')) {
            return 'color';
        }

        return 'text';
    }

    /**
     * Determine the group for the setting based on the key.
     */
    protected function getGroup($key)
    {
        if (str_contains($key, 'module_')) {
            return 'modules';
        }
        if (str_contains($key, 'business_whatsapp')) {
            return 'contact';
        }
        if (str_contains($key, 'business_') || str_contains($key, 'system_') || str_contains($key, 'color') || str_contains($key, 'font') || str_contains($key, 'branding_')) {
            return 'branding';
        }
        if (str_contains($key, 'tax_') || str_contains($key, 'currency_') || str_contains($key, 'bank_')) {
            return 'financial';
        }
        if (str_contains($key, 'stock_') || str_contains($key, 'inventory_') || str_contains($key, 'allow_negative')) {
            return 'inventory';
        }
        if (str_contains($key, 'sms_')) {
            return 'sms';
        }
        if (str_contains($key, 'mail_')) {
            return 'email';
        }
        if (str_contains($key, 'social_')) {
            return 'social';
        }
        if (str_contains($key, 'logistics_')) {
            return 'logistics';
        }
        if (str_contains($key, 'date_') || str_contains($key, 'timezone') || str_contains($key, 'language')) {
            return 'preferences';
        }

        return 'general';
    }

    /**
     * Test SMTP Connection.
     */
    public function testEmail(Request $request)
    {
        try {
            // Apply settings temporarily
            config([
                'mail.default' => $request->mail_mailer ?: 'smtp',
                'mail.mailers.smtp.host' => $request->mail_host,
                'mail.mailers.smtp.port' => (int) $request->mail_port,
                'mail.mailers.smtp.encryption' => $request->mail_encryption ?: null,
                'mail.mailers.smtp.username' => $request->mail_username,
                'mail.mailers.smtp.password' => $request->mail_password,
                'mail.from.address' => $request->mail_from_address ?: $request->mail_username,
                'mail.from.name' => $request->mail_from_name ?: config('app.name'),
            ]);

            Mail::raw('This is a test email to verify your Jopo Juniours Co. Ltd SMTP settings.', function ($message) use ($request) {
                $message->to($request->test_search ?? auth()->user()->email)
                    ->subject('System SMTP Connection Test');
            });

            return response()->json(['success' => true, 'message' => 'Test email sent successfully! Please check your inbox.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Connection failed: '.$e->getMessage()], 500);
        }
    }

    public function toggleOnlineShop(Request $request)
    {
        $enabled = $request->boolean('enabled');
        Setting::updateOrCreate(
            ['key' => 'online_shop_enabled'],
            ['value' => $enabled ? '1' : '0', 'group' => 'general', 'type' => 'boolean']
        );

        return response()->json(['success' => true, 'enabled' => $enabled]);
    }
}
