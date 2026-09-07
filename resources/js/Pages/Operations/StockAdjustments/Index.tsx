import { Head, router, Link, usePage } from "@inertiajs/react";
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Layers,
  Store as StoreIcon,
  Calendar,
  MoreHorizontal,
  ArrowRightLeft,
  XCircle,
  Info
} from "lucide-react";
import React, { useMemo, useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/layouts/app-layout";
import { KpiCard } from "@/components/dashboard/KpiCard";

interface Product {
  id: number;
  name?: string;
  product_name?: string;
  sku?: string;
  product_type?: 'trading' | 'manufactured' | 'raw_material' | string;
  category?: string;
  variants?: { id: number; color?: string; qty?: number }[];
}

interface RawMaterial {
  id: number;
  name: string;
  code: string;
  category?: string;
  color?: string;
}

interface Store {
  id: number;
  name?: string;
  store_name?: string;
}

interface User {
  id: number;
  name: string;
}

interface StockAdjustment {
  id: number;
  product_id: number;
  product_type: string;
  store_id: number;
  user_id: number;
  adjustment_type: 'Damage' | 'Loss' | 'Correction' | 'Expiry';
  quantity: number;
  reason: string;
  notes?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  product?: Product | RawMaterial;
  store?: Store;
  user?: User;
  created_at: string;
}

interface Props {
  adjustments: {
    data: StockAdjustment[];
    links: any[];
    current_page: number;
    last_page: number;
    total: number;
  };
  products: Product[];
  rawMaterials: RawMaterial[];
  stores: Store[];
}

export default function StockAdjustmentsIndex({ adjustments, products, rawMaterials, stores }: Props) {
  const { props } = usePage<any>();
  const flash = props.flash as { success?: string; error?: string } | undefined;
  const [searchTerm, setSearchTerm] = useState('');

  /* ── SweetAlert on redirect from create page ── */
  useEffect(() => {
    if (flash?.success) {
      Swal.fire({
        icon: 'success',
        title: 'Adjustment Applied!',
        text: flash.success,
        confirmButtonColor: '#059669',
        confirmButtonText: 'Great!',
        timer: 4000,
        timerProgressBar: true,
      });
    }
    if (flash?.error) {
      Swal.fire({ icon: 'error', title: 'Failed', text: flash.error, confirmButtonColor: '#dc2626' });
    }
  }, [flash?.success, flash?.error]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 capitalize px-2 font-medium">approved</Badge>;
      case 'Rejected':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-50 capitalize px-2 font-medium">rejected</Badge>;
      default:
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50 capitalize px-2 font-medium">pending</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'App\\Models\\Product' ? <Package className="h-4 w-4 text-emerald-600" /> : <Layers className="h-4 w-4 text-emerald-600" />;
  };

  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Inventory", href: "/inventory" },
    { title: "Stock Adjustments", href: "/stock-adjustments" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Stock Adjustments" />
      
      <div className="space-y-8 animate-in fade-in duration-500 font-['Nunito_Sans']">
        
        {/* Header Section */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 capitalize font-['Nunito_Sans']">Stock Adjustments</h1>
          </div>
          
          <Link href="/stock-adjustments/create">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md capitalize font-medium shadow-sm transition-all active:scale-95">
              <Plus className="h-4 w-4 mr-2" /> New Adjustment
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-['Nunito_Sans'] font-normal">
           {[
             { title: "Total Actions", value: adjustments.total.toLocaleString(), change: 0, icon: ArrowRightLeft, bgClass: "bg-blue-50/50", iconBgClass: "bg-blue-100 text-blue-600" },
             { title: "Pending Review", value: adjustments.data.filter(a => a.status === 'Pending').length.toLocaleString(), change: 0, icon: Info, bgClass: "bg-amber-50/50", iconBgClass: "bg-amber-100 text-amber-600" },
             { title: "Loss/Damage", value: adjustments.data.filter(a => ['Damage', 'Loss'].includes(a.adjustment_type)).length.toLocaleString(), change: 0, icon: XCircle, bgClass: "bg-rose-50/50", iconBgClass: "bg-rose-100 text-rose-600" },
             { title: "Applied Fixed", value: adjustments.data.filter(a => a.status === 'Approved').length.toLocaleString(), change: 0, icon: CheckCircle2, bgClass: "bg-emerald-50/50", iconBgClass: "bg-emerald-100 text-emerald-600" },
           ].map((k, i) => (
             <div key={k.title} className={`animate-fade-up stagger-${i + 1}`}>
               <KpiCard {...k} className="shadow-sm hover:shadow-md transition-shadow font-['Nunito_Sans']" />
             </div>
           ))}
        </div>

        {/* Filters and Table Area */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
          <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search by product or reason..." 
                  className="pl-10 h-10 border-slate-200 text-xs rounded-md focus:ring-emerald-500 bg-white font-['Nunito_Sans']"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" className="h-10 text-xs font-medium capitalize text-slate-600 border-slate-200 rounded-md font-['Nunito_Sans']">
                   <Filter className="h-3 w-3 mr-2 text-slate-400" /> All Branches
                </Button>
                <Button variant="outline" className="h-10 text-xs font-medium capitalize text-slate-600 border-slate-200 rounded-md font-['Nunito_Sans']">
                   <Calendar className="h-3 w-3 mr-2 text-slate-400" /> This Month
                </Button>
             </div>
          </div>

          <div className="overflow-x-auto font-['Nunito_Sans']">
            <Table>
              <TableHeader className="bg-slate-50/75">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="text-xs font-medium text-slate-500 py-3 pl-6 capitalize">Adjusted Item</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 text-center capitalize">Type</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 capitalize">Store Branch</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 text-center capitalize">Quantity</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 capitalize">Status</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 capitalize">Technician</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 py-3 text-right pr-6 px-10 capitalize">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.data.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={7} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center opacity-40">
                           <ArrowRightLeft className="h-10 w-10 mb-2 text-slate-400" />
                           <p className="text-sm font-medium capitalize text-slate-500">No adjustments found</p>
                        </div>
                     </TableCell>
                  </TableRow>
                ) : (
                  adjustments.data.map((adj) => (
                    <TableRow key={adj.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 rounded-md bg-slate-50 flex items-center justify-center border border-slate-100">
                              {getTypeIcon(adj.product_type)}
                           </div>
                           <div>
                              <p className="text-xs font-semibold text-slate-900 capitalize">
                                {adj.product?.name || (adj.product as any)?.product_name || 'Unknown Item'}
                                {adj.product_type === 'App\\Models\\RawMaterial' && (adj.product as any)?.color && ` - ${(adj.product as any).color}`}
                                {adj.product_type === 'App\\Models\\Product' && (adj as any).variant_color && ` - ${(adj as any).variant_color}`}
                              </p>
                              <p className="text-[10px] text-slate-500 capitalize mt-0.5 max-w-[200px] truncate italic">
                                 {adj.reason}
                              </p>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <Badge variant="outline" className="text-[10px] font-medium capitalize border-slate-200 text-slate-600">
                            {adj.adjustment_type}
                         </Badge>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-1.5">
                            <StoreIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs text-slate-700 font-normal capitalize">{(adj.store?.store_name || adj.store?.name) ?? 'Main Stock'}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <div className={`text-xs font-semibold ${adj.quantity < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {adj.quantity > 0 ? '+' : ''}{adj.quantity.toLocaleString()}
                         </div>
                      </TableCell>
                      <TableCell>
                         {getStatusBadge(adj.status)}
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-medium text-slate-700 border border-slate-200">
                               {adj.user?.name?.charAt(0) ?? 'U'}
                            </div>
                            <span className="text-xs text-slate-700 font-normal capitalize">{adj.user?.name ?? 'System'}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-right pr-6 px-10">
                         <p className="text-xs font-medium text-slate-700">{new Date(adj.created_at).toLocaleDateString()}</p>
                         <p className="text-[10px] text-slate-500">{new Date(adj.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between font-['Nunito_Sans']">
             <p className="text-xs font-normal text-slate-500 capitalize">showing {adjustments.data.length} of {adjustments.total} corrections</p>
             <div className="flex gap-1">
                <Button 
                   variant="outline" 
                   size="sm" 
                   disabled={adjustments.current_page === 1}
                   onClick={() => router.visit(`?page=${adjustments.current_page - 1}`)}
                   className="h-8 rounded-md text-xs font-medium capitalize border-slate-200"
                >
                   previous
                </Button>
                <Button 
                   variant="outline" 
                   size="sm"
                   disabled={adjustments.current_page === adjustments.last_page}
                   onClick={() => router.visit(`?page=${adjustments.current_page + 1}`)}
                   className="h-8 rounded-md text-xs font-medium capitalize border-slate-200"
                >
                   next
                </Button>
             </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
