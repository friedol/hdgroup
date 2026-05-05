import { Head, Link } from '@inertiajs/react';
import { 
  Plus, 
  Search, 
  Target, 
  TrendingUp, 
  Activity, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  Layers,
  CheckCircle2,
  Clock
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Card,
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppLayout from '@/layouts/app-layout';

interface ProductionOrder {
  id: number;
  order_number: string;
  bom_id?: number;
  roll_id?: number;
  bag_width?: number;
  bag_length?: number;
  bags_produced?: number;
  quantity_to_produce?: number;
  total_cost?: number;
  revenue?: number;
  gross_profit?: number;
  status: string;
  created_at: string;
  store?: { store_name: string };
  product?: { product_name: string };
  roll?: { name: string };
}

interface ProductionOrdersIndexProps {
  orders: { 
    data: ProductionOrder[]; 
    current_page: number; 
    per_page: number; 
    total: number;
    last_page: number;
  };
}

export default function ProductionOrdersIndex({ orders }: ProductionOrdersIndexProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Manufacturing', href: '#' },
    { title: 'Production Records', href: '#' }
  ];

  // Derive simple metrics from current page
  const totalProduced = orders.data.reduce((sum, o) => sum + (Number(o.bags_produced || o.quantity_to_produce) || 0), 0);
  const totalRevenue = orders.data.reduce((sum, o) => sum + (Number(o.revenue) || 0), 0);
  const completedCount = orders.data.filter(o => o.status === 'completed' || o.status === 'produced').length;

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'produced':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-lg px-2 py-0.5 text-[10px] font-bold"><CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Completed</Badge>;
      case 'in_progress':
      case 'approved':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 rounded-lg px-2 py-0.5 text-[10px] font-bold"><Activity className="h-2.5 w-2.5 mr-1" /> Processing</Badge>;
      case 'draft':
        return <Badge className="bg-slate-100 text-slate-500 border-none rounded-lg px-2 py-0.5 text-[10px] font-bold"><Clock className="h-2.5 w-2.5 mr-1" /> Draft</Badge>;
      default:
        return <Badge variant="secondary" className="rounded-lg px-2 py-0.5 text-[10px] font-bold">{status}</Badge>;
    }
  };

  return (
    <>
      <Head title="Production Records" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-1xl font-bold tracking-tight text-slate-900">Production Records</h1>

            </div>
            <div className="flex gap-2">
               <Link href="/production/roll-based">
                 <Button variant="outline" className="border-slate-200 text-slate-600 font-bold rounded-lg px-6">
                   <Plus className="h-4 w-4 mr-2" /> Roll Batch
                 </Button>
               </Link>
        
            </div>
          </div>

          {/* Metrics Card Context (deriving from data) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-amber-200 bg-amber-50 rounded-lg shadow-sm flex items-center gap-5 p-6 transition-all hover:bg-amber-100/50">
              <div className="bg-white p-3 rounded-lg shadow-sm"><Layers className="h-6 w-6 text-amber-600" /></div>
              <div>
                <p className="text-xs font-semibold text-amber-700 tracking-tight">Orders Count</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{orders.total || 0}</p>
              </div>
            </Card>
            <Card className="border-amber-200 bg-white rounded-lg shadow-sm flex items-center gap-5 p-6">
              <div className="bg-amber-50 p-3 rounded-lg"><CheckCircle2 className="h-6 w-6 text-amber-600" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 tracking-tight">Units Produced</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{totalProduced.toLocaleString()} <span className="text-xs text-slate-400 font-medium">Bags</span></p>
              </div>
            </Card>
            <Card className="border-amber-200 bg-amber-50 rounded-lg shadow-sm flex items-center gap-5 p-6 transition-all hover:bg-amber-100/50">
              <div className="bg-white p-3 rounded-lg shadow-sm"><TrendingUp className="h-6 w-6 text-amber-600" /></div>
              <div>
                <p className="text-xs font-semibold text-amber-700 tracking-tight">Generated Revenue</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{totalRevenue.toLocaleString()} <span className="text-xs text-slate-400 font-medium">TZS</span></p>
              </div>
            </Card>
          </div>

          {/* Table Area */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-4 border-b bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative w-full md:w-96">
                   <Search className="absolute left-3 top-3  h-4 w-4 text-slate-400" />
                   <Input 
                     placeholder="Search records by batch ID or product..." 
                     className="pl-10 h-10 border-slate-200 focus:ring-slate-400 rounded-lg text-xs"
                   />
                </div>
                <div className="flex items-center gap-2">
                   <Button variant="outline" size="sm" className="h-10 px-4 rounded-lg font-bold text-slate-600 border-slate-200">History Filter</Button>
                </div>
            </div>

            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b-slate-200">
                  <TableHead className="w-24 font-bold text-slate-800">Order ID</TableHead>
                  <TableHead className="font-bold text-slate-800">Product / Method</TableHead>
                  <TableHead className="font-bold text-slate-800">Destination Store</TableHead>
                  <TableHead className="font-bold text-slate-800 text-right">Yield (Qty)</TableHead>
                  <TableHead className="font-bold text-slate-800 text-right">Revenue (Est)</TableHead>
                  <TableHead className="font-bold text-slate-800">Status</TableHead>
                  <TableHead className="font-bold text-slate-800 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.data?.length > 0 ? (
                  orders.data.map((order) => {
                    const yieldQty = order.bags_produced || order.quantity_to_produce || 0;
                    const isRollBased = !!order.roll_id;

                    return (
                      <TableRow key={order.id} className="hover:bg-slate-50 border-b-slate-100 transition-colors">
                        <TableCell className="font-black text-amber-600 tracking-tighter text-xs">
                          <Link href={`/production-orders/${order.id}`}>
                             {order.order_number}
                          </Link>
                        </TableCell>
                        <TableCell>
                           <div className="flex flex-col">
                             <span className="font-bold text-slate-700 line-clamp-1">
                               {order.product?.product_name || (order.roll_id ? `${order.roll?.name} ${order.bag_width}x${order.bag_length}cm Bag` : "New Batch")}
                             </span>
                             <span className="text-[10px] text-slate-400 font-medium">
                               From: {order.roll?.name || "Inventory"}
                             </span>
                           </div>
                        </TableCell>
                        <TableCell className="font-bold text-slate-800 text-xs">{order.store?.store_name || 'Main Center'}</TableCell>
                        <TableCell className="text-right font-black text-slate-900">
                          {yieldQty.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium tracking-tight">pcs</span>
                        </TableCell>
                        <TableCell className="text-right font-black text-emerald-600">
                          {(order.revenue || 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">TZS</span>
                        </TableCell>
                        <TableCell>
                           {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="flex justify-end gap-1">
                               <Link href={`/production-orders/${order.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                                     <Eye className="h-4 w-4" />
                                  </Button>
                               </Link>
                               <Link href={isRollBased ? `/production/roll-based?id=${order.id}` : `/production-orders-new/${order.id}/edit`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                                     <Edit2 className="h-4 w-4" />
                                  </Button>
                               </Link>
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                                 onClick={() => {
                                   if (confirm('Are you sure you want to delete this production record? This will NOT reverse inventory changes.')) {
                                     import('@inertiajs/react').then(({ router }) => {
                                       router.delete(`/production-orders-new/${order.id}`);
                                     });
                                   }
                                 }}
                               >
                                  <Trash2 className="h-4 w-4" />
                               </Button>
                           </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                     <TableCell colSpan={7} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center opacity-30 grayscale">
                           <Activity className="h-10 w-10 mb-2" />
                           <p className="text-sm font-bold">No production records found</p>
                        </div>
                     </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination Placeholder */}
            {orders?.last_page > 1 && (
              <div className="p-4 border-t bg-slate-50/30 flex items-center justify-between">
                 <p className="text-[10px] font-medium text-slate-500">Page {orders.current_page} of {orders.last_page}</p>
                 <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" disabled={orders.current_page === 1}>
                       <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" disabled={orders.current_page === orders.last_page}>
                       <ChevronRight className="h-4 w-4" />
                    </Button>
                 </div>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}
