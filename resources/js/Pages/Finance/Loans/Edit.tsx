import { Head, router } from '@inertiajs/react';
import { AlertCircle, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

interface Loan {
  id: number;
  loan_number: string;
  customer_id: number;
  principal_amount: number;
  interest_rate: number;
  start_date: string;
  maturity_date: string;
  notes: string;
}

interface Customer {
  id: number;
  customer_name: string;
}

interface EditLoanProps {
  loan: Loan;
  customers: Customer[];
  errors?: Record<string, string>;
}

export default function EditLoan({ loan, customers = [], errors = {} }: EditLoanProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState(loan);

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '#' },
    { title: 'Loans', href: '/loans' },
    { title: `Edit ${loan.loan_number}`, href: '#' }
  ];

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    router.put(`/loans/${loan.id}`, formData as any, { onFinish: () => setLoading(false) });
  };

  const handleDelete = () => {
    if (confirm('Delete this loan? This action cannot be undone.')) {
      setDeleting(true);
      router.delete(`/loans/${loan.id}`, { onFinish: () => setDeleting(false) });
    }
  };

  return (
    <>
      <Head title={`Edit ${loan.loan_number}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Edit Loan</h1>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="h-4 w-4 mr-2" />Delete
            </Button>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Please fix errors:</h3>
                <ul className="text-sm text-red-800 mt-2 space-y-1">
                  {Object.entries(errors).map(([f, msg]) => <li key={f}>• {msg}</li>)}
                </ul>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Loan Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <select value={formData.customer_id} onChange={(e) => handleChange('customer_id', e.target.value)} disabled={loading} className="w-full px-3 py-2 border border-slate-300 rounded-md">
                    {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Principal Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5">TZS </span>
                    <Input type="number" step="0.01" value={formData.principal_amount} onChange={(e) => handleChange('principal_amount', e.target.value)} disabled={loading} className="pl-7" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Interest Rate (%)</Label>
                  <Input type="number" step="0.01" value={formData.interest_rate} onChange={(e) => handleChange('interest_rate', e.target.value)} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={formData.start_date} onChange={(e) => handleChange('start_date', e.target.value)} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label>Maturity Date</Label>
                  <Input type="date" value={formData.maturity_date} onChange={(e) => handleChange('maturity_date', e.target.value)} disabled={loading} />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Label>Notes</Label>
                <textarea value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} disabled={loading} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm min-h-[100px]" />
              </div>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => router.visit('/loans')} disabled={loading}>Cancel</Button>
              <Button disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </>
  );
}
