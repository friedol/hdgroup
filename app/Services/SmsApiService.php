<?php

namespace App\Services;

use App\Models\BranchSmsConfig;
use Illuminate\Support\Facades\Log;

class SmsApiService
{
    protected ?BranchSmsConfig $config = null;

    public function __construct(?int $branchId = null)
    {
        $id = $branchId ?? active_branch_id() ?? session('active_branch_id');
        if ($id) {
            $this->config = BranchSmsConfig::where('branch_id', $id)
                ->where('is_active', true)
                ->where('provider', 'beem')
                ->first();
        }

        // Fallback: pick the first active Beem config across all branches
        if (!$this->config) {
            $this->config = BranchSmsConfig::where('is_active', true)
                ->where('provider', 'beem')
                ->first();
        }
    }

    /**
     * Send an SMS message via Beem Africa.
     */
    public function sendSMS(string $to, string $message): array
    {
        if (!$this->config) {
            return ['success' => false, 'message' => 'No active SMS configuration found.'];
        }

        if (empty($this->config->api_key) || empty($this->config->api_secret_key)) {
            return ['success' => false, 'message' => 'SMS API credentials are not configured.'];
        }

        $phone = self::formatPhoneNumber($to);

        // Basic validation
        if (strlen($phone) < 10) {
            Log::warning('SMS skipped: Invalid phone number format', ['to' => $to, 'formatted' => $phone]);
            return ['success' => false, 'message' => 'Invalid phone number format.'];
        }

        $url   = $this->config->gateway_url ?: 'https://apisms.beem.africa/v1/send';
        $auth  = base64_encode($this->config->api_key . ':' . $this->config->api_secret_key);

        // Strip non-ASCII characters to avoid Beem rejection
        $plainMessage = preg_replace('/[^\x20-\x7E\r\n]/', '', $message);

        $payload = [
            'source_addr' => $this->config->sender_id ?: 'INFO',
            'encoding'    => 0, // Always use GSM for maximum compatibility
            'message'     => $plainMessage,
            'recipients'  => [
                ['recipient_id' => 1, 'dest_addr' => $phone]
            ],
        ];

        try {
            $curl = curl_init();
            curl_setopt_array($curl, [
                CURLOPT_URL            => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 30,
                CURLOPT_CUSTOMREQUEST  => 'POST',
                CURLOPT_HTTPHEADER     => [
                    'Authorization: Basic ' . $auth,
                    'Content-Type: application/json',
                    'Accept: application/json',
                ],
                CURLOPT_POSTFIELDS => json_encode($payload),
            ]);

            $response  = curl_exec($curl);
            $httpCode  = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            $curlError = curl_error($curl);
            curl_close($curl);

            $responseData = json_decode($response, true);

            if ($httpCode >= 200 && $httpCode < 300) {
                Log::info('SMS sent successfully', ['to' => $phone, 'status' => $httpCode]);
                return ['success' => true, 'message' => 'SMS sent successfully.', 'data' => $responseData];
            }

            $errMsg = $responseData['message'] ?? $curlError ?? 'Unknown error';
            Log::warning('SMS send failed', [
                'to' => $phone, 
                'http' => $httpCode, 
                'error' => $errMsg,
                'payload' => $payload
            ]);
            return ['success' => false, 'message' => 'SMS failed: ' . $errMsg];

        } catch (\Exception $e) {
            Log::error('SMS exception', ['error' => $e->getMessage()]);
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Format phone number to international format (+255XXXXXXXXX).
     */
    public static function formatPhoneNumber(string $phone): string
    {
        // Strip spaces, dashes, parentheses
        $phone = preg_replace('/[\s\-\(\)]/', '', $phone);

        // Remove leading +
        $stripped = ltrim($phone, '+');

        // Fix doubled country code: +255255XXXXXXXXX or 255255XXXXXXXXX → +255XXXXXXXXX
        if (str_starts_with($stripped, '255255')) {
            return '+255' . substr($stripped, 6); // remove first '255'
        }

        // Already has country code with +
        if (str_starts_with($phone, '+255')) {
            return $phone;
        }

        // Has country code without +
        if (str_starts_with($phone, '255') && strlen($phone) >= 12) {
            return '+' . $phone;
        }

        // Local format starting with 0
        if (str_starts_with($phone, '0')) {
            return '+255' . substr($phone, 1);
        }

        return '+' . $phone;
    }

    /**
     * Build a short, beautiful POS order confirmation SMS.
     */
    public static function buildOrderConfirmationSms(
        string $customerName,
        string $invoiceNumber,
        array  $items,
        float  $total,
        string $paymentMethod
    ): string {
        $firstName = explode(' ', trim($customerName))[0];

        // Build short product summary (max 3 items shown)
        $lines = [];
        $count = 0;
        foreach ($items as $item) {
            if ($count >= 3) {
                $lines[] = '... and more';
                break;
            }
            $qty  = $item['qty'] ?? 1;
            $name = $item['name'] ?? 'Item';
            $lines[] = "- {$qty}x {$name}";
            $count++;
        }
        $productSummary = implode("\n", $lines);

        $formattedTotal = number_format($total, 0, '.', ',');

        return "Hi {$firstName},\n"
            . "Your order has been confirmed!\n\n"
            . "Order: #{$invoiceNumber}\n"
            . $productSummary . "\n\n"
            . "Total: TZS {$formattedTotal}\n"
            . "Payment: {$paymentMethod}\n\n"
            . "Thank you for shopping with us!";
    }

    /**
     * Build a short delivery notification SMS.
     */
    public static function buildDeliverySms(
        string $customerName,
        string $invoiceNumber,
        float  $total
    ): string {
        $firstName      = explode(' ', trim($customerName))[0];
        $formattedTotal = number_format($total, 0, '.', ',');

        return "Hi {$firstName},\n"
            . "Great news! Your order has been delivered.\n\n"
            . "Order: #{$invoiceNumber}\n"
            . "Amount: TZS {$formattedTotal}\n\n"
            . "We hope you love your purchase!\n"
            . "Thank you for choosing us.";
    }
}
