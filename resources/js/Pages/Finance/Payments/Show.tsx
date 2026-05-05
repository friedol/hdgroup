import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit } from 'lucide-react';
import React from 'react';
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
  created_at: string;
}

interface Loan {
  id: number;
  loan_number: string;
  customer_name: string;
}

interface PaymentsShowProps {
  payment: Payment;
  loan: Loan;
}

export default function PaymentsShow({ payment, loan }: PaymentsShowProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '#' },
    { title: 'Payments', href: '/payments' },
    { title: `Payment ${payment.id}`, href: '#' }
  ];

  return (
    <>
      <Head title={`Payment #${payment.id}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/payments" className="p-2 hover:bg-slate-100 rounded">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-medium">Payment #{payment.id}</h1>
                <p className="text-sm text-slate-600 mt-1">for {loan.loan_number}</p>
              </div>
            </div>
            <Link href={`/payments/${payment.id}/edit`}>
              <Button><Edit className="h-4 w-4 mr-2" />Edit</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-slate-600">Amount</p>
              <p className="text-2xl font-medium text-green-600 mt-1">TZS {payment.amount.toFixed(2)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600">Payment Method</p>
              <p className="text-lg font-medium mt-1 capitalize">{payment.payment_method}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600">Payment Date</p>
              <p className="text-lg font-medium mt-1">{new Date(payment.payment_date).toLocaleDateString()}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600">Status</p>
              <p className="text-lg font-medium mt-1 capitalize">{payment.status}</p>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Payment Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Loan</p>
                  <p className="mt-1 font-medium">{loan.loan_number}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Customer</p>
                  <p className="mt-1 font-medium">{loan.customer_name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-slate-600">Reference Number</p>
                  <p className="mt-1">{payment.reference_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Recorded On</p>
                  <p className="mt-1">{new Date(payment.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}
