import React, { useState } from "react";
import { Phone, Save, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";

interface ContactSettingsProps {
  getSettingValue: (key: string, defaultVal?: string) => string;
}

export default function ContactSettings({ getSettingValue }: ContactSettingsProps) {
  // Parse support phone numbers from JSON
  const parsedPhones = (): string[] => {
    try {
      const raw = getSettingValue('support_phone_numbers', '[]');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [''];
    } catch {
      return [''];
    }
  };

  const [form, setForm] = useState({
    business_whatsapp: getSettingValue('business_whatsapp', ''),
    business_address: getSettingValue('business_address', ''),
    business_map_url: getSettingValue('business_map_url', ''),
  });

  const [phones, setPhones] = useState<string[]>(parsedPhones());

  const addPhone = () => setPhones([...phones, '']);
  const removePhone = (i: number) => setPhones(phones.filter((_, idx) => idx !== i));
  const updatePhone = (i: number, val: string) => {
    const updated = [...phones];
    updated[i] = val;
    setPhones(updated);
  };

  const handleSave = async () => {
    try {
      const filtered = phones.filter(p => p.trim() !== '');
      await axios.post('/settings/update', {
        ...form,
        support_phone_numbers: JSON.stringify(filtered),
      });
      toast.success('Contact settings updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update contact settings');
    }
  };

  return (
    <Card className="border-slate-200 shadow-none">
      <CardHeader className="pb-4 border-b border-slate-100 mb-6 px-6">
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 text-blue-600" />
          <div>
            <CardTitle className="text-sm font-semibold">Contact &amp; Communication</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">These values power the public contact page and order confirmation WhatsApp link.</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 px-6 pb-6">
        {/* WhatsApp */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">WhatsApp Number</Label>
          <Input
            value={form.business_whatsapp}
            onChange={e => setForm({ ...form, business_whatsapp: e.target.value })}
            placeholder="+254712345678"
            className="h-10 text-sm"
          />
          <p className="text-[10px] text-slate-400">Used for "Chat on WhatsApp" links after an order. Include country code, no spaces.</p>
        </div>

        {/* Support Phone Numbers */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Support Phone Numbers</Label>
          {phones.map((phone, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={phone}
                onChange={e => updatePhone(i, e.target.value)}
                placeholder="+254 700 000 000"
                className="h-10 text-sm flex-1"
              />
              {phones.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removePhone(i)} className="h-10 w-10 text-red-500 hover:text-red-700">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addPhone} className="text-[10px] font-bold uppercase">
            <Plus className="h-3 w-3 mr-1" /> Add Number
          </Button>
          <p className="text-[10px] text-slate-400">All numbers displayed on the Contact page.</p>
        </div>

        {/* Business Address */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Address</Label>
          <Input
            value={form.business_address}
            onChange={e => setForm({ ...form, business_address: e.target.value })}
            placeholder="123 Main Street, Nairobi, Kenya"
            className="h-10 text-sm"
          />
        </div>

        {/* Google Maps URL */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Google Maps URL</Label>
          <Input
            value={form.business_map_url}
            onChange={e => setForm({ ...form, business_map_url: e.target.value })}
            placeholder="https://maps.google.com/?q=..."
            className="h-10 text-sm"
          />
          <p className="text-[10px] text-slate-400">Paste the full Google Maps share link for the "Get Directions" button on the Contact page.</p>
        </div>
      </CardContent>

      <CardFooter className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px]" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" /> Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}
