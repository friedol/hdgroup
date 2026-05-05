import { Head, Link, router } from '@inertiajs/react';
import { 
  AlertCircle, 
  ArrowLeft, 
  Save, 
  User, 
  CreditCard, 
  MapPin, 
  ShieldPlus,
  Rocket,
  ShieldCheck,
} from 'lucide-react';
import React, { useState } from 'react';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

interface CreateCustomerProps {
  errors?: Record<string, string>;
  salespeople?: Array<{ id: number; staff_name: string }>;
}

const DEFAULT_COUNTRY_ISO = 'TZ';
const DEFAULT_COUNTRY_CODE = '255';
type CountryOption = { iso2: string; dialCode: string; name: string };
const IntlAny = Intl as any;
const regionNames =
  typeof Intl !== 'undefined' && IntlAny.DisplayNames
    ? new IntlAny.DisplayNames(['en'], { type: 'region' })
    : null;

const COUNTRY_CODE_OPTIONS = getCountries()
  .map((iso2) => {
    try {
      return {
        iso2,
        dialCode: getCountryCallingCode(iso2),
        name: regionNames?.of(iso2) || iso2,
      };
    } catch {
      return null;
    }
  })
  .filter(Boolean) as CountryOption[];

COUNTRY_CODE_OPTIONS.sort((a, b) => {
  if (a.iso2 === DEFAULT_COUNTRY_ISO) return -1;
  if (b.iso2 === DEFAULT_COUNTRY_ISO) return 1;
  return a.name.localeCompare(b.name);
});

function isoToFlag(iso2: string): string {
  return iso2.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export default function CreateCustomer({ errors = {}, salespeople = [] }: CreateCustomerProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    country_code: DEFAULT_COUNTRY_CODE,
    phone_local: '',
    whatsapp_no: '',
    whatsapp_country_code: DEFAULT_COUNTRY_CODE,
    whatsapp_local: '',
    company_name: '',
    business_address: '',
    brought_by: '',
    is_walking_customer: false,
    customer_address: '',
    credit_limit: '0',
    contact_person: '',
    password: '',
  });

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'CRM', href: '#' },
    { title: 'Customers', href: '/customers' },
    { title: 'Onboard new profile', href: '#' }
  ];

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.phone_local.trim()) {
      return;
    }

    const customerPhone = `+${formData.country_code}${formData.phone_local.replace(/^0+/, '')}`;
    const whatsAppPhone = formData.whatsapp_local.trim()
      ? `+${formData.whatsapp_country_code}${formData.whatsapp_local.replace(/^0+/, '')}`
      : '';

    setLoading(true);

    router.post('/customers', {
      ...formData,
      customer_name: formData.is_walking_customer ? 'Walking Customer' : formData.customer_name,
      customer_phone: customerPhone,
      whatsapp_no: whatsAppPhone || null,
    } as any, {
      onFinish: () => setLoading(false)
    });
  };

  return (
    <>
      <Head title="Onboard new customer" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1400px] mx-auto space-y-6 pb-10 px-6">
          
          {/* Action Header */}
          <div className="flex items-center gap-4 pt-4">
             <Link 
              href="/customers"
              className="group flex items-center text-slate-500 hover:text-slate-900 transition-colors"
            >
              <div className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center mr-3 group-hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span className="text-[14px] font-semibold tracking-tight">Back</span>
            </Link>

          <div className="flex flex-col gap-1 min-w-0">
              <h1 className="text-[18px] font-bold text-slate-900 leading-none">Create Customer</h1>

          </div>
          </div>


          {/* Error Alert Overlay */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border-r-4 border-r-red-500 rounded-lg p-4 flex gap-4 shadow-sm border border-red-100">
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                  <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-900 text-[14px]">Onboarding validation failure</h3>
                <ul className="text-[14px] text-red-800 mt-1 space-y-0.5 font-medium">
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field}>• {message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Identification Layer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 p-4 flex flex-row items-center gap-3">
                        <div className="h-8 w-8 rounded bg-white flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                            <User className="h-4 w-4" />
                        </div>
                        <div>
                            <CardTitle className="text-[14px] font-bold text-slate-900">Core identification</CardTitle>
                            <CardDescription className="text-[12px] font-medium text-slate-400">Primary legal and contact data</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="name" className="text-[14px] font-bold opacity-80 ml-1">Company / customer full name *</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter complete legal name"
                                    value={formData.customer_name}
                                    onChange={(e) => handleChange('customer_name', e.target.value)}
                                    disabled={loading}
                                    className="h-10 text-[14px] bg-white border-slate-200 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-[14px] font-bold opacity-80 ml-1">Billing email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="finance@customer.com"
                                    value={formData.customer_email}
                                    onChange={(e) => handleChange('customer_email', e.target.value)}
                                    disabled={loading}
                                    className="h-10 text-[14px] bg-white border-slate-200 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-[14px] font-bold opacity-80 ml-1">Primary phone *</Label>
                              <div className="h-10 rounded-md border border-slate-200 bg-white flex items-stretch overflow-hidden focus-within:ring-1 focus-within:ring-blue-500">
                                <select
                                  value={formData.country_code}
                                  onChange={(e) => handleChange('country_code', e.target.value)}
                                  disabled={loading}
                                  className="h-full min-w-[92px] bg-transparent px-2 text-xs font-bold text-slate-700 border-r border-slate-200 focus:outline-none"
                                >
                                  {COUNTRY_CODE_OPTIONS.map((opt) => (
                                    <option key={opt.iso2} value={opt.dialCode}>
                                      {isoToFlag(opt.iso2)} +{opt.dialCode}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  value={formData.phone_local}
                                  onChange={(e) => handleChange('phone_local', e.target.value.replace(/\D/g, '').replace(/^0+/, ''))}
                                  placeholder="784419707"
                                  disabled={loading}
                                  className="w-full px-3 text-[14px] outline-none"
                                />
                              </div>
                              <p className="text-[11px] text-slate-400">No leading 0. Example: +{formData.country_code} 784419707</p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="whatsapp" className="text-[14px] font-bold opacity-80 ml-1">WhatsApp (optional)</Label>
                              <div className="h-10 rounded-md border border-slate-200 bg-white flex items-stretch overflow-hidden focus-within:ring-1 focus-within:ring-blue-500">
                                <select
                                  value={formData.whatsapp_country_code}
                                  onChange={(e) => handleChange('whatsapp_country_code', e.target.value)}
                                  disabled={loading}
                                  className="h-full min-w-[92px] bg-transparent px-2 text-xs font-bold text-slate-700 border-r border-slate-200 focus:outline-none"
                                >
                                  {COUNTRY_CODE_OPTIONS.map((opt) => (
                                    <option key={opt.iso2} value={opt.dialCode}>
                                      {isoToFlag(opt.iso2)} +{opt.dialCode}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  value={formData.whatsapp_local}
                                  onChange={(e) => handleChange('whatsapp_local', e.target.value.replace(/\D/g, '').replace(/^0+/, ''))}
                                  placeholder="WhatsApp number"
                                  disabled={loading}
                                  className="w-full px-3 text-[14px] outline-none"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="company_name" className="text-[14px] font-bold opacity-80 ml-1">Company name (optional)</Label>
                              <Input
                                id="company_name"
                                placeholder="Business / company name"
                                value={formData.company_name}
                                onChange={(e) => handleChange('company_name', e.target.value)}
                                disabled={loading}
                                className="h-10 text-[14px] bg-white border-slate-200 focus:ring-1 focus:ring-blue-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="brought_by" className="text-[14px] font-bold opacity-80 ml-1">Brought by (salesperson)</Label>
                              <select
                                id="brought_by"
                                value={formData.brought_by}
                                onChange={(e) => handleChange('brought_by', e.target.value)}
                                disabled={loading}
                                className="h-10 w-full px-3 text-[14px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">— Select salesperson —</option>
                                {salespeople.map((s) => (
                                  <option key={s.id} value={s.id}>{s.staff_name}</option>
                                ))}
                              </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-[14px] font-bold opacity-80 ml-1">Physical distribution address</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                                <Textarea
                                    id="address"
                                    className="min-h-[100px] pl-10 text-[14px] bg-white border-slate-200 focus:ring-1 focus:ring-blue-500"
                                    placeholder="Branch location or HQ details..."
                                    value={formData.customer_address}
                                    onChange={(e) => handleChange('customer_address', e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                          <div className="space-y-2">
                            <Label htmlFor="business_address" className="text-[14px] font-bold opacity-80 ml-1">Business address (optional)</Label>
                            <Textarea
                              id="business_address"
                              className="min-h-[90px] text-[14px] bg-white border-slate-200 focus:ring-1 focus:ring-blue-500"
                              placeholder="Street, city, area..."
                              value={formData.business_address}
                              onChange={(e) => handleChange('business_address', e.target.value)}
                              disabled={loading}
                            />
                          </div>

                          <label className="flex items-center gap-3 p-3 rounded-md border border-slate-200 bg-slate-50">
                            <input
                              type="checkbox"
                              checked={formData.is_walking_customer}
                              onChange={(e) => handleChange('is_walking_customer', e.target.checked)}
                              disabled={loading}
                            />
                            <span className="text-[13px] font-semibold text-slate-700">Mark as walking customer</span>
                          </label>
                    </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Fiscal Parameters Card */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden h-full">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-4 flex flex-row items-center gap-3">
                            <div className="h-8 w-8 rounded bg-white flex items-center justify-center text-amber-600 shadow-sm border border-slate-100">
                                <CreditCard className="h-4 w-4" />
                            </div>
                            <div>
                                <CardTitle className="text-[14px] font-bold text-slate-900">Risk guardrails</CardTitle>
                                <CardDescription className="text-[12px] font-medium text-slate-400">Credit exposure settings</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-3">
                                <Label htmlFor="credit_limit" className="text-[14px] font-bold opacity-80 ml-1">Credit limit (TZS)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">#</span>
                                    <Input
                                        id="credit_limit"
                                        type="number"
                                        step="1"
                                        value={formData.credit_limit}
                                        onChange={(e) => handleChange('credit_limit', e.target.value)}
                                        disabled={loading}
                                        className="h-12 pl-8 font-mono text-[16px] font-black text-slate-900 border-2 border-slate-100"
                                    />
                                </div>
                                <p className="text-[12px] text-slate-400 leading-relaxed font-medium">Set the maximum permissible outstanding balance for this profile.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[14px] font-bold opacity-80 ml-1">Initial portal password</Label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Create customer password"
                                        className="pl-10 h-10 text-[14px] bg-white border-slate-200 focus:ring-1 focus:ring-blue-500"
                                        value={formData.password}
                                        onChange={(e) => handleChange('password', e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                                <p className="text-[12px] text-slate-400 leading-relaxed font-medium">Optional: customer can change this later.</p>
                            </div>

                            <div className="pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-2 text-slate-500 mb-2">
                                    <ShieldPlus className="h-4 w-4" />
                                    <span className="text-[12px] font-bold tracking-wider">Account security</span>
                                </div>
                                <p className="text-[12px] text-slate-400 font-medium">Profiles are initialized in 'Operational' status by default.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Final Execution Bar */}
            <div className="flex items-center justify-between gap-6 pt-6 border-t border-slate-100">
                <p className="text-[12px] font-bold text-slate-400 tracking-widest flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Ready for synchronization
                </p>
                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-10 px-6 font-bold text-[12px] text-slate-400 hover:text-slate-900"
                        onClick={() => router.visit('/customers')}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="h-10 px-8 bg-blue-600 hover:bg-blue-700 shadow-md active:scale-95 transition-all text-[13px] font-bold tracking-widest"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (
                            <>
                                <Rocket className="h-4 w-4 mr-2" />
                                Create profile
                            </>
                        )}
                    </Button>
                </div>
            </div>
          </form>
        </div>
      </AppLayout>
    </>
  );
}
