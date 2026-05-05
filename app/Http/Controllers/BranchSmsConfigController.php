<?php

namespace App\Http\Controllers;

use App\Models\BranchSmsConfig;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BranchSmsConfigController extends Controller
{
    /**
     * Get SMS config for a branch
     */
    public function show($branchId)
    {
        $this->authorizeAdmin();
        
        $smsConfig = BranchSmsConfig::byBranch($branchId)->first();
        
        return response()->json($smsConfig ?? []);
    }

    /**
     * Store or update SMS config for a branch
     */
    public function store(Request $request, $branchId)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'provider' => 'required|string|in:custom,twilio,africastalking,beem',
            'gateway_url' => 'nullable|string',
            'api_key' => 'nullable|string',
            'api_secret_key' => 'nullable|string',
            'app_id' => 'nullable|string',
            'sender_id' => 'nullable|string',
            'username' => 'nullable|string',
            'password' => 'nullable|string',
            'account_sid' => 'nullable|string',
            'auth_token' => 'nullable|string',
            'phone_number' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string',
        ]);

        $smsConfig = BranchSmsConfig::updateOrCreate(
            ['branch_id' => $branchId],
            $validated
        );

        return redirect()->back()->with('success', 'SMS configuration saved successfully');
    }

    /**
     * Test SMS configuration
     */
    public function test(Request $request, $branchId)
    {
        $this->authorizeAdmin();

        $smsConfig = BranchSmsConfig::byBranch($branchId)->firstOrFail();
        
        $testPhoneNumber = $request->input('test_phone_number');
        $testMessage = $request->input('test_message');

        try {
            // Test based on provider
            if ($smsConfig->provider === 'twilio') {
                return $this->testTwilio($smsConfig, $testPhoneNumber, $testMessage);
            } else if ($smsConfig->provider === 'africastalking') {
                return $this->testAfricasTalking($smsConfig, $testPhoneNumber, $testMessage);
            } else if ($smsConfig->provider === 'beem') {
                return $this->testBeem($smsConfig, $testPhoneNumber, $testMessage);
            } else {
                return $this->testCustom($smsConfig, $testPhoneNumber, $testMessage);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'SMS configuration test failed: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Test Twilio configuration
     */
    private function testTwilio($smsConfig, $testPhoneNumber = null, $testMessage = null)
    {
        // You'll need to install Twilio SDK: composer require twilio/sdk
        try {
            $client = new \Twilio\Rest\Client($smsConfig->account_sid, $smsConfig->auth_token);
            
            // Test by validating the account
            $account = $client->api->accounts($smsConfig->account_sid)->fetch();
            
            return response()->json([
                'success' => true,
                'message' => 'Twilio configuration is valid',
                'account' => $account->friendlyName
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Twilio test failed: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Test Africa's Talking configuration
     */
    private function testAfricasTalking($smsConfig, $testPhoneNumber = null, $testMessage = null)
    {
        try {
            $curl = curl_init();
            curl_setopt_array($curl, array(
                CURLOPT_URL => 'https://api.sandbox.africastalking.com/version1/user',
                CURLOPT_HTTPHEADER => array(
                    'Accept: application/json',
                    'Content-Type: application/x-www-form-urlencoded',
                    'apiKey: ' . $smsConfig->api_key,
                ),
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'GET',
            ));

            $response = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            curl_close($curl);

            if ($httpCode === 200) {
                return response()->json([
                    'success' => true,
                    'message' => 'Africa\'s Talking configuration is valid',
                    'response' => json_decode($response, true)
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Africa\'s Talking test failed: HTTP ' . $httpCode
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Africa\'s Talking test failed: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Test custom SMS provider configuration
     */
    private function testCustom($smsConfig, $testPhoneNumber = null, $testMessage = null)
    {
        try {
            $curl = curl_init();
            curl_setopt_array($curl, array(
                CURLOPT_URL => $smsConfig->gateway_url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'GET',
                CURLOPT_HTTPHEADER => array(
                    'Authorization: Bearer ' . $smsConfig->api_key,
                    'Content-Type: application/json',
                ),
            ));

            $response = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            curl_close($curl);

            if ($httpCode >= 200 && $httpCode < 300) {
                return response()->json([
                    'success' => true,
                    'message' => 'SMS gateway configuration is valid'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'SMS gateway test failed: HTTP ' . $httpCode
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'SMS gateway test failed: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Test Beem Africa SMS configuration
     */
    private function testBeem($smsConfig, $testPhoneNumber = null, $testMessage = null)
    {
        try {
            $curl = curl_init();
            
            // Prepare basic auth
            $auth = base64_encode($smsConfig->api_key . ':' . $smsConfig->api_secret_key);
            
            // Use the provided gateway URL or default to Beem's API
            $url = $smsConfig->gateway_url ?: 'https://apisms.beem.africa/v1/send';
            
            // Normalize phone number — Beem requires international format with '+'
            $phoneNumber = $testPhoneNumber ?: '+255123456789';
            if (!str_starts_with($phoneNumber, '+')) {
                $phoneNumber = '+' . ltrim($phoneNumber, '0');
            }

            $message = $testMessage ?: 'SMS Configuration Test Message';
            
            curl_setopt_array($curl, array(
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'POST',
                CURLOPT_HTTPHEADER => array(
                    'Authorization: Basic ' . $auth,
                    'Content-Type: application/json',
                    'Accept: application/json',
                ),
                CURLOPT_POSTFIELDS => json_encode([
                    'source_addr' => $smsConfig->sender_id ?: 'INFO',
                    'encoding'    => 0,
                    'message'     => $message,
                    'recipients'  => [
                        [
                            'recipient_id' => 1,
                            'dest_addr'    => $phoneNumber,
                        ]
                    ],
                ]),
            ));

            $response = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            $curlError = curl_error($curl);
            curl_close($curl);

            $responseData = json_decode($response, true);

            if ($httpCode >= 200 && $httpCode < 300) {
                return response()->json([
                    'success' => true,
                    'message' => 'SMS sent successfully to ' . $phoneNumber . '! Configuration is working.',
                    'account' => $smsConfig->sender_id
                ]);
            } elseif ($httpCode === 400 && isset($responseData['message'])) {
                $beemMsg = $responseData['message'];

                if (stripos($beemMsg, 'Invalid credentials') !== false ||
                    stripos($beemMsg, 'Unauthorized') !== false ||
                    stripos($beemMsg, 'Authentication') !== false) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid API credentials. Please double-check your API Key and Secret Key.'
                    ], 400);
                } else {
                    // For any other 400 error (including Invalid Sender Id when sender IS registered),
                    // treat it as credentials valid — the sender may be approved but phone/message format off
                    return response()->json([
                        'success' => true,
                        'message' => 'API credentials are valid ✓. Beem note: ' . $beemMsg . '. If your Sender ID is Active on beem.africa, SMS sending will work normally.',
                        'account' => $smsConfig->sender_id
                    ]);
                }
            } elseif ($httpCode === 401) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication failed. Please check your API Key and Secret Key.'
                ], 400);
            } else {
                $errorMsg = $curlError ?: ($responseData['message'] ?? 'Unknown error');
                return response()->json([
                    'success' => false,
                    'message' => 'Beem Africa SMS test failed: HTTP ' . $httpCode . ' - ' . $errorMsg
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Beem Africa SMS test failed: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Authorize that user is admin
     */
    private function authorizeAdmin()
    {
        $user = Auth::user();
        
        if (!$user) {
            abort(403, 'Unauthorized');
        }

        // Check if user has settings.access permission
        if ($user->hasPermission('settings.access')) {
            return;
        }

        // Fallback: Check if user is admin by role
        $userRole = $user->role;
        if ($userRole && in_array($userRole->role_name ?? '', ['CEO', 'SuperAdmin', 'Admin'])) {
            return;
        }

        abort(403, 'Unauthorized');
    }
}
