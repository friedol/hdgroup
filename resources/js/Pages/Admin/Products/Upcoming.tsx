import { Head, Link, router, useForm } from "@inertiajs/react";
import { Plus, Edit, Trash2, Search, PackageOpen, ChevronLeft, ChevronRight, CloudLightning, Image, Layers, HelpCircle, Inbox } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/layouts/app-layout";

/* ─── Types ────────────────────────────────────── */
interface UpcomingProduct {
  id: number;
  product_id: string;
  sku: string;
  barcode?: string;
  product_name: string;
  product_quantity: number;
  product_price: number;
  unit_price: number;
  buying_price: number;
  is_published: boolean | number;
  image_1?: string | null;
  category_id?: number;
  category_name?: string;
  store_id?: number;
  store_name?: string;
  unit_id?: number;
  unit_name?: string;
  upcoming_order_id?: number;
}

interface Props {
  products: UpcomingProduct[];
  categories: Array<{ id: number; category_name: string }>;
  stores: Array<{ id: number; store_name: string }>;
  units: Array<{ id: number; unit_name: string }>;
}

/* ─── Helpers ──────────────────────────────────── */
const typeBadge = (type: string) => {
  const map: Record<string, string> = {
    trading: 'bg-blue-50 text-blue-700',
    manufactured: 'bg-violet-50 text-violet-700',
    raw_material: 'bg-amber-50 text-amber-700',
  };
  return map[type] ?? 'bg-slate-100 text-slate-600';
};

/* ─── Component ────────────────────────────────── */
export default function UpcomingModule({ products = [], categories = [], stores = [], units = [] }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<UpcomingProduct | null>(null);

  const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
    product_name: '',
    sku: '',
    category_id: '',
    store_id: '',
    unit_id: '',
    buying_price: '0',
    product_quantity: '0',
    product_price: '0',
  });

  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Upcoming Products", href: "#" }
  ];

  const handlePublish = (row: UpcomingProduct) => {
    if (!confirm(`Are you sure you want to publish "${row.product_name}" to the live catalog?`)) {
      return;
    }
    router.put(`/upcoming-products/publish/${row.id}`, {}, {
      onSuccess: () => toast.success('Product published to catalog successfully'),
      onError: (errors) => toast.error((errors?.error as string) || 'Failed to publish product'),
    });
  };

  const handleDelete = (row: UpcomingProduct) => {
    if (!confirm(`Permanently delete draft "${row.product_name}"?`)) {
      return;
    }
    router.delete(`/upcoming-products/${row.id}`, {
      onSuccess: () => toast.success('Draft product deleted successfully'),
      onError: (errors) => toast.error((errors?.error as string) || 'Failed to delete draft'),
    });
  };

  const openEditModal = (p: UpcomingProduct) => {
    setEditingProduct(p);
    setData({
      product_name: p.product_name || '',
      sku: p.sku || p.product_id || '',
      category_id: p.category_id?.toString() || '',
      store_id: p.store_id?.toString() || '',
      unit_id: p.unit_id?.toString() || '',
      buying_price: p.buying_price?.toString() || '0',
      product_quantity: p.product_quantity?.toString() || '0',
      product_price: p.product_price?.toString() || '0',
    });
    clearErrors();
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    put(`/upcoming-products/${editingProduct.id}`, {
      onSuccess: () => {
        setIsModalOpen(false);
        toast.success('Draft product updated successfully');
        reset();
      },
      onError: (err) => {
        toast.error(err.error || 'Failed to save draft changes');
      }
    });
  };

  const filtered = products.filter(p => {
    const name = p.product_name || "";
    const sku = p.sku || p.product_id || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || sku.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const publishedCount = products.filter(p => p.is_published).length;
  const pendingCount = products.length - publishedCount;

  return (
    <>
      <Head title="Upcoming Products" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="w-full space-y-6 pb-20">
          
          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none font-sans">Upcoming Products</h1>
            </div>
          </div>

          {/* ── Stats bar ── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total drafts', value: products.length, valueColor: 'text-slate-900', border: 'border-slate-200', bg: 'bg-white', chip: 'bg-slate-50/80', chipText: 'Pipeline', icon: <Inbox className="h-4 w-4 md:h-5 md:w-5" /> },
              { label: 'Pending release', value: pendingCount, valueColor: 'text-amber-700', border: 'border-amber-200', bg: 'bg-amber-50/30', chip: 'bg-amber-50/80', chipText: 'Drafts', icon: <HelpCircle className="h-4 w-4 md:h-5 md:w-5" /> },
              { label: 'Published to catalog', value: publishedCount, valueColor: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50/30', chip: 'bg-emerald-50/80', chipText: 'Live', icon: <CloudLightning className="h-4 w-4 md:h-5 md:w-5" /> },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border ${s.border} p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow ${s.bg}`}>
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="bg-white p-1.5 md:p-2 rounded-lg shadow-sm text-slate-500">{s.icon}</div>
                  <span className={`text-[8px] md:text-[10px] font-medium px-1.5 md:px-2 py-0.5 rounded-full ${s.chip} text-slate-600`}>
                    {s.chipText}
                  </span>
                </div>
                <p className={`text-lg md:text-2xl font-semibold tabular-nums leading-none ${s.valueColor}`}>{s.value}</p>
                <p className="text-[10px] md:text-xs font-medium text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Table card ── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="upcoming-search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search drafts by SKU or name..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[11px] font-semibold text-slate-400">
                    <th className="px-5 py-3 text-left w-[80px]">Photo</th>
                    <th className="px-5 py-3 text-left">Product Name</th>
                    <th className="px-5 py-3 text-left">SKU</th>
                    <th className="px-5 py-3 text-left">Category</th>
                    <th className="px-5 py-3 text-right">Target QTY</th>
                    <th className="px-5 py-3 text-right">Selling Price</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <PackageOpen className="h-12 w-12 mx-auto text-slate-200 mb-3 opacity-30" />
                        <p className="text-sm font-semibold text-slate-400">No draft products found</p>
                        <p className="text-[11px] text-slate-300 mt-1">Add draft products through upcoming orders</p>
                      </td>
                    </tr>
                  ) : filtered.map(row => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      
                      {/* Photo */}
                      <td className="px-5 py-3">
                        <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          {row.image_1 ? (
                            <img
                              src={row.image_1}
                              alt={row.product_name}
                              className="h-full w-full object-cover"
                              onError={e => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Image className="h-4 w-4 text-slate-300" />
                          )}
                        </div>
                      </td>

                      {/* Product Name */}
                      <td className="px-5 py-3 font-semibold text-slate-950 leading-tight">
                        {row.product_name}
                      </td>

                      {/* SKU */}
                      <td className="px-5 py-3 font-mono text-xs text-blue-600 font-semibold">{row.sku || row.product_id || 'N/A'}</td>

                      {/* Category */}
                      <td className="px-5 py-3 text-xs text-slate-600 font-bold">{row.category_name || 'General'}</td>

                      {/* Target QTY */}
                      <td className="px-5 py-3 text-right font-bold text-slate-800 tabular-nums">{row.product_quantity}</td>

                      {/* Price */}
                      <td className="px-5 py-3 text-right font-semibold text-slate-900 tabular-nums">
                        TZS {Number(row.product_price || 0).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center justify-center text-[10px] font-semibold px-2.5 py-1 rounded-lg ${row.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {row.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {!row.is_published && (
                            <button
                              title="Publish product to live catalog"
                              onClick={() => handlePublish(row)}
                              className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all"
                            >
                              <CloudLightning className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            title="Edit draft product"
                            onClick={() => openEditModal(row)}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            title="Delete draft product"
                            onClick={() => handleDelete(row)}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </AppLayout>

      {/* Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Edit Draft Product
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <Label htmlFor="product_name" className="text-xs font-semibold text-slate-600">Product Name <span className="text-red-500">*</span></Label>
                <Input
                  id="product_name"
                  value={data.product_name}
                  onChange={(e) => setData('product_name', e.target.value)}
                  placeholder="e.g. Cotton T-Shirt"
                  className="rounded-xl border-slate-200"
                  required
                />
                {errors.product_name && <p className="text-red-500 text-xs mt-0.5">{errors.product_name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sku" className="text-xs font-semibold text-slate-600">SKU / Code <span className="text-red-500">*</span></Label>
                <Input
                  id="sku"
                  value={data.sku}
                  onChange={(e) => setData('sku', e.target.value)}
                  placeholder="e.g. TS-COT-01"
                  className="rounded-xl border-slate-200"
                  required
                />
                {errors.sku && <p className="text-red-500 text-xs mt-0.5">{errors.sku}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Category <span className="text-red-500">*</span></Label>
                <Select value={data.category_id} onValueChange={val => setData('category_id', val)}>
                  <SelectTrigger className="border-slate-200 rounded-xl h-10">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.category_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.category_id && <p className="text-red-500 text-xs mt-0.5">{errors.category_id}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Store / Warehouse <span className="text-red-500">*</span></Label>
                <Select value={data.store_id} onValueChange={val => setData('store_id', val)}>
                  <SelectTrigger className="border-slate-200 rounded-xl h-10">
                    <SelectValue placeholder="Select store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.store_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.store_id && <p className="text-red-500 text-xs mt-0.5">{errors.store_id}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Unit <span className="text-red-500">*</span></Label>
                <Select value={data.unit_id} onValueChange={val => setData('unit_id', val)}>
                  <SelectTrigger className="border-slate-200 rounded-xl h-10">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.unit_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.unit_id && <p className="text-red-500 text-xs mt-0.5">{errors.unit_id}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="buying_price" className="text-xs font-semibold text-slate-600">Buying Cost (TZS) <span className="text-red-500">*</span></Label>
                <Input
                  id="buying_price"
                  type="number"
                  value={data.buying_price}
                  onChange={(e) => setData('buying_price', e.target.value)}
                  className="rounded-xl border-slate-200"
                  required
                />
                {errors.buying_price && <p className="text-red-500 text-xs mt-0.5">{errors.buying_price}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product_quantity" className="text-xs font-semibold text-slate-600">Target Quantity <span className="text-red-500">*</span></Label>
                <Input
                  id="product_quantity"
                  type="number"
                  value={data.product_quantity}
                  onChange={(e) => setData('product_quantity', e.target.value)}
                  className="rounded-xl border-slate-200"
                  required
                />
                {errors.product_quantity && <p className="text-red-500 text-xs mt-0.5">{errors.product_quantity}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product_price" className="text-xs font-semibold text-slate-600">Expected Selling Price (TZS)</Label>
                <Input
                  id="product_price"
                  type="number"
                  value={data.product_price}
                  onChange={(e) => setData('product_price', e.target.value)}
                  className="rounded-xl border-slate-200"
                />
                {errors.product_price && <p className="text-red-500 text-xs mt-0.5">{errors.product_price}</p>}
              </div>

            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl text-xs font-semibold h-9">Cancel</Button>
              <Button type="submit" disabled={processing} className="rounded-xl text-xs font-semibold h-9 bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20">
                {processing ? 'Saving...' : 'Save Draft Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
