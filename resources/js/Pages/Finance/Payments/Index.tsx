import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Filter, MoreVertical, Printer, Edit2, Trash2, CreditCard, TrendingUp, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { KpiCard } from "@/components/dashboard/KpiCard";

interface Payment {
  id: number;
  loan_id: number;
  unique_id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  reference: string;
  status: string;
  loan?: { unique_id: string };
  sale?: { invoice_number: string };
}

interface PaymentsIndexProps {
  payments: { data: Payment[]; current_page: number; last_page: number; total: number; per_page: number };
  metrics: {
    totalPayments: number;
    totalCollected: number;
    completed: number;
  };
  filters: any;
}

export default function PaymentsIndex({ payments, metrics, filters }: PaymentsIndexProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '/finance' },
    { title: 'Payments', href: '/payments' }
  ];

  const columns: {
    key: string;
    label: string;
    render?: (value: any, row: Payment) => React.ReactNode;
    sortable?: boolean;
  }[] = [
    { 
      key: 'id', 
      label: 'Payment No.',
      render: (value: any, row: Payment) => (
        <span className="font-semibold text-slate-700">PAY-{value}</span>
      ),
      sortable: true
    },
    { 
      key: 'unique_id',
      label: 'Order/Loan ID',
      render: (value: string) => (
        <span className="font-bold text-blue-600">{value || 'N/A'}</span>
      ),
      sortable: true
    },
    {
      key: 'amount_paid',
      label: 'Amount',
      render: (value: number) => (
        <span className="font-bold text-emerald-600">TZS {(value ?? 0).toLocaleString()}</span>
      ),
      sortable: true
    },
    {
      key: 'payment_date',
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString(),
      sortable: true
    },
    {
      key: 'payment_method',
      label: 'Method',
      sortable: false
    },
    {
      key: 'reference',
      label: 'Status',
      render: (value: string, row: Payment) => (
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${row.status === 'Paid' || row.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {row.status || 'Active'}
        </span>
      )
    }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-TZ', {
      minimumFractionDigits: 0,
    }).format(val || 0);
  };

  const kpis = [
    { title: "Total Payments", value: (metrics?.totalPayments || 0).toString(), change: 0, icon: CreditCard, href: "#", bgClass: "bg-blue-50/50", iconBgClass: "bg-blue-100 text-blue-600" },
    { title: "Total Collected", value: `TZS ${formatCurrency(metrics?.totalCollected)}`, change: 0, icon: TrendingUp, href: "#", bgClass: "bg-emerald-50/50", iconBgClass: "bg-emerald-100 text-emerald-600" },
    { title: "Completed", value: (metrics?.completed || 0).toString(), change: 0, icon: CheckCircle2, href: "#", bgClass: "bg-indigo-50/50", iconBgClass: "bg-indigo-100 text-indigo-600" },
  ];

  return (
    <>
      <Head title="Payments Management" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1600px] mx-auto space-y-6 pb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold tracking-tight">Payments</h1>
              <p className="text-muted-foreground mt-1">Record and track loan payments</p>
            </div>
            <Link href="/payments/create">
              <Button className="bg-[#1e293b] hover:bg-slate-800 text-white"><Plus className="h-4 w-4 mr-2" />New Payment</Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {kpis.map((kpi, i) => (
              <div key={kpi.title} className={`animate-fade-up stagger-${i + 1}`}>
                <KpiCard {...kpi} className="shadow-sm hover:shadow-md transition-shadow" />
              </div>
            ))}
          </div>

          <Card className="border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50/50">
               <div className="flex items-center relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Search by ID or reference..." 
                    className="pl-9 bg-white"
                    defaultValue={filters?.search}
                    onChange={(e) => {
                      // Implementation of debounced search could go here
                    }}
                  />
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    {columns.map(col => (
                      <th key={col.key} className="text-left px-6 py-4 font-semibold text-slate-600 uppercase text-[11px] tracking-wider">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.data.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      {columns.map(col => (
                        <td key={col.key} className="px-6 py-4 text-slate-600">
                          {col.render ? col.render((row as any)[col.key], row) : (row as any)[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {payments.data.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-12 text-slate-400">No payment records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 border-t flex items-center justify-between bg-white">
              <div className="text-[11px] font-medium text-slate-500">
                Showing page {payments.current_page} of {payments.last_page} ({payments.total} total records)
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-[11px] font-bold"
                  disabled={payments.current_page === 1}
                  onClick={() => router.get('/payments', { ...filters, page: payments.current_page - 1 })}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-[11px] font-bold"
                  disabled={payments.current_page === payments.last_page}
                  onClick={() => router.get('/payments', { ...filters, page: payments.current_page + 1 })}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}
