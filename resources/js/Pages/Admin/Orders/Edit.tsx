import { Head, Link, useForm } from '@inertiajs/react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  History,
  Save,
  ShoppingCart,
  User,
} from 'lucide-react';
import { FormEvent } from 'react';
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

interface SaleEditData {
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
}

interface Props {
  sale: SaleEditData;
  items: SaleItem[];
  payments: SalePayment[];
  change_logs: ChangeLog[];
  total_profit: number;
}

const fmt = (n: number) =>
  'TZS ' + Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtDate = (d: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const statusStyle = (s: string) => {
  if (s === 'Paid') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'Partially Paid') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
};

export default function EditSaleOrder({ sale, items, payments, change_logs, total_profit }: Props) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sales orders', href: '/orders-crud' },
    { title: sale.invoice_number, href: `/orders-crud/${sale.invoice_number}` },
    { title: 'Edit', href: '#' },
  ];

  const { data, setData, put, processing, errors } = useForm({
    payment_method: sale.payment_method ?? '',
    payment_status: sale.payment_status,
    notes: sale.notes ?? '',
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    put(`/orders-crud/${sale.invoice_number}`);
  };

  return (
    <>
      <Head title={`Edit ${sale.invoice_number}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="w-full max-w-[1700px] mx-auto px-2 md:px-3 space-y-4 pb-20">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href={`/orders-crud/${sale.invoice_number}`}>
                <Button variant="ghost" size="icon" className="h-9 w-9 border border-slate-200 rounded-lg bg-white shadow-sm hover:bg-slate-50">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900 tracking-tight font-mono">{sale.invoice_number}</h1>
                  <Badge variant="outline" className={`rounded-md px-2 py-0.5 font-bold text-[10px] border uppercase ${statusStyle(sale.payment_status)}`}>
                    {sale.payment_status}
                  </Badge>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded uppercase">Editing</span>
                </div>
                <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> {fmtDate(sale.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <form onSubmit={submit}>
                <Button type="submit" disabled={processing} className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-2">
                  <Save className="h-3.5 w-3.5" /> {processing ? 'Saving…' : 'Save changes'}
                </Button>
              </form>
              <Link href={`/orders-crud/${sale.invoice_number}`}>
                <Button variant="outline" className="h-9 px-4 border-slate-200 rounded-lg font-bold text-xs">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'PAYABLE',   value: fmt(sale.payable_amount), color: 'text-slate-900',    border: 'border-l-blue-500' },
              { label: 'COLLECTED', value: fmt(sale.amount_paid),    color: 'text-emerald-600',  border: 'border-l-emerald-500' },
              { label: 'BALANCE',   value: fmt(sale.balance),        color: sale.balance > 0 ? 'text-rose-600' : 'text-slate-400', border: 'border-l-rose-500' },
              { label: 'PROFIT',    value: fmt(total_profit),        color: 'text-indigo-600',   border: 'border-l-indigo-500' },
            ].map((k) => (
              <div key={k.label} className={`border border-slate-200 border-l-4 ${k.border} rounded-lg p-3 shadow-sm bg-white`}>
                <p className="text-[10px] font-bold uppercase tracking-tight text-slate-500 mb-1">{k.label}</p>
                <p className={`text-base font-bold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">

            {/* Left — read-only details */}
            <div className="space-y-4">

              {/* Items table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                    <h2 className="text-xs font-bold text-slate-500 uppercase">Sale items</h2>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-md">{items.length} products</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/20">
                        <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Product</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Unit</th>
                        <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Qty</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Discount</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Subtotal</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">{item.display_name || item.product_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.product_sku || 'N/A'}</p>
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-slate-700">{fmt(item.unit_price)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs font-bold text-slate-700">{item.quantity}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-rose-500">{item.discount > 0 ? `-${fmt(item.discount)}` : '—'}</td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-slate-900">{fmt(item.subtotal)}</td>
                          <td className={`px-4 py-3 text-right text-xs font-bold ${item.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(item.profit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col items-end gap-1">
                  {sale.discount_amount > 0 && <p className="text-xs font-bold text-rose-600">Discount: -{fmt(sale.discount_amount)}</p>}
                  {sale.tax_amount > 0 && <p className="text-xs font-bold text-amber-700">Tax: +{fmt(sale.tax_amount)}</p>}
                  <p className="text-base font-bold text-slate-900">Net: {fmt(sale.payable_amount)}</p>
                </div>
              </div>

              {/* Payment history */}
              {payments.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    <h2 className="text-xs font-bold text-slate-500 uppercase">Payment history</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/20">
                          <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Date</th>
                          <th className="text-right px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Amount</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Method</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Reference</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Recorded by</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {payments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 text-[11px] font-bold text-slate-600">{fmtDate(p.payment_date)}</td>
                            <td className="px-4 py-3 text-right text-xs font-bold text-emerald-600">{fmt(p.amount_paid)}</td>
                            <td className="px-4 py-3 text-[11px] font-bold text-slate-600">{p.payment_method}</td>
                            <td className="px-4 py-3 text-[11px] font-mono text-slate-500">{p.reference || '—'}</td>
                            <td className="px-4 py-3 text-[11px] font-bold text-slate-500">{p.recorded_by}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Change log */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2">
                  <History className="h-4 w-4 text-violet-600" />
                  <h2 className="text-xs font-bold text-slate-500 uppercase">Change log</h2>
                </div>
                {change_logs.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-400 text-xs font-bold">No changes recorded yet</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {change_logs.map((log) => (
                      <div key={log.id} className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="text-xs font-bold text-slate-700">{fmtDate(log.created_at)}</p>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase">{log.action}</Badge>
                          <p className="text-xs font-bold text-slate-500">by {log.changed_by_name}</p>
                        </div>
                        <p className="text-xs font-bold text-slate-700">{log.description}</p>
                        {log.changes && Object.entries(log.changes).map(([field, diff]) => (
                          <p key={field} className="text-[11px] font-mono text-slate-500 mt-1">
                            {field}: {String(diff.old ?? '—')} → {String(diff.new ?? '—')}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right — editable form + customer info */}
            <div className="space-y-4">

              {/* Edit form */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <h2 className="text-xs font-bold text-slate-500 uppercase">Edit order</h2>
                </div>
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Payment method</label>
                    <select
                      value={data.payment_method}
                      onChange={(e) => setData('payment_method', e.target.value)}
                      className="w-full h-10 px-3 text-xs font-bold border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Mobile">Mobile</option>
                      <option value="Bank">Bank</option>
                    </select>
                    {errors.payment_method && <p className="text-[11px] text-rose-600 mt-1 font-bold">{errors.payment_method}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Payment status</label>
                    <select
                      value={data.payment_status}
                      onChange={(e) => setData('payment_status', e.target.value as SaleEditData['payment_status'])}
                      className="w-full h-10 px-3 text-xs font-bold border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                    {errors.payment_status && <p className="text-[11px] text-rose-600 mt-1 font-bold">{errors.payment_status}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Internal notes</label>
                    <textarea
                      rows={5}
                      value={data.notes}
                      onChange={(e) => setData('notes', e.target.value)}
                      placeholder="Add context for this order update…"
                      className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-y"
                    />
                    {errors.notes && <p className="text-[11px] text-rose-600 mt-1 font-bold">{errors.notes}</p>}
                  </div>

                  <Button type="submit" disabled={processing} className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2">
                    <Save className="h-3.5 w-3.5" /> {processing ? 'Saving…' : 'Save changes'}
                  </Button>
                </form>
              </div>

              {/* Customer card */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-blue-600" />
                  <h2 className="text-xs font-bold text-slate-500 uppercase">Customer</h2>
                </div>
                <p className="text-sm font-bold text-slate-900 uppercase">{sale.customer_name}</p>
                {sale.customer_phone && <p className="text-xs font-bold text-slate-500 mt-1">{sale.customer_phone}</p>}
                <p className="text-xs text-slate-500 mt-3 font-bold">Cashier: <span className="text-slate-700">{sale.cashier_name}</span></p>
              </div>

              {/* Notes read-only (if exist) */}
              {sale.notes && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <h2 className="text-xs font-bold text-slate-500 uppercase">Current notes</h2>
                  </div>
                  <p className="text-xs font-bold text-slate-700 whitespace-pre-wrap">{sale.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
