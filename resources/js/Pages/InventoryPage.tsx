import { Head, useForm, router } from "@inertiajs/react";
import {
  Package, Search, Plus, Filter, Download, AlertTriangle, CheckCircle2, XCircle,
  ArrowUpDown, MoreHorizontal, Edit, Trash2, Eye, ArrowRightLeft
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/layouts/app-layout";

interface Product {
  id: number;
  product_name: string;
  product_id: string; // SKU
  category_name?: string;
  category?: string | any;
  product_price: number;
  unit_price: number;
  buying_price: number;
  qty: number;
  total_qty?: number;
  reorderLevel: number;
  branch?: { name: string };
  branch_name?: string;
  status: "In Stock" | "Low Stock" | "Out of Stock" | string;
  product_type?: "trading" | "manufactured" | "raw_material" | string;
  variants?: { id: number; color?: string; qty?: number }[];
}

interface RawMaterial {
  id: number;
  name: string;
  code: string;
  color?: string;
}

interface Store {
  id: number;
  store_name: string;
  name?: string;
}

interface StockAdjustment {
  id: number;
  product_id: number;
  variant_id?: number | null;
  variant_color?: string | null;
  product_type: string;
  store_id: number;
  quantity: number;
  reason: string;
  status: string;
  created_at: string;
  product?: { name?: string; product_name?: string; product_type?: string };
  store?: { name?: string; store_name?: string };
}

interface InventoryPageProps {
  products: Product[];
  rawMaterials?: RawMaterial[];
  stores?: Store[];
  categories?: any[];
  transfers?: any[];
  adjustments?: StockAdjustment[];
  kpis?: {
    total_products: number;
    low_stock_alerts: number;
    out_of_stock: number;
    total_value: number | string;
  };
}

const statusStyle: Record<string, string> = {
  "In Stock": "bg-accent/10 text-accent",
  "Low Stock": "bg-warning/10 text-warning",
  "Out of Stock": "bg-red-50 text-red-700 border border-red-100",
  "Pending": "bg-emerald-50 text-emerald-700 border border-emerald-100",
  "In Transit": "bg-emerald-50 text-emerald-700 border border-emerald-100",
  "Completed": "bg-emerald-50 text-emerald-700 border border-emerald-100",
  "Approved": "bg-emerald-50 text-emerald-700 border border-emerald-100",
};

const statusIcon: Record<string, React.ReactNode> = {
  "In Stock": <CheckCircle2 className="w-3 h-3" />,
  "Low Stock": <AlertTriangle className="w-3 h-3" />,
  "Out of Stock": <XCircle className="w-3 h-3" />,
};

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Inventory", href: "/inventory" },
];

export default function InventoryPage({ 
    products = [], 
    rawMaterials = [],
    stores = [],
    categories = [], 
    transfers = [], 
    adjustments = [],
    kpis = { total_products: 0, low_stock_alerts: 0, out_of_stock: 0, total_value: 0 }
}: InventoryPageProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productsPage, setProductsPage] = useState(1);
  const [transfersPage, setTransfersPage] = useState(1);
  const [adjustmentsPage, setAdjustmentsPage] = useState(1);
  const itemsPerPage = 10;
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('tab') || 'products';
    }

    return 'products';
  });
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [modalFilter, setModalFilter] = useState<'trading' | 'manufactured' | 'raw_material'>('trading');
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

  const { data: transData, setData: setTransData, post: postTrans, processing: transProcessing, reset: resetTrans, errors: transErrors } = useForm({
    source_store: '',      // source_store_id in backend
    store_name: '',        // destination_store_id in backend
    product_id: [''],      // transfer controller expects array
    product_quantity: [''], // transfer controller expects array
    reason: '',
    staff_recommeded: '',
  });

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    postTrans('/transfers', {
      onSuccess: () => {
        setIsTransferDialogOpen(false);
        resetTrans();
        toast.success("Stock transfer initiated successfully");
      },
      onError: (err) => {
          console.error(err);
          toast.error("Failed to initiate transfer");
      }
    });
  };

  const { data: adjData, setData: setAdjData, post: postAdj, processing: adjProcessing, reset: resetAdj, errors: adjErrors } = useForm({
    product_id: '',
    variant_id: '',
    product_type: 'App\\Models\\Product',
    store_id: '',
    adjustment_type: 'Correction',
    quantity: '',
    reason: '',
    notes: '',
  });

  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    postAdj('/stock-adjustments', {
      onSuccess: () => {
        setIsAdjustmentDialogOpen(false);
        resetAdj();
        toast.success("Adjustment saved successfully");
      },
      onError: (err) => {
          console.error(err);
          toast.error("Failed to save adjustment");
      }
    });
  };

  const pageTitle = activeTab === 'adjustments' ? 'Stock Adjustments' : 
                   activeTab === 'transfers' ? 'Stock Transfers' : 'Inventory Management';
  
  const pageSubtitle = activeTab === 'adjustments' ? 'Track physical inventory corrections and losses' : 
                      activeTab === 'transfers' ? 'Manage product movement between stores' : 
                      'Track products, manage stock, handle transfers';

  const filtered = products.filter((p) => {
    const name = p.product_name || "";
    const sku = p.product_id || "";
    const category = p.category_name || (typeof p.category === 'object' && p.category !== null ? p.category.category_name : p.category) || "General";
    const status = p.status || "In Stock";

    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || category === categoryFilter;
    const matchStatus = statusFilter === "all" || status === statusFilter;

    return matchSearch && matchCategory && matchStatus;
  });

  const rawCategoryList = categories.length > 0 ? categories.map((c: any) => typeof c === 'object' && c !== null ? c.category_name : c) : [...new Set(products.map((p) => p.category_name || (typeof p.category === 'object' && p.category !== null ? p.category.category_name : p.category)))];
  const categoryList = [...new Set(rawCategoryList)].filter(Boolean);
  const selectedAdjustmentProduct = useMemo(
    () => products.find((p) => p.id.toString() === adjData.product_id),
    [products, adjData.product_id]
  );
  const manufacturedVariants = useMemo(
    () => (selectedAdjustmentProduct?.variants || []).filter((v) => !!v.color),
    [selectedAdjustmentProduct]
  );



  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={pageTitle} />
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald/10"><Package className={`w-5 h-5 ${activeTab === 'adjustments' ? 'text-emerald-500' : 'text-emerald'}`} /></div>
            <div>
              <h1 className="text-lg md:text-2xl lg:text-[32px] font-bold text-foreground">{pageTitle}</h1>
            </div>
          </div>

          {activeTab === 'adjustments' ? (
            <Button 
              onClick={() => {
                setModalFilter('trading');
                setAdjData({
                  product_id: '',
                  variant_id: '',
                  product_type: 'App\\Models\\Product',
                  store_id: '',
                  adjustment_type: 'Correction',
                  quantity: '',
                  reason: '',
                  notes: '',
                });
                setIsAdjustmentDialogOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm h-11 px-8 font-bold shadow-lg shadow-emerald-100 transition-all border-none"
            >
              <Plus className="w-4 h-4 mr-2" /> Create
            </Button>
          ) : activeTab === 'transfers' ? (
            <Button 
              onClick={() => setIsTransferDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm h-11 px-8 font-bold shadow-lg shadow-emerald-100 transition-all border-none"
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" /> Create
            </Button>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm h-11 px-8 font-bold shadow-lg shadow-emerald-100 transition-all border-none">
                  <Plus className="w-4 h-4 mr-2" /> Create
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl p-0 border-none shadow-2xl rounded-sm overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-emerald-950 p-8 text-white relative overflow-hidden">
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-sm bg-white/10 flex items-center justify-center text-emerald-400">
                        <Package className="h-6 w-6" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-black tracking-tight">Product Architecture</DialogTitle>

                    </div>
                  </div>
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Package className="h-32 w-32 rotate-12" />
                  </div>
                </div>

                <div className="p-8 space-y-6 bg-white overflow-y-auto max-h-[70vh]">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest font-black">Product Identity</Label>
                      <Input placeholder="Material or Product Name" className="h-12 border-emerald-100 rounded-sm focus:ring-slate-900" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest font-black">SKU / Identifier</Label>
                      <Input placeholder="e.g. FG-10293" className="h-12 border-emerald-100 rounded-sm focus:ring-slate-900" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest font-black">Category</Label>
                      <Select>
                        <SelectTrigger className="h-12 border-emerald-100 rounded-sm">
                          <SelectValue placeholder="Define category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest font-black">Target Ledger / Store</Label>
                      <Select>
                        <SelectTrigger className="h-12 border-emerald-100 rounded-sm">
                          <SelectValue placeholder="Select Store" />
                        </SelectTrigger>
                        <SelectContent>
                          {stores.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.store_name || s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 p-6 rounded-sm space-y-4">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Financial & Stock Configuration</p>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-500">Retail Price (TZS)</Label>
                        <Input type="number" placeholder="0.00" className="h-11 border-white bg-white rounded-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-500">Acquisition Cost</Label>
                        <Input type="number" placeholder="0.00" className="h-11 border-white bg-white rounded-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-500">Opening Balance</Label>
                        <Input type="number" placeholder="0" className="h-11 border-white bg-white rounded-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest font-black">Stock Intelligence</Label>
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1.5">
                          <Label className="text-[9px] text-slate-400">Reorder Notification Level</Label>
                          <Input type="number" placeholder="10" className="h-11 border-slate-100 rounded-sm text-xs" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                          <Label className="text-[9px] text-slate-400">Critical Shortage Threshold</Label>
                          <Input type="number" placeholder="5" className="h-11 border-slate-100 rounded-sm text-xs" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 border-t border-slate-50 flex gap-3 bg-white">
                  <Button variant="outline" className="flex-1 rounded-sm font-bold text-slate-500 h-12 shadow-none border-slate-100">Discard Draft</Button>
                  <Button className="flex-2 bg-emerald-950 hover:bg-black text-white rounded-sm font-bold h-12 px-12 transition-all">Publish into Inventory</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

      {/* Premium KPI Section */}
      {activeTab !== 'adjustments' && activeTab !== 'transfers' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 animate-fade-up stagger-1">
          <div className="bg-white p-3 md:p-6 rounded-sm border border-emerald-100 shadow-sm transition-all hover:border-slate-300">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Products</p>
              <p className="text-xl md:text-3xl font-medium text-slate-900 mt-1 md:mt-2 tracking-tighter">{Number(kpis.total_products || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-3 md:p-6 rounded-sm border border-emerald-100 shadow-sm transition-all hover:border-amber-200">
            <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Low Stock Alerts</p>
              <p className="text-xl md:text-3xl font-medium text-emerald-600 mt-1 md:mt-2 tracking-tighter">{Number(kpis.low_stock_alerts || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-3 md:p-6 rounded-sm border border-emerald-100 shadow-sm transition-all hover:border-red-200">
            <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">Out of Stock</p>
              <p className="text-xl md:text-3xl font-medium text-red-600 mt-1 md:mt-2 tracking-tighter">{Number(kpis.out_of_stock || 0).toLocaleString()}</p>
          </div>
          <div className="bg-emerald-600 p-3 md:p-6 rounded-sm border-none shadow-xl shadow-emerald-100/50 text-white">
            <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Total Valuation</p>
            <div className="flex items-baseline gap-1 mt-1 md:mt-2">
                <span className="text-[9px] md:text-xs font-black opacity-60">TZS</span>
                <p className="text-xl md:text-3xl font-medium tracking-tighter">{Number(kpis.total_value || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 border-none shadow-2xl rounded-sm overflow-hidden bg-white">
            <div className="bg-emerald-50/50 p-6 border-b border-slate-100">
              <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">Stock Movement</DialogTitle>
              <p className="text-slate-500 text-xs mt-0.5 tracking-tight">Transfer assets between internal stores or branch locations.</p>
            </div>
            
            <form onSubmit={handleTransferSubmit} className="p-6 space-y-5 bg-white">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Source Store</Label>
                    <Select 
                      value={transData.source_store} 
                      onValueChange={val => setTransData('source_store', val)}
                    >
                      <SelectTrigger className="h-11 rounded-sm border-emerald-100">
                        <SelectValue placeholder="From..." />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.store_name || s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {transErrors.source_store && <p className="text-[10px] text-red-500">{transErrors.source_store}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Destination Store</Label>
                    <Select 
                      value={transData.store_name} 
                      onValueChange={val => setTransData('store_name', val)}
                    >
                      <SelectTrigger className="h-11 rounded-sm border-emerald-100">
                        <SelectValue placeholder="To..." />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.store_name || s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {transErrors.store_name && <p className="text-[10px] text-red-500">{transErrors.store_name}</p>}
                  </div>
              </div>

              <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest font-black">Target Asset</Label>
                  <Select 
                    value={transData.product_id[0]} 
                    onValueChange={val => setTransData('product_id', [val])}
                  >
                    <SelectTrigger className="h-11 rounded-sm border-emerald-100">
                      <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {products.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.product_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {transErrors['product_id.0'] && <p className="text-[10px] text-red-500">{transErrors['product_id.0']}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Quantity</Label>
                    <Input 
                      type="number" 
                      className="h-11 rounded-sm border-emerald-100"
                      value={transData.product_quantity[0]}
                      onChange={e => setTransData('product_quantity', [e.target.value])}
                    />
                    {transErrors['product_quantity.0'] && <p className="text-[10px] text-red-500">{transErrors['product_quantity.0']}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Staff Assigned</Label>
                    <Input 
                      className="h-11 rounded-sm border-emerald-100"
                      placeholder="Authorized staff"
                      value={transData.staff_recommeded}
                      onChange={e => setTransData('staff_recommeded', e.target.value)}
                    />
                    {transErrors.staff_recommeded && <p className="text-[10px] text-red-500">{transErrors.staff_recommeded}</p>}
                  </div>
              </div>

              <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Transfer Reason</Label>
                  <Input 
                    className="h-11 rounded-sm border-emerald-100"
                    placeholder="e.g. Stock replenishment"
                    value={transData.reason}
                    onChange={e => setTransData('reason', e.target.value)}
                  />
                  {transErrors.reason && <p className="text-[10px] text-red-500">{transErrors.reason}</p>}
                </div>

              <div className="pt-4 flex gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsTransferDialogOpen(false)} className="flex-1 h-12 rounded-sm font-bold">Cancel</Button>
                  <Button type="submit" disabled={transProcessing} className="flex-1 h-12 rounded-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white">Execute Transfer</Button>
              </div>
            </form>
        </DialogContent>
      </Dialog>

      {/* Adjustment Dialog (Moved to top level) */}
      <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 border-none shadow-2xl rounded-sm overflow-hidden bg-white">
            <div className="bg-emerald-50/50 p-6 border-b border-slate-100">
              <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">Stock Correction</DialogTitle>

            </div>
            
            <form onSubmit={handleAdjustmentSubmit} className="p-6 space-y-5 bg-white">
              <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest font-black">Inventory Class</Label>
                  <Select 
                    value={modalFilter} 
                    onValueChange={(val: any) => {
                      setModalFilter(val);
                      if (val === 'trading' || val === 'manufactured') {
                        setAdjData({
                          ...adjData,
                          product_type: 'App\\Models\\Product',
                          product_id: '',
                          variant_id: '',
                        });
                      } else {
                        setAdjData({
                          ...adjData,
                          product_type: 'App\\Models\\RawMaterial',
                          product_id: '',
                          variant_id: '',
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-sm border-emerald-100 focus:ring-slate-900">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trading">Trading Products Inventory</SelectItem>
                      <SelectItem value="manufactured">Manufactured Goods Inventory</SelectItem>
                      <SelectItem value="raw_material">Raw Materials Inventory</SelectItem>
                    </SelectContent>
                  </Select>
                  {adjErrors.product_type && <p className="text-[10px] text-red-500">{adjErrors.product_type}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Target Item</Label>
                    <Select 
                      value={adjData.product_id} 
                      onValueChange={val => {
                        setAdjData('product_id', val);
                        setAdjData('variant_id', '');
                      }}
                    >
                      <SelectTrigger className="h-11 rounded-sm border-emerald-100">
                        <SelectValue placeholder="Select Item" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {modalFilter === 'trading' || modalFilter === 'manufactured'
                          ? products
                              .filter(p => p.product_type === modalFilter)
                              .map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.product_name}</SelectItem>)
                          : rawMaterials.map(rm => (
                              <SelectItem key={rm.id} value={rm.id.toString()}>
                                {rm.name} {rm.color ? `(${rm.color})` : ''}
                              </SelectItem>
                            ))
                        }
                      </SelectContent>
                    </Select>
                    {adjErrors.product_id && <p className="text-[10px] text-red-500">{adjErrors.product_id}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Store</Label>
                    <Select 
                      value={adjData.store_id} 
                      onValueChange={val => setAdjData('store_id', val)}
                    >
                      <SelectTrigger className="h-11 rounded-sm border-emerald-100">
                        <SelectValue placeholder="Select Store" />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.store_name || s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {adjErrors.store_id && <p className="text-[10px] text-red-500">{adjErrors.store_id}</p>}
                  </div>
              </div>

              {modalFilter === 'manufactured' && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Color Variant</Label>
                  <Select
                    value={adjData.variant_id}
                    onValueChange={(val) => setAdjData('variant_id', val)}
                    disabled={!adjData.product_id || manufacturedVariants.length === 0}
                  >
                    <SelectTrigger className="h-11 rounded-sm border-emerald-100">
                      <SelectValue placeholder={adjData.product_id ? (manufacturedVariants.length > 0 ? 'Select Color Variant' : 'No variants found') : 'Select manufactured item first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturedVariants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id.toString()}>
                          {variant.color} {typeof variant.qty === 'number' ? `(Qty: ${variant.qty})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {adjErrors.variant_id && <p className="text-[10px] text-red-500">{adjErrors.variant_id}</p>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Adj. Type</Label>
                    <Select 
                      value={adjData.adjustment_type} 
                      onValueChange={val => setAdjData('adjustment_type', val)}
                    >
                      <SelectTrigger className="h-11 rounded-sm border-emerald-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Correction">Correction (±)</SelectItem>
                        <SelectItem value="Damage">Damage (-)</SelectItem>
                        <SelectItem value="Loss">Loss (-)</SelectItem>
                        <SelectItem value="Expiry">Expiry (-)</SelectItem>
                      </SelectContent>
                    </Select>
                    {adjErrors.adjustment_type && <p className="text-[10px] text-red-500">{adjErrors.adjustment_type}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Quantity</Label>
                    <Input 
                      type="number" 
                      className="h-11 rounded-sm border-emerald-100"
                      value={adjData.quantity}
                      onChange={e => setAdjData('quantity', e.target.value)}
                    />
                    {adjErrors.quantity && <p className="text-[10px] text-red-500">{adjErrors.quantity}</p>}
                  </div>
              </div>

              <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Reason</Label>
                  <Input 
                    className="h-11 rounded-sm border-emerald-100"
                    value={adjData.reason}
                    onChange={e => setAdjData('reason', e.target.value)}
                  />
                  {adjErrors.reason && <p className="text-[10px] text-red-500">{adjErrors.reason}</p>}
                </div>

              <div className="pt-4 flex gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsAdjustmentDialogOpen(false)} className="flex-1 h-12 rounded-sm font-bold">Cancel</Button>
                  <Button type="submit" disabled={adjProcessing} className="flex-1 h-12 rounded-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white">Apply Adjustment</Button>
              </div>
            </form>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-up stagger-2">
        {activeTab !== 'adjustments' && activeTab !== 'transfers' && (
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
            <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="products" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search products..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]"><Filter className="w-3.5 h-3.5 mr-2" /><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Categories</SelectItem>{categoryList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="In Stock">In Stock</SelectItem><SelectItem value="Low Stock">Low Stock</SelectItem><SelectItem value="Out of Stock">Out of Stock</SelectItem></SelectContent>
            </Select>
            <Button variant="outline" className="gap-2"><Download className="w-3.5 h-3.5" /> Export</Button>
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-2 md:px-4 py-3 font-medium text-muted-foreground text-xs md:text-sm"><span className="flex items-center gap-1">Product <ArrowUpDown className="w-3 h-3" /></span></th>
                    <th className="text-left px-2 md:px-4 py-3 font-medium text-muted-foreground text-xs md:text-sm">Code</th>
                    <th className="text-left px-2 md:px-4 py-3 font-medium text-muted-foreground text-xs md:text-sm hidden sm:table-cell">Variant</th>
                    <th className="text-left px-2 md:px-4 py-3 font-medium text-muted-foreground text-xs md:text-sm hidden md:table-cell">Category</th>
                    <th className="text-right px-2 md:px-4 py-3 font-medium text-muted-foreground text-xs md:text-sm">Price</th>
                    <th className="text-right px-2 md:px-4 py-3 font-medium text-muted-foreground text-xs md:text-sm">Qty</th>
                    <th className="text-left px-2 md:px-4 py-3 font-medium text-muted-foreground text-xs md:text-sm hidden lg:table-cell">Branch</th>
                    <th className="text-left px-2 md:px-4 py-3 font-medium text-muted-foreground text-xs md:text-sm">Status</th>
                    <th className="text-right px-2 md:px-4 py-3 font-medium text-muted-foreground text-xs md:text-sm hidden sm:table-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice((productsPage - 1) * itemsPerPage, productsPage * itemsPerPage).map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-2 md:px-4 py-2 md:py-3 font-medium text-foreground text-xs md:text-sm">{p.product_name}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-muted-foreground font-mono text-[9px] md:text-xs whitespace-nowrap">{p.product_id}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-muted-foreground text-[9px] md:text-xs hidden sm:table-cell">
                        {p.product_type === 'manufactured' && p.variants?.length ? p.variants.map(v => v.color).join(', ') : '-'}
                      </td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-muted-foreground text-xs hidden md:table-cell">{p.category_name || (typeof p.category === 'object' && p.category !== null ? p.category.category_name : p.category)}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-right tabular-nums text-foreground text-xs md:text-sm">${p.product_price?.toLocaleString() || p.unit_price?.toLocaleString()}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-right tabular-nums text-foreground text-xs md:text-sm">{p.qty}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-muted-foreground text-xs hidden lg:table-cell">{p.branch_name || p.branch?.name || "Main"}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3">
                        <span className={`inline-flex items-center gap-1 text-[9px] md:text-xs font-medium px-1.5 py-0.5 md:px-2 md:py-1 rounded-md ${statusStyle[p.status || "In Stock"]}`}>
                          {statusIcon[p.status || "In Stock"] || <CheckCircle2 className="w-3 h-3" />} {p.status || "In Stock"}
                        </span>
                      </td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-right hidden sm:table-cell">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded hover:bg-secondary transition-colors"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                          <button className="p-1.5 rounded hover:bg-secondary transition-colors"><Edit className="w-3.5 h-3.5 text-muted-foreground" /></button>
                          <button className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between px-2 sm:px-4 py-3 border-t border-border/50 gap-3 text-xs md:text-sm">
              <p className="text-muted-foreground">Showing {((productsPage - 1) * itemsPerPage) + 1} - {Math.min(productsPage * itemsPerPage, filtered.length)} of {filtered.length}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={productsPage === 1} onClick={() => setProductsPage(p => p - 1)} className="text-xs h-8">Previous</Button>
                <span className="flex items-center px-2 py-1 text-xs">{productsPage} / {Math.ceil(filtered.length / itemsPerPage)}</span>
                <Button variant="outline" size="sm" disabled={productsPage === Math.ceil(filtered.length / itemsPerPage)} onClick={() => setProductsPage(p => p + 1)} className="text-xs h-8">Next</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <div className="bg-white border border-emerald-100 rounded-sm overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-emerald-100 bg-emerald-50/50">
                  <th className="text-left px-2 md:px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap">Code</th>
                  <th className="text-left px-2 md:px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap">Product</th>
                  <th className="text-right px-2 md:px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap">Qty</th>
                  <th className="text-left px-2 md:px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap hidden sm:table-cell">From</th>
                  <th className="text-left px-2 md:px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap hidden sm:table-cell">To</th>
                  <th className="text-left px-2 md:px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap">Status</th>
                  <th className="text-left px-2 md:px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap hidden md:table-cell">Date</th>
                </tr></thead>
                <tbody>
                   {transfers.slice((transfersPage - 1) * itemsPerPage, transfersPage * itemsPerPage).map(t => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-emerald-50/50 transition-colors">
                      <td className="px-2 md:px-4 py-2 md:py-3 font-mono text-[9px] md:text-xs text-emerald-600 font-bold whitespace-nowrap">{t.code || t.id}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 font-bold text-slate-900 text-[9px] md:text-xs">{t.product}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-right tabular-nums font-black text-slate-800 text-[9px] md:text-xs">{t.qty}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-slate-600 font-medium text-[9px] md:text-xs hidden sm:table-cell">{t.from}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-slate-600 font-medium text-[9px] md:text-xs hidden sm:table-cell">{t.to}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3"><span className={`text-[9px] md:text-[10px] font-black uppercase px-1.5 md:px-2 py-0.5 md:py-1 rounded-sm whitespace-nowrap ${statusStyle[t.status]}`}>{t.status}</span></td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-slate-500 font-bold text-[9px] md:text-xs hidden md:table-cell whitespace-nowrap">{t.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between px-2 sm:px-4 py-3 border-t border-slate-100 gap-3 text-xs md:text-sm">
              <p className="text-slate-600">Showing {((transfersPage - 1) * itemsPerPage) + 1} - {Math.min(transfersPage * itemsPerPage, transfers.length)} of {transfers.length}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={transfersPage === 1} onClick={() => setTransfersPage(p => p - 1)} className="text-xs h-8">Previous</Button>
                <span className="flex items-center px-2 py-1 text-xs">{transfersPage} / {Math.ceil(transfers.length / itemsPerPage)}</span>
                <Button variant="outline" size="sm" disabled={transfersPage === Math.ceil(transfers.length / itemsPerPage)} onClick={() => setTransfersPage(p => p + 1)} className="text-xs h-8">Next</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-4">
           <div className="bg-white border border-emerald-100 rounded-sm overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-emerald-100 bg-emerald-50/50">
                  <th className="text-left px-2 md:px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap">Code</th>
                  <th className="text-left px-2 md:px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap">Product</th>
                  <th className="text-left px-2 md:px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap hidden sm:table-cell">Store</th>
                  <th className="text-left px-2 md:px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap hidden lg:table-cell">Type</th>
                  <th className="text-right px-2 md:px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap">Qty</th>
                  <th className="text-left px-2 md:px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap hidden md:table-cell">Reason</th>
                  <th className="text-left px-2 md:px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap">Status</th>
                  <th className="text-left px-2 md:px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap hidden sm:table-cell">Date</th>
                </tr></thead>
                <tbody>
                  {adjustments.slice((adjustmentsPage - 1) * itemsPerPage, adjustmentsPage * itemsPerPage).map(a => (
                     <tr key={a.id} className="border-b border-slate-100 hover:bg-emerald-50/50 transition-colors">
                       <td className="px-2 md:px-4 py-2 md:py-3 font-mono text-[9px] md:text-xs text-emerald-600 font-bold whitespace-nowrap">{a.product_id || a.id}</td>
                       <td className="px-2 md:px-4 py-2 md:py-3 font-bold text-slate-900 uppercase tracking-tight text-[9px] md:text-xs">
                         {a.product?.product_name || a.product?.name || 'N/A'}
                         {a.product_type?.includes('RawMaterial') && (a.product as any)?.color && ` (${(a.product as any).color})`}
                         {!a.product_type?.includes('RawMaterial') && a.variant_color && ` (${a.variant_color})`}
                       </td>
                       <td className="px-2 md:px-4 py-2 md:py-3 text-slate-600 font-bold text-[9px] md:text-xs uppercase hidden sm:table-cell">{a.store?.store_name || a.store?.name || 'N/A'}</td>
                       <td className="px-2 md:px-4 py-2 md:py-3 text-slate-500 font-medium text-[9px] md:text-xs hidden lg:table-cell">
                         {a.product_type?.includes('RawMaterial') ? 'Raw Material' : (a.product?.product_type === 'trading' ? 'Trading' : 'Manufactured')}
                       </td>
                       <td className={`px-2 md:px-4 py-2 md:py-3 text-right tabular-nums font-black text-[9px] md:text-xs whitespace-nowrap ${a.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}>{a.quantity > 0 ? "+" : ""}{a.quantity}</td>
                       <td className="px-2 md:px-4 py-2 md:py-3 text-slate-700 font-medium text-[9px] md:text-xs hidden md:table-cell">{a.reason}</td>
                       <td className="px-2 md:px-4 py-2 md:py-3"><span className={`text-[9px] md:text-[10px] font-black uppercase px-1.5 md:px-2 py-0.5 md:py-1 rounded-sm whitespace-nowrap ${statusStyle[a.status] || 'bg-slate-100 text-slate-600'}`}>{a.status}</span></td>
                       <td className="px-2 md:px-4 py-2 md:py-3 text-slate-500 font-bold text-[9px] md:text-xs hidden sm:table-cell whitespace-nowrap">{a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A'}</td>
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between px-2 sm:px-4 py-3 border-t border-slate-100 gap-3 text-xs md:text-sm">
              <p className="text-slate-600">Showing {((adjustmentsPage - 1) * itemsPerPage) + 1} - {Math.min(adjustmentsPage * itemsPerPage, adjustments.length)} of {adjustments.length}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={adjustmentsPage === 1} onClick={() => setAdjustmentsPage(p => p - 1)} className="text-xs h-8">Previous</Button>
                <span className="flex items-center px-2 py-1 text-xs">{adjustmentsPage} / {Math.ceil(adjustments.length / itemsPerPage)}</span>
                <Button variant="outline" size="sm" disabled={adjustmentsPage === Math.ceil(adjustments.length / itemsPerPage)} onClick={() => setAdjustmentsPage(p => p + 1)} className="text-xs h-8">Next</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  );
}
