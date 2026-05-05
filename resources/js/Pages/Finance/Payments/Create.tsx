import { Head, router } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

interface Loan {
  id: number;
  loan_number: string;
}

interface CreatePaymentProps {
  loans: Loan[];
  errors?: Record<string, string>;
}

export default function CreatePayment({ loans = [], errors = {} }: CreatePaymentProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    loan_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference_number: '',
  });

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '#' },
    { title: 'Payments', href: '/payments' },
    { title: 'Create Payment', href: '#' }
  ];

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    router.post('/payments', formData as any, { onFinish: () => setLoading(false) });
  };

  return (
    <>
      <Head title="Record Payment" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Record Loan Payment</h1>

          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle className="h-5 w-5 text-red-600 inline-block mr-2" />
              <div className="inline-block">
                {Object.entries(errors).map(([f, msg]) => <div key={f}>{msg}</div>)}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Select Loan *</Label>
                  <select value={formData.loan_id} onChange={(e) => handleChange('loan_id', e.target.value)} disabled={loading} className="w-full px-3 py-2 border border-slate-300 rounded-md">
                    <option value="">Choose Loan</option>
                    {loans.map(l => <option key={l.id} value={l.id}>{l.loan_number}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Amount *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5">TZS </span>
                    <Input type="number" step="0.01" value={formData.amount} onChange={(e) => handleChange('amount', e.target.value)} disabled={loading} className="pl-7" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Payment Date *</Label>
                  <Input type="date" value={formData.payment_date} onChange={(e) => handleChange('payment_date', e.target.value)} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <select value={formData.payment_method} onChange={(e) => handleChange('payment_method', e.target.value)} disabled={loading} className="w-full px-3 py-2 border border-slate-300 rounded-md">
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit_card">Credit Card</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Reference Number</Label>
                  <Input type="text" placeholder="Check #, Receipt #, etc." value={formData.reference_number} onChange={(e) => handleChange('reference_number', e.target.value)} disabled={loading} />
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => router.visit('/payments')} disabled={loading}>Cancel</Button>
              <Button disabled={loading}>{loading ? 'Recording...' : 'Record Payment'}</Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </>
  );
}
