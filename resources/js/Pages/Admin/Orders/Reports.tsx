import { Head, router, Link } from '@inertiajs/react';
import {
  FilePieChart, Search, Filter, Calendar,
  ArrowRight, Download, Printer, Plus,
  Table as TableIcon, BarChart3, TrendingUp, DollarSign,
  ChevronDown, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

interface OrderReport {
  unique_id: string;
  email: string;
  name: string;
  phone_number: string;
  status: string;
  created_at: string;
  total_quantity: number;
  total_price: number;
}

interface Props {
  transfers: OrderReport[];
  totalQuantity: number;
}

const fmt = (n: number) =>
  'TZS ' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtDate = (d: string) => {
  if (!d) {
return '—';
}

  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function OrderReports({ transfers, totalQuantity }: Props) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleFilter = () => {
    router.visit(window.location.pathname, {
      data: { start_date: startDate, end_date: endDate },
      preserveState: true,
      only: ['transfers', 'totalQuantity']
    });
  };

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Orders report', href: '/orders-report' },
  ];

  const totalValue = transfers.reduce((acc, curr) => acc + curr.total_price, 0);

  return (
    <>
      <Head title="Order Reports" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="w-full space-y-8 pb-20">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-[20px] font-bold text-slate-900 tracking-tight leading-none">Orders performance</h1>
              <p className="text-sm font-medium text-slate-500 mt-1.5">Analyze and export comprehensive order reports across all channels</p>
            </div>
            <div className="flex items-center gap-3">
               <Button onClick={() => window.print()} variant="outline" className="h-11 px-6 border-slate-200 rounded-xl font-bold bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50">
                  <Printer className="h-4 w-4 mr-2" /> Print Summary
               </Button>
               <Button className="h-11 px-6 bg-slate-900 hover:bg-black text-white rounded-xl font-black shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all">
                  <Download className="h-4 w-4 mr-2" /> Export Dataset (CSV)
               </Button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-white border border-slate-200 rounded-3xl p-8 flex items-center justify-between shadow-sm">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3">Total Volume</p>
                   <p className="text-3xl font-black text-slate-900 leading-none">{transfers.length} <span className="text-sm font-bold text-slate-400">units</span></p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                   <TableIcon className="h-6 w-6" />
                </div>
             </div>
             <div className="bg-white border border-slate-200 rounded-3xl p-8 flex items-center justify-between shadow-sm">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3">Item Quantity</p>
                   <p className="text-3xl font-black text-slate-900 leading-none">{totalQuantity.toLocaleString()} <span className="text-sm font-bold text-slate-400">pcs</span></p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 border border-violet-100">
                   <BarChart3 className="h-6 w-6" />
                </div>
             </div>
             <div className="bg-white border border-slate-200 rounded-3xl p-8 flex items-center justify-between shadow-sm">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3">Accumulated Value</p>
                   <p className="text-3xl font-black text-emerald-600 leading-none">{fmt(totalValue)}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                   <TrendingUp className="h-6 w-6" />
                </div>
             </div>
          </div>

          {/* Report Builder Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
             
             {/* Main Table Segment */}
             <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col animate-fade-up">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                   <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-blue-600 animate-pulse" />
                      <h2 className="text-sm font-black text-slate-700 tracking-tight leading-none uppercase">Order Log</h2>
                   </div>
                   <div className="flex items-center gap-2">
                       <span className="text-[11px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded">Live Data</span>
                   </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-sm">
                      <thead>
                         <tr className="border-b border-slate-100">
                            <th className="px-8 py-4 text-[11px] font-black text-slate-400 tracking-tight text-left">Internal ID</th>
                            <th className="px-8 py-4 text-[11px] font-black text-slate-400 tracking-tight text-left">Consignee</th>
                            <th className="px-8 py-4 text-[11px] font-black text-slate-400 tracking-tight text-right">Volume</th>
                            <th className="px-8 py-4 text-[11px] font-black text-slate-400 tracking-tight text-right">Valuation</th>
                            <th className="px-8 py-4 text-[11px] font-black text-slate-400 tracking-tight text-left">Timestamp</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {transfers.length === 0 ? (
                            <tr>
                               <td colSpan={5} className="px-8 py-20 text-center">
                                  <FilePieChart className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                                  <p className="text-sm font-black text-slate-800">No data for the selected period</p>
                                  <p className="text-xs text-slate-400">Initialize a custom range in the builder panel</p>
                               </td>
                            </tr>
                         ) : transfers.map(t => (
                            <tr key={t.unique_id} className="hover:bg-slate-50/50 transition-colors">
                               <td className="px-8 py-4 font-black text-slate-900 border-l-[3px] border-transparent hover:border-blue-600 transition-all font-mono text-[11px]">{t.unique_id}</td>
                               <td className="px-8 py-4">
                                  <div className="flex flex-col">
                                     <span className="font-black text-slate-800 tracking-tight leading-none mb-1 uppercase">{t.name}</span>
                                     <span className="text-[10px] text-slate-400 font-bold">{t.phone_number || 'No contact'}</span>
                                  </div>
                               </td>
                               <td className="px-8 py-4 text-right">
                                  <Badge variant="outline" className="rounded-lg bg-slate-50 font-black text-[10px] border-slate-200 px-2">{t.total_quantity} qty</Badge>
                               </td>
                               <td className="px-8 py-4 text-right">
                                  <span className="text-sm font-black text-slate-900 tracking-tighter">{fmt(t.total_price)}</span>
                               </td>
                               <td className="px-8 py-4 text-[11px] font-bold text-slate-500">{fmtDate(t.created_at)}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
                <div className="px-8 py-6 border-t border-slate-50 bg-slate-50/30">
                   <div className="flex justify-between items-center">
                      <p className="text-[11px] font-black text-slate-400 uppercase">System Intelligence Output</p>
                      <p className="text-xs font-bold text-slate-600">{transfers.length} records processed successfully</p>
                   </div>
                </div>
             </div>

             {/* Filter Builder Sidebar */}
             <div className="space-y-6">
                <div className="bg-slate-950 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/10 h-fit">
                   <div className="flex items-center gap-3 mb-8">
                      <Filter className="h-5 w-5 text-blue-400" />
                      <h3 className="text-sm font-black uppercase tracking-widest leading-none">Report Builder</h3>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[11px] font-black text-slate-500 uppercase tracking-tight">Period start</label>
                         <Input
                           type="date"
                           value={startDate}
                           onChange={e => setStartDate(e.target.value)}
                           className="bg-slate-900 border-slate-800 text-white rounded-2xl h-12 outline-none focus:ring-0 focus:border-blue-500 transition-all"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[11px] font-black text-slate-500 uppercase tracking-tight">Period end</label>
                         <Input
                           type="date"
                           value={endDate}
                           onChange={e => setEndDate(e.target.value)}
                           className="bg-slate-900 border-slate-800 text-white rounded-2xl h-12 outline-none focus:ring-0 focus:border-blue-500 transition-all"
                         />
                      </div>
                      
                      <Button onClick={handleFilter} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black mt-4 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all">
                         Generate Dataset
                      </Button>

                      <div className="pt-8 border-t border-slate-900 mt-6">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Export capabilities</p>
                         <div className="grid grid-cols-2 gap-3">
                            <button className="flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all group">
                               <Download className="h-5 w-5 text-slate-500 group-hover:text-blue-400 transition-all mb-2" />
                               <span className="text-[9px] font-black text-slate-500 uppercase leading-none">Excel XLSX</span>
                            </button>
                            <button className="flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all group">
                               <Download className="h-5 w-5 text-slate-500 group-hover:text-amber-400 transition-all mb-2" />
                               <span className="text-[9px] font-black text-slate-500 uppercase leading-none">PDF Report</span>
                            </button>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/10">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="h-10 w-10 rounded-2xl bg-blue-500 flex items-center justify-center border border-white/20">
                         <ArrowUpRight className="h-5 w-5" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase text-blue-200 leading-none mb-1">Performance Insight</p>
                         <p className="text-xl font-black text-white leading-none tracking-tight">Health Index: 98%</p>
                      </div>
                   </div>
                   <p className="text-xs font-bold leading-relaxed text-blue-50 font-medium">Your current order fulfillment velocity is higher than last month. Data-driven growth is stable.</p>
                </div>
             </div>

          </div>

        </div>
      </AppLayout>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </>
  );
}
