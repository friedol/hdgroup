import { Head, Link } from "@inertiajs/react";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Search,
  Plus
} from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";

interface InventoryReportProps {
  prd: any[];
  totalQty: number;
  inventory_profit: number;
  outStock: any[];
  categories: any[];
}

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Reports", href: "#" },
  { title: "Inventory", href: "/report_inventory" },
];

export default function InventoryReport({ 
  prd, 
  totalQty, 
  inventory_profit, 
  outStock, 
  categories 
}: InventoryReportProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredPrd = React.useMemo(() => {
    if (!prd) {
return [];
}

    return prd.filter(item => 
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [prd, searchTerm]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Inventory Report" />
      <div className="space-y-6 pb-10">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Report</h1>
            <p className="text-sm text-slate-500">Asset valuation and stock distribution</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" size="sm">Export Data</Button>
             <Link href="/products-new">
                <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" /> New Adjustment
                </Button>
             </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <Card className="border-emerald-100 shadow-none bg-emerald-50/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Stock</p>
                   <Package className="h-4 w-4 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{(totalQty || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">Units</span></h2>
              </CardContent>
           </Card>
 
           <Card className="border-none shadow-xl shadow-emerald-100 bg-emerald-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                   <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Valuation</p>
                   <DollarSign className="h-4 w-4 text-emerald-300" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">TZS {(inventory_profit || 0).toLocaleString()}</h2>
              </CardContent>
           </Card>
 
           <Card className="border-emerald-100 shadow-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Low Stock</p>
                   <AlertTriangle className="h-4 w-4 text-orange-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{(outStock?.length || 0)} <span className="text-xs font-normal text-slate-400">Triggers</span></h2>
              </CardContent>
           </Card>

           <Card className="border-emerald-100 shadow-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categories</p>
                   <TrendingUp className="h-4 w-4 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold">{(categories?.length || 0)}</h2>
              </CardContent>
           </Card>
        </div>

        <Card className="border-emerald-100 shadow-none overflow-hidden">
          <CardHeader className="bg-emerald-50/50/50 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Live Stock Audit</CardTitle>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                 <Input 
                   placeholder="Search products..." 
                   className="pl-9 h-9 w-[280px]" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-50/50/30">
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500">Product Name</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 text-center">Qty</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 text-right">Unit Price</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 text-right">Valuation</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrd?.map((item, idx) => (
                   <TableRow key={idx}>
                      <TableCell>
                         <div className="space-y-0.5">
                            <p className="text-sm font-medium text-slate-900">{item.product_name}</p>
                            <p className="text-[10px] text-slate-400 tracking-tight">ID: #{item.PRDID || 'N/A'}</p>
                         </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">{(item.pro_quantity || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm">TZS {(item.product_price || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">TZS {((item.pro_quantity || 0) * (item.product_price || 0)).toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                         {(item.pro_quantity || 0) <= 5 ? (
                            <Badge variant="destructive" className="text-[9px] h-5 px-1.5 uppercase font-bold">Low</Badge>
                         ) : (
                            <Badge variant="secondary" className="text-[9px] h-5 px-1.5 uppercase font-bold text-emerald-700 bg-emerald-50">OK</Badge>
                         )}
                      </TableCell>
                   </TableRow>
                ))}
              </TableBody>
            </Table>
            {!filteredPrd?.length && (
               <div className="py-20 text-center text-slate-400 italic text-sm">No products found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
