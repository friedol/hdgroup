import { Head } from "@inertiajs/react";
import { ArrowRightLeft, Store as StoreIcon, User as UserIcon, Package, Printer, Download } from "lucide-react";
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";

interface TransferItem {
  id: number;
  unique_id: string;
  product_id: number;
  product_name: string;
  product_quantity: number;
  unit_factor: number;
  base_unit: string;
  raw_pieces: number;
  buying_price: number;
  selling_price: number;
  buying_value: number;
  selling_value: number;
  expected_profit: number;
  reason: string;
  status: string | null;
  staff_name: string;
  staff_recommeded: string;
  created_at: string;
  source_store_name: string;
  destination_store_name: string;
}

interface Summary {
  unique_id: string;
  source_store: string | null;
  destination_store: string | null;
  staff_name: string | null;
  staff_recommeded: string | null;
  status: string | null;
  created_at: string | null;
  total_quantity: number;
  total_buying_value: number;
  total_selling_value: number;
  total_expected_profit: number;
  line_count: number;
}

interface Props {
  transfers: TransferItem[];
  summary: Summary;
}

const money = (n: number) => `TZS ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const qty = (n: number) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function TransfersShow({ transfers, summary }: Props) {
  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Transfers", href: "/transfers" },
    { title: summary?.unique_id ?? "Transfer Detail", href: "#" },
  ];

  if (!transfers?.length) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="p-12 text-center text-slate-500 font-['Nunito_Sans']">Transfer record not found.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Transfer ${summary.unique_id}`} />

      <div className="space-y-8 animate-in fade-in duration-500 font-['Nunito_Sans']">
        <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <ArrowRightLeft className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{summary.unique_id}</h1>
              <p className="text-xs text-slate-500">
                Transferred on {summary.created_at ? new Date(summary.created_at).toLocaleString() : "—"} &middot; by {summary.staff_name ?? "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-medium px-3 py-1 capitalize">
              {summary.status ?? "pending"}
            </Badge>
            <a
              href={`/transfers/${summary.unique_id}/print`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 h-9 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </a>
            <a
              href={`/transfers/${summary.unique_id}/print?download=1`}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 h-9 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" /> PDF
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Source Store</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <StoreIcon className="h-4 w-4 text-slate-400" />
                <p className="text-base font-semibold text-slate-900 capitalize">{summary.source_store ?? "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Destination Store</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <StoreIcon className="h-4 w-4 text-emerald-600" />
                <p className="text-base font-semibold text-slate-900 capitalize">{summary.destination_store ?? "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 capitalize">Operator: {summary.staff_name ?? "—"}</p>
                  <p className="text-xs text-slate-500 capitalize">Recommended: {summary.staff_recommeded ?? "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Internal pricing summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Quantity", value: `${qty(summary.total_quantity)} units`, tone: "text-slate-900" },
            { label: "Stock Cost (Buying)", value: money(summary.total_buying_value), tone: "text-blue-700" },
            { label: "Sale Value (Selling)", value: money(summary.total_selling_value), tone: "text-emerald-700" },
            { label: "Expected Sell Profit", value: money(summary.total_expected_profit), tone: "text-amber-700" },
          ].map((c) => (
            <div key={c.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{c.label}</p>
              <p className={`mt-1 text-lg font-bold ${c.tone}`}>{c.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 capitalize">Transferred Items — Internal Pricing</h2>
            <span className="text-[11px] text-slate-400">For internal / office use only</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/75">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="text-xs font-medium text-slate-500 py-3 pl-6">Product</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 text-center">Qty</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 text-center">Raw Pieces</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 text-right">Buying Price</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 text-right">Selling Price</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 text-right">Buying Value</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 text-right pr-6">Selling Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-slate-400" />
                        <div>
                          <span className="text-xs font-semibold text-slate-900 capitalize">{item.product_name}</span>
                          {item.reason ? <p className="text-[11px] text-slate-400 italic">{item.reason}</p> : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2">
                        {qty(item.product_quantity)} {item.base_unit}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-[11px] font-medium text-slate-500">
                      {item.unit_factor > 1 ? `${item.raw_pieces.toLocaleString()} pcs` : "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-slate-600">{money(item.buying_price)}</TableCell>
                    <TableCell className="text-right text-xs text-slate-600">{money(item.selling_price)}</TableCell>
                    <TableCell className="text-right text-xs font-semibold text-blue-700">{money(item.buying_value)}</TableCell>
                    <TableCell className="text-right pr-6 text-xs font-semibold text-emerald-700">{money(item.selling_value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
