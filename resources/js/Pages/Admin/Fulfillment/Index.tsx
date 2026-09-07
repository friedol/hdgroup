import { Head, router } from '@inertiajs/react';
import { Search, Package, Clock3, CheckCircle2, Layers, ChevronRight, Users } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';

interface FulfillmentOrder {
  id: number;
  invoice: string;
  customer: string;
  assigned_to: string;
  date: string;
  time: string;
  items_count: number;
  overall_status: 'pending' | 'in_progress' | 'checked';
  items: Array<{
    id: number;
    name: string;
    qty: number;
    fulfillment_status: string;
  }>;
}

interface Props {
  orders: { data: FulfillmentOrder[]; current_page: number; last_page: number; total: number; links: any[] };
  filters: Record<string, string>;
}

const STATUS_COLOR: Record<string, string> = {
  pending:     'bg-slate-50 border border-slate-200 text-slate-600',
  in_progress: 'bg-blue-50 border border-blue-100 text-blue-700',
  checked:     'bg-emerald-50 border border-emerald-100 text-emerald-700',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', in_progress: 'In Progress', checked: 'Complete',
};

const ITEM_STATUS_DOT: Record<string, string> = {
  checked: 'bg-emerald-500', processed: 'bg-blue-500', picked: 'bg-violet-500', pending: 'bg-slate-300',
};

const ITEM_STATUS_BADGE: Record<string, string> = {
  checked: 'bg-emerald-100 text-emerald-700', processed: 'bg-blue-100 text-blue-700',
  picked: 'bg-violet-100 text-violet-700', pending: 'bg-slate-100 text-slate-600',
};

export default function FulfillmentIndex({ orders, filters = {} }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [applying, setApplying] = useState(false); // eslint-disable-line

  const total     = orders.total ?? orders.data.length;
  const pending   = orders.data.filter(o => o.overall_status === 'pending').length;
  const inProg    = orders.data.filter(o => o.overall_status === 'in_progress').length;
  const done      = orders.data.filter(o => o.overall_status === 'checked').length;

  const applyFilters = () => {
    setApplying(true);
    const q: Record<string, string> = {};
    if (search.trim()) q.search = search.trim();
    router.get('/fulfillment', q, { preserveState: true, preserveScroll: true, replace: true, onFinish: () => setApplying(false) });
  };

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Order Fulfillment', href: '/fulfillment' },
  ];

  return (
    <>
      <Head title="Order Fulfillment" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="w-full space-y-6 pb-20">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Order Fulfillment</h1>
              <p className="text-xs font-medium text-slate-500 mt-1.5">Track and process assigned orders</p>
            </div>
          </div>

          {/* Metric chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Total Assigned', value: total, subText: 'All orders', border: 'border-slate-200', bg: 'bg-white', icon: <Layers className="h-3.5 w-3.5" /> },
              { label: 'Pending',        value: pending, subText: 'Not started', border: 'border-amber-100', bg: 'bg-amber-50/30', valueColor: 'text-amber-700', icon: <Clock3 className="h-3.5 w-3.5" /> },
              { label: 'In Progress',    value: inProg,  subText: 'Being processed', border: 'border-blue-100', bg: 'bg-blue-50/30', valueColor: 'text-blue-700', icon: <Package className="h-3.5 w-3.5" /> },
              { label: 'Completed',      value: done,    subText: 'Fully checked', border: 'border-emerald-100', bg: 'bg-emerald-50/30', valueColor: 'text-emerald-700', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
            ].map((s, i) => (
              <div key={i} className={`rounded-xl border ${s.border} px-3 py-2.5 shadow-sm hover:shadow-md transition-all ${s.bg}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="bg-white p-1 rounded-lg shadow-sm text-slate-500 border border-slate-100">{s.icon}</div>
                  <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-400">Fulfillment</span>
                </div>
                <p className={`text-sm font-bold tabular-nums leading-none ${s.valueColor || 'text-slate-900'}`}>{s.value}</p>
                <p className="text-[10px] font-semibold text-slate-700 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Orders table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider shrink-0">Fulfillment Queue</span>
              <div className="flex items-center gap-2 ml-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    placeholder="Search invoice..."
                    className="pl-9 pr-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-slate-50 focus:bg-white transition-all w-52 text-slate-900 placeholder:text-slate-400"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && applyFilters()}
                  />
                </div>
                <button onClick={applyFilters} disabled={applying}
                  className="h-7 px-3 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50 shrink-0">
                  {applying ? '...' : 'Search'}
                </button>
              </div>
              <span className="text-xs font-semibold text-slate-500 shrink-0">{total} order(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[11px] font-semibold text-slate-400">
                    <th className="px-5 py-3 text-left">Invoice</th>
                    <th className="px-5 py-3 text-left">Customer</th>
                    <th className="px-5 py-3 text-left">Assigned To</th>
                    <th className="px-5 py-3 text-left">Items</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <Users className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                        <p className="text-sm font-semibold text-slate-400">No assigned orders found</p>
                      </td>
                    </tr>
                  ) : orders.data.map(order => {
                    const checkedCount = order.items.filter(i => i.fulfillment_status === 'checked').length;
                    const pct = order.items.length > 0 ? Math.round((checkedCount / order.items.length) * 100) : 0;
                    return (
                      <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-blue-600 font-semibold">{order.invoice}</td>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-900">{order.customer}</p>
                        </td>
                        <td className="px-5 py-3 text-xs font-bold text-slate-700">{order.assigned_to}</td>
                        <td className="px-5 py-3">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap gap-1">
                              {order.items.slice(0, 3).map(item => (
                                <span key={item.id} className="flex items-center gap-1 text-[10px] font-bold bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md text-slate-700">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ITEM_STATUS_DOT[item.fulfillment_status] ?? ITEM_STATUS_DOT.pending}`} />
                                  {item.name.length > 16 ? item.name.slice(0, 15) + '…' : item.name} ×{item.qty}
                                </span>
                              ))}
                              {order.items.length > 3 && (
                                <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-500">+{order.items.length - 3} more</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 bg-slate-100 rounded-full h-1 max-w-[80px]">
                                <div className={`h-1 rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[9px] font-bold text-slate-500">{pct}%</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center justify-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg ${STATUS_COLOR[order.overall_status] ?? STATUS_COLOR.pending}`}>
                            {STATUS_LABEL[order.overall_status] ?? order.overall_status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs font-semibold text-slate-600">{order.date}<br />{order.time}</td>
                        <td className="px-5 py-3 text-right">
                          <a href={`/fulfillment/${order.invoice}`}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all">
                            Process <ChevronRight className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {orders.last_page > 1 && (
            <div className="flex justify-center gap-1.5">
              {orders.links.map((link: any) => (
                <button key={link.label} disabled={!link.url}
                  onClick={() => link.url && router.get(link.url)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${link.active ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40'}`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          )}

        </div>
      </AppLayout>
    </>
  );
}
