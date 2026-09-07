import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
  ArrowLeft, Package, CheckCircle2, Clock, User, MapPin,
  DollarSign, ShoppingBag, UserCheck, Zap, Loader2, CheckCircle
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

type FulfillmentStatus = 'pending' | 'picked' | 'processed' | 'checked';

interface SaleItemRow {
  id: number;
  name: string;
  variant_color: string | null;
  print_type: string | null;
  qty: number;
  unit_price: number;
  source_store: string | null;
  fulfillment_status: FulfillmentStatus;
  fulfilled_by: string | null;
  fulfilled_at: string | null;
}

interface SaleData {
  id: number;
  invoice: string;
  customer: string;
  cashier: string;
  assigned_to: string;
  date: string;
  time: string;
  payable: number;
  status: string;
  items: SaleItemRow[];
}

const ITEM_STATUS_COLOR: Record<FulfillmentStatus, string> = {
  pending:   'bg-slate-50 border border-slate-200 text-slate-600',
  picked:    'bg-violet-50 border border-violet-100 text-violet-700',
  processed: 'bg-blue-50 border border-blue-100 text-blue-700',
  checked:   'bg-emerald-50 border border-emerald-100 text-emerald-700',
};

const STATUS_BTN: { value: FulfillmentStatus; label: string; active: string; idle: string }[] = [
  { value: 'pending',   label: 'Pending',   active: 'bg-slate-800 text-white border-slate-800',         idle: 'border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50' },
  { value: 'picked',    label: 'Picked',    active: 'bg-violet-600 text-white border-violet-600',        idle: 'border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50' },
  { value: 'processed', label: 'Processed', active: 'bg-blue-600 text-white border-blue-600',            idle: 'border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50' },
  { value: 'checked',   label: 'Checked ✓', active: 'bg-emerald-600 text-white border-emerald-600',      idle: 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50' },
];

const PAY_BADGE: Record<string, string> = {
  'Paid':           'bg-emerald-50 border border-emerald-100 text-emerald-700',
  'Partially Paid': 'bg-amber-50 border border-amber-100 text-amber-700',
  'Unpaid':         'bg-rose-50 border border-rose-100 text-rose-700',
};

export default function FulfillmentShow({ sale }: { sale: SaleData }) {
  const [items, setItems] = useState<SaleItemRow[]>(sale.items);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'items'>('items');

  const totalItems   = items.length;
  const checkedCount = items.filter(i => i.fulfillment_status === 'checked').length;
  const pendingCount = items.filter(i => i.fulfillment_status === 'pending').length;
  const inProgCount  = items.filter(i => i.fulfillment_status === 'picked' || i.fulfillment_status === 'processed').length;
  const allChecked   = checkedCount === totalItems && totalItems > 0;
  const progressPct  = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const updateItemStatus = async (itemId: number, status: FulfillmentStatus) => {
    setUpdatingId(itemId);
    try {
      const res = await axios.post('/fulfillment/item/status', { item_id: itemId, status });
      if (res.data.success) {
        setItems(prev => prev.map(i =>
          i.id === itemId
            ? { ...i, fulfillment_status: status, fulfilled_by: res.data.fulfilled_by, fulfilled_at: res.data.fulfilled_at }
            : i
        ));
        toast.success(`Item marked as ${status}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const bulkUpdate = async (status: FulfillmentStatus) => {
    setBulkUpdating(true);
    try {
      const res = await axios.post('/fulfillment/bulk-status', { sale_id: sale.id, status });
      if (res.data.success) {
        setItems(prev => prev.map(i => ({ ...i, fulfillment_status: status })));
        toast.success(`All items marked as ${status}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed');
    } finally {
      setBulkUpdating(false);
    }
  };

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Fulfillment', href: '/fulfillment' },
    { title: sale.invoice, href: `/fulfillment/${sale.invoice}` },
  ];

  return (
    <>
      <Head title={`Fulfillment — ${sale.invoice}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="w-full space-y-6 pb-20">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/fulfillment"
                className="h-9 w-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 shadow-sm transition-all">
                <ArrowLeft className="w-4 h-4" />
              </a>
              <div>
                <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">{sale.invoice}</h1>
                <p className="text-xs font-medium text-slate-500 mt-1.5">Order Fulfillment</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {allChecked && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Fully Processed
                </span>
              )}
              <span className={`inline-flex items-center justify-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg ${PAY_BADGE[sale.status] ?? PAY_BADGE.Unpaid}`}>
                {sale.status}
              </span>
            </div>
          </div>

          {/* Metric chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Total Items', value: totalItems,   subText: 'In this order',    border: 'border-slate-200',   bg: 'bg-white',           icon: <Package className="h-3.5 w-3.5" /> },
              { label: 'Pending',     value: pendingCount, subText: 'Not yet started',   border: 'border-amber-100',   bg: 'bg-amber-50/30',     valueColor: 'text-amber-700', icon: <Clock className="h-3.5 w-3.5" /> },
              { label: 'In Progress', value: inProgCount,  subText: 'Being processed',   border: 'border-blue-100',    bg: 'bg-blue-50/30',      valueColor: 'text-blue-700',  icon: <Package className="h-3.5 w-3.5" /> },
              { label: 'Completed',   value: checkedCount, subText: 'Fully checked',     border: 'border-emerald-100', bg: 'bg-emerald-50/30',   valueColor: 'text-emerald-700', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
            ].map((s, i) => (
              <div key={i} className={`rounded-xl border ${s.border} px-3 py-2.5 shadow-sm hover:shadow-md transition-all ${s.bg}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="bg-white p-1 rounded-lg shadow-sm text-slate-500 border border-slate-100">{s.icon}</div>
                  <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-400">{progressPct}%</span>
                </div>
                <p className={`text-sm font-bold tabular-nums leading-none ${(s as any).valueColor || 'text-slate-900'}`}>{s.value}</p>
                <p className="text-[10px] font-semibold text-slate-700 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tab nav */}
          <div className="flex items-center border-b border-slate-200">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 mb-2">
              {([
                { key: 'items', label: `Items (${totalItems})` },
                { key: 'overview', label: 'Order Details' },
              ] as const).map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`rounded-lg text-xs font-semibold px-4 py-1.5 transition-all ${activeTab === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Items tab */}
          {activeTab === 'items' && (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">

              {/* LEFT: Items table card */}
              <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50 pb-4">
                  <CardTitle className="text-sm font-bold text-slate-800">Items to Process</CardTitle>
                  <CardDescription className="text-xs text-slate-400">{totalItems} item(s) — click a status button to update</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[11px] font-semibold text-slate-400">
                          <th className="px-5 py-3 text-left">Product</th>
                          <th className="px-5 py-3 text-center">Qty</th>
                          <th className="px-5 py-3 text-left">Store</th>
                          <th className="px-5 py-3 text-center">Status</th>
                          <th className="px-5 py-3 text-left">Handled by</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => (
                          <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3">
                              <p className="font-semibold text-slate-900 leading-tight">
                                {item.name}
                                {item.variant_color && <span className="text-slate-500 font-medium"> — {item.variant_color}</span>}
                              </p>
                              {item.print_type && (
                                <span className="text-[10px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded mt-0.5 inline-block capitalize">{item.print_type}</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-center font-bold text-slate-900 tabular-nums">{item.qty}</td>
                            <td className="px-5 py-3 text-xs font-semibold text-slate-600">
                              {item.source_store
                                ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-400 shrink-0" />{item.source_store}</span>
                                : <span className="text-slate-400">—</span>
                              }
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className={`inline-flex items-center justify-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg capitalize ${ITEM_STATUS_COLOR[item.fulfillment_status]}`}>
                                {item.fulfillment_status}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs font-semibold text-slate-600">
                              {item.fulfilled_by
                                ? <><span className="font-bold text-slate-800">{item.fulfilled_by}</span><br /><span className="text-[10px] text-slate-400">{item.fulfilled_at}</span></>
                                : <span className="text-slate-400">—</span>
                              }
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {STATUS_BTN.map(opt => (
                                  <button key={opt.value}
                                    onClick={() => updateItemStatus(item.id, opt.value)}
                                    disabled={updatingId === item.id || item.fulfillment_status === opt.value}
                                    className={`h-7 px-2.5 rounded-lg text-[10px] font-bold transition-all border ${
                                      item.fulfillment_status === opt.value ? opt.active : opt.idle
                                    } disabled:cursor-not-allowed flex items-center gap-1`}>
                                    {updatingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* RIGHT: Bulk actions + progress */}
              <div className="space-y-4 xl:sticky xl:top-6">
                {/* Progress */}
                <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b border-slate-50 pb-4">
                    <CardTitle className="text-sm font-bold text-slate-800">Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">{checkedCount} of {totalItems} done</span>
                      <span className={`text-2xl font-black tabular-nums ${allChecked ? 'text-emerald-600' : 'text-slate-900'}`}>{progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className={`h-2.5 rounded-full transition-all duration-700 ${allChecked ? 'bg-emerald-500' : 'bg-blue-600'}`}
                        style={{ width: `${progressPct}%` }} />
                    </div>
                  </CardContent>
                </Card>

                {/* Bulk actions */}
                <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b border-slate-50 pb-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-slate-600" />
                      <CardTitle className="text-sm font-bold text-slate-800">Bulk Update All</CardTitle>
                    </div>
                    <CardDescription className="text-xs text-slate-400">Apply a status to every item at once</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5 grid grid-cols-2 gap-2">
                    {STATUS_BTN.map(opt => (
                      <button key={opt.value} onClick={() => bulkUpdate(opt.value)} disabled={bulkUpdating}
                        className={`flex items-center justify-center gap-1.5 h-9 rounded-xl text-[11px] font-bold border transition-all ${opt.idle} disabled:opacity-50 hover:shadow-sm active:scale-95`}>
                        {bulkUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        All {opt.label}
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Order info */}
              <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50 pb-4">
                  <CardTitle className="text-sm font-bold text-slate-800">Order Information</CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4 text-xs font-semibold text-slate-600">
                  {[
                    { Icon: ShoppingBag, label: 'Invoice',  value: sale.invoice,    mono: true },
                    { Icon: User,        label: 'Customer', value: sale.customer },
                    { Icon: UserCheck,   label: 'Cashier',  value: sale.cashier },
                    { Icon: UserCheck,   label: 'Assignee', value: sale.assigned_to },
                  ].map(row => (
                    <div key={row.label} className="flex items-start gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                      <row.Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{row.label}</p>
                        <p className={`text-sm font-bold text-slate-900 ${(row as any).mono ? 'font-mono' : ''}`}>{row.value}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Payment info */}
              <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50 pb-4">
                  <CardTitle className="text-sm font-bold text-slate-800">Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-3 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                    <span className="text-slate-500">Order Date:</span>
                    <span className="font-bold text-slate-900">{sale.date} {sale.time}</span>
                  </div>
                  <div className="pt-2 flex justify-between items-center font-extrabold text-slate-900 text-sm">
                    <span>Order Total:</span>
                    <span className="text-blue-700">TZS {sale.payable.toLocaleString()}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-50">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Payment Status</p>
                    <span className={`inline-flex items-center justify-center text-[10px] font-bold px-2.5 py-1 rounded-lg ${PAY_BADGE[sale.status] ?? PAY_BADGE.Unpaid}`}>
                      {sale.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </AppLayout>
    </>
  );
}
