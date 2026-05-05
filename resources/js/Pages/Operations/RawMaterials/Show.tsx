import { Head, Link, router } from '@inertiajs/react';
import { 
  ArrowLeft, 
  Edit2, 
  Package, 
  TrendingUp, 
  Layers, 
  History, 
  AlertCircle,
  Clock,
  MapPin,
  Calendar,
  User,
  ShoppingBag,
  ExternalLink,
  Settings
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppLayout from '@/layouts/app-layout';

interface Movement {
  id: number;
  transaction_type: string;
  quantity: number;
  reference: string;
  notes?: string;
  created_at: string;
  createdBy?: { name: string };
  store?: { store_name: string };
}

interface RawMaterial {
  id: number;
  code: string;
  name: string;
  category: string;
  base_unit: string;
  current_stock: number;
  cost_per_unit: number;
  supplier: string;
  is_roll: boolean;
  gsm?: number;
  width?: number;
  total_length?: number;
  remaining_length?: number;
  color?: string;
  total_value: number;
  movements?: Movement[];
  branch?: { name: string };
  createdBy?: { name: string };
  barcode?: string;
  created_at: string;
}

interface RawMaterialsShowProps {
  rawMaterial: RawMaterial;
  stores: any[];
}

export default function RawMaterialsShow({ rawMaterial }: RawMaterialsShowProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Manufacturing', href: '/raw-materials' },
    { title: 'Material Details', href: '#' }
  ];

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'stock_addition': return 'text-emerald-600 bg-emerald-50';
      case 'stock_removal': return 'text-rose-600 bg-rose-50';
      case 'stock_adjustment': return 'text-amber-600 bg-amber-50';
      case 'stock_transfer_in': return 'text-amber-600 bg-amber-50';
      case 'stock_transfer_out': return 'text-amber-600 bg-amber-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <>
      <Head title={`${rawMaterial.name} - details`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto py-2">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-1">
              <Link href="/raw-materials" className="flex items-center text-xs text-slate-500 hover:text-slate-800 transition-colors font-semibold mb-3">
                 <ArrowLeft className="h-3 w-3 mr-1" /> Back to Registry
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-medium text-slate-900 tracking-tight">{rawMaterial.name}</h1>
                <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-500 font-semibold text-[10px] px-3 py-1">
                  ID: {rawMaterial.code || rawMaterial.id}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 font-medium">Categorized under <span className="text-amber-600 font-semibold">{rawMaterial.category || 'none'}</span></p>
            </div>
            
            <div className="flex gap-2 shrink-0">
               <Link href={`/raw-materials/${rawMaterial.id}/edit`}>
                  <Button variant="outline" className="border-slate-200 text-slate-600 rounded-lg font-medium px-6 h-12 shadow-sm">
                    <Edit2 className="h-4 w-4 mr-2" /> Update Specs
                  </Button>
               </Link>
               <Button className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg px-6 h-12 shadow-lg shadow-slate-200">
                 <ShoppingBag className="h-4 w-4 mr-2" /> Order Supply
               </Button>
            </div>
          </div>

          {/* Core Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 border-slate-200 rounded-lg shadow-sm flex flex-col justify-between transition-all hover:bg-slate-50">
              <div className="flex justify-between items-start mb-4">
                 <p className="text-xs font-semibold text-slate-500 tracking-tight">Real-Time Stock</p>
                 <div className="p-1.5 bg-slate-100 rounded-lg"><Package className="h-4 w-4 text-slate-500" /></div>
              </div>
              <div>
                <p className="text-3xl font-medium text-slate-900 tracking-tight">{rawMaterial.current_stock?.toLocaleString()}</p>
                <p className="text-xs font-medium text-slate-400 mt-1">{rawMaterial.base_unit} in inventory</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                 <span className="text-slate-400">Stock Status</span>
                 <span className="text-emerald-600">Healthy</span>
              </div>
            </Card>

            <Card className="p-6 border-slate-200 rounded-lg shadow-sm flex flex-col justify-between overflow-hidden relative transition-all hover:bg-amber-50/10">
              <div className="flex justify-between items-start mb-4 relative z-10">
                 <p className="text-xs font-semibold text-slate-500 tracking-tight">Inventory Value</p>
                 <div className="p-1.5 bg-amber-100 rounded-lg relative z-10"><TrendingUp className="h-4 w-4 text-amber-600" /></div>
              </div>
              <div className="relative z-10">
                <p className="text-3xl font-medium text-slate-900 tracking-tight">{rawMaterial.total_value?.toLocaleString()}</p>
                <p className="text-xs font-medium text-slate-400 mt-1">Tanzanian Shillings (TZS)</p>
              </div>
              <div className="absolute right-0 bottom-0 opacity-[0.03] p-2">
                 <TrendingUp className="h-24 w-24 text-amber-900" />
              </div>
            </Card>

            <Card className="p-6 border-slate-200 rounded-lg shadow-sm flex flex-col justify-between transition-all hover:bg-slate-50">
              <div className="flex justify-between items-start mb-4">
                 <p className="text-xs font-semibold text-slate-500 tracking-tight">Procurement Rate</p>
                 <div className="p-1.5 bg-slate-100 rounded-lg"><TrendingUp className="h-4 w-4 text-slate-500" /></div>
              </div>
              <div>
                <p className="text-3xl font-medium text-slate-900 tracking-tight">{rawMaterial.cost_per_unit?.toLocaleString()}</p>
                <p className="text-xs font-medium text-slate-400 mt-1">Cost per {rawMaterial.base_unit}</p>
              </div>
               <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                 <span className="text-slate-400">Supplier</span>
                 <span className="text-amber-600 font-semibold truncate max-w-[120px]">{rawMaterial.supplier || 'Unassigned'}</span>
              </div>
            </Card>

            <Card className="p-6 border-slate-200 rounded-lg shadow-sm flex flex-col justify-between transition-all hover:bg-amber-50/5">
              <div className="flex justify-between items-start mb-4">
                 <p className="text-xs font-semibold text-slate-500 tracking-tight">Material Category</p>
                 <div className="p-1.5 bg-amber-100 rounded-lg"><Layers className="h-4 w-4 text-amber-600" /></div>
              </div>
              <div>
                <p className="text-lg font-medium text-slate-900 tracking-tight">{rawMaterial.is_roll ? 'Fabric Roll' : 'Modular Component'}</p>
                <div className="flex gap-2 mt-2">
                   {rawMaterial.is_roll && <Badge className="bg-amber-100 text-amber-700 rounded-lg text-[10px] font-semibold px-2 border-none">Geometric</Badge>}
                   <Badge className="bg-slate-100 text-slate-600 rounded-lg text-[10px] font-semibold px-2 border-none">Trackable</Badge>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             
             {/* Specifications */}
             <div className="space-y-6">
                <Card className="border-slate-200 rounded-lg shadow-sm overflow-hidden">
                   <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center justify-between">
                      <h2 className="text-sm font-medium text-slate-800 tracking-tight">Technical Specifications</h2>
                      <div className="p-1.5 bg-white rounded-lg border border-slate-100 shadow-sm"><Settings className="h-4 w-4 text-slate-400" /></div>
                   </div>
                   <div className="p-6 space-y-5">
                      <div className="space-y-1">
                         <p className="text-xs font-semibold text-slate-500">Primary Branch</p>
                         <div className="flex items-center gap-2">
                             <MapPin className="h-3 w-3 text-rose-400" />
                             <p className="text-xs font-medium text-slate-800 ">{rawMaterial.branch?.name || 'Main Branch'}</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-500">Base Unit</p>
                            <p className="text-xs font-medium text-slate-800 ">{rawMaterial.base_unit}</p>
                         </div>
                         <div className="space-y-1 text-right">
                            <p className="text-xs font-semibold text-slate-500">Barcode</p>
                            <p className="text-xs font-mono text-slate-500 tracking-tighter">{rawMaterial.barcode || 'non-indexed'}</p>
                         </div>
                      </div>

                      {rawMaterial.is_roll && (
                        <div className="pt-4 mt-4 border-t border-slate-50 space-y-4">
                           <div className="flex justify-between items-center">
                              <p className="text-xs font-semibold text-slate-500">Roll Width</p>
                              <p className="text-xs font-semibold text-slate-800">{rawMaterial.width} cm</p>
                           </div>
                           <div className="flex justify-between items-center">
                              <p className="text-xs font-semibold text-slate-500">Fabric Density (GSM)</p>
                              <p className="text-xs font-semibold text-slate-800">{rawMaterial.gsm} g</p>
                           </div>
                           <div className="flex justify-between items-center">
                              <p className="text-xs font-semibold text-slate-500">Total Run Length</p>
                              <p className="text-xs font-semibold text-amber-600 italic">{rawMaterial.total_length} m</p>
                           </div>
                           <div className="flex justify-between items-center bg-amber-50/50 p-2 -mx-2 rounded-lg border border-amber-100/50 mt-1">
                              <p className="text-xs font-semibold text-amber-900">Current Partial Length</p>
                              <p className="text-xs font-semibold text-amber-700 tabular-nums">{rawMaterial.remaining_length} m</p>
                           </div>
                        </div>
                      )}

                      <div className="pt-4 space-y-3">
                         <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-tight italic">
                            <User className="h-3 w-3" /> registered by: {rawMaterial.createdBy?.name || 'automator'}
                         </div>
                         <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-tight italic">
                            <Calendar className="h-3 w-3" /> created on: {new Date(rawMaterial.created_at).toLocaleDateString()}
                         </div>
                      </div>
                   </div>
                </Card>

                <div className="bg-amber-50 rounded-lg p-5 text-amber-900 shadow-sm border border-amber-100 flex items-start gap-4">
                   <div className="bg-amber-100/50 p-2 rounded-lg text-amber-600"><AlertCircle className="h-5 w-5" /></div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-medium uppercase tracking-tight text-amber-600">Intelligence Note</p>
                      <p className="text-xs font-medium leading-relaxed italic">this material is currently active for production use. low stock triggers will be sent at 10% remaining capacity.</p>
                   </div>
                </div>
             </div>

             {/* Movement History */}
             <div className="lg:col-span-2 space-y-6">
                <Card className="border-slate-200 rounded-lg shadow-sm overflow-hidden min-h-[500px]">
                   <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-slate-400" />
                        <h2 className="text-[10px] font-semibold uppercase text-slate-500 tracking-tight">Inventory Movement Log</h2>
                      </div>
                      <Link href={`/inventory/raw-materials`}>
                        <Button variant="ghost" size="sm" className="text-[10px] font-medium uppercase text-amber-600 hover:bg-amber-50">
                          Full Report <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                   </div>
                   
                   <Table>
                      <TableHeader className="bg-slate-50/50">
                         <TableRow className="border-b-slate-100">
                            <TableHead className="w-16 font-medium text-slate-700 ">Type</TableHead>
                            <TableHead className="font-medium text-slate-700 ">Timestamp</TableHead>
                            <TableHead className="font-medium text-slate-700 ">Store/Bin</TableHead>
                            <TableHead className="font-medium text-slate-700 ">Reference</TableHead>
                            <TableHead className="text-right font-medium text-slate-700 ">Quantity</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rawMaterial.movements && rawMaterial.movements.length > 0 ? (
                           rawMaterial.movements.map((move) => (
                              <TableRow key={move.id} className="hover:bg-slate-50 transition-colors border-b-slate-100">
                                 <TableCell>
                                    <div className={`text-[9px] font-medium uppercase px-2 py-0.5 rounded-lg w-max tracking-tight border ${getStatusColor(move.transaction_type)}`}>
                                       {move.transaction_type.split('_')[1] || move.transaction_type}
                                    </div>
                                 </TableCell>
                                 <TableCell className="text-xs font-medium text-slate-600 tabular-nums">
                                    {new Date(move.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                 </TableCell>
                                 <TableCell className="text-xs font-medium text-slate-700">
                                    {move.store?.store_name || 'Unassigned'}
                                 </TableCell>
                                 <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">
                                    {move.reference}
                                 </TableCell>
                                 <TableCell className={`text-right font-medium tabular-nums pr-6 ${move.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {move.quantity > 0 ? '+' : ''}{(move.quantity ?? 0).toLocaleString()}
                                 </TableCell>
                              </TableRow>
                           ))
                        ) : (
                           <TableRow>
                              <TableCell colSpan={5} className="h-64 text-center">
                                 <div className="flex flex-col items-center justify-center opacity-40">
                                    <Clock className="h-10 w-10 mb-3 text-slate-300" />
                                    <p className="text-sm font-semibold text-slate-500">No registered movements yet</p>
                                 </div>
                              </TableCell>
                           </TableRow>
                        )}
                      </TableBody>
                   </Table>
                </Card>
             </div>

          </div>

        </div>
      </AppLayout>
    </>
  );
}
