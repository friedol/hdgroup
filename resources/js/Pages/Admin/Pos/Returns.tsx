import { Head, router } from '@inertiajs/react';
import { RotateCcw, TrendingDown, Calendar, Hash, User, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import AppLayout from '@/layouts/app-layout';

/* ─── Types ─────────────────────────────── */
interface ReturnSale {
  id: number;
  invoice: string;
  customer: string;
  cashier: string;
  items_count: number;
  payable: number;
  method: string;
  status: string;
  date: string;
  time: string;
}

interface Paginated {
  data: ReturnSale[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

interface Props {
  sales: Paginated;
  totalReturnAmount: number;
  todayReturnAmount: number;
  totalReturnCount: number;
}

/* ─── Helpers ─────────────────────────────── */
const fmt = (n: number) =>
  'TZS ' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

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
export default function Returns({ sales, totalReturnAmount, todayReturnAmount, totalReturnCount }: Props) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sales & POS', href: '#' },
    { title: 'Returns', href: '#' },
  ];

  const handlePage = (page: number) =>
    router.get('/returns', { page }, { preserveState: true });

  const KPIS = [
    {
      label: 'TOTAL RETURNED',
      value: fmt(totalReturnAmount),
      icon: TrendingDown,
      color: 'text-rose-600',
      iconColor: 'text-rose-500',
      border: 'border-l-rose-500',
      note: 'Total refunded amount',
    },
    {
      label: "TODAY'S RETURNS",
      value: fmt(todayReturnAmount),
      icon: Calendar,
      color: 'text-amber-600',
      iconColor: 'text-amber-500',
      border: 'border-l-amber-500',
      note: 'Today refund value',
    },
    {
      label: 'TOTAL RETURN COUNT',
      value: totalReturnCount,
      icon: Hash,
      color: 'text-slate-700',
      iconColor: 'text-slate-500',
      border: 'border-l-slate-500',
      note: 'Number of return slips',
    },
  ];

  return (
    <>
      <Head title="Returns" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1600px] mx-auto space-y-6 pb-8">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Commercial returns</h1>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <RotateCcw className="h-4 w-4 text-slate-400" />
              <h3 className="text-base font-bold text-slate-800">All return records</h3>
              <span className="ml-auto text-xs font-bold text-slate-400">{sales.total} total</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Invoice', 'Customer', 'Cashier', 'Items', 'Refunded', 'Method', 'Status', 'Date & time'].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sales.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <RotateCcw className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                        <p className="text-base font-bold text-slate-400">No returns recorded</p>
                        <p className="text-[11px] text-slate-300 mt-1">Return transactions will appear here</p>
                      </td>
                    </tr>
                  ) : sales.data.map(row => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-rose-50/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-sm text-rose-600 font-bold whitespace-nowrap">{row.invoice}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <User className="h-3 w-3 text-slate-400" />
                          </div>
                          <span className="text-sm font-bold text-slate-800">{row.customer}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-600 font-bold">{row.cashier}</td>
                      <td className="px-5 py-3 text-center text-sm font-bold text-slate-700">{row.items_count}</td>
                      <td className="px-5 py-3 text-right text-base font-bold text-rose-600 tabular-nums whitespace-nowrap">
                        TZS {row.payable.toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${methodStyle(row.method)}`}>{row.method}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">{row.status}</span>
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
                  Showing <span className="text-slate-800">{sales.data.length}</span> of <span className="text-slate-800">{sales.total}</span> returns
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => handlePage(sales.current_page - 1)} disabled={sales.current_page === 1}
                    className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:border-rose-200 hover:text-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 px-2">{sales.current_page} / {sales.last_page}</span>
                  <button onClick={() => handlePage(sales.current_page + 1)} disabled={sales.current_page >= sales.last_page}
                    className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:border-rose-200 hover:text-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
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
