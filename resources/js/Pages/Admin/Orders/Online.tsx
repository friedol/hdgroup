import { Head, router, Link } from '@inertiajs/react';
import {
  ShoppingCart, Search, Filter, Calendar,
  ArrowRight, Eye, Edit, Trash2, CheckCircle2,
  Clock, AlertCircle, TrendingUp, DollarSign, Users,
  X, ChevronDown, Download, Printer, Plus, Mail, Phone,
  PackageCheck, ShoppingBag, Send
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { KpiCard } from "@/components/dashboard/KpiCard";

interface OnlineOrder {
  unique_id: string;
  is_checked: boolean | number;
  email: string;
  name: string;
  phone_number: string;
  status: string;
  created_at: string;
  total_quantity: number;
  items_breakdown: string;
  total_price: number;
  total_disc_price: number;
  total_paid: number;
}

interface Metrics {
  total_orders: number;
  total_revenue: number;
  pending_check: number;
}

interface Props {
  orders: OnlineOrder[];
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

export default function OnlineOrders({ orders, metrics, staff_members }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredOrders = orders.filter(o => {
    const s = search.toLowerCase();
    const matchSearch = o.unique_id.toLowerCase().includes(s) || 
                        o.name.toLowerCase().includes(s) || 
                        o.phone_number.toLowerCase().includes(s) || 
                        o.email.toLowerCase().includes(s);
    
    if (filter === 'all') {
return matchSearch;
}

    if (filter === 'pending') {
return matchSearch && o.status === 'pending' && !o.is_checked;
}

    if (filter === 'checked') {
return matchSearch && o.is_checked;
}

    if (filter === 'paid') {
return matchSearch && o.total_paid >= o.total_disc_price;
}

    return matchSearch;
  });

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Online orders', href: '/online-orders' },
  ];

  const statusColor = (o: OnlineOrder) => {
    if (o.is_checked) {
return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

    if (o.status === 'pending') {
return 'bg-amber-50 text-amber-700 border-amber-200';
}

    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const kpis = [
    { title: "Total Online Orders", value: metrics.total_orders.toString(), change: 0, icon: ShoppingBag, href: "#", bgClass: "bg-blue-50/50", iconBgClass: "bg-blue-100 text-blue-600" },
    { title: "Total Sales Value", value: fmt(metrics.total_revenue), change: 0, icon: TrendingUp, href: "#", bgClass: "bg-emerald-50/50", iconBgClass: "bg-emerald-100 text-emerald-600" },
    { title: "Website Pending Checks", value: metrics.pending_check.toString(), change: 0, icon: PackageCheck, href: "#", bgClass: "bg-amber-50/50", iconBgClass: "bg-amber-100 text-amber-600" },
  ];

  return (
    <>
      <Head title="Online Orders" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="w-full space-y-8 pb-20">

          {/* Header */}
          <div className="flex items-center justify-between gap-6">
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Online Orders</h1>
            </div>
            <div className="flex items-center gap-3">
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {kpis.map((kpi, i) => (
              <div key={kpi.title} className={`animate-fade-up stagger-${i + 1}`}>
                <KpiCard {...kpi} className="shadow-sm hover:shadow-md transition-shadow" />
              </div>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Seach by invoice, name, phone or email..."
                  className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-none"
                />
              </div>
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full lg:w-56">
                   <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="w-full h-11 pl-4 pr-10 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 appearance-none transition-all"
                  >
                    <option value="all">Fulfillment (All)</option>
                    <option value="pending">Pending confirmation</option>
                    <option value="checked">Checked & Finalized</option>
                    <option value="paid">Fully paid orders</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-up">
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 tracking-tight text-left">Internal identity</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 tracking-tight text-left">Customer contact</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 tracking-tight text-left">Inventory assets</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 tracking-tight text-right">Net Price</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 tracking-tight text-right">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 tracking-tight text-left">Record date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 tracking-tight text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <ShoppingBag className="h-12 w-12 text-slate-200" />
                          <p className="text-base font-bold text-slate-800 tracking-tight">No online orders found</p>
                          <p className="text-sm text-slate-400 max-w-[220px] leading-relaxed font-bold">There are currently no web orders matching your criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredOrders.map(o => (
                    <tr key={o.unique_id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900 leading-tight tracking-tight">{o.unique_id}</p>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">{o.status}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-800 tracking-tight leading-tight">{o.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-bold">
                           <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> {o.phone_number}</span>
                           <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> {o.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[240px]">
                        <p className="text-sm font-bold text-slate-600 line-clamp-2 leading-relaxed">
                          {o.items_breakdown || 'Generic items'}
                        </p>
                        <p className="text-xs font-bold text-blue-600 mt-1">{o.total_quantity} items total</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-base font-bold text-slate-900 tracking-tighter">{fmt(o.total_disc_price)}</p>
                        {o.total_paid > 0 && (
                          <p className="text-xs font-bold text-emerald-600 mt-0.5 tracking-tight border-t border-slate-100 pt-0.5 inline-block">
                            Paid: {fmt(o.total_paid)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <Badge variant="outline" className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusColor(o)}`}>
                          {o.is_checked ? 'Finalized' : 'Verification Required'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-800">{fmtDate(o.created_at)}</p>
                        <p className="text-xs text-slate-400 mt-0.5 font-bold">Online Store</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            className="h-8 rounded-lg px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            title="Tuma / Share Invoice"
                            onClick={() => {
                              const url = `${window.location.origin}/invoice/receipt/${encodeURIComponent(o.unique_id)}`;
                              const text = `Habari ${o.name}, hapa kuna Invoice / Risiti yako ya TZS ${o.total_disc_price.toLocaleString()} kutoka Jopo Juniours Co. Ltd. Unaweza kuipata hapa: ${url}`;
                              window.open(`https://api.whatsapp.com/send?phone=${o.phone_number || ''}&text=${encodeURIComponent(text)}`, '_blank');
                            }}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 rounded-lg px-2"
                            title={o.is_checked ? 'Reprint receipt' : 'Finalize order first to print receipt'}
                            disabled={!o.is_checked}
                            onClick={() => window.open(`/invoice/receipt/${encodeURIComponent(o.unique_id)}`, '_blank', 'width=450,height=700')}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Link href={`/online-orders/${o.unique_id}`}>
                            <Button variant="outline" className="h-8 rounded-lg text-blue-600 border-blue-200 hover:bg-blue-50 px-2">
                              <Eye className="h-4 w-4 mr-1" />
                              <span className="text-xs font-bold">View</span>
                            </Button>
                          </Link>
                          <Button variant="outline" className="h-8 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 px-2" onClick={() => {
 if(confirm('Delete web order?')) {
router.delete(`/online-orders/${o.unique_id}`)
} 
}}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            <span className="text-xs font-bold">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/30">
               <p className="text-[11px] font-bold text-slate-400 tracking-tight">Management of customer requests originating from Digital Storefront</p>
            </div>
          </div>

        </div>
      </AppLayout>
    </>
  );
}
