import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { Globe, ImageIcon, Upload, Save, ShoppingBag } from "lucide-react";
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
  const [onlineShopEnabled, setOnlineShopEnabled] = useState(
    getSettingValue('online_shop_enabled', '1') === '1'
  );
  const [togglingShop, setTogglingShop] = useState(false);

  const handleToggleOnlineShop = async (enabled: boolean) => {
    setTogglingShop(true);
    try {
      await axios.post('/settings/toggle-online-shop', { enabled });
      setOnlineShopEnabled(enabled);
      toast.success(`Online shop ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch {
      toast.error('Failed to update online shop status');
    } finally {
      setTogglingShop(false);
    }
  };

  const [generalForm, setGeneralForm] = useState({
    business_name: getSettingValue('business_name', 'Mizzonite Group Ltd'),
    business_email: getSettingValue('business_email', 'info@hdgroup.co.ke'),
    business_phone: getSettingValue('business_phone', '+254 700 000 000'),
    system_logo: null as any,
    system_favicon: null as any
  });

  const handleSaveGeneralSettings = () => {
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

    router.post('/settings/update', formData, {
      onSuccess: () => {
        toast.success('System settings updated successfully!');
      },
      onError: () => {
        toast.error('Failed to update settings');
      }
    });
  };

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Branding */}
      <div className="lg:col-span-4 space-y-6">
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-4 border-b border-slate-100 mb-6 px-6">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-4 w-4 text-blue-600" />
              <div>
                <CardTitle className="text-sm font-semibold">Branding</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 px-6 pb-6">
            {/* System Logo Upload */}
            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Logo</Label>
              <div className="border border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-4 bg-slate-50/50">
                <div className="h-20 w-20 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 overflow-hidden shadow-sm">
                  {generalForm.system_logo ? (
                    <img src={URL.createObjectURL(generalForm.system_logo)} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    getSettingValue('system_logo') ? (
                      <img src={`/storage/${getSettingValue('system_logo')}`} alt="Current Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <ImageIcon size={28} />
                    )
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-900 bg-white px-4 py-2 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm">
                      <Upload size={14} /> {getSettingValue('system_logo') ? 'Change' : 'Upload'} Logo
                    </div>
                    <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={e => setGeneralForm({...generalForm, system_logo: e.target.files?.[0] || null})} />
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 text-center font-medium">Recommended: PNG format, square or landscape</p>
              </div>
            </div>

            {/* System Favicon Upload */}
            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Favicon</Label>
              <div className="border border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-4 bg-slate-50/50">
                <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-300 overflow-hidden shadow-sm">
                  {generalForm.system_favicon ? (
                    <img src={URL.createObjectURL(generalForm.system_favicon)} alt="Favicon Preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    getSettingValue('system_favicon') ? (
                      <img src={`/storage/${getSettingValue('system_favicon')}`} alt="Current Favicon" className="w-full h-full object-contain p-2" />
                    ) : (
                      <ImageIcon size={18} />
                    )
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <label htmlFor="favicon-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-900 bg-white px-4 py-2 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm">
                      <Upload size={14} /> {getSettingValue('system_favicon') ? 'Change' : 'Upload'} Icon
                    </div>
                    <input id="favicon-upload" type="file" className="hidden" accept="image/*" onChange={e => setGeneralForm({...generalForm, system_favicon: e.target.files?.[0] || null})} />
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 text-center font-medium">Recommended: ICO or PNG, 32x32px</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Business Info */}
      <div className="lg:col-span-8">
        <Card className="border-slate-200 shadow-none h-full flex flex-col">
          <CardHeader className="pb-4 border-b border-slate-100 mb-6 px-6">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-blue-600" />
              <div>
                <CardTitle className="text-sm font-semibold">Business Information</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 px-6 pb-6 flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Name</Label>
                <Input 
                  value={generalForm.business_name}
                  onChange={(e) => setGeneralForm({...generalForm, business_name: e.target.value})}
                  className="h-11 text-sm bg-slate-50/30 focus:bg-white transition-all" 
                  placeholder="e.g. Mizzonite Group"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Email</Label>
                <Input 
                  value={generalForm.business_email}
                  onChange={(e) => setGeneralForm({...generalForm, business_email: e.target.value})}
                  className="h-11 text-sm bg-slate-50/30 focus:bg-white transition-all" 
                  placeholder="info@business.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Phone</Label>
                <Input 
                  value={generalForm.business_phone}
                  onChange={(e) => setGeneralForm({...generalForm, business_phone: e.target.value})}
                  className="h-11 text-sm bg-slate-50/30 focus:bg-white transition-all" 
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mt-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                This information is used across the system for document headers, email notifications, and storefront contact sections. Ensure the email and phone number are valid for customer support.
              </p>
            </div>
          </CardContent>
          <CardFooter className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px] px-6" onClick={handleSaveGeneralSettings}>
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>

    {/* Online Shop Toggle */}
    <Card className="border-slate-200 shadow-none mt-6">
      <CardHeader className="pb-4 border-b border-slate-100 mb-4 px-6">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-4 w-4 text-emerald-600" />
          <CardTitle className="text-sm font-semibold">Online Shop</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div>
            <p className="text-sm font-bold text-slate-800">Online Shop Status</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {onlineShopEnabled
                ? 'Your online shop is live and visible to customers.'
                : 'Your online shop is offline. Customers will see a maintenance page.'}
            </p>
          </div>
          <button
            type="button"
            disabled={togglingShop}
            onClick={() => handleToggleOnlineShop(!onlineShopEnabled)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
              onlineShopEnabled ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                onlineShopEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-3">
          When disabled, all public shop routes redirect to a "shop offline" page. Admin and POS remain fully accessible.
        </p>
      </CardContent>
    </Card>
    </>
  );
}
