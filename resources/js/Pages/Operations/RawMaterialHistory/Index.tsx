import { Head } from '@inertiajs/react';
import { Layers, ArrowUpRight, Archive } from 'lucide-react';
import React from 'react';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface RawMaterialUsageRow {
  size: string;
  color: string;
  amount: number;
  pcs_per_roll: number;
  outgoing: number;
  remain: number;
}

interface RawMaterialHistoryProps {
  rawMaterialUsage: RawMaterialUsageRow[];
  rawMaterialUsageTotals: {
    amount: number;
    pcs_per_roll_total: number;
    outgoing: number;
    remain: number;
  };
}

export default function RawMaterialHistoryIndex({ rawMaterialUsage = [], rawMaterialUsageTotals }: RawMaterialHistoryProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Manufacturing', href: '#' },
    { title: 'Raw Material History', href: '#' },
  ];

  return (
    <>
      <Head title="Raw Material History" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Raw Material Usage</h1>

            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 border-slate-200 shadow-sm">
              <p className="text-[11px] text-slate-500 font-semibold">TOTAL AMOUNT</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{(rawMaterialUsageTotals?.amount || 0).toLocaleString()}</p>
            </Card>
            <Card className="p-4 border-slate-200 shadow-sm">
              <p className="text-[11px] text-slate-500 font-semibold">PCS @1ROLL</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{(rawMaterialUsageTotals?.pcs_per_roll_total || 0).toLocaleString()}</p>
            </Card>
            <Card className="p-4 border-amber-200 bg-amber-50 shadow-sm">
              <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1"><ArrowUpRight className="h-3.5 w-3.5" /> OUTGOING</p>
              <p className="text-2xl font-black text-amber-700 mt-1">{(rawMaterialUsageTotals?.outgoing || 0).toLocaleString()}</p>
            </Card>
            <Card className="p-4 border-emerald-200 bg-emerald-50 shadow-sm">
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1"><Archive className="h-3.5 w-3.5" /> REMAIN</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{(rawMaterialUsageTotals?.remain || 0).toLocaleString()}</p>
            </Card>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 md:px-5 py-4 border-b bg-slate-50/60">
              <h2 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">Raw Material Usage Table</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[11px] font-semibold text-slate-500">
                    <th className="px-5 py-3 text-left">Roll Size</th>
                    <th className="px-5 py-3 text-left">Colour</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right">PCS @1ROLL</th>
                    <th className="px-5 py-3 text-right">Outgoing</th>
                    <th className="px-5 py-3 text-right">Remain</th>
                  </tr>
                </thead>
                <tbody>
                  {rawMaterialUsage.length > 0 ? (
                    rawMaterialUsage.map((row, index) => (
                      <tr key={`${row.size}-${row.color}-${index}`} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-800">{row.size}</td>
                        <td className="px-5 py-3 font-semibold text-slate-700">{row.color}</td>
                        <td className="px-5 py-3 text-right font-bold text-slate-900 tabular-nums">{(row.amount || 0).toLocaleString()}</td>
                        <td className="px-5 py-3 text-right font-bold text-slate-700 tabular-nums">{(row.pcs_per_roll || 0).toLocaleString()}</td>
                        <td className="px-5 py-3 text-right font-bold text-amber-700 tabular-nums">{(row.outgoing || 0).toLocaleString()}</td>
                        <td className="px-5 py-3 text-right font-bold text-emerald-700 tabular-nums">{(row.remain || 0).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-xs font-semibold">No raw material usage data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
