import { Head, useForm, Link, usePage } from "@inertiajs/react";
import {
  ArrowLeft, ChevronRight, ArrowUpDown, Package, Layers,
  Store as StoreIcon, AlertCircle, CheckSquare, Square, Trash2, Plus,
} from "lucide-react";
import React, { useMemo, useEffect, useState } from 'react';
import { toast } from "sonner";
import Swal from 'sweetalert2';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/layouts/app-layout";

interface Product {
  id: number;
  name?: string;
  product_name?: string;
  sku?: string;
  product_type?: 'trading' | 'manufactured' | 'raw_material' | string;
  category?: string;
  variants?: { id: number; color?: string; qty?: number }[];
  inventories?: { store_id: number; qty: number }[];
  product_management?: { unit_name?: string };
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

interface Props {
  products: Product[];
  rawMaterials: RawMaterial[];
  stores: Store[];
}

const breadcrumbs = [
  { title: "Dashboard",         href: "/dashboard" },
  { title: "Stock Adjustments", href: "/stock-adjustments" },
  { title: "New Adjustment",    href: "/stock-adjustments/create" },
];

const ADJUSTMENT_TYPES = [
  { value: 'Correction', label: 'Correction (±)', desc: 'Fix incorrect stock count', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'Damage',     label: 'Damage (−)',     desc: 'Remove damaged items',       color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { value: 'Loss',       label: 'Loss (−)',       desc: 'Missing or stolen stock',    color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { value: 'Expiry',     label: 'Expiry (−)',     desc: 'Expired products',           color: 'text-purple-600 bg-purple-50 border-purple-200' },
];

export default function StockAdjustmentCreate({ products, rawMaterials, stores }: Props) {
  const { props } = usePage<any>();
  const flash = props.flash as { success?: string; error?: string } | undefined;

  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set());

  const { data, setData, post, processing, errors } = useForm({
    product_type: 'App\\Models\\Product',
    store_id: '',
    adjustment_type: 'Correction',
    reason: '',
    notes: '',
    product_id: [''],
    variant_id: [''],
    quantity: [''],
  });

  /* ── Flash SweetAlert when redirected back ── */
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

  /* ── Row helpers ── */
  const addProductRow = () => setData({
    ...data,
    product_id: [...data.product_id, ''],
    variant_id: [...data.variant_id, ''],
    quantity: [...data.quantity, '']
  });

  const removeProductRow = (i: number) => {
    if (data.product_id.length === 1) return;
    const pids = [...data.product_id]; pids.splice(i, 1);
    const vids = [...data.variant_id]; vids.splice(i, 1);
    const qtys = [...data.quantity]; qtys.splice(i, 1);
    setData({ ...data, product_id: pids, variant_id: vids, quantity: qtys });
  };

  const updateRow = (i: number, field: 'product_id' | 'variant_id' | 'quantity', val: string) => {
    const arr = [...data[field]]; arr[i] = val; setData(field, arr);
  };

  /* ── Bulk Mode Helpers ── */
  const storeItems = data.product_type === 'App\\Models\\Product' ? products : rawMaterials;
  
  const toggleBulk = (id: number) => {
    const next = new Set(bulkSelected);
    next.has(id) ? next.delete(id) : next.add(id);
    setBulkSelected(next);
  };
  const selectAllBulk = () => setBulkSelected(new Set(storeItems.map(p => p.id)));
  const clearBulkSelection = () => setBulkSelected(new Set());

  const applyBulkToForm = () => {
    const selected = storeItems.filter(p => bulkSelected.has(p.id));
    if (selected.length === 0) { toast.error("Select at least one product"); return; }
    
    setData({
      ...data,
      product_id: selected.map(p => p.id.toString()),
      variant_id: selected.map(() => ''),
      quantity: selected.map(() => '1'),
    });
    setBulkMode(false);
    toast.success(`${selected.length} items added to adjustment`);
  };


  const productOptions = products.map(p => {
    let label = p.product_name || p.name || `Product #${p.id}`;
    if (data.store_id) {
      const qty = p.inventories?.find(i => i.store_id.toString() === data.store_id)?.qty || 0;
      const unit = p.product_management?.unit_name || 'units';
      label += ` — ${qty} ${unit} in stock`;
    }
    return { value: p.id.toString(), label };
  });
  const rawMaterialOptions = rawMaterials.map(rm => ({ value: rm.id.toString(), label: `${rm.name}${rm.color ? ` - ${rm.color}` : ''}` }));
  const optionsList = data.product_type === 'App\\Models\\Product' ? productOptions : rawMaterialOptions;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/stock-adjustments', {
      onSuccess: () => toast.success("Redirecting…"),
      onError: ()  => toast.error("Failed to record adjustment. Please check the fields."),
    });
  };

  const selectedType = ADJUSTMENT_TYPES.find(t => t.value === data.adjustment_type);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="New Stock Adjustment" />

      <div className="space-y-5 pb-10 font-['Nunito_Sans']">

        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <Link href="/stock-adjustments">
            <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Stock Adjustment</h1>
            <p className="text-xs text-slate-500">Correct, record damage, loss or expiry events in bulk</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left column ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Adjustment Type */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="bg-slate-50 rounded-t-xl px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Adjustment Type</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-2">
                {ADJUSTMENT_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setData('adjustment_type', t.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      data.adjustment_type === t.value
                        ? t.color + ' shadow-sm'
                        : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <p className="text-xs font-bold">{t.label}</p>
                    <p className="text-[10px] mt-0.5 opacity-80">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Store */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="bg-slate-50 rounded-t-xl px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <StoreIcon className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Target Store</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Store</Label>
                  <Select value={data.store_id} onValueChange={val => setData('store_id', val)}>
                    <SelectTrigger className="border-slate-200 h-10 text-sm">
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                    <SelectContent className="max-h-52">
                      {stores.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.store_name || s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.store_id && <p className="text-[10px] text-red-500">{errors.store_id}</p>}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Reason</Label>
                <Input
                  placeholder="Brief reason for this adjustment"
                  className="h-10 border-slate-200 text-sm"
                  value={data.reason}
                  onChange={e => setData('reason', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Notes <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Textarea
                  placeholder="Any additional context or details…"
                  className="border-slate-200 text-sm min-h-[80px] resize-none"
                  value={data.notes}
                  onChange={e => setData('notes', e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Link href="/stock-adjustments" className="flex-1">
                <Button type="button" variant="outline" className="w-full h-10 text-sm">Cancel</Button>
              </Link>
              <Button type="submit" disabled={processing} className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">
                {processing ? 'Applying…' : 'Apply Adjustment'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* ── Right column: Product selection ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
              <div className="bg-slate-50 rounded-t-xl px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Target Items</span>
                  {data.product_id.filter(Boolean).length > 0 && (
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px] h-4 px-1.5 border-0">
                      {data.product_id.filter(Boolean).length} selected
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={bulkMode ? "default" : "outline"}
                    onClick={() => { setBulkMode(prev => !prev); clearBulkSelection(); }}
                    disabled={!data.store_id || storeItems.length === 0}
                    className={`h-8 text-xs gap-1.5 ${bulkMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-slate-200 text-slate-600'}`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Bulk Select
                  </Button>
                </div>
              </div>

              <div className="p-4 flex-1">
                {/* Inventory type toggle */}
                <div className="mb-4">
                  <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Inventory Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'App\\Models\\Product',     label: 'Products',       icon: <Package className="h-4 w-4" /> },
                      { value: 'App\\Models\\RawMaterial', label: 'Raw Materials',  icon: <Layers  className="h-4 w-4" /> },
                    ].map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => { setData('product_type', t.value); setData('product_id', ['']); setData('variant_id', ['']); setData('quantity', ['']); setBulkMode(false); }}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-semibold transition-all
                          ${data.product_type === t.value
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'}`}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {!data.store_id && (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <StoreIcon className="h-12 w-12 text-slate-200 mb-3" />
                    <p className="text-sm font-semibold text-slate-700">Select a target store first</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">You need to select the store before you can adjust items.</p>
                  </div>
                )}

                {/* ── BULK MODE ── */}
                {data.store_id && bulkMode && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">Bulk Selection</p>
                        <p className="text-[10px] text-slate-500">Select multiple items to add them to your adjustment list.</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <button type="button" onClick={selectAllBulk} className="text-emerald-600 font-semibold hover:underline">Select All</button>
                        <button type="button" onClick={clearBulkSelection} className="text-slate-500 hover:underline">Clear</button>
                      </div>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto space-y-1.5 pr-1">
                      {storeItems.map(p => {
                        const checked = bulkSelected.has(p.id);
                        
                        let qty = 0;
                        let unit = 'units';
                        if ('inventories' in p) {
                          qty = p.inventories?.find(i => i.store_id.toString() === data.store_id)?.qty || 0;
                          unit = p.product_management?.unit_name || 'units';
                        }
                        
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => toggleBulk(p.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                              ${checked ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                          >
                            {checked
                              ? <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                              : <Square className="h-4 w-4 text-slate-300 shrink-0" />
                            }
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{p.product_name || p.name}</p>
                              {'sku' in p && p.sku && <p className="text-[10px] text-slate-400">SKU: {p.sku}</p>}
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${qty > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
                                {qty} {unit}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      type="button"
                      onClick={applyBulkToForm}
                      disabled={bulkSelected.size === 0}
                      className="w-full mt-4 h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Apply {bulkSelected.size > 0 ? `${bulkSelected.size} Items` : 'Selection'}
                    </Button>
                  </div>
                )}

                {/* ── INDIVIDUAL MODE: item rows ── */}
                {data.store_id && !bulkMode && (
                  <div className="space-y-3">
                    {data.product_id.map((pid, idx) => {
                      const selected = storeItems.find(p => p.id.toString() === pid);
                      
                      let manufacturedVariants = [];
                      if (selected && 'variants' in selected && data.product_type === 'App\\Models\\Product' && selected.product_type === 'manufactured') {
                        manufacturedVariants = selected.variants?.filter(v => !!v.color) || [];
                      }
                      
                      let qty = 0;
                      let unit = 'units';
                      if (selected && 'inventories' in selected) {
                        qty = selected.inventories?.find(i => i.store_id.toString() === data.store_id)?.qty || 0;
                        unit = selected.product_management?.unit_name || 'units';
                      }

                      return (
                        <div key={idx} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
                          {/* Searchable select */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <SearchableSelect
                              value={pid}
                              onChange={val => updateRow(idx, 'product_id', val)}
                              placeholder="Search and select item…"
                              options={optionsList}
                            />
                            
                            {manufacturedVariants.length > 0 && (
                              <Select value={data.variant_id[idx]} onValueChange={val => updateRow(idx, 'variant_id', val)}>
                                <SelectTrigger className="border-slate-200 h-10 text-sm bg-white">
                                  <SelectValue placeholder="Select Color Variant" />
                                </SelectTrigger>
                                <SelectContent>
                                  {manufacturedVariants.map(v => (
                                    <SelectItem key={v.id} value={v.id.toString()}>
                                      {v.color} {typeof v.qty === 'number' ? `(Qty: ${v.qty})` : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          {/* Qty */}
                          <div className="w-28 shrink-0 space-y-1">
                            <div className="relative">
                              <Input
                                type="number"
                                placeholder="Qty"
                                value={data.quantity[idx]}
                                onChange={e => updateRow(idx, 'quantity', e.target.value)}
                                className="bg-white border-slate-200 h-11 text-sm text-center"
                              />
                            </div>
                            {selected && (
                              <p className={`text-[9px] text-center font-bold ${qty > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                Avail: {qty} {unit}
                              </p>
                            )}
                          </div>

                          {/* Remove */}
                          <Button
                            type="button" variant="ghost" size="icon"
                            onClick={() => removeProductRow(idx)}
                            disabled={data.product_id.length === 1}
                            className="h-11 w-11 text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {data.store_id && !bulkMode && (
                  <Button
                    type="button" variant="outline"
                    onClick={addProductRow}
                    className="w-full mt-3 h-10 border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-emerald-700 hover:border-emerald-300"
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Add Another Item
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
