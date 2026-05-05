import { Head, router } from '@inertiajs/react';
import {
  ReceiptText, TrendingUp, DollarSign, AlertCircle,
  Search, Filter, ChevronLeft, ChevronRight, Clock, User
} from 'lucide-react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';

/* ─── Types ─────────────────────────────── */
interface Sale {
  id: number;
  invoice: string;
  customer: string;
  company?: string;
  cashier: string;
  items_count: number;
  total: number;
  discount: number;
  payable: number;
  method: string;
  status: string;
  date: string;
  time: string;
}

interface Paginated {
  data: Sale[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

interface Kpis {
  today_revenue: number;
  total_revenue: number;
  total_sales: number;
  unpaid_amount: number;
}

interface Props {
  sales: Paginated;
  kpis: Kpis;
  filters: Record<string, string>;
}

/* ─── Helpers ────────────────────────────── */
const fmt = (n: number) => 'TZS ' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const statusStyle = (s: string) => {
  if (s === 'Paid')          {
return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

  if (s === 'Partially Paid') {
return 'bg-amber-50 text-amber-700 border-amber-200';
}

  return 'bg-rose-50 text-rose-700 border-rose-200';
};

const methodStyle = (m: string) => {
  if (m === 'Cash')   {
return 'bg-blue-50 text-blue-700';
}

  if (m === 'Card')   {
return 'bg-purple-50 text-purple-700';
}

  if (m === 'Mobile') {
return 'bg-teal-50 text-teal-700';
}

  return 'bg-slate-100 text-slate-600';
};

/* ─── Component ──────────────────────────── */
export default function History({ sales, kpis, filters }: Props) {
  const [search, setSearch]   = useState(filters.search ?? '');
  const [status, setStatus]   = useState(filters.status ?? '');
  const [method, setMethod]   = useState(filters.method ?? '');
  const [startDt, setStartDt] = useState(filters.start_dt ?? '');
  const [endDt, setEndDt]     = useState(filters.end_dt ?? '');

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sales & POS', href: '#' },
    { title: 'Sales history', href: '#' },
  ];

  const applyFilters = (overrides: Record<string, string> = {}) => {
    router.get('/sales-history', {
      search, status, method, start_dt: startDt, end_dt: endDt, ...overrides,
    }, { preserveState: true, preserveScroll: true });
  };

  const handleSearch = (e: React.FormEvent) => {
 e.preventDefault(); applyFilters(); 
};
  const handlePage   = (page: number) => router.get('/sales-history', { ...filters, page }, { preserveState: true });

  const KPIS = [
    {
      label: "TODAY'S REVENUE",
      value: fmt(kpis.today_revenue),
      icon: TrendingUp,
      color: 'text-emerald-600',
      border: 'border-l-emerald-500',
      iconColor: 'text-emerald-500',
      note: 'Today sales intake',
    },
    {
      label: 'TOTAL REVENUE',
      value: fmt(kpis.total_revenue),
      icon: DollarSign,
      color: 'text-blue-600',
      border: 'border-l-blue-500',
      iconColor: 'text-blue-500',
      note: 'All recorded sales',
    },
    {
      label: 'TOTAL SALES',
      value: kpis.total_sales,
      icon: ReceiptText,
      color: 'text-violet-600',
      border: 'border-l-violet-500',
      iconColor: 'text-violet-500',
      note: 'Completed invoices',
    },
    {
      label: 'UNPAID BALANCE',
      value: fmt(kpis.unpaid_amount),
      icon: AlertCircle,
      color: 'text-rose-600',
      border: 'border-l-rose-500',
      iconColor: 'text-rose-500',
      note: 'Outstanding amount',
    },
  ];

  return (
    <>
      <Head title="Sales history" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1600px] mx-auto space-y-6 pb-8">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Sales history</h1>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {KPIS.map(k => (
              <div key={k.label} className={`bg-white border border-slate-200 border-l-4 ${k.border} rounded-xl p-4 shadow-sm`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <k.icon className={`h-3.5 w-3.5 ${k.iconColor}`} />
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{k.label}</p>
                </div>
                <p className={`text-sm md:text-lg font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-slate-400 mt-1">{k.note}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <form onSubmit={handleSearch} className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
              {/* search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search invoice number..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-slate-50 focus:bg-white"
                />
              </div>

              {/* status */}
              <select value={status} onChange={e => {
 setStatus(e.target.value); applyFilters({ status: e.target.value }); 
}}
                className="py-2.5 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-violet-400 bg-slate-50 focus:bg-white min-w-[140px]">
                <option value="">All statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>

              {/* method */}
              <select value={method} onChange={e => {
 setMethod(e.target.value); applyFilters({ method: e.target.value }); 
}}
                className="py-2.5 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-violet-400 bg-slate-50 focus:bg-white min-w-[140px]">
                <option value="">All methods</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Mobile">Mobile</option>
              </select>

              {/* date range */}
              <input type="date" value={startDt} onChange={e => setStartDt(e.target.value)}
                className="py-2.5 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-violet-400 bg-slate-50 focus:bg-white" />
              <input type="date" value={endDt} onChange={e => setEndDt(e.target.value)}
                className="py-2.5 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-violet-400 bg-slate-50 focus:bg-white" />

              <button type="submit"
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-black rounded-xl transition-colors shadow-sm shadow-violet-500/20">
                <Filter className="h-4 w-4 inline mr-1.5" />Apply
              </button>
            </form>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Invoice', 'Customer', 'Cashier', 'Items', 'Total', 'Discount', 'Payable', 'Method', 'Status', 'Date & time'].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sales.data.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-5 py-16 text-center">
                        <ReceiptText className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                        <p className="text-base font-bold text-slate-400">No sales found</p>
                        <p className="text-[11px] text-slate-300 mt-1">Try adjusting your filters</p>
                      </td>
                    </tr>
                  ) : sales.data.map(row => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-mono text-sm text-violet-600 font-bold whitespace-nowrap">{row.invoice}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 leading-tight">{row.customer}</p>
                            {row.company && <p className="text-xs text-slate-400 font-bold">{row.company}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-600 font-bold">{row.cashier}</td>
                      <td className="px-5 py-3 text-center text-sm font-bold text-slate-700">{row.items_count}</td>
                      <td className="px-5 py-3 text-right text-base font-bold text-slate-900 tabular-nums whitespace-nowrap">TZS {Number(row.total || 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-right text-sm text-rose-600 font-bold tabular-nums whitespace-nowrap">
                        {row.discount > 0 ? `-TZS ${row.discount.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-base font-bold text-blue-700 tabular-nums whitespace-nowrap">TZS {Number(row.payable || 0).toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${methodStyle(row.method)}`}>{row.method}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${statusStyle(row.status)}`}>{row.status}</span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <p className="text-sm font-bold text-slate-700">{row.date}</p>
                        <p className="text-xs text-slate-400 font-bold flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{row.time}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {sales.total > sales.per_page && (
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500">
                  Showing <span className="text-slate-800">{sales.data.length}</span> of <span className="text-slate-800">{sales.total}</span> sales
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => handlePage(sales.current_page - 1)} disabled={sales.current_page === 1}
                    className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:border-violet-200 hover:text-violet-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 px-2">{sales.current_page} / {sales.last_page}</span>
                  <button onClick={() => handlePage(sales.current_page + 1)} disabled={sales.current_page >= sales.last_page}
                    className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:border-violet-200 hover:text-violet-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}
