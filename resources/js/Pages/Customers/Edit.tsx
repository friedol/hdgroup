import { Head, Link, router } from '@inertiajs/react';
import {
  AlertCircle,
  Trash2,
  ArrowLeft,
  Save,
  User,
  CreditCard,
  MapPin,
  Settings,
  ShieldCheck,
  Power,
  History as HistoryIcon
} from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';

interface Customer {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  credit_limit: number;
  is_active: boolean;
}

interface EditCustomerProps {
  customer: Customer;
  errors?: Record<string, string>;
}

export default function EditCustomer({ customer, errors = {} }: EditCustomerProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: customer.customer_name,
    customer_email: customer.customer_email || '',
    customer_phone: customer.customer_phone || '',
    customer_address: customer.customer_address || '',
    credit_limit: customer.credit_limit.toString(),
    is_active: customer.is_active,
    password: '',
  });

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'CRM', href: '#' },
    { title: 'Customers', href: '/customers' },
    { title: 'Update profile', href: '#' }
  ];

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    router.put(`/customers/${customer.id}`, formData as any, {
      onFinish: () => setLoading(false)
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to permanently delete this customer account? This cannot be undone.')) {
      setDeleting(true);
      router.delete(`/customers/${customer.id}`, {
        onFinish: () => setDeleting(false)
      });
    }
  };

  return (
    <>
      <Head title={`Modify ${customer.customer_name}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1400px] mx-auto space-y-6 pb-10 px-6">

          {/* Action Header */}
          <div className="flex items-center justify-between pt-4">
             <Link
              href={`/customers/${customer.id}`}
              className="group flex items-center text-slate-500 hover:text-slate-900 transition-colors"
            >
              <div className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center mr-3 group-hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span className="text-[14px] font-semibold tracking-tight">Discard and profile view</span>
            </Link>

            <Button
                variant="destructive"
                size="sm"
                className="h-10 px-6 active:scale-95 transition-all shadow-md text-[13px] font-bold tracking-widest text-white flex items-center justify-center"
                onClick={handleDelete}
                disabled={deleting || loading}
            >
                <Trash2 className="h-4 w-4 mr-2" />
                Terminate account
            </Button>
          </div>

          <div className="flex flex-col gap-1">
              <h1 className="text-[18px] font-bold text-slate-900 leading-none">Security center</h1>
              <p className="text-[14px] text-slate-500 font-medium mt-1">Updating profile artifact: <span className="text-blue-600 font-bold">HD-{customer.id}</span></p>
          </div>

          {/* Error Alert */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border-r-4 border-r-red-500 rounded-lg p-4 flex gap-4 shadow-sm border border-red-100">
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                  <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-900 text-[14px]">Profile identification failure</h3>
                <ul className="text-[14px] text-red-800 mt-1 space-y-0.5 font-medium">
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field}>• {message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Account Operational Status */}
            <Card className="border-none shadow-sm bg-white overflow-hidden relative border-l-4 border-l-green-500">
                <CardContent className="p-4 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100`}>
                            <Power className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-[14px] font-bold text-slate-900 leading-none tracking-tight">Account operational status</h3>
                            <p className="text-[14px] text-slate-400 font-medium mt-1 uppercase">Determine if this client can place new orders</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`text-[12px] font-bold tracking-widest ${formData.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                            {formData.is_active ? 'Operational' : 'Restricted'}
                        </span>
                        <Switch
                            checked={formData.is_active}
                            onCheckedChange={(val) => handleChange('is_active', val)}
                            disabled={loading}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Identity Artifacts */}
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
                                        placeholder="Full legal name"
                                        value={formData.customer_name}
                                        onChange={(e) => handleChange('customer_name', e.target.value)}
                                        disabled={loading}
                                        className="h-10 text-[14px] bg-white border-slate-200 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-[14px] font-bold opacity-80 ml-1">Billing email *</Label>
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
                                    <Input
                                        id="phone"
                                        placeholder="+255 XXX XXX XXX"
                                        value={formData.customer_phone}
                                        onChange={(e) => handleChange('customer_phone', e.target.value)}
                                        disabled={loading}
                                        className="h-10 text-[14px] bg-white border-slate-200 focus:ring-1 focus:ring-blue-500"
                                    />
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
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Financial Parameters */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden h-full relative">
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
                                <p className="text-[12px] text-slate-400 leading-relaxed font-medium">Verify the risk profile before increasing the credit capacity.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[14px] font-bold opacity-80 ml-1">Reset portal password</Label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter new password"
                                        className="pl-10 h-10 text-[14px] bg-white border-slate-200 focus:ring-1 focus:ring-blue-500"
                                        value={formData.password}
                                        onChange={(e) => handleChange("password", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                                <p className="text-[12px] text-slate-400 leading-relaxed font-medium">Leave blank to keep the current password.</p>
                            </div>

                            <div className="pt-4 border-t border-slate-50 flex items-center gap-3 text-slate-400">
                                <ShieldCheck className="h-4 w-4" />
                                <span className="text-[12px] font-bold tracking-widest leading-none">Secured artifact</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Final Action Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-400">
                    <HistoryIcon className="h-4 w-4" />
                    <span className="text-[12px] font-bold tracking-wider">Changes audited to system logs</span>
                </div>
                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-10 px-6 font-bold text-[12px] text-slate-400 hover:text-slate-900"
                        onClick={() => router.visit(`/customers/${customer.id}`)}
                        disabled={loading}
                    >
                        Abandon
                    </Button>
                    <Button
                        type="submit"
                        className="h-10 px-10 bg-blue-600 hover:bg-blue-700 shadow-lg active:scale-95 transition-all text-[13px] font-bold tracking-widest"
                        disabled={loading}
                    >
                        {loading ? 'Committing...' : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save changes
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
