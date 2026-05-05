import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface Payment {
  id: number;
  loan_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  status: string;
}

interface Loan {
  id: number;
  loan_number: string;
}

interface PaymentsEditProps {
  payment: Payment;
  loans: Loan[];
  errors?: Record<string, string>;
}

export default function PaymentsEdit({ payment, loans = [], errors = {} }: PaymentsEditProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '#' },
    { title: 'Payments', href: '/payments' },
    { title: 'Edit Payment', href: '#' }
  ];

  const [formData, setFormData] = useState({
    loan_id: payment.loan_id.toString(),
    amount: payment.amount.toString(),
    payment_date: payment.payment_date,
    payment_method: payment.payment_method,
    reference_number: payment.reference_number || ''
  });

  const handleSubmit = () => {
    router.put(`/payments/${payment.id}`, formData);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this payment?')) {
      router.delete(`/payments/${payment.id}`);
    }
  };

  return (
    <>
      <Head title="Edit Payment" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.visit('/payments')} className="p-2 hover:bg-slate-100 rounded">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-3xl font-bold">Edit Payment</h1>
            </div>
            <button
              onClick={handleDelete}
              className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />Delete
            </button>
          </div>

          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loan *</label>
                <select
                  value={formData.loan_id}
                  onChange={(e) => setFormData({ ...formData, loan_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {loans.map((loan) => (
                    <option key={loan.id} value={loan.id}>{loan.loan_number}</option>
                  ))}
                </select>
                {errors.loan_id && <p className="text-red-600 text-sm mt-1">{errors.loan_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-700">TZS </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.payment_date && <p className="text-red-600 text-sm mt-1">{errors.payment_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method *</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                </select>
                {errors.payment_method && <p className="text-red-600 text-sm mt-1">{errors.payment_method}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Check #, Ref #, etc."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSubmit} className="bg-blue-600">Update Payment</Button>
                <button
                  onClick={() => router.visit('/payments')}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}
