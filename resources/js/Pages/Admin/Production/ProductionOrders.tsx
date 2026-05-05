import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { 
  History, 
  ArrowLeft,
  Calendar,
  Package,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import React from 'react';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

interface ProductionOrder {
  id: number;
  order_number: string;
  bag_width: number;
  bag_length: number;
  bags_produced: number;
  revenue: number;
  gross_profit: number;
  created_at: string;
  status: string;
  roll?: { name: string; code: string };
  store?: { store_name: string };
  created_by?: { staff_name: string };
}

interface ProductionOrdersProps {
  orders: { data: ProductionOrder[]; current_page: number; per_page: number; total: number };
}

export default function ProductionOrders({ orders }: ProductionOrdersProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Manufacturing', href: '/production/roll-based' },
    { title: 'Production History', href: '#' }
  ];

  const columns = [
    { 
      key: 'created_at', 
      label: 'Produced Date',
      render: (val: string) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{format(new Date(val), 'MMM dd, yyyy HH:mm')}</span>
        </div>
      ),
      sortable: true
    },
    { 
      key: 'product', 
      label: 'Product Details',
      render: (_: any, row: ProductionOrder) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">
             Bag {row.bag_width}x{row.bag_length}cm
          </span>
          <span className="text-[11px] font-semibold text-slate-400 tracking-tight">
            Roll: {row.roll?.name || 'Raw Fabric'}
          </span>
        </div>
      )
    },
    { 
      key: 'bags_produced', 
      label: 'Batch Yield',
      render: (val: number) => (
        <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 font-bold px-3 py-1 rounded-lg">
          {val.toLocaleString()} Pcs
        </Badge>
      )
    },
    { 
      key: 'revenue', 
      label: 'Gross Revenue',
      render: (val: number) => (
        <div className="flex flex-col">
           <span className="font-bold text-slate-900">{val.toLocaleString()} TZS</span>
           <span className="text-[10px] text-slate-400 font-bold uppercase">Sales Value</span>
        </div>
      )
    },
    { 
      key: 'gross_profit', 
      label: 'Margin Contribution',
      render: (val: number) => (
        <div className="flex flex-col">
           <span className="font-bold text-emerald-600">+{val.toLocaleString()} TZS</span>
           <span className="text-[10px] text-emerald-400 font-bold uppercase">Estimated Gross</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Fulfillment',
      render: (val: string) => (
        <Badge className={
          val === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 rounded-lg px-3' : 
          val === 'draft' ? 'bg-amber-50 text-amber-700 border-amber-100 rounded-lg px-3' : 
          'bg-slate-50 text-slate-700 border-slate-100 rounded-lg px-3'
        }>
          {val.charAt(0).toUpperCase() + val.slice(1)}
        </Badge>
      )
    }
  ];

  return (
    <>
      <Head title="Production History" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b pb-4 border-slate-100">
            <div className="flex items-center gap-4">
               <Button variant="ghost" size="icon" onClick={() => router.visit('/production/roll-based')} className="h-10 w-10 text-slate-400 hover:text-slate-600">
                 <ArrowLeft className="h-5 w-5" />
               </Button>
               <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Production History</h1>
                  <p className="text-xs font-medium text-slate-400">Audit log of all manufacturing runs and yield analytics.</p>
               </div>
            </div>
            <Button onClick={() => router.visit('/production/roll-based')} className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-lg shadow-amber-100">
              <Package className="h-4 w-4 mr-2" /> New Production Batch
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
               <div className="space-y-1">
                 <p className="text-xs font-semibold text-slate-500 uppercase">Recent Activity</p>
                 <p className="text-2xl font-bold text-slate-900">{orders.total.toLocaleString()} Runs</p>
               </div>
               <div className="h-12 w-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400">
                 <History className="h-6 w-6" />
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
               <div className="space-y-1">
                 <p className="text-xs font-semibold text-slate-500 uppercase">Total Items Produced</p>
                 <p className="text-2xl font-bold text-emerald-600">{orders.data.reduce((sum, o) => sum + (o.bags_produced || 0), 0).toLocaleString()} Pcs</p>
               </div>
               <div className="h-12 w-12 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center text-emerald-600">
                 <TrendingUp className="h-6 w-6" />
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
               <div className="space-y-1">
                 <p className="text-xs font-semibold text-slate-500 uppercase">Revenue Analytics</p>
                 <p className="text-2xl font-bold text-amber-600">{orders.data.reduce((sum, o) => sum + (Number(o.revenue) || 0), 0).toLocaleString()} TZS</p>
               </div>
               <div className="h-12 w-12 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-center text-amber-600">
                 <DollarSign className="h-6 w-6" />
               </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            <DataTable<ProductionOrder>
              columns={columns}
              data={orders.data}
              keyExtractor={(row) => row.id}
              pagination={{
                current: orders.current_page,
                total: orders.total,
                perPage: orders.per_page,
                onPageChange: (page) => router.visit(`?page=${page}`)
              }}
            />
          </div>
        </div>
      </AppLayout>
    </>
  );
}
