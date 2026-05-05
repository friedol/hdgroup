import { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Loader2, Zap, MessageSquare, Info } from "lucide-react";
import { toast } from "sonner";

interface BranchSmsConfigFormProps {
  branchId: number;
  branchName: string;
  onSuccess?: () => void;
}

interface SmsConfigData {
  provider: string;
  gateway_url: string;
  api_key: string;
  api_secret_key: string;
  app_id: string;
  sender_id: string;
  username: string;
  password: string;
  account_sid: string;
  auth_token: string;
  phone_number: string;
  is_active: boolean;
  description: string;
}

export default function BranchSmsConfigForm({ branchId, branchName, onSuccess }: BranchSmsConfigFormProps) {
  const [testing, setTesting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [testMessage, setTestMessage] = useState("");

  const { data, setData, post, processing, errors } = useForm<SmsConfigData>({
    provider: "custom",
    gateway_url: "",
    api_key: "",    api_secret_key: "",
    app_id: "",    sender_id: "",
    username: "",
    password: "",
    account_sid: "",
    auth_token: "",
    phone_number: "",
    is_active: true,
    description: "",
  });

  // Load existing config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch(`/settings/sms-config/${branchId}`, {
          headers: {
            'Accept': 'application/json',
          },
        });
        const config = await response.json();
        if (config && config.id) {
          setData(config);
        }
        setLoaded(true);
      } catch (err) {
        console.error("Failed to load SMS config:", err);
        setLoaded(true);
      }
    };
    loadConfig();
  }, [branchId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(`/settings/sms-config/${branchId}`, {
      onSuccess: () => {
        toast.success("SMS configuration saved successfully");
        onSuccess?.();
      },
      onError: (errors) => {
        toast.error("Failed to save SMS configuration");
        console.error(errors);
      },
    });
  };

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testPhoneNumber.trim()) {
      toast.error("Please enter a test phone number");
      return;
    }
    
    if (!testMessage.trim()) {
      toast.error("Please enter a test message");
      return;
    }
    
    setTesting(true);
    setTestResult(null);

    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
      
      const response = await fetch(`/settings/sms-config/${branchId}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
          "Accept": "application/json",
        },
        body: JSON.stringify({
          ...data,
          test_phone_number: testPhoneNumber,
          test_message: testMessage,
        }),
      });

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        toast.success("SMS configuration test passed!");
      } else {
        toast.error("SMS configuration test failed");
      }
    } catch (err) {
      toast.error("Error testing SMS configuration");
      setTestResult({ success: false, message: String(err) });
    } finally {
      setTesting(false);
    }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-150 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">SMS Configuration</CardTitle>
                <p className="text-sm text-slate-500 mt-0.5">Configure SMS gateway for {branchName}</p>
              </div>
            </div>
            <Badge variant={data.is_active ? "default" : "secondary"} className="bg-green-100 text-green-800 font-medium">
              {data.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Provider Selection Section */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="provider" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  SMS Provider
                </Label>
                <p className="text-xs text-slate-500 mt-1">Select your SMS service provider</p>
              </div>
              <Select value={data.provider} onValueChange={(val) => setData("provider", val)}>
                <SelectTrigger className="h-10 border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">
                    <span className="font-medium">Custom Gateway</span>
                  </SelectItem>
                  <SelectItem value="twilio">
                    <span className="font-medium">Twilio</span>
                  </SelectItem>
                  <SelectItem value="africastalking">
                    <span className="font-medium">Africa's Talking</span>
                  </SelectItem>
                  <SelectItem value="beem">
                    <span className="font-medium">Beem Africa SMS</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.provider && (
                <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {errors.provider}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-200" />

            {/* Custom Gateway Fields */}
            {data.provider === "custom" && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">Custom Gateway Settings</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gateway_url" className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    Gateway URL <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-slate-500">The endpoint URL for sending SMS</p>
                  <Input
                    id="gateway_url"
                    placeholder="https://api.smsprovider.com/send"
                    value={data.gateway_url}
                    onChange={(e) => setData("gateway_url", e.target.value)}
                    className="h-10 border-slate-300"
                  />
                  {errors.gateway_url && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.gateway_url}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="api_key" className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                      API Key / Token <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-slate-500">Your API credentials</p>
                    <Input
                      id="api_key"
                      type="password"
                      placeholder="••••••••••••••••"
                      value={data.api_key}
                      onChange={(e) => setData("api_key", e.target.value)}
                      className="h-10 border-slate-300"
                    />
                    {errors.api_key && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.api_key}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sender_id" className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                      Sender ID <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-slate-500">Name or number shown as sender</p>
                    <Input
                      id="sender_id"
                      placeholder="e.g., COMPANY_NAME"
                      value={data.sender_id}
                      onChange={(e) => setData("sender_id", e.target.value)}
                      className="h-10 border-slate-300"
                    />
                    {errors.sender_id && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.sender_id}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Username
                    </Label>
                    <p className="text-xs text-slate-500">If required by provider</p>
                    <Input
                      id="username"
                      placeholder="Optional username"
                      value={data.username}
                      onChange={(e) => setData("username", e.target.value)}
                      className="h-10 border-slate-300"
                    />
                    {errors.username && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.username}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Password
                    </Label>
                    <p className="text-xs text-slate-500">If required by provider</p>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••••••••••"
                      value={data.password}
                      onChange={(e) => setData("password", e.target.value)}
                      className="h-10 border-slate-300"
                    />
                    {errors.password && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.password}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Twilio Fields */}
            {data.provider === "twilio" && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">Twilio Account Settings</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="account_sid" className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                      Account SID <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-slate-500">Found in your Twilio dashboard</p>
                    <Input
                      id="account_sid"
                      placeholder="AC•••••••••••••••••••••••••"
                      value={data.account_sid}
                      onChange={(e) => setData("account_sid", e.target.value)}
                      className="h-10 border-slate-300"
                    />
                    {errors.account_sid && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.account_sid}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auth_token" className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                      Auth Token <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-slate-500">Secret authentication token</p>
                    <Input
                      id="auth_token"
                      type="password"
                      placeholder="••••••••••••••••"
                      value={data.auth_token}
                      onChange={(e) => setData("auth_token", e.target.value)}
                      className="h-10 border-slate-300"
                    />
                    {errors.auth_token && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.auth_token}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="phone_number" className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    Twilio Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-slate-500">The phone number to send SMS from</p>
                  <Input
                    id="phone_number"
                    placeholder="+1 (555) 000-0000"
                    value={data.phone_number}
                    onChange={(e) => setData("phone_number", e.target.value)}
                    className="h-10 border-slate-300"
                  />
                  {errors.phone_number && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.phone_number}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Africa's Talking Fields */}
            {data.provider === "africastalking" && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">Africa's Talking Settings</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                      Username <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-slate-500">Your Africa's Talking username</p>
                    <Input
                      id="username"
                      placeholder="Your account username"
                      value={data.username}
                      onChange={(e) => setData("username", e.target.value)}
                      className="h-10 border-slate-300"
                    />
                    {errors.username && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.username}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api_key" className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                      API Key <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-slate-500">Your account API key</p>
                    <Input
                      id="api_key"
                      type="password"
                      placeholder="••••••••••••••••"
                      value={data.api_key}
                      onChange={(e) => setData("api_key", e.target.value)}
                      className="h-10 border-slate-300"
                    />
                    {errors.api_key && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.api_key}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Beem Africa SMS Fields */}
            {data.provider === "beem" && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">Beem Africa SMS Settings</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gateway_url" className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    API URL <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-slate-500">Beem's SMS API endpoint</p>
                  <Input
                    id="gateway_url"
                    placeholder="https://apisms.beem.africa/v1/send"
                    value={data.gateway_url}
                    onChange={(e) => setData("gateway_url", e.target.value)}
                    className="h-10 border-slate-300"
                  />
                  {errors.gateway_url && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.gateway_url}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="api_key" className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                      API Key <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-slate-500">Your Beem API Key</p>
                    <Input
                      id="api_key"
                      placeholder="Your API key"
                      value={data.api_key}
                      onChange={(e) => setData("api_key", e.target.value)}
                      className="h-10 border-slate-300"
                    />
                    {errors.api_key && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.api_key}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api_secret_key" className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                      API Secret Key <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-slate-500">Your secret authentication key</p>
                    <Input
                      id="api_secret_key"
                      type="password"
                      placeholder="••••••••••••••••"
                      value={data.api_secret_key}
                      onChange={(e) => setData("api_secret_key", e.target.value)}
                      className="h-10 border-slate-300"
                    />
                    {errors.api_secret_key && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.api_secret_key}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="sender_id" className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    Sender ID <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-slate-500">Brand name displayed to recipients</p>
                  <Input
                    id="sender_id"
                    placeholder="e.g., HDPackaging"
                    value={data.sender_id}
                    onChange={(e) => setData("sender_id", e.target.value)}
                    className="h-10 border-slate-300"
                  />
                  {errors.sender_id && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.sender_id}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Common Description Field */}
            <div className="pt-4 border-t border-slate-200">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Description
                </Label>
                <p className="text-xs text-slate-500">Optional notes about this configuration</p>
                <Textarea
                  id="description"
                  placeholder="Notes about this SMS configuration, e.g., purpose, date configured, etc."
                  value={data.description}
                  onChange={(e) => setData("description", e.target.value)}
                  rows={3}
                  className="border-slate-300"
                />
              </div>
            </div>

            {/* Test SMS Configuration Section */}
            <div className="pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-4 w-4 text-orange-600" />
                <p className="text-sm font-medium text-orange-900">Test SMS Configuration</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="test_phone" className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    Test Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-slate-500">Phone number to receive test SMS</p>
                  <Input
                    id="test_phone"
                    placeholder="+255123456789"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    className="h-10 border-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test_message" className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    Test Message <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-slate-500">Message content for test SMS</p>
                  <Input
                    id="test_message"
                    placeholder="Test message from HD Group"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="h-10 border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`flex items-start gap-3 p-4 rounded-lg border ${
                testResult.success 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${
                    testResult.success ? 'text-emerald-900' : 'text-red-900'
                  }`}>
                    {testResult.message}
                  </p>
                  {testResult.account && (
                    <p className="text-xs text-slate-600 mt-1">Account: {testResult.account}</p>
                  )}
                </div>
              </div>
            )}
          </form>
        </CardContent>

        <CardFooter className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={testing || processing}
            className="font-semibold text-xs uppercase border-slate-300 hover:bg-slate-50"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Test Configuration
              </>
            )}
          </Button>

          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 font-semibold text-xs uppercase text-white"
            onClick={handleSubmit}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
