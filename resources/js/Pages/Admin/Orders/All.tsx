import { Head, router, Link } from '@inertiajs/react';
import {
  ClipboardList, Search, Filter, Calendar,
  ArrowRight, Eye, Edit, Trash2, CheckCircle2,
  Clock, AlertCircle, TrendingUp, DollarSign, Users,
  X, ChevronDown, Download, Printer, Plus
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface Order {
  unique_id: string;
  customer_name: string;
  cashier_name: string;
  payment_method: string;
  payment_status: 'Paid' | 'Partially Paid' | 'Unpaid';
  formatted_total: number;
  formatted_paid: number;
  formatted_balance: number;
  items_count: number;
  items_preview?: string;
  created_at: string;
  sale_type: string;
}

interface Metrics {
  total_orders: number;
  total_revenue: number;
  pending_check: number;
  total_balance: number;
}

interface Props {
  orders: Order[];
  metrics: Metrics;
  staff_members: string[];
}

const fmt = (n: number) =>
  'TZS ' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtDate = (d: string) => {
  if (!d) {
return '—';
}

  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function SalesOrders({ orders, metrics, staff_members }: Props) {
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('all');

  const filteredOrders = orders.filter(o => {
    const s = search.toLowerCase();
    const matchSearch = o.unique_id.toLowerCase().includes(s) || o.customer_name.toLowerCase().includes(s);
    const matchStatus =
      paymentStatus === 'all'
        ? true
        : paymentStatus === 'pending'
          ? o.payment_status !== 'Paid'
          : o.payment_status === paymentStatus;
    return matchSearch && matchStatus;
  });

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Customer orders', href: '/orders-crud' },
  ];

  const paymentStatusBadge = (status: string) => {
    if (status === 'Paid') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Partially Paid') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };


  return (
    <>
      <Head title="Sales Orders" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-8 pb-20">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Customer orders</h1>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              {
                label: 'TOTAL ORDERS',
                value: metrics.total_orders,
                note: 'All customer orders',
                icon: <ClipboardList className="w-3 h-3 text-blue-500" />,
                border: 'border-l-blue-500',
                valueClass: 'text-foreground',
              },
              {
                label: 'TOTAL COLLECTIONS',
                value: fmt(metrics.total_revenue),
                note: 'Collected amount',
                icon: <TrendingUp className="w-3 h-3 text-emerald-500" />,
                border: 'border-l-emerald-500',
                valueClass: 'text-emerald-600',
              },
              {
                label: 'PENDING / UNPAID',
                value: metrics.pending_check,
                note: 'Needs follow-up',
                icon: <Clock className="w-3 h-3 text-amber-500" />,
                border: 'border-l-amber-500',
                valueClass: 'text-amber-600',
              },
              {
                label: 'TOTAL OUTSTANDING',
                value: fmt(metrics.total_balance),
                note: 'Unpaid balance',
                icon: <DollarSign className="w-3 h-3 text-rose-500" />,
                border: 'border-l-rose-500',
                valueClass: 'text-rose-600',
              },
            ].map(k => (
              <Card key={k.label} className={`border-l-4 ${k.border}`}>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium flex items-center gap-1 text-slate-700">
                    {k.icon}
                    {k.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className={`text-sm md:text-lg font-bold leading-none ${k.valueClass}`}>{k.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{k.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Seach by ID or customer name..."
                  className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-none"
                />
              </div>
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full lg:w-48">
                  <select
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value)}
                    className="w-full h-11 pl-4 pr-10 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 appearance-none transition-all"
                  >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending orders</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
                <Button variant="outline" className="h-11 px-4 border-slate-200 rounded-xl font-bold bg-white text-slate-700">
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-up">
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-tight text-left">Order / Customer</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-tight text-left">Cashier</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-tight text-left">Items</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-tight text-left">Total payable</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-tight text-left">Collected</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-tight text-left">Balance</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-tight text-left">Payment status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-tight text-left">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-tight text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <ClipboardList className="h-12 w-12 text-slate-200" />
                          <p className="text-base font-bold text-slate-800 tracking-tight">No matching sales orders found</p>
                          <p className="text-sm text-slate-400 max-w-[220px] leading-relaxed font-bold">Try adjusting your filters or search keywords</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredOrders.map(o => (
                    <tr key={o.unique_id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900 leading-tight tracking-tight uppercase">{o.customer_name}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{o.unique_id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-700">{o.cashier_name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 uppercase font-medium">{o.payment_method}</p>
                      </td>
                      <td className="px-6 py-4 text-left">
                        {o.items_preview && (
                          <div className="text-[10px] text-slate-500 mt-1 max-w-[220px] space-y-0.5">
                            {o.items_preview.split(',').map((item, idx) => (
                              <p key={idx} className="leading-tight" title={item.trim()}>
                                {item.trim()}
                              </p>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-left">
                        <p className="text-base font-semibold text-slate-800 tracking-tight">{fmt(o.formatted_total)}</p>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <p className="text-base font-semibold text-emerald-600 tracking-tight">{fmt(o.formatted_paid)}</p>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <p className={`text-base font-semibold tracking-tight ${o.formatted_balance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {fmt(o.formatted_balance)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <Badge variant="outline" className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${paymentStatusBadge(o.payment_status)}`}>
                          {o.payment_status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-700">{fmtDate(o.created_at)}</p>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="flex items-center justify-start gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Reprint receipt"
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            onClick={() => window.open(`/finance/invoices/${encodeURIComponent(o.unique_id)}/receipt`, '_blank', 'width=450,height=700')}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Link href={`/orders-crud/${o.unique_id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/orders-crud/${o.unique_id}/edit`}>
                             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50">
                               <Edit className="h-4 w-4" />
                             </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => {
 if(confirm('Delete this sale permanently?')) {
router.delete(`/orders-crud/${o.unique_id}`)
} 
}}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination placeholder - The controller uses ->get(), so no real pagination yet, but we could add if needed */}
            <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400">Displaying most recent {filteredOrders.length} records</p>
               <div className="flex items-center gap-2">
                <Button variant="outline" disabled className="h-10 px-4 rounded-xl text-xs font-bold border-slate-200">Previous</Button>
                <Button variant="outline" disabled className="h-10 px-4 rounded-xl text-xs font-bold border-slate-200">Next</Button>
               </div>
            </div>
          </div>

        </div>
      </AppLayout>
    </>
  );
}
