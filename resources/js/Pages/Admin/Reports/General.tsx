import { Head, Link } from "@inertiajs/react";
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  ArrowUpRight, 
  Wallet,
  Building2,
  ChevronRight
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
import AppLayout from "@/layouts/app-layout";

interface GeneralAnalyticsProps {
  totalSales: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  inventoryValue: number;
  totalPurchases: number;
  outstandingLoans: number;
  categories: any[];
}

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Reports", href: "#" },
  { title: "Business Intelligence", href: "/analytics" },
];

export default function BusinessIntelligence({ 
  totalSales, 
  totalExpenses, 
  grossProfit, 
  netProfit, 
  inventoryValue, 
  outstandingLoans, 
  categories 
}: GeneralAnalyticsProps) {
  
  const operationalEfficiency = ((totalSales - totalExpenses) / (totalSales || 1)) * 100;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Business Intelligence" />
      <div className="space-y-6 pb-10">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Intelligence</h1>
            <p className="text-sm text-slate-500">Consolidated financial and operational metrics</p>
          </div>
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 font-semibold px-3 py-1">
             Live Data Feed
          </Badge>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-2">
                 <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    Total Sales <DollarSign className="h-4 w-4 text-blue-500" />
                 </CardTitle>
              </CardHeader>
              <CardContent>
                 <h2 className="text-2xl font-bold">TZS {(totalSales || 0).toLocaleString()}</h2>
                 <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Gross contribution: TZS {(grossProfit || 0).toLocaleString()}</p>
                 <Link href="/report_sales" className="inline-flex items-center text-[10px] font-bold text-blue-600 hover:text-blue-700 mt-4 uppercase">
                    View Sales Audit <ChevronRight className="ml-1 h-3 w-3" />
                 </Link>
              </CardContent>
           </Card>

           <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-2">
                 <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    Total Expenses <ShoppingCart className="h-4 w-4 text-rose-500" />
                 </CardTitle>
              </CardHeader>
              <CardContent>
                 <h2 className="text-2xl font-bold">TZS {(totalExpenses || 0).toLocaleString()}</h2>
                 <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">System Outflows</p>
                 <Link href="/report_expenses" className="inline-flex items-center text-[10px] font-bold text-rose-600 hover:text-rose-700 mt-4 uppercase">
                    View Expenses <ChevronRight className="ml-1 h-3 w-3" />
                 </Link>
              </CardContent>
           </Card>

           <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-2">
                 <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    Inventory Value <Package className="h-4 w-4 text-amber-500" />
                 </CardTitle>
              </CardHeader>
              <CardContent>
                 <h2 className="text-2xl font-bold">TZS {(inventoryValue || 0).toLocaleString()}</h2>
                 <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Across {(categories?.length || 0)} Categories</p>
                 <Link href="/report_inventory" className="inline-flex items-center text-[10px] font-bold text-amber-600 hover:text-amber-700 mt-4 uppercase">
                    Detailed Asset Map <ChevronRight className="ml-1 h-3 w-3" />
                 </Link>
              </CardContent>
           </Card>

           <Card className={`border-slate-200 shadow-none ${netProfit >= 0 ? 'bg-emerald-50/30' : 'bg-rose-50/30'}`}>
              <CardHeader className="pb-2">
                 <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    Net Yield <TrendingUp className={`h-4 w-4 ${netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
                 </CardTitle>
              </CardHeader>
              <CardContent>
                 <h2 className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    TZS {(netProfit || 0).toLocaleString()}
                 </h2>
                 <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Efficiency: {operationalEfficiency.toFixed(1)}%</p>
              </CardContent>
           </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <Card className="border-slate-200 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-lg font-bold">Market Exposure</CardTitle>
                    <p className="text-xs text-slate-500">Outstanding credit and performance</p>
                 </div>
                 <Link href="/loans">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                       <ArrowUpRight className="h-4 w-4" />
                    </Button>
                 </Link>
              </CardHeader>
              <CardContent>
                 <div className="p-6 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Loans</p>
                    <h3 className="text-3xl font-bold text-slate-900">TZS {(outstandingLoans || 0).toLocaleString()}</h3>
                    <div className="mt-4 flex items-center gap-2">
                       <Badge variant="outline" className="text-[10px] bg-white">External Audit</Badge>
                       <span className="text-[10px] text-slate-400 italic font-medium">Status: Synchronized</span>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-slate-200 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-lg font-bold">Portfolio Map</CardTitle>
                    <p className="text-xs text-slate-500">Category-based asset weighting</p>
                 </div>
                 <Link href="/categories-crud">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                       <ArrowUpRight className="h-4 w-4" />
                    </Button>
                 </Link>
              </CardHeader>
              <CardContent>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white border border-slate-100 rounded-lg">
                       <div className="flex items-center gap-2 mb-1">
                          <Building2 className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-bold">{(categories?.length || 0)}</span>
                       </div>
                       <p className="text-[10px] text-slate-400 uppercase font-black">Categories</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-100 rounded-lg">
                       <div className="flex items-center gap-2 mb-1">
                          <ShoppingCart className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm font-bold">Live</span>
                       </div>
                       <p className="text-[10px] text-slate-400 uppercase font-black">POS Connect</p>
                    </div>
                 </div>
                 <div className="mt-4 p-3 bg-slate-900 rounded-lg text-center font-bold text-[10px] text-slate-400 uppercase tracking-widest">
                    Asset Weight Index: Stable
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </AppLayout>
  );
}
