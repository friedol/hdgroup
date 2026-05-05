import { Head, router } from '@inertiajs/react';
import {
  ArrowLeft, Receipt, User, Calendar, CreditCard,
  Package, ShoppingCart, DollarSign, Calculator, Printer,
  FileDown, Trash2, Clock, MapPin, Building2, Briefcase
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

/* ─── Types ─────────────────────────────── */
interface SaleItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  subtotal: number;
  unit: string;
}

interface Customer {
  id: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  company_name?: string;
  business_address?: string;
  brought_by?: number;
  is_walking_customer?: boolean;
}

interface Payment {
  id: number;
  amount: number;
  method: string;
  date: string;
}

interface Sale {
  id: number;
  invoice: string;
  total: number;
  discount: number;
  tax: number;
  payable: number;
  paid: number;
  balance: number;
  method: string;
  status: string;
  notes?: string;
  date: string;
  time: string;
  customer: Customer | null;
  cashier: string;
  items: SaleItem[];
  payments: Payment[];
}

interface CustomerStats {
  total_orders: number;
  total_spent: number;
  recent_sales: Array<{
    invoice: string;
    payable: number;
    status: string;
    date: string;
  }>;
}

interface Props {
  sale: Sale;
  customerStats: CustomerStats | null;
}

/* ─── Helpers ────────────────────────────── */
const fmt = (n: number) =>
  'TZS ' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const statusColors = (s: string) => {
  if (s === 'Paid')           {
return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

  if (s === 'Partially Paid') {
return 'bg-amber-50 text-amber-700 border-amber-200';
}

  return 'bg-rose-50 text-rose-700 border-rose-200';
};

/* ─── Component ──────────────────────────── */
export default function ShowSale({ sale, customerStats }: Props) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sales history', href: '/sales-history' },
    { title: sale.invoice, href: '#' },
  ];

  const handlePrint = () => {
    window.location.href = `/pos/print/${sale.invoice}`;
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this sale record? This will revert inventory.')) {
      router.delete(`/pos/sale/${sale.id}`);
    }
  };

  return (
    <>
      <Head title={`Sale ${sale.invoice}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-8 pb-20">

          {/* Header Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button onClick={() => router.visit('/sales-history')} variant="ghost" size="icon" className="h-10 w-10 border border-slate-200 rounded-xl bg-white shadow-sm hover:bg-slate-50">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-[20px] font-medium text-slate-900 tracking-tight leading-none">{sale.invoice}</h1>
                  <Badge variant="outline" className={`rounded-lg px-2.5 py-1 font-semibold text-[10px] border ${statusColors(sale.status)}`}>
                    {sale.status}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-slate-400 mt-1.5 flex items-center gap-2">
                  Reference ID: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-medium">#{sale.id}</span>
                  <span className="text-slate-200">|</span>
                  <Clock className="h-3.5 w-3.5" /> {sale.date} at {sale.time}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button onClick={handlePrint} className="h-11 px-6 bg-slate-900 hover:bg-black text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-slate-900/10">
                <Printer className="h-4 w-4" /> Print receipt
              </Button>
              <Button variant="outline" className="h-11 px-6 border-slate-200 rounded-xl font-medium flex items-center gap-2 bg-white text-slate-700">
                <FileDown className="h-4 w-4" /> Download PDF
              </Button>
              <Button onClick={handleDelete} variant="outline" className="h-11 w-11 p-0 border-slate-200 rounded-xl text-rose-500 hover:bg-rose-50 hover:border-rose-100 flex items-center justify-center bg-white transition-all shadow-sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">

            {/* LEFT COLUMN — Sale Details */}
            <div className="space-y-8">

              {/* Items List */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-up">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                    <h2 className="text-xs font-semibold text-slate-500 tracking-tight">Purchase items</h2>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">{sale.items.length} unique assets</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-6 py-4 text-[10px] font-semibold text-slate-400 tracking-tight">Item description</th>
                        <th className="text-right px-6 py-4 text-[10px] font-semibold text-slate-400 tracking-tight">Price</th>
                        <th className="text-center px-6 py-4 text-[10px] font-semibold text-slate-400 tracking-tight">Quantity</th>
                        <th className="text-right px-6 py-4 text-[10px] font-semibold text-slate-400 tracking-tight">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {sale.items.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-slate-800 leading-tight">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Sale unit: {item.unit}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-xs font-medium text-slate-600">{fmt(item.price)}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">{item.qty} {item.unit}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-semibold text-slate-900 tabular-nums">{fmt(item.subtotal)}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Section */}
                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                  <div className="w-full max-w-[300px] space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-medium text-slate-400 tracking-tight">Order subtotal</p>
                      <p className="text-sm font-semibold text-slate-800">{fmt(sale.total)}</p>
                    </div>
                    {sale.tax > 0 && (
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-medium text-slate-400 tracking-tight">VAT (18%)</p>
                        <p className="text-sm font-semibold text-slate-800">{fmt(sale.tax)}</p>
                      </div>
                    )}
                    {sale.discount > 0 && (
                      <div className="flex justify-between items-center text-rose-600">
                        <p className="text-xs font-medium tracking-tight">Discount applied</p>
                        <p className="text-sm font-semibold">-{fmt(sale.discount)}</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                      <p className="text-sm font-semibold text-slate-600 tracking-tight leading-none">Net payable</p>
                      <p className="text-2xl font-semibold text-blue-600 tracking-tighter leading-none">{fmt(sale.payable)}</p>
                    </div>
                    <div className="flex justify-between items-center pt-4">
                      <p className="text-xs font-medium text-emerald-600 tracking-tight leading-none">Total collected</p>
                      <p className="text-base font-semibold text-emerald-600 tracking-tight leading-none">{fmt(sale.paid)}</p>
                    </div>
                    {sale.balance > 0 && (
                      <div className="flex justify-between items-center p-3 bg-rose-50 rounded-xl border border-rose-100 mt-2">
                         <p className="text-[11px] font-semibold text-rose-700 tracking-tight">Remaining balance</p>
                         <p className="text-base font-semibold text-rose-700 tracking-tight">{fmt(sale.balance)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Transactions / Payments History */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 animate-fade-up">
                 <div className="flex items-center gap-2 mb-8">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-xs font-semibold text-slate-500 tracking-tight">Transaction lifecycle</h2>
                 </div>
                 <div className="space-y-4">
                    {sale.payments.map((p, i) => (
                       <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-hover hover:border-slate-200">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-sm text-emerald-600">
                                <CreditCard className="h-5 w-5" />
                             </div>
                             <div>
                                <p className="text-[11px] font-semibold text-slate-400 leading-none mb-1">Payment #{i+1}</p>
                                <p className="text-sm font-semibold text-slate-800 tracking-tight">{p.method}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-medium text-slate-400 mb-0.5">{p.date}</p>
                             <p className="text-base font-semibold text-emerald-600 leading-none">{fmt(p.amount)}</p>
                          </div>
                       </div>
                    ))}
                    {sale.payments.length === 0 && (
                       <p className="text-center py-10 text-xs font-medium text-slate-400 italic">No payments recorded for this invoice.</p>
                    )}
                 </div>
              </div>

              {/* Notes Section */}
              {sale.notes && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="h-4 w-4 text-slate-400" />
                    <h2 className="text-xs font-semibold text-slate-500 tracking-tight">Accountant notes</h2>
                  </div>
                  <p className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed italic">
                    "{sale.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN — Entity Information */}
            <div className="space-y-8">

              {/* Customer Entity */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-fade-up">
                <div className="flex items-center gap-2 mb-6">
                  <User className="h-4 w-4 text-violet-600" />
                  <h2 className="text-xs font-semibold text-slate-500 tracking-tight">Identity details</h2>
                </div>
                {sale.customer ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-violet-50 flex items-center justify-center border border-violet-100 shadow-sm">
                        <User className="h-7 w-7 text-violet-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 leading-tight">{sale.customer.customer_name}</h3>
                        <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">{sale.customer.is_walking_customer ? 'Retail / Walk-in' : 'Registered customer'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-50">
                      {[
                        { label: 'Primary store contact', value: sale.customer.customer_phone, icon: <DollarSign className="h-3.5 w-3.5" /> },
                        { label: 'Email address',  value: sale.customer.customer_email, icon: <DollarSign className="h-3.5 w-3.5" /> },
                        { label: 'Corporate entity',   value: sale.customer.company_name, icon: <Building2 className="h-3.5 w-3.5" /> },
                        { label: 'Office address',  value: sale.customer.business_address, icon: <MapPin className="h-3.5 w-3.5" /> },
                      ].map(f => f.value && (
                        <div key={f.label} className="space-y-1">
                           <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">{f.label}</p>
                           <p className="text-xs font-semibold text-slate-700 tracking-tight leading-none">{f.value}</p>
                        </div>
                      ))}
                    </div>

                    {customerStats && (
                       <div className="bg-slate-950 rounded-2xl p-6 space-y-4">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Client performance</p>
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <p className="text-[9px] font-medium text-slate-600 uppercase">Liftime orders</p>
                                <p className="text-lg font-semibold text-white">{customerStats.total_orders}</p>
                             </div>
                             <div>
                                <p className="text-[9px] font-medium text-slate-600 uppercase">Lifetime LTV</p>
                                <p className="text-lg font-semibold text-emerald-400 truncate">{fmt(customerStats.total_spent)}</p>
                             </div>
                          </div>
                       </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                     <p className="text-sm font-semibold text-slate-800">Walking customer</p>
                     <p className="text-xs text-slate-400 mt-1">Retail transaction without profile</p>
                  </div>
                )}
              </div>

              {/* Operations Internal */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                 <div className="flex items-center gap-2 mb-6">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    <h2 className="text-xs font-semibold text-slate-500 tracking-tight">Audit context</h2>
                 </div>
                 <div className="space-y-5">
                    <div className="flex justify-between items-center">
                       <span className="text-[11px] font-medium text-slate-400">Cashier desk</span>
                       <span className="text-xs font-semibold text-slate-800">{sale.cashier}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[11px] font-medium text-slate-400">Default gateway</span>
                       <span className="text-xs font-semibold text-blue-600">{sale.method}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[11px] font-medium text-slate-400">Warehouse exit</span>
                       <span className="text-xs font-semibold text-slate-800">Primary Branch</span>
                    </div>
                 </div>
              </div>

            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
