import { Head, Link, router } from '@inertiajs/react';
import {
  AlertCircle,
  Trash,
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
  company_name?: string;
  business_address?: string;
  brought_by?: number;
  credit_limit: number;
  branch_id?: number | null;
  is_active: boolean;
}

interface EditCustomerProps {
  customer: Customer;
  branches?: Array<{ id: number; name: string }>;
  errors?: Record<string, string>;
}

export default function EditCustomer({ customer, branches = [], errors = {} }: EditCustomerProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: customer.customer_name,
    customer_email: customer.customer_email || '',
    customer_phone: customer.customer_phone || '',
    customer_address: customer.customer_address || '',
    credit_limit: customer.credit_limit.toString(),
    is_active: customer.is_active,
    branch_id: customer.branch_id ? customer.branch_id.toString() : '',
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
        <div className="max-w-[1650px] mx-auto space-y-6 pb-10 px-0">

          {/* Action Header */}
          <div className="flex items-center justify-between pt-4">
             <div className="flex items-center gap-2">
                <Link
                  href={`/customers/${customer.id}`}
                  className="group flex items-center text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                    <ArrowLeft className="h-4 w-4" />
                  </div>
                </Link>
                <h1 className="text-[18px] font-bold text-slate-900 tracking-tight ml-2">Modify profile</h1>
             </div>

            <Button
                variant="destructive"
                size="icon"
                className="h-9 w-9 rounded-full shadow-sm active:scale-95 transition-all"
                onClick={handleDelete}
                disabled={deleting || loading}
                title="Delete Customer"
            >
                <Trash className="h-4 w-4" />
            </Button>
          </div>

          {/* Error Alert */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border-r-4 border-r-red-500 rounded-lg p-4 flex gap-4 shadow-sm border border-red-100">
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                  <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-900 text-[14px]">Update validation failure</h3>
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
                            <h3 className="text-[14px] font-bold text-slate-900 leading-none tracking-tight">Status</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`text-[12px] font-bold ${formData.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                            {formData.is_active ? 'Active' : 'Inactive'}
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
                                <CardTitle className="text-[14px] font-bold text-slate-900">Identification</CardTitle>
                                <CardDescription className="text-[12px] font-medium text-slate-400">Legal and contact information</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="name" className="text-[13px] font-semibold text-slate-700 ml-1">Full name *</Label>
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
                                    <Label htmlFor="email" className="text-[13px] font-semibold text-slate-700 ml-1">Email *</Label>
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
                                    <Label htmlFor="phone" className="text-[13px] font-semibold text-slate-700 ml-1">Phone *</Label>
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
                                <Label htmlFor="address" className="text-[13px] font-semibold text-slate-700 ml-1">Delivery address</Label>
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
                                <Label htmlFor="branch_id" className="text-[13px] font-semibold text-slate-700 ml-1">Assigned Branch *</Label>
                                <select
                                    id="branch_id"
                                    value={formData.branch_id}
                                    onChange={(e) => handleChange('branch_id', e.target.value)}
                                    disabled={loading}
                                    required
                                    className="h-10 w-full px-3 text-[14px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                                >
                                    <option value="">— Select branch —</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-slate-400">Primary branch for this customer profile.</p>
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
                                <CardTitle className="text-[14px] font-bold text-slate-900">Finance</CardTitle>
                                <CardDescription className="text-[12px] font-medium text-slate-400">Credit and risk settings</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-3">
                                <Label htmlFor="credit_limit" className="text-[13px] font-semibold text-slate-700 ml-1">Credit limit (TZS)</Label>
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
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Max permissible outstanding balance.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[13px] font-semibold text-slate-700 ml-1">Reset password</Label>
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
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Leave blank to keep current password.</p>
                            </div>

                            <div className="pt-4 border-t border-slate-50 flex items-center gap-3 text-slate-400">
                                <ShieldCheck className="h-4 w-4" />
                                <span className="text-[12px] font-bold leading-none">Security</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Final Action Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-400">
                    <HistoryIcon className="h-4 w-4" />
                    <span className="text-[12px] font-bold">Changes audited</span>
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
