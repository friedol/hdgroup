import { Head, useForm, router } from "@inertiajs/react";
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
import React, { useMemo, useState } from 'react';
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

interface Product {
  id: number;
  name: string;
  product_name?: string;
  sku: string;
  product_type?: 'trading' | 'manufactured' | 'raw_material' | string;
  category?: string;
  variants?: { id: number; color?: string; qty?: number }[];
}

interface RawMaterial {
  id: number;
  name: string;
  code: string;
  category?: string;
}

interface Store {
  id: number;
  name: string;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productType, setProductType] = useState<'App\\Models\\Product' | 'App\\Models\\RawMaterial'>('App\\Models\\Product');

  const { data, setData, post, processing, reset, errors } = useForm({
    product_id: '',
    variant_id: '',
    product_type: 'App\\Models\\Product',
    store_id: '',
    adjustment_type: 'Correction',
    quantity: '',
    reason: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/stock-adjustments', {
      onSuccess: () => {
        setIsDialogOpen(false);
        reset();
        toast.success("Adjustment recorded successfully");
      },
      onError: () => {
        toast.error("Failed to record adjustment. Please check the fields.");
      }
    });
  };

  const selectedProduct = useMemo(
    () => products.find((p) => p.id.toString() === data.product_id),
    [products, data.product_id]
  );
  const manufacturedVariants = useMemo(
    () => (selectedProduct?.variants || []).filter((v) => !!v.color),
    [selectedProduct]
  );
  const requiresManufacturedDetails = data.product_type === 'App\\Models\\Product' && selectedProduct?.product_type === 'manufactured';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 lowercase px-2">approved</Badge>;
      case 'Rejected':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-50 lowercase px-2">rejected</Badge>;
      default:
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 lowercase px-2">pending</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'App\\Models\\Product' ? <Package className="h-4 w-4 text-emerald-500" /> : <Layers className="h-4 w-4 text-emerald-500" />;
  };

  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Inventory", href: "/inventory" },
    { title: "Stock Adjustments", href: "/stock-adjustments" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Stock Adjustments" />
      
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 lowercase">Stock Adjustments</h1>

          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm lowercase font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95">
                <Plus className="h-4 w-4 mr-2" /> New Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-sm p-0 overflow-hidden border-none shadow-2xl">
              <div className="bg-emerald-600 p-6 text-white text-center">
                 <ArrowRightLeft className="h-8 w-8 mx-auto mb-2 opacity-50" />
                 <DialogTitle className="text-xl font-black lowercase tracking-tight">Create Stock Correction</DialogTitle>

              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 italic">Inventory Type</Label>
                  <Select 
                    value={data.product_type} 
                    onValueChange={(val: any) => {
                      setData('product_type', val);
                      setData('product_id', ''); // Clear product selection
                      setData('variant_id', '');
                    }}
                  >
                    <SelectTrigger className="border-emerald-100 h-11 rounded-sm focus:ring-emerald-500">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="App\Models\Product">Produced Goods (Finished)</SelectItem>
                      <SelectItem value="App\Models\RawMaterial">Raw Materials (Inputs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 italic">Target Item</Label>
                    <Select value={data.product_id} onValueChange={val => {
                      setData('product_id', val);
                      setData('variant_id', '');
                    }}>
                      <SelectTrigger className="border-emerald-100 h-11 rounded-sm focus:ring-emerald-500">
                        <SelectValue placeholder="Select Item" />
                      </SelectTrigger>
                      <SelectContent>
                        {data.product_type === 'App\Models\Product' 
                          ? products.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name || p.product_name}</SelectItem>)
                          : rawMaterials.map(rm => <SelectItem key={rm.id} value={rm.id.toString()}>{rm.name}</SelectItem>)
                        }
                      </SelectContent>
                    </Select>
                    {errors.product_id && <p className="text-[10px] text-red-500">{errors.product_id}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 italic">Target Store</Label>
                    <Select value={data.store_id} onValueChange={val => setData('store_id', val)}>
                      <SelectTrigger className="border-emerald-100 h-11 rounded-sm focus:ring-emerald-500">
                        <SelectValue placeholder="Select Store" />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.store_id && <p className="text-[10px] text-red-500">{errors.store_id}</p>}
                  </div>
                </div>

                {requiresManufacturedDetails && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 italic">Color Variant</Label>
                    <Select value={data.variant_id} onValueChange={val => setData('variant_id', val)}>
                      <SelectTrigger className="border-emerald-100 h-11 rounded-sm focus:ring-emerald-500">
                        <SelectValue placeholder={manufacturedVariants.length > 0 ? 'Select Variant' : 'No variants found'} />
                      </SelectTrigger>
                      <SelectContent>
                        {manufacturedVariants.map(v => (
                          <SelectItem key={v.id} value={v.id.toString()}>
                            {v.color} {typeof v.qty === 'number' ? `(Qty: ${v.qty})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.variant_id && <p className="text-[10px] text-red-500">{errors.variant_id}</p>}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 italic">Adjustment Type</Label>
                    <Select value={data.adjustment_type} onValueChange={val => setData('adjustment_type', val)}>
                      <SelectTrigger className="border-emerald-100 h-11 rounded-sm focus:ring-emerald-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Correction">Correction (±)</SelectItem>
                        <SelectItem value="Damage">Damage (-)</SelectItem>
                        <SelectItem value="Loss">Loss (-)</SelectItem>
                        <SelectItem value="Expiry">Expiry (-)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 italic">Quantity</Label>
                    <Input 
                      type="number" 
                      placeholder="e.g. 50 or -50"
                      className="h-11 border-emerald-100 rounded-sm focus:ring-emerald-500"
                      value={data.quantity}
                      onChange={e => setData('quantity', e.target.value)}
                    />
                    {errors.quantity && <p className="text-[10px] text-red-500">{errors.quantity}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-bold uppercase text-slate-400 italic">Reason / Justification</Label>
                   <Input 
                     placeholder="Why is this adjustment necessary?"
                     className="h-11 border-emerald-100 rounded-sm focus:ring-emerald-500"
                     value={data.reason}
                     onChange={e => setData('reason', e.target.value)}
                   />
                   {errors.reason && <p className="text-[10px] text-red-500">{errors.reason}</p>}
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-bold uppercase text-slate-400 italic">Verification Notes (Optional)</Label>
                   <Textarea 
                     placeholder="Additional technician notes..."
                     className="border-emerald-100 rounded-sm focus:ring-emerald-500 min-h-[80px]"
                     value={data.notes}
                     onChange={e => setData('notes', e.target.value)}
                   />
                </div>

                <div className="pt-4 border-t border-slate-50 flex gap-3">
                   <Button 
                     type="button" 
                     variant="outline" 
                     className="flex-1 rounded-sm lowercase font-bold text-slate-500 h-12"
                     onClick={() => setIsDialogOpen(false)}
                   >
                     Discard
                   </Button>
                   <Button 
                     type="submit" 
                     disabled={processing}
                     className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm lowercase font-bold h-12 shadow-lg shadow-emerald-100"
                   >
                     Apply Correction
                   </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <Card className="border-emerald-100 shadow-sm rounded-sm">
             <CardContent className="p-6">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 rounded-sm bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <ArrowRightLeft className="h-6 w-6" />
                   </div>
                   <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Actions</p>
                      <h3 className="text-2xl font-black text-slate-900">{adjustments.total}</h3>
                   </div>
                </div>
             </CardContent>
           </Card>

           <Card className="border-emerald-100 shadow-sm rounded-sm">
             <CardContent className="p-6">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 rounded-sm bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Info className="h-6 w-6" />
                   </div>
                   <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Pending Review</p>
                      <h3 className="text-2xl font-black text-slate-900">
                        {adjustments.data.filter(a => a.status === 'Pending').length}
                      </h3>
                   </div>
                </div>
             </CardContent>
           </Card>

           <Card className="border-emerald-100 shadow-sm rounded-sm">
             <CardContent className="p-6">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 rounded-sm bg-rose-50 flex items-center justify-center text-rose-600">
                      <XCircle className="h-6 w-6" />
                   </div>
                   <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Loss/Damage</p>
                      <h3 className="text-2xl font-black text-rose-600">
                        {adjustments.data.filter(a => ['Damage', 'Loss'].includes(a.adjustment_type)).length}
                      </h3>
                   </div>
                </div>
             </CardContent>
           </Card>

           <Card className="border-emerald-100 shadow-sm rounded-sm bg-emerald-950 text-white border-none shadow-xl">
             <CardContent className="p-6">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 rounded-sm bg-white/10 flex items-center justify-center text-amber-400">
                      <CheckCircle2 className="h-6 w-6" />
                   </div>
                   <div>
                      <p className="text-[10px] font-bold uppercase text-emerald-300 tracking-wider font-black">Applied Fixed</p>
                      <h3 className="text-2xl font-black">
                        {adjustments.data.filter(a => a.status === 'Approved').length}
                      </h3>
                   </div>
                </div>
             </CardContent>
           </Card>
        </div>

        {/* Filters and Table Area */}
        <div className="bg-white border border-emerald-100 rounded-sm shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
          <div className="p-4 border-b border-slate-100 bg-emerald-50/50/50 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search by product or reason..." 
                  className="pl-10 h-10 border-emerald-100 text-xs rounded-sm focus:ring-emerald-500 bg-white"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" className="h-10 text-[10px] font-bold uppercase text-slate-600 border-emerald-100 rounded-sm">
                   <Filter className="h-3 w-3 mr-2" /> All Branches
                </Button>
                <Button variant="outline" className="h-10 text-[10px] font-bold uppercase text-slate-600 border-emerald-100 rounded-sm">
                   <Calendar className="h-3 w-3 mr-2" /> This Month
                </Button>
             </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-emerald-50/50/80">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 h-auto tracking-widest pl-6">Adjusted Item</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 h-auto tracking-widest text-center">Type</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 h-auto tracking-widest">Store Branch</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 h-auto tracking-widest text-center">Quantity</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 h-auto tracking-widest">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 h-auto tracking-widest">Technician</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 py-4 h-auto tracking-widest text-right pr-6 px-10">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.data.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={7} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center opacity-30">
                           <ArrowRightLeft className="h-12 w-12 mb-2" />
                           <p className="text-xs font-bold uppercase tracking-widest">no adjustments found</p>
                        </div>
                     </TableCell>
                  </TableRow>
                ) : (
                  adjustments.data.map((adj) => (
                    <TableRow key={adj.id} className="group hover:bg-emerald-50/50/80 transition-colors border-slate-50">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 rounded-sm bg-slate-100 flex items-center justify-center border border-emerald-100/50">
                              {getTypeIcon(adj.product_type)}
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-900 lowercase">{adj.product?.name ?? 'Unknown Item'}</p>
                              <p className="text-[10px] text-slate-400 lowercase tracking-tighter mt-0.5 max-w-[200px] truncate italic">
                                 {adj.reason}
                              </p>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <Badge variant="outline" className="text-[9px] font-black uppercase border-emerald-100 text-slate-500 rounded-none tracking-tighter">
                            {adj.adjustment_type}
                         </Badge>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-1.5">
                            <StoreIcon className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-600 font-medium lowercase tracking-tight">{adj.store?.name ?? 'Main Stock'}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <div className={`text-xs font-black ${adj.quantity < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {adj.quantity > 0 ? '+' : ''}{adj.quantity.toLocaleString()}
                         </div>
                      </TableCell>
                      <TableCell>
                         {getStatusBadge(adj.status)}
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-black uppercase text-slate-600">
                               {adj.user?.name?.charAt(0) ?? 'U'}
                            </div>
                            <span className="text-xs text-slate-600 font-medium lowercase tracking-tight">{adj.user?.name ?? 'System'}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-right pr-6 px-10">
                         <p className="text-[10px] font-bold text-slate-500">{new Date(adj.created_at).toLocaleDateString()}</p>
                         <p className="text-[9px] text-slate-400 lowercase">{new Date(adj.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-100 bg-emerald-50/50/30 flex items-center justify-between">
             <p className="text-xs font-medium text-slate-500 lowercase tracking-tight">showing {adjustments.data.length} of {adjustments.total} corrections</p>
             <div className="flex gap-1">
                <Button 
                   variant="outline" 
                   size="sm" 
                   disabled={adjustments.current_page === 1}
                   onClick={() => router.visit(`?page=${adjustments.current_page - 1}`)}
                   className="h-8 rounded-sm text-[10px] font-bold uppercase"
                >
                   previous
                </Button>
                <Button 
                   variant="outline" 
                   size="sm"
                   disabled={adjustments.current_page === adjustments.last_page}
                   onClick={() => router.visit(`?page=${adjustments.current_page + 1}`)}
                   className="h-8 rounded-sm text-[10px] font-bold uppercase"
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
