import React, { useState } from "react";
import { Mail, ShieldCheck, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";

interface EmailSettingsProps {
  getSettingValue: (key: string, defaultVal?: string) => string;
}

export default function EmailSettings({ getSettingValue }: EmailSettingsProps) {
  const [emailForm, setEmailForm] = useState({
    mail_mailer: getSettingValue('mail_mailer', 'smtp'),
    mail_host: getSettingValue('mail_host', 'smtp.hostinger.com'),
    mail_port: getSettingValue('mail_port', '465'),
    mail_username: getSettingValue('mail_username', 'info@chibobrand.com'),
    mail_password: getSettingValue('mail_password', ''),
    mail_encryption: getSettingValue('mail_encryption', 'ssl'),
    mail_from_address: getSettingValue('mail_from_address', 'info@chibobrand.com'),
    mail_from_name: getSettingValue('mail_from_name', 'Jopo Juniours Co. Ltd Ltd'),
    test_recipient: "",
  });

  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const handleSaveEmailSettings = async () => {
    try {
      await axios.post('/settings/update', emailForm);
      toast.success('Mail identity and SMTP relay configuration synchronized!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'SMTP migration failure');
    }
  };

  const handleTestEmailConnection = async () => {
    if (!emailForm.test_recipient) {
      toast.error("Institutional test recipient required");
      return;
    }
    
    setIsTestingEmail(true);
    try {
      const response = await axios.post('/settings/test-email', {
        ...emailForm,
        test_search: emailForm.test_recipient
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'SMTP connection timeout or authentication failure');
    } finally {
      setIsTestingEmail(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-none">
      <CardHeader className="pb-4 border-b border-slate-100 mb-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-blue-600" />
            <div>
              <CardTitle className="text-sm font-semibold">Email Configuration</CardTitle>
              <CardDescription className="text-xs">Configure SMTP settings for system notifications</CardDescription>
            </div>
          </div>
          <Badge className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-bold uppercase py-1 px-3">SMTP Mode</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Server Details Section */}
          <div className="space-y-6">
            <div className="border border-slate-100 rounded-xl p-6 bg-slate-50/10">
              <p className="text-[10px] font-black uppercase text-blue-600 mb-6 tracking-widest">Server Connection</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Mail Driver / Mailer</Label>
                  <Select 
                    value={emailForm.mail_mailer}
                    onValueChange={(val) => setEmailForm({...emailForm, mail_mailer: (val as any)})}
                  >
                    <SelectTrigger className="h-10 text-sm bg-white">
                      <SelectValue placeholder="Select Driver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smtp">SMTP (Recommended)</SelectItem>
                      <SelectItem value="sendmail">Sendmail</SelectItem>
                      <SelectItem value="mailgun">Mailgun API</SelectItem>
                      <SelectItem value="ses">AWS SES</SelectItem>
                      <SelectItem value="postmark">Postmark</SelectItem>
                      <SelectItem value="log">Log (Debug only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">SMTP Host</Label>
                  <Input 
                    value={emailForm.mail_host}
                    onChange={(e) => setEmailForm({...emailForm, mail_host: e.target.value})}
                    placeholder="e.g. smtp.hostinger.com" 
                    className="h-10 text-sm bg-white shadow-sm" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">SMTP Port</Label>
                    <Input 
                      value={emailForm.mail_port}
                      onChange={(e) => setEmailForm({...emailForm, mail_port: e.target.value})}
                      placeholder="465 or 587" 
                      className="h-10 text-sm bg-white shadow-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Encryption</Label>
                    <Select 
                      value={emailForm.mail_encryption}
                      onValueChange={(val) => setEmailForm({...emailForm, mail_encryption: val})}
                    >
                      <SelectTrigger className="h-10 text-sm bg-white shadow-sm">
                        <SelectValue placeholder="Select Encryption" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ssl">SSL (Port 465)</SelectItem>
                        <SelectItem value="tls">TLS (Port 587)</SelectItem>
                        <SelectItem value="none">None / Open</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Authentication & Identity Section */}
          <div className="space-y-6">
            <div className="border border-slate-100 rounded-xl p-6 bg-slate-50/10 h-full">
              <p className="text-[10px] font-black uppercase text-amber-600 mb-6 tracking-widest">Authentication & Identity</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">SMTP Username</Label>
                  <Input 
                    value={emailForm.mail_username}
                    onChange={(e) => setEmailForm({...emailForm, mail_username: e.target.value})}
                    placeholder="info@chibobrand.com" 
                    className="h-10 text-sm bg-white shadow-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">SMTP Password</Label>
                  <Input 
                    type="password"
                    value={emailForm.mail_password}
                    onChange={(e) => setEmailForm({...emailForm, mail_password: e.target.value})}
                    placeholder="Enter SMTP Password" 
                    className="h-10 text-sm bg-white shadow-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Sender Address (From)</Label>
                  <Input 
                    value={emailForm.mail_from_address}
                    onChange={(e) => setEmailForm({...emailForm, mail_from_address: e.target.value})}
                    placeholder="noreply@hdgroup.co.ke" 
                    className="h-10 text-sm bg-white shadow-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Sender Name</Label>
                  <Input 
                    value={emailForm.mail_from_name}
                    onChange={(e) => setEmailForm({...emailForm, mail_from_name: e.target.value})}
                    placeholder="Jopo Juniours Co. Ltd notifications" 
                    className="h-10 text-sm bg-white shadow-sm" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 mt-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">System Connectivity Test</p>
                <p className="text-[10px] text-slate-500">Send a test email to verify your credentials are working</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Input 
                value={emailForm.test_recipient}
                onChange={(e) => setEmailForm({...emailForm, test_recipient: e.target.value})}
                placeholder="recipient@example.com"
                className="h-10 text-sm bg-white"
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="shrink-0 h-10 px-6 font-bold uppercase text-[10px]"
                onClick={handleTestEmailConnection}
                disabled={isTestingEmail}
              >
                {isTestingEmail ? (
                  <>
                    <span className="w-4 h-4 mr-2 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>Test Connection</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
        <Button 
          size="sm" 
          className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px] h-10 px-8 shadow-lg shadow-blue-500/20"
          onClick={handleSaveEmailSettings}
        >
          <Save className="h-4 w-4 mr-2" /> Save Configuration
        </Button>
      </CardFooter>
    </Card>
  );
}
