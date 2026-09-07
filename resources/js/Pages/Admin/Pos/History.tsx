import { Head, router } from '@inertiajs/react';
import {
  ReceiptText, TrendingUp, DollarSign, AlertCircle,
  Search, Filter, ChevronLeft, ChevronRight, Clock, User, Printer, Send
} from 'lucide-react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { KpiCard } from "@/components/dashboard/KpiCard";

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
  notes?: string;
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
  const [period, setPeriod]   = useState(filters.period ?? '');
  const [startDt, setStartDt] = useState(filters.start_dt ?? '');
  const [endDt, setEndDt]     = useState(filters.end_dt ?? '');

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sales & POS', href: '#' },
    { title: 'Sales history', href: '#' },
  ];

  const applyFilters = (overrides: Record<string, string> = {}) => {
    router.get('/sales-history', {
      search, status, method, period, start_dt: startDt, end_dt: endDt, ...overrides,
    }, { preserveState: true, preserveScroll: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); applyFilters(); 
  };
  const handlePage   = (page: number) => router.get('/sales-history', { ...filters, page }, { preserveState: true });

  const kpiCards = [
    { title: "Today's Revenue", value: fmt(kpis.today_revenue), change: 0, icon: TrendingUp, href: "#", bgClass: "bg-emerald-50/50", iconBgClass: "bg-emerald-100 text-emerald-600" },
    { title: "Total Revenue", value: fmt(kpis.total_revenue), change: 0, icon: DollarSign, href: "#", bgClass: "bg-blue-50/50", iconBgClass: "bg-blue-100 text-blue-600" },
    { title: "Total Sales", value: kpis.total_sales.toString(), change: 0, icon: ReceiptText, href: "#", bgClass: "bg-violet-50/50", iconBgClass: "bg-violet-100 text-violet-600" },
    { title: "Unpaid Balance", value: fmt(kpis.unpaid_amount), change: 0, icon: AlertCircle, href: "#", bgClass: "bg-rose-50/50", iconBgClass: "bg-rose-100 text-rose-600" },
  ];

  return (
    <>
      <Head title="Sales history" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="w-full space-y-6 pb-8">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Sales history</h1>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {kpiCards.map((kpi, i) => (
              <div key={kpi.title} className={`animate-fade-up stagger-${i + 1}`}>
                <KpiCard {...kpi} className="shadow-sm hover:shadow-md transition-shadow" />
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

              {/* period filter */}
              <select value={period} onChange={e => {
                setPeriod(e.target.value); applyFilters({ period: e.target.value });
              }}
                className="py-2.5 px-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-violet-400 bg-slate-50 focus:bg-white min-w-[140px]">
                <option value="">All time</option>
                <option value="day">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>

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
                    {['Invoice', 'Customer', 'Cashier', 'Items', 'Total', 'Discount', 'Payable', 'Method', 'Status', 'Date & time', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sales.data.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-5 py-16 text-center">
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
                            {row.notes && (
                              <p className="text-xs bg-violet-50 text-violet-700 p-1.5 rounded-lg border border-violet-100 mt-1 italic font-normal">
                                Note: "{row.notes}"
                              </p>
                            )}
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
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            title="Tuma / Share Invoice"
                            onClick={() => {
                              const url = `${window.location.origin}/invoice/receipt/${encodeURIComponent(row.invoice)}`;
                              const text = `Habari ${row.customer}, hapa kuna Invoice / Risiti yako ya TZS ${row.payable.toLocaleString()} kutoka Jopo Juniours Co. Ltd. Unaweza kuipata hapa: ${url}`;
                              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                          <button
                            title="Print receipt"
                            onClick={() => window.open(`/invoice/receipt/${encodeURIComponent(row.invoice)}`, '_blank', 'width=450,height=700')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
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
