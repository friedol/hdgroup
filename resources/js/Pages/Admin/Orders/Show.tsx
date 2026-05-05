import { Head, Link, router } from '@inertiajs/react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit,
  FileText,
  History,
  Package,
  Printer,
  ShoppingCart,
  Truck,
  Trash2,
  TrendingUp,
  User,
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

interface SaleItem {
  id: number;
  product_name: string;
  display_name?: string;
  product_sku: string;
  unit_price: number;
  quantity: number;
  discount: number;
  subtotal: number;
  profit: number;
  variant_color?: string | null;
  print_type?: string | null;
}

interface SalePayment {
  id: number;
  amount_paid: number;
  payment_method: string;
  reference: string;
  payment_date: string;
  recorded_by: string;
}

interface ChangeLog {
  id: number;
  changed_by_name: string;
  action: string;
  description: string;
  changes: Record<string, { old: string | null; new: string | null }> | null;
  created_at: string;
}

interface SaleData {
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  cashier_name: string;
  payment_method: string;
  payment_status: 'Paid' | 'Partially Paid' | 'Unpaid';
  discount_amount: number;
  tax_amount: number;
  payable_amount: number;
  amount_paid: number;
  balance: number;
  notes: string | null;
  created_at: string;
  delivery_status?: string | null;
  can_manage_delivery?: boolean;
}

interface LegacyOrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  discount: number;
  item_total: number;
  product_sku: string;
}

interface LegacyOrderDetail {
  unique_id: string;
  name: string;
  email: string;
  phone_number: string;
  city: string;
  cargo: string;
  payment_method: string;
  amount_paid: number;
  balance: number;
  created_at: string;
  is_checked: boolean | number;
}

interface Props {
  is_pos_sale?: boolean;
  sale?: SaleData;
  items?: SaleItem[];
  payments?: SalePayment[];
  change_logs?: ChangeLog[];
  total_profit?: number;
  orders?: LegacyOrderItem[];
  ordersDetail?: LegacyOrderDetail;
  orderId?: string;
}

const fmt = (n: number) =>
  'TZS ' + Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtDate = (d: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const paymentStatusStyle = (s: string) => {
  if (s === 'Paid') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'Partially Paid') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
};

function PosSaleOrderView({
  sale,
  items,
  payments,
  change_logs,
  total_profit,
}: {
  sale: SaleData;
  items: SaleItem[];
  payments: SalePayment[];
  change_logs: ChangeLog[];
  total_profit: number;
}) {
  const normalizeDelivery = (raw?: string | null) => {
    const s = (raw || 'pending').toLowerCase();
    if (s === 'approved') return 'confirmed';
    if (s === 'complete' || s === 'completed') return 'delivered';
    if (['pending', 'confirmed', 'processing', 'in_transit', 'delivered', 'rejected', 'cancelled'].includes(s)) {
      return s;
    }
    return 'pending';
  };

  const [deliveryStatus, setDeliveryStatus] = useState(normalizeDelivery(sale.delivery_status));
  const [updatingDelivery, setUpdatingDelivery] = useState(false);
  const canManageDelivery = !!sale.can_manage_delivery && !['rejected', 'cancelled'].includes(deliveryStatus);

  const handleUpdateDelivery = (newStatus: string) => {
    if (!canManageDelivery || newStatus === deliveryStatus) return;

    setUpdatingDelivery(true);
    router.post(
      `/online-orders/${sale.invoice_number}/delivery-status`,
      { status: newStatus },
      {
        onSuccess: () => {
          setDeliveryStatus(newStatus);
          setUpdatingDelivery(false);
        },
        onError: () => {
          setUpdatingDelivery(false);
          alert('Failed to update delivery status');
        },
      }
    );
  };

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sales orders', href: '/orders-crud' },
    { title: sale.invoice_number, href: '#' },
  ];

  return (
    <>
      <Head title={`Sale ${sale.invoice_number}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-8 pb-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => window.history.back()}
                variant="ghost"
                size="icon"
                className="h-10 w-10 border border-slate-200 rounded-lg bg-white shadow-sm hover:bg-slate-50"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none font-mono">{sale.invoice_number}</h1>
                  <Badge variant="outline" className={`rounded-md px-2 py-1 font-bold text-[10px] border tracking-wider uppercase ${paymentStatusStyle(sale.payment_status)}`}>
                    {sale.payment_status}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-slate-400 mt-1.5 flex items-center gap-2">
                  <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] uppercase">POS Sale</span>
                  <span className="text-slate-200">|</span>
                  <Calendar className="h-3.5 w-3.5" /> {fmtDate(sale.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/orders-crud/${sale.invoice_number}/edit`}>
                <Button className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-2">
                  <Edit className="h-4 w-4" /> Edit
                </Button>
              </Link>
              <Button
                onClick={() => window.open(`/finance/invoices/${encodeURIComponent(sale.invoice_number)}/receipt`, '_blank', 'width=450,height=700')}
                variant="outline"
                className="h-10 px-5 border-slate-200 rounded-lg font-bold text-xs flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" /> Print
              </Button>
              <Button
                variant="outline"
                className="h-10 w-10 p-0 border-rose-200 rounded-lg text-rose-500 hover:bg-rose-50"
                onClick={() => {
                  if (confirm('Permanently delete this sale?')) {
                    router.delete(`/orders-crud/${sale.invoice_number}`);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: 'PAYABLE', value: fmt(sale.payable_amount), color: 'text-slate-900', border: 'border-l-blue-500' },
              { label: 'COLLECTED', value: fmt(sale.amount_paid), color: 'text-emerald-600', border: 'border-l-emerald-500' },
              { label: 'BALANCE', value: fmt(sale.balance), color: sale.balance > 0 ? 'text-rose-600' : 'text-slate-400', border: 'border-l-rose-500' },
              { label: 'PROFIT', value: fmt(total_profit), color: 'text-indigo-600', border: 'border-l-indigo-500' },
            ].map((k) => (
              <div key={k.label} className={`border border-slate-200 border-l-4 ${k.border} rounded-lg p-4 shadow-sm bg-white`}>
                <p className="text-[10px] font-medium uppercase tracking-tight text-slate-500 mb-2">{k.label}</p>
                <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {canManageDelivery && (() => {
            const deliverySteps = [
              { key: 'pending', label: 'Pending', icon: Package, desc: 'Order received' },
              { key: 'confirmed', label: 'Confirmed', icon: Package, desc: 'Order verified' },
              { key: 'processing', label: 'Processing', icon: Clock, desc: 'Being prepared' },
              { key: 'in_transit', label: 'In Transit', icon: Truck, desc: 'On the way' },
              { key: 'delivered', label: 'Delivered', icon: CheckCircle2, desc: 'Completed' },
            ];
            const statusOrder = ['pending', 'confirmed', 'processing', 'in_transit', 'delivered'];
            const currentIdx = Math.max(0, statusOrder.indexOf(deliveryStatus));

            return (
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Delivery Pipeline</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Click a stage to advance the order</p>
                  </div>
                  {updatingDelivery && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="animate-spin h-3.5 w-3.5 border-2 border-slate-400 border-t-transparent rounded-full" />
                      Updating...
                    </div>
                  )}
                </div>
                <div className="relative flex justify-between items-start">
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-100 -z-0">
                    <div
                      className="h-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${(currentIdx / (deliverySteps.length - 1)) * 100}%` }}
                    />
                  </div>
                  {deliverySteps.map((step, idx) => {
                    const Icon = step.icon;
                    const isCompleted = idx < currentIdx;
                    const isCurrent = idx === currentIdx;
                    const isClickable = idx > currentIdx && idx === currentIdx + 1;

                    return (
                      <div
                        key={step.key}
                        className={`relative z-10 flex flex-col items-center gap-2 text-center w-[20%] ${isClickable && !updatingDelivery ? 'cursor-pointer group' : 'cursor-default'}`}
                        onClick={() => isClickable && !updatingDelivery && handleUpdateDelivery(step.key)}
                        title={isClickable ? `Advance to ${step.label}` : undefined}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all
                          ${isCompleted ? 'bg-emerald-400 text-white' : isCurrent ? 'bg-amber-400 text-slate-900' : isClickable ? 'bg-white border-2 border-dashed border-amber-300 text-amber-400 group-hover:bg-amber-50' : 'bg-white border-2 border-slate-200 text-slate-300'}`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className={`text-xs font-bold tracking-tight ${isCompleted ? 'text-emerald-700' : isCurrent ? 'text-slate-900' : isClickable ? 'text-amber-600' : 'text-slate-400'}`}>
                            {step.label}
                          </p>
                          <p className={`text-[10px] ${isCompleted ? 'text-emerald-400' : isCurrent ? 'text-slate-500' : 'text-slate-300'}`}>
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-8">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                    <h2 className="text-xs font-bold text-slate-500 uppercase">Sale items</h2>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded-md">{items.length} products</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-50 bg-slate-50/20">
                        <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Product</th>
                        <th className="text-right px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Unit</th>
                        <th className="text-center px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Qty</th>
                        <th className="text-right px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Discount</th>
                        <th className="text-right px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Subtotal</th>
                        <th className="text-right px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">{item.display_name || item.product_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.product_sku || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4 text-right text-xs font-bold text-slate-700">{fmt(item.unit_price)}</td>
                          <td className="px-6 py-4 text-center"><span className="px-2.5 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700">{item.quantity}</span></td>
                          <td className="px-6 py-4 text-right text-xs font-bold text-rose-500">{item.discount > 0 ? `-${fmt(item.discount)}` : '—'}</td>
                          <td className="px-6 py-4 text-right text-xs font-bold text-slate-900">{fmt(item.subtotal)}</td>
                          <td className={`px-6 py-4 text-right text-xs font-bold ${item.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(item.profit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col items-end gap-1.5">
                  {sale.discount_amount > 0 && <p className="text-xs font-bold text-rose-600">Discount: -{fmt(sale.discount_amount)}</p>}
                  {sale.tax_amount > 0 && <p className="text-xs font-bold text-amber-700">Tax: +{fmt(sale.tax_amount)}</p>}
                  <p className="text-lg font-bold text-slate-900">Net: {fmt(sale.payable_amount)}</p>
                </div>
              </div>

              {payments.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    <h2 className="text-xs font-bold text-slate-500 uppercase">Payment history</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-50 bg-slate-50/20">
                          <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Date</th>
                          <th className="text-right px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Amount</th>
                          <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Method</th>
                          <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Reference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {payments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4 text-[11px] font-bold text-slate-600">{fmtDate(p.payment_date)}</td>
                            <td className="px-6 py-4 text-right text-xs font-bold text-emerald-600">{fmt(p.amount_paid)}</td>
                            <td className="px-6 py-4 text-[11px] font-bold text-slate-600">{p.payment_method}</td>
                            <td className="px-6 py-4 text-[11px] font-mono text-slate-500">{p.reference || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/30 flex items-center gap-3">
                  <History className="h-4 w-4 text-violet-600" />
                  <h2 className="text-xs font-bold text-slate-500 uppercase">Change log</h2>
                </div>
                {change_logs.length === 0 ? (
                  <div className="px-8 py-10 text-center text-slate-400 text-sm font-bold">No changes recorded yet</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {change_logs.map((log) => (
                      <div key={log.id} className="px-8 py-4">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="text-xs font-bold text-slate-700">{fmtDate(log.created_at)}</p>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase">{log.action}</Badge>
                          <p className="text-xs font-bold text-slate-500">by {log.changed_by_name}</p>
                        </div>
                        <p className="text-xs text-slate-700 font-bold">{log.description}</p>
                        {log.changes && Object.entries(log.changes).map(([field, diff]) => (
                          <p key={field} className="text-[11px] font-mono text-slate-500 mt-1">
                            {field}: {String(diff.old ?? '—')} {'->'} {String(diff.new ?? '—')}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <User className="h-4 w-4 text-blue-600" />
                  <h2 className="text-xs font-bold text-slate-500 uppercase">Customer</h2>
                </div>
                <p className="text-sm font-bold text-slate-900 uppercase">{sale.customer_name}</p>
                {sale.customer_phone && <p className="text-xs font-bold text-slate-500 mt-1">{sale.customer_phone}</p>}
                <p className="text-xs text-slate-500 mt-3">Cashier: <span className="font-bold text-slate-700">{sale.cashier_name}</span></p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <h2 className="text-xs font-bold text-slate-500 uppercase">Payment</h2>
                </div>
                <p className="text-xs text-slate-600 font-bold">Method: <span className="font-bold text-slate-800">{sale.payment_method}</span></p>
                <div className="mt-3">
                  <Badge variant="outline" className={`text-[10px] font-bold uppercase rounded-md ${paymentStatusStyle(sale.payment_status)}`}>{sale.payment_status}</Badge>
                </div>
              </div>

              {sale.notes && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <h2 className="text-xs font-bold text-slate-500 uppercase">Notes</h2>
                  </div>
                  <p className="text-xs font-bold text-slate-700">{sale.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}

function LegacyOrderView({ orders, ordersDetail, orderId, totalProfit }: {
  orders: LegacyOrderItem[];
  ordersDetail: LegacyOrderDetail;
  orderId: string;
  totalProfit: number;
}) {
  const subtotal = orders.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalDiscount = orders.reduce((sum, item) => sum + (item.discount * item.quantity), 0);
  const netTotal = orders.reduce((sum, item) => sum + item.item_total, 0);

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sales orders', href: '/orders-crud' },
    { title: orderId, href: '#' },
  ];

  return (
    <>
      <Head title={`Order ${orderId}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-8 pb-20">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button onClick={() => window.history.back()} variant="ghost" size="icon" className="h-10 w-10 border border-slate-200 rounded-lg bg-white shadow-sm hover:bg-slate-50">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">{orderId}</h1>
                <p className="text-sm font-medium text-slate-400 mt-1.5">{fmtDate(ordersDetail.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => router.visit(`/orders-crud/${orderId}/edit`)} className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold">Process fulfillment</Button>
              <Button onClick={() => { window.location.href = `/orders/print/${orderId}`; }} variant="outline" className="h-10 px-5 border-slate-200 rounded-lg text-xs font-bold">Print order</Button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/30">
              <h2 className="text-xs font-bold text-slate-500 uppercase">Order items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/10">
                    <th className="text-left px-8 py-4 text-[10px] font-bold text-slate-400 uppercase">Product</th>
                    <th className="text-right px-8 py-4 text-[10px] font-bold text-slate-400 uppercase">Unit</th>
                    <th className="text-center px-8 py-4 text-[10px] font-bold text-slate-400 uppercase">Qty</th>
                    <th className="text-right px-8 py-4 text-[10px] font-bold text-slate-400 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-8 py-5">
                        <p className="text-xs font-bold text-slate-800 uppercase">{item.product_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">SKU: {item.product_sku}</p>
                      </td>
                      <td className="px-8 py-5 text-right text-xs font-bold text-slate-600">{fmt(item.price)}</td>
                      <td className="px-8 py-5 text-center"><span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700">{item.quantity}</span></td>
                      <td className="px-8 py-5 text-right text-xs font-bold text-slate-900">{fmt(item.item_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 text-slate-900 text-right">
              <p className="text-xs font-bold text-slate-500">Gross: {fmt(subtotal)}</p>
              {totalDiscount > 0 && <p className="text-xs font-bold text-rose-600">Discount: -{fmt(totalDiscount)}</p>}
              <p className="text-lg font-bold mt-1">Net: {fmt(netTotal)}</p>
              <p className="text-xs font-bold text-emerald-600 mt-1">Collected: {fmt(ordersDetail.amount_paid)}</p>
              {ordersDetail.balance > 0 && <p className="text-xs font-bold text-rose-600">Balance: {fmt(ordersDetail.balance)}</p>}
              <p className="text-xs font-bold text-indigo-600 mt-1">Profit: {fmt(totalProfit)}</p>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}

export default function ShowOrder(props: Props) {
  if (props.is_pos_sale && props.sale) {
    return (
      <PosSaleOrderView
        sale={props.sale}
        items={props.items ?? []}
        payments={props.payments ?? []}
        change_logs={props.change_logs ?? []}
        total_profit={props.total_profit ?? 0}
      />
    );
  }

  return (
    <LegacyOrderView
      orders={props.orders ?? []}
      ordersDetail={props.ordersDetail as LegacyOrderDetail}
      orderId={props.orderId ?? ''}
      totalProfit={props.total_profit ?? 0}
    />
  );
}
