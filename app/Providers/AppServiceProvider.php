<?php

namespace App\Providers;

use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Setting;
use App\Models\Transfer;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        Relation::morphMap([
            'finished_product' => Product::class,
            'Sale' => Sale::class,
            'Transfer' => Transfer::class,
            'adjustment' => InventoryTransaction::class,
        ]);

        $this->loadMailSettings();
    }

    /**
     * Load mail settings from database and apply to config.
     */
    protected function loadMailSettings(): void
    {
        try {
            if (! Schema::hasTable('settings')) {
                return;
            }

            $mailSettings = Setting::where('group', 'email')->pluck('value', 'key');

            if ($mailSettings->isEmpty()) {
                return;
            }

            $mailer = $mailSettings->get('mail_mailer') ?: 'smtp';

            config([
                'mail.default' => $mailer,
                'mail.mailers.smtp.host' => $mailSettings->get('mail_host'),
                'mail.mailers.smtp.port' => (int) $mailSettings->get('mail_port'),
                'mail.mailers.smtp.encryption' => $mailSettings->get('mail_encryption'),
                'mail.mailers.smtp.username' => $mailSettings->get('mail_username'),
                'mail.mailers.smtp.password' => $mailSettings->get('mail_password'),
                'mail.from.address' => $mailSettings->get('mail_from_address'),
                'mail.from.name' => $mailSettings->get('mail_from_name'),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to load mail settings: '.$e->getMessage());
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
