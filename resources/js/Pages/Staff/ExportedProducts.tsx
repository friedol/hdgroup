import { Head, Link, router, useForm } from "@inertiajs/react";
import {
  ArrowLeft, Search, Package, DollarSign, Clock, CheckCircle2,
  Filter, Eye, FileText, RefreshCcw, Calendar, Phone, User, CreditCard,
  TrendingUp, XCircle, ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import AppLayout from "@/layouts/app-layout";

interface ExportRecord {
  unique_id: string;
  tin: string | null;
  customer_name: string;
  staff_name: string;
  phone: string | null;
  sale_mode: string;
  payment_date: string;
  status: string | null;
  is_checked: boolean;
  created_at: string;
  total_quantity: number;
  total_price: number;
}

interface ExportedProductsProps {
  exports: ExportRecord[];
  totalItems: number;
  totalAmount: number;
}

const STATUS_CFG: Record<string, { cls: string; dot: string; label: string }> = {
  Checked:  { cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', label: 'Checked'  },
  Pending:  { cls: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500',   label: 'Pending'  },
  Cancelled:{ cls: 'bg-rose-100 text-rose-600',       dot: 'bg-rose-400',    label: 'Cancelled'},
};
const getStatus = (s: string | null) => STATUS_CFG[s ?? ''] ?? { cls: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400', label: s || 'N/A' };

export default function ExportedProducts({ exports = [], totalItems = 0, totalAmount = 0 }: ExportedProductsProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Logistics', href: '/logistics' },
    { title: 'Exported Products', href: '#' },
  ];

  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const handleFilter = (e?: React.FormEvent) => {
    e?.preventDefault();
    router.get('/exported-products', {
      ...(search     ? { search }     : {}),
      ...(startDate  ? { start_date: startDate } : {}),
      ...(endDate    ? { end_date: endDate }   : {}),
    }, { preserveState: true });
  };

  const handleToday = () => {
    setStartDate('');
    setEndDate('');
    router.get('/exported-products', {}, { preserveState: true });
  };

  // Client-side status filter
  const filtered = exports.filter(exp => {
    const matchSearch = !search ||
      exp.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      exp.unique_id.toLowerCase().includes(search.toLowerCase()) ||
      (exp.phone ?? '').includes(search);
    const matchStatus = !statusFilter || exp.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pending   = exports.filter(e => e.status === 'Pending').length;
  const checked   = exports.filter(e => e.status === 'Checked').length;

  return (
    <>
      <Head title="Exported Products" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">

          {/* ── Header ── */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/logistics" className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                <ArrowLeft className="w-4 h-4 text-slate-500" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Exported Products</h1>
                <p className="text-sm text-slate-500 mt-0.5">View and manage all export transactions</p>
              </div>
            </div>
            <Link href="/orders-crud">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors">
                <FileText className="w-4 h-4" />
                New Export
              </button>
            </Link>
          </div>

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Package,      bg: 'bg-indigo-50',  iconCls: 'text-indigo-600',  label: 'Total Exports',  value: totalItems,                              sub: "Today's records" },
              { icon: DollarSign,   bg: 'bg-emerald-50', iconCls: 'text-emerald-600', label: 'Total Amount',   value: `TZS ${(totalAmount || 0).toLocaleString()}`, sub: 'Revenue today' },
              { icon: Clock,        bg: 'bg-amber-50',   iconCls: 'text-amber-600',   label: 'Pending',        value: pending,                                 sub: 'Awaiting check' },
              { icon: CheckCircle2, bg: 'bg-blue-50',    iconCls: 'text-blue-600',    label: 'Checked',        value: checked,                                 sub: 'Verified exports' },
            ].map(({ icon: Icon, bg, iconCls, label, value, sub }) => (
              <div key={label} className="rounded-xl bg-white border border-slate-200 shadow-sm px-3 py-2.5 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${iconCls}`} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="text-base font-bold text-slate-800 mt-0">{value}</p>
                  <p className="text-[9px] text-slate-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Filters ── */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
            <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by customer, order ID, phone…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50/50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-all"
                />
              </div>

              {/* Date range */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="pl-8 pr-3 py-2.5 text-sm rounded-xl bg-slate-50/50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-all"
                  />
                </div>
                <span className="text-slate-400 text-sm">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="px-3 py-2.5 text-sm rounded-xl bg-slate-50/50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-all"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 text-sm rounded-xl bg-slate-50/50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-all"
              >
                <option value="">All Status</option>
                <option value="Checked">Checked</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              {/* Buttons */}
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Apply Filter
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Today
              </button>
            </form>
          </div>

          {/* ── Table ── */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-600 font-medium">No exports found</p>
                <p className="text-slate-400 text-sm mt-1">
                  {search ? `No results for "${search}"` : 'No exports recorded for the selected date range'}
                </p>
                <Link href="/orders-crud">
                  <button className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
                    Create Export
                  </button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Order ID', 'Customer', 'Staff', 'Sale Mode', 'Qty', 'Amount (TZS)', 'Date', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 tracking-wider bg-slate-50 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((exp) => {
                      const sc = getStatus(exp.status);
                      return (
                        <tr key={exp.unique_id} className="hover:bg-slate-50/80 transition-colors group">

                          {/* Order ID */}
                          <td className="px-5 py-4">
                            <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">
                              {exp.unique_id}
                            </span>
                          </td>

                          {/* Customer */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                <User className="w-3.5 h-3.5 text-indigo-500" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 text-xs">{exp.customer_name}</p>
                                {exp.phone && (
                                  <a href={`tel:${exp.phone}`} className="text-[10px] text-indigo-500 flex items-center gap-1 hover:underline">
                                    <Phone className="w-2.5 h-2.5" />{exp.phone}
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Staff */}
                          <td className="px-5 py-4 text-xs text-slate-600">{exp.staff_name}</td>

                          {/* Sale Mode */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              exp.sale_mode === 'Paid'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {exp.sale_mode === 'Paid' ? (
                                <><CreditCard className="w-2.5 h-2.5 mr-1" />Paid</>
                              ) : (
                                <><TrendingUp className="w-2.5 h-2.5 mr-1" />Loan</>
                              )}
                            </span>
                          </td>

                          {/* Qty */}
                          <td className="px-5 py-4 text-xs font-semibold text-slate-700 tabular-nums">
                            {(exp.total_quantity || 0).toLocaleString()}
                          </td>

                          {/* Amount */}
                          <td className="px-5 py-4 text-xs font-bold text-slate-800 tabular-nums">
                            {(exp.total_price || 0).toLocaleString()}
                          </td>

                          {/* Date */}
                          <td className="px-5 py-4 text-xs text-slate-500">
                            <div>{new Date(exp.created_at).toLocaleDateString()}</div>
                            <div className="text-[10px] text-slate-400">{new Date(exp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${sc.cls}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link
                                href={`/exports/${exp.unique_id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                              >
                                <Eye className="w-3 h-3" />View
                              </Link>
                              {!exp.is_checked && (
                                <Link
                                  href={`/exports/${exp.unique_id}/check`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                >
                                  <CheckCircle2 className="w-3 h-3" />Check
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Footer */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>
                    Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{' '}
                    <span className="font-semibold text-slate-700">{exports.length}</span> exports
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <DollarSign className="w-3 h-3 text-emerald-500" />
                    Total: TZS {filtered.reduce((s, e) => s + (e.total_price || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}
