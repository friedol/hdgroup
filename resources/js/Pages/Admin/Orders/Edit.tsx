import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  History,
  Save,
  ShoppingCart,
  User,
  Wallet,
  TrendingUp,
  Scale,
  BadgeCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

interface SaleItem {
  id: number;
  product_id: number;
  product_name: string;
  display_name?: string;
  product_sku: string;
  image?: string | null;
  unit_price: number;
  quantity: number;
  discount: number;
  subtotal: number;
  profit: number;
  variant_color?: string | null;
  print_type?: string | null;
}

interface ProductOption {
  id: number;
  product_name: string;
  selling_price: number;
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
  branch_id?: number | null;
}

interface Branch {
  id: number;
  name: string;
  system_name?: string;
}

interface Props {
  sale: SaleEditData;
  items: SaleItem[];
  products: ProductOption[];
  payments: SalePayment[];
  change_logs: ChangeLog[];
  total_profit: number;
  is_global?: boolean;
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

export default function EditSaleOrder({ sale, items, products, payments, change_logs, total_profit, is_global }: Props) {
  const { branches } = usePage().props as unknown as { branches: Branch[] };
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sales orders', href: '/orders-crud' },
    { title: sale.invoice_number, href: `/orders-crud/${sale.invoice_number}` },
    { title: 'Edit', href: '#' },
  ];

  const isWithin24Hours = (Date.now() - new Date(sale.created_at).getTime()) <= 24 * 60 * 60 * 1000;

  const { data, setData, put, processing, errors } = useForm({
    payment_method: sale.payment_method ?? '',
    payment_status: sale.payment_status,
    notes: sale.notes ?? '',
    branch_id: sale.branch_id ?? (null as number | null),
    items: items.map(item => ({
      id: item.id,
      product_id: item.product_id,
      unit_price: item.unit_price,
      variant_color: item.variant_color ?? '',
      quantity: item.quantity,
    })),
  });

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...data.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setData('items', updatedItems);
  };

  const submit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    put(`/orders-crud/${sale.invoice_number}`);
  };

  return (
    <>
      <Head title={`Edit ${sale.invoice_number}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="w-full space-y-4 pb-20">

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

          {/* Stat cards — dashboard style */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {([
              {
                label: 'Total Payable',
                value: fmt(sale.payable_amount),
                sub: 'Order value',
                icon: Wallet,
                bg: 'bg-blue-50/50',
                border: 'border-blue-200',
                iconBg: 'bg-blue-100 text-blue-600',
                chip: 'bg-blue-50/80 text-blue-700',
                chipLabel: 'Invoice',
              },
              {
                label: 'Amount Collected',
                value: fmt(sale.amount_paid),
                sub: 'Payments received',
                icon: BadgeCheck,
                bg: 'bg-emerald-50/50',
                border: 'border-emerald-200',
                iconBg: 'bg-emerald-100 text-emerald-600',
                chip: 'bg-emerald-50/80 text-emerald-700',
                chipLabel: 'Paid',
              },
              {
                label: 'Outstanding Balance',
                value: fmt(sale.balance),
                sub: sale.balance > 0 ? 'Still owed' : 'Fully settled',
                icon: Scale,
                bg: sale.balance > 0 ? 'bg-rose-50/50' : 'bg-slate-50/50',
                border: sale.balance > 0 ? 'border-rose-200' : 'border-slate-200',
                iconBg: sale.balance > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500',
                chip: sale.balance > 0 ? 'bg-rose-50/80 text-rose-700' : 'bg-slate-100 text-slate-500',
                chipLabel: sale.balance > 0 ? 'Owing' : 'Clear',
              },
              {
                label: 'Estimated Profit',
                value: fmt(total_profit),
                sub: 'Selling price minus cost',
                icon: TrendingUp,
                bg: total_profit >= 0 ? 'bg-indigo-50/50' : 'bg-rose-50/50',
                border: total_profit >= 0 ? 'border-indigo-200' : 'border-rose-200',
                iconBg: total_profit >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600',
                chip: total_profit >= 0 ? 'bg-indigo-50/80 text-indigo-700' : 'bg-rose-50/80 text-rose-700',
                chipLabel: total_profit >= 0 ? 'Profit' : 'Loss',
              },
            ] as const).map((card) => (
              <div
                key={card.label}
                className={`rounded-xl border ${card.border} px-3 py-2.5 ${card.bg} flex items-center gap-3 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
              >
                <div className={`p-1.5 rounded-lg shadow-sm shrink-0 ${card.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                  <card.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-black text-slate-900 tabular-nums leading-none">{card.value}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${card.chip}`}>{card.chipLabel}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 mt-0.5 truncate">{card.label}</p>
                </div>
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
                    {isWithin24Hours ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">Editable (within 24h)</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-[10px] font-bold">Locked (&gt; 24h old)</Badge>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-md">{items.length} products</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/20">
                        <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Product</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Selling Price</th>
                        <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Qty</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Discount</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Subtotal</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            {isWithin24Hours ? (
                              <div className="flex items-start gap-3">
                                {item.image ? (
                                  <img src={item.image} alt={item.product_name} className="h-10 w-10 rounded-lg object-cover border border-slate-100 flex-shrink-0 mt-1" />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-1">
                                    <ShoppingCart className="h-4 w-4 text-slate-400" />
                                  </div>
                                )}
                                <div className="space-y-2 flex-1 max-w-xs">
                                <select
                                  value={data.items[index]?.product_id ?? item.product_id}
                                  onChange={e => {
                                    const pid = Number(e.target.value);
                                    const found = products?.find(p => p.id === pid);
                                    const updatedItems = [...data.items];
                                    updatedItems[index] = {
                                      ...updatedItems[index],
                                      product_id: pid,
                                      unit_price: found?.selling_price ?? updatedItems[index]?.unit_price ?? 0,
                                    };
                                    setData('items', updatedItems);
                                  }}
                                  className="w-full h-8 px-2 text-xs font-bold border border-slate-200 rounded bg-white outline-none focus:border-blue-400"
                                >
                                  {products?.map(p => (
                                    <option key={p.id} value={p.id}>{p.product_name} — TZS {(p.selling_price ?? 0).toLocaleString()}</option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  placeholder="Color (e.g. Red)"
                                  value={data.items[index]?.variant_color ?? item.variant_color ?? ''}
                                  onChange={e => handleItemChange(index, 'variant_color', e.target.value)}
                                  className="w-full h-8 px-2 text-xs border border-slate-200 rounded bg-white placeholder:text-slate-400 outline-none focus:border-blue-400"
                                />
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                {item.image ? (
                                  <img src={item.image} alt={item.product_name} className="h-10 w-10 rounded-lg object-cover border border-slate-100 flex-shrink-0" />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <ShoppingCart className="h-4 w-4 text-slate-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">{item.display_name || item.product_name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.product_sku || 'N/A'}</p>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isWithin24Hours ? (
                              <input
                                type="number"
                                value={data.items[index]?.unit_price ?? item.unit_price}
                                onChange={e => handleItemChange(index, 'unit_price', Number(e.target.value))}
                                className="w-24 h-8 px-2 text-xs font-bold text-right border border-slate-200 rounded bg-white outline-none focus:border-blue-400 ml-auto"
                              />
                            ) : (
                              <span className="text-xs font-bold text-slate-700">{fmt(item.unit_price)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs font-bold text-slate-700">{item.quantity}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-rose-500">{item.discount > 0 ? `-${fmt(item.discount)}` : '—'}</td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-slate-900">{fmt((data.items[index]?.unit_price ?? item.unit_price) * item.quantity - item.discount)}</td>
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

                  {is_global && (
                    <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-amber-600" />
                        <label className="block text-[10px] font-bold uppercase text-amber-700">
                          Correct Branch Assignment
                        </label>
                      </div>
                      <p className="text-[10px] text-amber-600 font-bold">
                        This order is currently assigned to: <span className="text-amber-800">{sale.branch_id ? (branches.find(b => b.id === sale.branch_id)?.name ?? `Branch #${sale.branch_id}`) : 'Unassigned (created in Global mode)'}</span>
                      </p>
                      <select
                        value={data.branch_id ?? ''}
                        onChange={(e) => setData('branch_id', e.target.value ? Number(e.target.value) : null)}
                        className="w-full h-10 px-3 text-xs font-bold border border-amber-300 rounded-lg bg-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-100"
                      >
                        <option value="">— Keep unassigned —</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name || b.system_name}</option>
                        ))}
                      </select>
                      {errors.branch_id && <p className="text-[11px] text-rose-600 mt-1 font-bold">{errors.branch_id}</p>}
                    </div>
                  )}

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
