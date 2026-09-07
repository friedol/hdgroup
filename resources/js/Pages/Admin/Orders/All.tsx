import { Head, router, Link, usePage } from '@inertiajs/react';
import {
  ClipboardList, Search,
  ArrowRight, Eye, Edit, Trash2, CheckCircle2,
  Clock, AlertCircle, TrendingUp, DollarSign, Users,
  X, ChevronDown, Download, Printer, Plus, Send, Building2,
  FileText, ScrollText, MoreVertical,
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { KpiCard } from "@/components/dashboard/KpiCard";

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
  branch_name?: string | null;
  branch_id?: number | null;
}

interface Branch {
  id: number;
  name: string;
  system_name?: string;
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
  is_global?: boolean;
}

const fmt = (n: number) =>
  'TZS ' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtDate = (d: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function SalesOrders({ orders, metrics, staff_members, is_global }: Props) {
  const { branches } = usePage().props as unknown as { branches: Branch[] };
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [assigningId, setAssigningId] = useState<string | null>(null);

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

  const assignBranch = (orderId: string, branchId: string) => {
    if (!branchId) return;
    setAssigningId(orderId);
    router.put(`/orders-crud/${orderId}`, { branch_id: parseInt(branchId) }, {
      preserveScroll: true,
      onFinish: () => setAssigningId(null),
    });
  };

  const kpis = [
    { title: "Total Orders", value: metrics.total_orders.toString(), change: 0, icon: ClipboardList, href: "#", bgClass: "bg-blue-50/50", iconBgClass: "bg-blue-100 text-blue-600" },
    { title: "Total Collections", value: fmt(metrics.total_revenue), change: 0, icon: TrendingUp, href: "#", bgClass: "bg-emerald-50/50", iconBgClass: "bg-emerald-100 text-emerald-600" },
    { title: "Pending / Unpaid", value: metrics.pending_check.toString(), change: 0, icon: Clock, href: "#", bgClass: "bg-amber-50/50", iconBgClass: "bg-amber-100 text-amber-600" },
    { title: "Total Outstanding", value: fmt(metrics.total_balance), change: 0, icon: DollarSign, href: "#", bgClass: "bg-rose-50/50", iconBgClass: "bg-rose-100 text-rose-600" },
  ];

  return (
    <>
      <Head title="Sales Orders" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="w-full space-y-8 pb-20">

          {/* Header */}
          <div className="flex items-center justify-between gap-6">
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Customer orders</h1>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {kpis.map((kpi, i) => (
              <div key={kpi.title} className={`animate-fade-up stagger-${i + 1}`}>
                <KpiCard {...kpi} className="shadow-sm hover:shadow-md transition-shadow" />
              </div>
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
                  placeholder="Search by ID or customer name..."
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
                    {is_global && <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-tight text-left">Branch</th>}
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-tight text-left">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-tight text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={is_global ? 10 : 9} className="px-6 py-20 text-center">
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
                      {is_global && (
                        <td className="px-6 py-4 text-left min-w-[160px]">
                          {o.branch_id ? (
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                              {o.branch_name}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                              <div className="relative">
                                <select
                                  key={o.unique_id}
                                  disabled={assigningId === o.unique_id}
                                  defaultValue=""
                                  onChange={e => assignBranch(o.unique_id, e.target.value)}
                                  className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-md pl-2 pr-6 py-0.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-wait transition-all"
                                >
                                  <option value="" disabled>
                                    {assigningId === o.unique_id ? 'Saving…' : 'Unassigned ▾'}
                                  </option>
                                  {(branches ?? []).map(b => (
                                    <option key={b.id} value={b.id}>
                                      {b.system_name ?? b.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-700">{fmtDate(o.created_at)}</p>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="flex items-center justify-start gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem asChild>
                                <Link href={`/orders-crud/${o.unique_id}`} className="flex items-center gap-2">
                                  <Eye className="h-4 w-4 text-blue-500" />
                                  <span>View Order</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/orders-crud/${o.unique_id}/edit`} className="flex items-center gap-2">
                                  <Edit className="h-4 w-4 text-violet-500" />
                                  <span>Edit Order</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="flex items-center gap-2"
                                onClick={() => window.open(`/invoice/receipt/${encodeURIComponent(o.unique_id)}`, '_blank', 'width=450,height=700')}
                              >
                                <Printer className="h-4 w-4 text-blue-500" />
                                <span>Print Receipt</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex items-center gap-2"
                                onClick={() => {
                                  const existing = document.getElementById('print-iframe');
                                  if (existing) document.body.removeChild(existing);
                                  const iframe = document.createElement('iframe');
                                  iframe.id = 'print-iframe';
                                  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:900px;height:1200px;border:none;';
                                  iframe.src = `/orders-crud/${encodeURIComponent(o.unique_id)}/invoice`;
                                  iframe.onload = () => { try { iframe.contentWindow?.print(); } catch(e) {} };
                                  document.body.appendChild(iframe);
                                }}
                              >
                                <FileText className="h-4 w-4 text-emerald-500" />
                                <span>Print Invoice</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex items-center gap-2"
                                onClick={() => {
                                  const existing = document.getElementById('print-iframe');
                                  if (existing) document.body.removeChild(existing);
                                  const iframe = document.createElement('iframe');
                                  iframe.id = 'print-iframe';
                                  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:900px;height:1200px;border:none;';
                                  iframe.src = `/orders-crud/${encodeURIComponent(o.unique_id)}/proforma`;
                                  iframe.onload = () => { try { iframe.contentWindow?.print(); } catch(e) {} };
                                  document.body.appendChild(iframe);
                                }}
                              >
                                <ScrollText className="h-4 w-4 text-violet-500" />
                                <span>Print Proforma</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="flex items-center gap-2"
                                onClick={() => {
                                  const url = `${window.location.origin}/invoice/receipt/${encodeURIComponent(o.unique_id)}`;
                                  const text = `Habari ${o.customer_name}, hapa kuna Invoice / Risiti yako ya TZS ${o.formatted_total.toLocaleString()} kutoka Jopo Juniours Co. Ltd. Unaweza kuipata hapa: ${url}`;
                                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                                }}
                              >
                                <Send className="h-4 w-4 text-emerald-500" />
                                <span>Share via WhatsApp</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="flex items-center gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                                onClick={() => {
                                  if (confirm('Delete this sale permanently?')) {
                                    router.delete(`/orders-crud/${o.unique_id}`);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
