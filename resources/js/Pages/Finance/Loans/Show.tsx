import { Head, Link, router } from '@inertiajs/react';
import { Edit, ArrowLeft, Trash2, Wallet, Percent, Scale, Activity } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';

interface Loan {
  id: number;
  loan_number?: string;
  unique_id?: string;
  customer?: { customer_name?: string };
  customer_name?: string;
  principal_amount?: number;
  total_amount?: number;
  interest_rate?: number;
  balance?: number;
  status?: string;
  start_date?: string;
  maturity_date?: string;
  payment_date?: string;
  notes?: string;
  created_at?: string;
  payments?: Array<{ id: number; amount?: number; amount_paid?: number; payment_date: string }>;
}

export default function ShowLoan({ loan }: { loan: Loan }) {
  const [deleting, setDeleting] = useState(false);
  const loanNumber = loan.loan_number || loan.unique_id || `Loan-${loan.id}`;
  const customerName = loan.customer?.customer_name || loan.customer_name || 'Unknown customer';
  const principalAmount = Number(loan.principal_amount ?? loan.total_amount ?? 0);
  const outstandingBalance = Number(loan.balance ?? principalAmount);
  const interestRate = Number(loan.interest_rate ?? 0);
  const startDate = loan.start_date || loan.created_at;
  const maturityDate = loan.maturity_date || loan.payment_date;
  const statusLabel = loan.status || (outstandingBalance > 0 ? 'pending' : 'paid');

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '#' },
    { title: 'Loans', href: '/loans' },
    { title: loanNumber, href: '#' }
  ];

  const handleDelete = () => {
    if (confirm('Delete this loan?')) {
      setDeleting(true);
      router.delete(`/loans/${loan.id}`, { onFinish: () => setDeleting(false) });
    }
  };

  return (
    <>
      <Head title={loanNumber} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="flex items-center gap-2">
              <Link href="/loans">
                <Button variant="outline" size="sm" className="h-9 text-xs font-bold border-slate-200"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
              </Link>
              <Link href={`/loans/${loan.id}/edit`}>
                <Button size="sm" className="h-9 text-xs font-bold"><Edit className="h-4 w-4 mr-2" />Edit</Button>
              </Link>
            </div>
            <div className="md:ml-auto">
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight">{loanNumber}</h1>
              <p className="text-xs font-bold text-slate-500 mt-1">{customerName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1 text-slate-700">
                  <Wallet className="w-3 h-3 text-blue-500" />
                  PRINCIPAL
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm md:text-base font-bold text-slate-900">TZS {principalAmount.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1 text-slate-700">
                  <Percent className="w-3 h-3 text-emerald-500" />
                  INTEREST RATE
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm md:text-base font-bold text-slate-900">{interestRate}%</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-rose-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1 text-slate-700">
                  <Scale className="w-3 h-3 text-rose-500" />
                  OUTSTANDING
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm md:text-base font-bold text-rose-600">TZS {outstandingBalance.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1 text-slate-700">
                  <Activity className="w-3 h-3 text-indigo-500" />
                  STATUS
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <Badge variant={statusLabel === 'active' ? 'default' : 'secondary'} className="text-[10px] font-bold uppercase">{statusLabel}</Badge>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="details" className="text-xs font-bold">Details</TabsTrigger>
              <TabsTrigger value="payments" className="text-xs font-bold">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs font-bold text-slate-500">Start Date</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{startDate ? new Date(startDate).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500">Maturity Date</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{maturityDate ? new Date(maturityDate).toLocaleDateString() : '-'}</p>
                  </div>
                </div>
                {loan.notes && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-xs font-bold text-slate-500">Notes</p>
                    <p className="mt-2 text-sm text-slate-800">{loan.notes}</p>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card className="p-6">
                {loan.payments?.length ? (
                  <div className="space-y-2">
                    {loan.payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-xs font-bold text-slate-600">{new Date(p.payment_date).toLocaleDateString()}</span>
                        <span className="text-sm font-bold text-slate-900">TZS {Number(p.amount ?? p.amount_paid ?? 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-500">No payments recorded</p>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </>
  );
}
