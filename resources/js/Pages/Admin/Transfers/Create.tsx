import { Head, useForm, Link } from "@inertiajs/react";
import {
  Plus, Trash2, ArrowRightLeft, ArrowLeft, ChevronRight,
  Layers, Store as StoreIcon, CheckSquare, Square, PackageOpen,
} from "lucide-react";
import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/layouts/app-layout";

interface Store { id: number; name?: string; store_name?: string; }
interface User  { id: number; name?: string; staff_name?: string; }
interface StoreProduct { id: number; product_name: string; qty: number; raw_qty: number; unit: string; factor: number; }
interface Props { stores: Store[]; users: User[]; }

const breadcrumbs = [
  { title: "Dashboard",   href: "/dashboard" },
  { title: "Inventory",   href: "/products-new" },
  { title: "Transfers",   href: "/transfers" },
  { title: "New Transfer",href: "/transfers/create" },
];

export default function TransferCreate({ stores, users }: Props) {
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set());

  const { data, setData, post, processing, errors } = useForm({
    source_store: '',
    store_name: '',
    staff_recommeded: '',
    reason: 'Inter-store transfer',
    product_id: [''],
    product_quantity: ['1'],
  });

  /* ─── Load products when source store changes ─── */
  useEffect(() => {
    if (data.source_store) {
      setLoadingProducts(true);
      setBulkSelected(new Set());
      fetch(`/transfers/store-products/${data.source_store}`)
        .then(r => r.json())
        .then(result => { setStoreProducts(Array.isArray(result) ? result : []); setLoadingProducts(false); })
        .catch(() => { setLoadingProducts(false); toast.error("Failed to load store products"); });
    } else {
      setStoreProducts([]);
    }
  }, [data.source_store]);

  /* ─── Individual row helpers ─── */
  const addProductRow = () => setData({ ...data, product_id: [...data.product_id, ''], product_quantity: [...data.product_quantity, '1'] });
  const removeProductRow = (i: number) => {
    if (data.product_id.length === 1) return;
    const ids = [...data.product_id]; ids.splice(i, 1);
    const qtys = [...data.product_quantity]; qtys.splice(i, 1);
    setData({ ...data, product_id: ids, product_quantity: qtys });
  };
  const updateRow = (i: number, field: 'product_id' | 'product_quantity', val: string) => {
    const arr = [...data[field]]; arr[i] = val; setData(field, arr);
  };

  /* ─── Bulk mode helpers ─── */
  const toggleBulk = (id: number) => {
    const next = new Set(bulkSelected);
    next.has(id) ? next.delete(id) : next.add(id);
    setBulkSelected(next);
  };
  const selectAllBulk = () => {
    setBulkSelected(new Set(storeProducts.map(p => p.id)));
  };
  const clearBulkSelection = () => setBulkSelected(new Set());

  const applyBulkToForm = () => {
    const selected = storeProducts.filter(p => bulkSelected.has(p.id));
    if (selected.length === 0) { toast.error("Select at least one product"); return; }
    setData({
      ...data,
      product_id: selected.map(p => p.id.toString()),
      product_quantity: selected.map(() => '1'),
    });
    setBulkMode(false);
    toast.success(`${selected.length} product(s) added to transfer`);
  };

  /* ─── Submit ─── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.source_store || !data.store_name) { toast.error("Select both source and destination stores"); return; }
    if (data.source_store === data.store_name)  { toast.error("Source and destination cannot be the same"); return; }
    post('/transfers', {
      onSuccess: (page: any) => {
        const err = page?.props?.flash?.error;
        err ? toast.error(err) : toast.success("Products transferred successfully");
      },
      onError: () => toast.error("Transfer failed — check inventory levels"),
    });
  };

  const productOptions = storeProducts.map(p => ({ value: p.id.toString(), label: `${p.product_name} — ${p.qty} ${p.unit} in stock` }));
  const sourceName = stores.find(s => s.id.toString() === data.source_store)?.store_name ?? '';
  const destName   = stores.find(s => s.id.toString() === data.store_name)?.store_name ?? '';

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="New Stock Transfer" />

      <div className="space-y-5 pb-10 font-['Nunito_Sans']">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/transfers">
              <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200 shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Stock Transfer</h1>
              <p className="text-xs text-slate-500">Move inventory between warehouses or branches</p>
            </div>
          </div>

          {/* Route summary pill */}
          {(sourceName || destName) && (
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-700">
              <StoreIcon className="h-3.5 w-3.5" />
              <span>{sourceName || '?'}</span>
              <ArrowRightLeft className="h-3 w-3 text-emerald-400" />
              <span>{destName || '?'}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left column: Route + Reason ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Route card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="bg-slate-50 rounded-t-xl px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Transfer Route</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Source Store</Label>
                  <Select value={data.source_store} onValueChange={val => setData('source_store', val)}>
                    <SelectTrigger className="border-slate-200 h-10 text-sm">
                      <SelectValue placeholder="Select source store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.store_name || s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.source_store && <p className="text-[10px] text-red-500">{errors.source_store}</p>}
                </div>

                <div className="flex justify-center">
                  <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center">
                    <ArrowRightLeft className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Destination Store</Label>
                  <Select value={data.store_name} onValueChange={val => setData('store_name', val)}>
                    <SelectTrigger className="border-slate-200 h-10 text-sm">
                      <SelectValue placeholder="Select destination store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.store_name || s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.store_name && <p className="text-[10px] text-red-500">{errors.store_name}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Authorized By</Label>
                  <Select value={data.staff_recommeded} onValueChange={val => setData('staff_recommeded', val)}>
                    <SelectTrigger className="border-slate-200 h-10 text-sm">
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent className="max-h-52">
                      {users.map(u => <SelectItem key={u.id} value={u.staff_name || u.name || `User #${u.id}`}>{u.staff_name || u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.staff_recommeded && <p className="text-[10px] text-red-500">{errors.staff_recommeded}</p>}
                </div>
              </div>
            </div>

            {/* Reason card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Reason / Reference</Label>
              <Input
                placeholder="e.g., Replenishing weekend stock"
                className="h-10 border-slate-200 text-sm"
                value={data.reason}
                onChange={e => setData('reason', e.target.value)}
              />
              {errors.reason && <p className="text-[10px] text-red-500">{errors.reason}</p>}
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <Link href="/transfers" className="flex-1">
                <Button type="button" variant="outline" className="w-full h-10 text-sm">Cancel</Button>
              </Link>
              <Button type="submit" disabled={processing} className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">
                {processing ? 'Submitting…' : 'Confirm Transfer'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* ── Right column: Products ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full">
              {/* Card header */}
              <div className="bg-slate-50 rounded-t-xl px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Products to Transfer</span>
                  {data.product_id.filter(Boolean).length > 0 && (
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px] h-4 px-1.5 border-0">
                      {data.product_id.filter(Boolean).length} selected
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Bulk mode toggle */}
                  <Button
                    type="button"
                    size="sm"
                    variant={bulkMode ? "default" : "outline"}
                    onClick={() => { setBulkMode(prev => !prev); clearBulkSelection(); }}
                    disabled={!data.source_store || storeProducts.length === 0}
                    className={`h-8 text-xs gap-1.5 ${bulkMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-slate-200 text-slate-600'}`}
                  >
                    <PackageOpen className="h-3.5 w-3.5" />
                    Bulk Select
                  </Button>

                  {/* Add individual row */}
                  {!bulkMode && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addProductRow}
                      disabled={!data.source_store || storeProducts.length === 0}
                      className="h-8 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Item
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-4">

                {/* ── No source store selected ── */}
                {!data.source_store && (
                  <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-xl">
                    <StoreIcon className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-400 italic">Select a source store to load available products</p>
                  </div>
                )}

                {/* ── Loading ── */}
                {data.source_store && loadingProducts && (
                  <div className="py-16 text-center text-slate-400 text-sm">Loading store inventory…</div>
                )}

                {/* ── Empty store ── */}
                {data.source_store && !loadingProducts && storeProducts.length === 0 && (
                  <div className="py-10 text-center text-rose-500 text-sm bg-rose-50 rounded-xl border border-rose-100">
                    No available stock found in selected store.
                  </div>
                )}

                {/* ── BULK MODE: checkbox list ── */}
                {data.source_store && !loadingProducts && storeProducts.length > 0 && bulkMode && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{bulkSelected.size} of {storeProducts.length} selected</span>
                      <div className="flex gap-3">
                        <button type="button" onClick={selectAllBulk} className="text-emerald-600 font-semibold hover:underline">Select All</button>
                        <button type="button" onClick={clearBulkSelection} className="text-slate-500 hover:underline">Clear</button>
                      </div>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto space-y-1.5 pr-1">
                      {storeProducts.map(p => {
                        const checked = bulkSelected.has(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => toggleBulk(p.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                              ${checked ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}
                          >
                            {checked
                              ? <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                              : <Square className="h-4 w-4 text-slate-300 shrink-0" />
                            }
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{p.product_name}</p>
                              <p className="text-[10px] text-slate-400">{p.qty} {p.unit} available</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.qty > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                              {p.qty} {p.unit}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      type="button"
                      onClick={applyBulkToForm}
                      disabled={bulkSelected.size === 0}
                      className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Apply {bulkSelected.size > 0 ? `${bulkSelected.size} Products` : 'Selection'}
                    </Button>
                  </div>
                )}

                {/* ── INDIVIDUAL MODE: product rows ── */}
                {data.source_store && !loadingProducts && storeProducts.length > 0 && !bulkMode && (
                  <div className="space-y-3">
                    {data.product_id.map((pid, idx) => {
                      const selected = storeProducts.find(p => p.id.toString() === pid);
                      return (
                        <div key={idx} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
                          {/* Searchable select */}
                          <div className="flex-1 min-w-0">
                            <SearchableSelect
                              value={pid}
                              onChange={val => updateRow(idx, 'product_id', val)}
                              placeholder="Search and select product…"
                              options={productOptions}
                            />
                          </div>

                          {/* Qty + unit */}
                          <div className="w-32 shrink-0">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number" min="1"
                                placeholder="Qty"
                                value={data.product_quantity[idx]}
                                onChange={e => updateRow(idx, 'product_quantity', e.target.value)}
                                className="bg-white border-slate-200 h-11 text-sm text-center"
                              />
                              {selected?.unit && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-2 whitespace-nowrap shrink-0">
                                  {selected.unit}
                                </span>
                              )}
                            </div>
                            {selected && selected.factor > 1 && (
                              <p className="text-[9px] text-slate-400 text-center mt-0.5">
                                = {Number(data.product_quantity[idx] || 0) * selected.factor} pcs
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
              </div>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
