import { Head, router } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

interface Customer {
  id: number;
  customer_name: string;
}

interface CreateLoanProps {
  customers: Customer[];
  errors?: Record<string, string>;
}

export default function CreateLoan({ customers = [], errors = {} }: CreateLoanProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    principal_amount: '',
    interest_rate: '',
    start_date: '',
    maturity_date: '',
    notes: '',
  });

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '#' },
    { title: 'Loans', href: '/loans' },
    { title: 'Create Loan', href: '#' }
  ];

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    router.post('/loans', formData as any, { onFinish: () => setLoading(false) });
  };

  return (
    <>
      <Head title="Create Loan" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-slate-900">Create New Loan</h1>

          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Please fix errors:</h3>
                <ul className="text-sm text-red-800 mt-2 space-y-1">
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field}>• {message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Loan Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <select
                    id="customer"
                    value={formData.customer_id}
                    onChange={(e) => handleChange('customer_id', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name}</option>)}
                  </select>
                  {errors.customer_id && <p className="text-xs text-red-500">{errors.customer_id}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="principal">Principal Amount *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5">TZS </span>
                    <Input id="principal" type="number" step="0.01" placeholder="0.00" value={formData.principal_amount} onChange={(e) => handleChange('principal_amount', e.target.value)} disabled={loading} className="pl-7" />
                  </div>
                  {errors.principal_amount && <p className="text-xs text-red-500">{errors.principal_amount}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">Interest Rate (%) *</Label>
                  <Input id="rate" type="number" step="0.01" placeholder="0.00" value={formData.interest_rate} onChange={(e) => handleChange('interest_rate', e.target.value)} disabled={loading} />
                  {errors.interest_rate && <p className="text-xs text-red-500">{errors.interest_rate}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start">Start Date *</Label>
                  <Input id="start" type="date" value={formData.start_date} onChange={(e) => handleChange('start_date', e.target.value)} disabled={loading} />
                  {errors.start_date && <p className="text-xs text-red-500">{errors.start_date}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maturity">Maturity Date *</Label>
                  <Input id="maturity" type="date" value={formData.maturity_date} onChange={(e) => handleChange('maturity_date', e.target.value)} disabled={loading} />
                  {errors.maturity_date && <p className="text-xs text-red-500">{errors.maturity_date}</p>}
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea id="notes" placeholder="Additional notes..." value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} disabled={loading} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm min-h-[100px]" />
              </div>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => router.visit('/loans')} disabled={loading}>Cancel</Button>
              <Button disabled={loading}>{loading ? 'Creating...' : 'Create Loan'}</Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </>
  );
}
