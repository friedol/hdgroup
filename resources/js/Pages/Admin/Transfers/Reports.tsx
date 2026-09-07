import { Head } from "@inertiajs/react";
import { ArrowRightLeft, Layers, Calendar, Filter } from "lucide-react";
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";
import { KpiCard } from "@/components/dashboard/KpiCard";

interface TransferItem {
  unique_id: string;
  source_store: string;
  destination_store: string;
  staff_name: string;
  staff_recommeded: string;
  created_at: string;
  total_quantity: number;
  total_buying_value?: number;
  total_selling_value?: number;
}

interface Props {
  transfers: TransferItem[];
  totalQuantity: number;
  totalBuyingValue?: number;
  totalSellingValue?: number;
}

const money = (n: number) =>
  `TZS ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function TransfersReports({ transfers, totalQuantity, totalBuyingValue = 0, totalSellingValue = 0 }: Props) {
  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Transfers", href: "/transfers" },
    { title: "Reports", href: "#" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Transfer Reports" />

      <div className="space-y-8 animate-in fade-in duration-500 font-['Nunito_Sans']">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 capitalize">Transfer Audit & Analytics</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <KpiCard
            title="Total Transfer Batches"
            value={transfers.length.toLocaleString()}
            change={0}
            icon={ArrowRightLeft}
            bgClass="bg-blue-50/50"
            iconBgClass="bg-blue-100 text-blue-600"
            className="font-['Nunito_Sans']"
          />
          <KpiCard
            title="Total Units Transferred"
            value={totalQuantity.toLocaleString()}
            change={0}
            icon={Layers}
            bgClass="bg-emerald-50/50"
            iconBgClass="bg-emerald-100 text-emerald-600"
            className="font-['Nunito_Sans']"
          />
          <KpiCard
            title="Stock Cost (Buying)"
            value={money(totalBuyingValue)}
            change={0}
            icon={Calendar}
            bgClass="bg-amber-50/50"
            iconBgClass="bg-amber-100 text-amber-600"
            className="font-['Nunito_Sans']"
          />
          <KpiCard
            title="Sale Value (Selling)"
            value={money(totalSellingValue)}
            change={0}
            icon={Layers}
            bgClass="bg-violet-50/50"
            iconBgClass="bg-violet-100 text-violet-600"
            className="font-['Nunito_Sans']"
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900 capitalize">Detailed Movement Logs</h2>
          </div>
          <Table>
            <TableHeader className="bg-slate-50/75">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-xs font-medium text-slate-500 py-3 pl-6">Transfer Ref</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 py-3">Source Store</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 py-3">Destination Store</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 py-3 text-center">Units</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 py-3 text-right">Buying Value</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 py-3 text-right">Selling Value</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 py-3">Staff</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 py-3 text-right pr-6">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center text-slate-400">No transfer reports found.</TableCell>
                </TableRow>
              ) : (
                transfers.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                    <TableCell className="pl-6 py-4 font-semibold text-xs text-slate-900">{item.unique_id}</TableCell>
                    <TableCell className="text-xs text-slate-700 capitalize">{item.source_store}</TableCell>
                    <TableCell className="text-xs text-slate-700 capitalize">{item.destination_store}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2">
                        {item.total_quantity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold text-blue-700">{money(item.total_buying_value ?? 0)}</TableCell>
                    <TableCell className="text-right text-xs font-semibold text-emerald-700">{money(item.total_selling_value ?? 0)}</TableCell>
                    <TableCell className="text-xs text-slate-700 capitalize">{item.staff_name || item.staff_recommeded}</TableCell>
                    <TableCell className="text-right pr-6 text-xs text-slate-600">{new Date(item.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
