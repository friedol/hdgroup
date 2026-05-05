import React, { useState } from "react";
import { Globe, ImageIcon, Upload, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";

interface GeneralSettingsProps {
  settings: any;
  getSettingValue: (key: string, defaultVal?: string) => string;
}

export default function GeneralSettings({ settings, getSettingValue }: GeneralSettingsProps) {
  const [generalForm, setGeneralForm] = useState({
    business_name: getSettingValue('business_name', 'HD Group Ltd'),
    business_email: getSettingValue('business_email', 'info@hdgroup.co.ke'),
    business_phone: getSettingValue('business_phone', '+254 700 000 000'),
    system_logo: null as any,
    system_favicon: null as any
  });

  const handleSaveGeneralSettings = async () => {
    try {
      const formData = new FormData();
      formData.append('business_name', generalForm.business_name);
      formData.append('business_email', generalForm.business_email);
      formData.append('business_phone', generalForm.business_phone);
      
      if (generalForm.system_logo) {
        formData.append('system_logo', generalForm.system_logo);
      }
      if (generalForm.system_favicon) {
        formData.append('system_favicon', generalForm.system_favicon);
      }

      await axios.post('/settings/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('System settings updated successfully!');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    }
  };

  return (
    <Card className="border-slate-200 shadow-none">
      <CardHeader className="pb-4 border-b border-slate-100 mb-6 px-6">
        <div className="flex items-center gap-3">
          <Globe className="h-4 w-4 text-blue-600" />
          <div>
            <CardTitle className="text-sm font-semibold">General Settings</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Name</Label>
            <Input 
              value={generalForm.business_name}
              onChange={(e) => setGeneralForm({...generalForm, business_name: e.target.value})}
              className="h-10 text-sm" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Email</Label>
            <Input 
              value={generalForm.business_email}
              onChange={(e) => setGeneralForm({...generalForm, business_email: e.target.value})}
              className="h-10 text-sm" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Phone</Label>
            <Input 
              value={generalForm.business_phone}
              onChange={(e) => setGeneralForm({...generalForm, business_phone: e.target.value})}
              className="h-10 text-sm" 
            />
          </div>
        </div>

        {/* System Logo Upload */}
        <div className="space-y-2 pt-4 border-t border-slate-100">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Logo</Label>
          <div className="border border-dashed border-slate-200 rounded p-6 flex flex-col items-center justify-center gap-4 bg-slate-50/30">
            <div className="h-16 w-16 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-300 overflow-hidden shadow-sm">
              {generalForm.system_logo ? (
                <img src={URL.createObjectURL(generalForm.system_logo)} alt="Logo Preview" className="w-full h-full object-contain p-2" />
              ) : (
                getSettingValue('system_logo') ? (
                  <img src={`/storage/${getSettingValue('system_logo')}`} alt="Current Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon size={24} />
                )
              )}
            </div>
            <div className="flex flex-col items-center">
              <label htmlFor="logo-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-blue-600 bg-white px-4 py-2 rounded border border-blue-200 hover:bg-blue-50 transition-colors">
                  <Upload size={14} /> Upload Logo
                </div>
                <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={e => setGeneralForm({...generalForm, system_logo: e.target.files?.[0] || null})} />
              </label>
            </div>
            <p className="text-[10px] text-slate-400 text-center">Recommended: PNG format, 200x200px or larger</p>
          </div>
        </div>

        {/* System Favicon Upload */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Favicon</Label>
          <div className="border border-dashed border-slate-200 rounded p-6 flex flex-col items-center justify-center gap-4 bg-slate-50/30">
            <div className="h-12 w-12 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-300 overflow-hidden shadow-sm">
              {generalForm.system_favicon ? (
                <img src={URL.createObjectURL(generalForm.system_favicon)} alt="Favicon Preview" className="w-full h-full object-contain p-1" />
              ) : (
                getSettingValue('system_favicon') ? (
                  <img src={`/storage/${getSettingValue('system_favicon')}`} alt="Current Favicon" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon size={18} />
                )
              )}
            </div>
            <div className="flex flex-col items-center">
              <label htmlFor="favicon-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-blue-600 bg-white px-4 py-2 rounded border border-blue-200 hover:bg-blue-50 transition-colors">
                  <Upload size={14} /> Upload Favicon
                </div>
                <input id="favicon-upload" type="file" className="hidden" accept="image/*" onChange={e => setGeneralForm({...generalForm, system_favicon: e.target.files?.[0] || null})} />
              </label>
            </div>
            <p className="text-[10px] text-slate-400 text-center">Recommended: ICO or PNG format, 32x32px</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px]" onClick={handleSaveGeneralSettings}>
          <Save className="h-4 w-4 mr-2" /> Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}
