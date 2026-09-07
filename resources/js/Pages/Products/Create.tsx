import { Head, router } from '@inertiajs/react';
import { AlertCircle, Plus, Trash2, Camera, RefreshCw, Barcode, Lock, ShieldCheck, ArrowLeft, ChevronDown, ChevronUp, Scan, X } from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

interface CreateProductProps {
  categories: Array<{ id: number; name: string }>;
  units: Array<{ id: number; name: string }>;
  stores: Array<{ id: number; name: string; branch_id?: number | null }>;
  branches: Array<{ id: number; name: string }>;
  activeBranchId?: number | null;
  errors?: Record<string, string>;
}

interface PricingNode {
  unit_name: string;
  factor: number;
  market_price: number | string;
}

interface TechSpec {
  title: string;
  value: string;
}

export default function CreateProduct({
  categories = [],
  units = [],
  stores = [],
  branches = [],
  activeBranchId = null,
  errors = {},
}: CreateProductProps) {
  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [images, setImages] = useState<(File | null)[]>([null, null, null, null, null]);
  const [pricingNodes, setPricingNodes] = useState<PricingNode[]>([{ unit_name: '', factor: 1, market_price: 0 }]);
  const [techSpecs, setTechSpecs] = useState<TechSpec[]>([]);
  const [convRatio, setConvRatio] = useState(1);
  const [buyingUnit, setBuyingUnit] = useState('');
  const [totalBuyingCost, setTotalBuyingCost] = useState<number | string>(0);

  const [form, setForm] = useState({
    product_name: '',
    sku: 'Auto',
    barcode: '',
    category_id: '',
    store_id: '',
    branch_id: activeBranchId?.toString() ?? '',
    brand: '',
    material_type: '',
    base_unit: '',
    description: '',
    // Costing
    buying_price: 0,
    // Inventory
    opening_qty: 0,
    reorder_level: '',
    low_alert: '',
    // Physical
    gsm: '',
    color: '',
    weight: '',
    weight_unit: 'kg',
    width: '',
    length: '',
    box_l: '',
    box_w: '',
    box_h: '',
    box_unit: 'cm',
    // Visibility
    is_enabled: true,
    is_featured: false,
    is_public: false,
    // Type
    product_type: 'trading' as 'trading' | 'manufactured',
  });

  const fileRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null]);

  /* Barcode scanner modal */
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeScanTab, setBarcodeScanTab] = useState<'usb' | 'camera'>('usb');
  const [barcodeManualInput, setBarcodeManualInput] = useState('');
  const [cameraError, setCameraError] = useState('');
  const barcodeModalInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  }, []);

  const captureBarcode = useCallback((code: string) => {
    stopCamera();
    set('barcode', code);
    setBarcodeModalOpen(false);
    setBarcodeManualInput('');
    setCameraError('');
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      if (!('BarcodeDetector' in window)) {
        setCameraError('Camera barcode detection is not supported in this browser. Use Chrome or Edge, or use USB scanner mode.');
        return;
      }
      const detector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'qr_code', 'data_matrix'],
      });
      detectorRef.current = detector;
      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || !detectorRef.current) return;
        try {
          const barcodes = await detectorRef.current.detect(videoRef.current);
          if (barcodes.length > 0) captureBarcode(barcodes[0].rawValue);
        } catch { /* ignore */ }
      }, 300);
    } catch {
      setCameraError('Camera access denied. Please allow camera permission and try again.');
    }
  }, [captureBarcode]);

  useEffect(() => {
    if (barcodeModalOpen && barcodeScanTab === 'usb') {
      setTimeout(() => barcodeModalInputRef.current?.focus(), 100);
    }
    if (barcodeModalOpen && barcodeScanTab === 'camera') startCamera();
    if (!barcodeModalOpen) stopCamera();
  }, [barcodeModalOpen, barcodeScanTab, startCamera, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Products', href: '/products-new' },
    { title: 'Create Product', href: '#' },
  ];

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const costPerBase = convRatio > 0 ? ((Number(totalBuyingCost) || 0) / convRatio).toFixed(2) : '0.00';

  const handleImagePick = (index: number) => fileRefs.current[index]?.click();
  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImages(prev => {
 const next = [...prev]; next[index] = file;

 return next; 
});
  };
  const addPricingNode = () => setPricingNodes(prev => [...prev, { unit_name: '', factor: 1, market_price: 0 }]);
  const removePricingNode = (i: number) => setPricingNodes(prev => prev.filter((_, idx) => idx !== i));
  const updatePricingNode = (i: number, field: keyof PricingNode, value: any) => {
    setPricingNodes(prev => prev.map((node, idx) => idx === i ? { ...node, [field]: value } : node));
  };

  const addTechSpec = () => setTechSpecs(prev => [...prev, { title: '', value: '' }]);
  const updateTechSpec = (i: number, field: keyof TechSpec, value: string) => {
    setTechSpecs(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };
  const removeTechSpec = (i: number) => setTechSpecs(prev => prev.filter((_, idx) => idx !== i));
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, String(v)));
    data.append('buying_unit', buyingUnit);
    data.append('conv_ratio', String(convRatio));
    data.append('total_buying_cost', String(totalBuyingCost));
    images.forEach((img, i) => {
 if (img) {
data.append(`images[${i}]`, img);
} 
});
    data.append('pricing_nodes', JSON.stringify(pricingNodes));
    data.append('tech_specs', JSON.stringify(techSpecs));

    router.post('/products-new', data as any, {
      onSuccess: () => { toast.success('Product published successfully'); router.visit('/products-new'); },
      onError: () => toast.error('Please fill in all required fields before saving'),
      onFinish: () => setLoading(false),
    });
  };

  const sectionTitle = (icon: string, label: string, color: string) => (
    <div className="flex items-center gap-2 mb-5">
      <span className={`text-lg ${color}`}>{icon}</span>
      <h2 className={`font-bold text-sm ${color}`}>{label}</h2>
    </div>
  );

  const fieldLabel = (text: string, required = false) => (
    <label className="block text-xs font-bold text-slate-500 mb-1.5">
      {text}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  const inputCls = "h-9 border-slate-200 rounded-sm text-sm bg-white focus:ring-1 focus:ring-slate-400";
  const selectCls = "w-full h-9 border border-slate-200 rounded-sm text-sm px-2 bg-white focus:outline-none focus:ring-1 focus:ring-slate-400";

  return (
    <>
      <Head title="Create Product" />

      {/* Barcode Scanner Modal */}
      <Dialog open={barcodeModalOpen} onOpenChange={(open) => { if (!open) { stopCamera(); setCameraError(''); } setBarcodeModalOpen(open); }}>
        <DialogContent className="sm:max-w-md bg-white" onOpenAutoFocus={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Barcode className="h-4 w-4 text-emerald-600" />
              Scan Barcode
            </DialogTitle>
          </DialogHeader>
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-4">
            {(['usb', 'camera'] as const).map(tab => (
              <button key={tab} type="button"
                onClick={() => { stopCamera(); setCameraError(''); setBarcodeScanTab(tab); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${barcodeScanTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {tab === 'usb' ? '⌨ USB / Bluetooth Scanner' : '📷 Camera'}
              </button>
            ))}
          </div>

          {barcodeScanTab === 'usb' && (
            <div className="space-y-4">
              <div className="relative">
                <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                <input
                  ref={barcodeModalInputRef}
                  value={barcodeManualInput}
                  onChange={e => setBarcodeManualInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (barcodeManualInput.trim()) captureBarcode(barcodeManualInput.trim()); } }}
                  placeholder="Scan barcode here or type and press Enter..."
                  autoComplete="off"
                  className="w-full pl-9 pr-4 py-3 text-sm border-2 border-emerald-200 rounded-xl bg-emerald-50/30 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 text-center">Point your USB or Bluetooth scanner at the barcode.<br/>It will auto-fill the field. Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Enter</kbd> to confirm.</p>
              {barcodeManualInput.trim() && (
                <button type="button" onClick={() => captureBarcode(barcodeManualInput.trim())}
                  className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black transition-colors">
                  Use "{barcodeManualInput.trim()}"
                </button>
              )}
            </div>
          )}

          {barcodeScanTab === 'camera' && (
            <div className="space-y-3">
              {cameraError ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">{cameraError}</div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-28 border-2 border-emerald-400 rounded-lg opacity-70" />
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500 text-center">Align the barcode within the green frame. It will be captured automatically.</p>
              {cameraError && (
                <button type="button" onClick={startCamera}
                  className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black transition-colors">
                  Retry Camera
                </button>
              )}
            </div>
          )}

          <button type="button" onClick={() => { stopCamera(); setBarcodeModalOpen(false); setCameraError(''); }}
            className="mt-2 w-full h-9 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">
            Cancel
          </button>
        </DialogContent>
      </Dialog>

      <AppLayout breadcrumbs={breadcrumbs}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 max-w-[1400px] mx-auto">
            <div className="col-span-full border-b border-slate-100 pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => router.visit('/products-new')} type="button" className="rounded-xl border border-slate-200 h-11 w-11 shadow-sm hover:bg-slate-50 transition-all">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h1 className="text-1xl font-bold text-slate-900 tracking-tight">Add Product</h1>
                  </div>
                </div>
              </div>
            </div>

            {/* LEFT COLUMN */}
            <div className="space-y-6">

              {/* Basic Information */}
              <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                {sectionTitle('🔵', 'Basic information', 'text-blue-600')}
                {Object.keys(errors).length > 0 && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 text-sm text-red-800">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <ul className="list-disc pl-4">{Object.entries(errors).map(([f, m]) => <li key={f}>{m}</li>)}</ul>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    {fieldLabel('Product name', true)}
                    <Input className={inputCls} placeholder="Enter product name" value={form.product_name} onChange={e => set('product_name', e.target.value)} />
                  </div>
                  <div>
                    {fieldLabel('SKU/Item no', true)}
                    <div className="flex gap-2">
                      <Input className={inputCls + ' flex-1'} value={form.sku} onChange={e => set('sku', e.target.value)} />
                      <button type="button" className="h-9 w-9 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    {fieldLabel('Barcode')}
                    <div className="flex gap-2">
                      <Input className={inputCls + ' flex-1'} placeholder="UPC/EAN" value={form.barcode} onChange={e => set('barcode', e.target.value)} />
                      <button type="button" onClick={() => { setBarcodeModalOpen(true); setBarcodeScanTab('usb'); setBarcodeManualInput(''); }} className="h-9 px-2.5 border border-emerald-200 bg-emerald-50 rounded-lg flex items-center gap-1.5 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-bold">
                        <Scan className="h-3.5 w-3.5" />
                        Scan
                      </button>
                    </div>
                  </div>

                  <div>
                    {fieldLabel('Category', true)}
                    <select className={selectCls} value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                      <option value="">-- Select category --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    {fieldLabel('Branch', true)}
                    <select className={selectCls} value={form.branch_id} onChange={e => { set('branch_id', e.target.value); set('store_id', ''); }}>
                      <option value="">-- Select branch --</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    {fieldLabel('Store', true)}
                    <select className={selectCls} value={form.store_id} onChange={e => set('store_id', e.target.value)} disabled={!form.branch_id}>
                      <option value="">{form.branch_id ? '-- Select store --' : '-- Select branch first --'}</option>
                      {stores.filter(s => !form.branch_id || String(s.branch_id ?? '') === String(form.branch_id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    {fieldLabel('Base unit', true)}
                    <select className={selectCls} value={form.base_unit} onChange={e => set('base_unit', e.target.value)}>
                      <option value="">-- Select unit --</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div />
                  <div />

                  {/* Show More Details toggle */}
                  <div className="col-span-full">
                    <button
                      type="button"
                      onClick={() => setShowMore(v => !v)}
                      className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {showMore ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {showMore ? 'Hide extra details' : 'Show more details'}
                    </button>
                  </div>

                  {showMore && (
                    <>
                      <div>
                        {fieldLabel('Brand')}
                        <Input className={inputCls} placeholder="e.g. HD" value={form.brand} onChange={e => set('brand', e.target.value)} />
                      </div>
                      <div>
                        {fieldLabel('Material aspect / type')}
                        <Input className={inputCls} placeholder="e.g. Non-Woven" value={form.material_type} onChange={e => set('material_type', e.target.value)} />
                      </div>
                    </>
                  )}

                  <div className="col-span-full">
                    {fieldLabel('Description')}
                    <Textarea className="border-slate-200 rounded-lg text-sm min-h-[100px] focus:ring-1 focus:ring-slate-400" placeholder="Brief product overview..." value={form.description} onChange={e => set('description', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Costing + Inventory side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Costing Details */}
                <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                  {sectionTitle('🟢', 'Costing details', 'text-emerald-600')}
                  <div className="space-y-6">
                    <div>
                      {fieldLabel('Total buying cost', true)}
                      <div className="flex">
                        <span className="h-9 inline-flex items-center px-4 bg-slate-50 border border-r-0 border-slate-200 rounded-l-lg text-xs font-bold text-slate-500">TZS</span>
                        <Input type="number" className={inputCls + ' rounded-l-none flex-1'} value={totalBuyingCost} onChange={e => { const v = e.target.value; setTotalBuyingCost(v === '' ? '' : parseFloat(v)); }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        {fieldLabel('Buying unit')}
                        <select className={selectCls} value={buyingUnit} onChange={e => setBuyingUnit(e.target.value)}>
                          <option value="">-- Select --</option>
                          {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                        </select>
                      </div>
                      <div>
                        {fieldLabel(`Pieces inside (${buyingUnit || 'selected buying unit'})`)}
                        <Input type="number" className={inputCls} value={convRatio} onChange={e => setConvRatio(parseFloat(e.target.value) || 1)} />
                      </div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-4 flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-700">Cost per base unit</span>
                      <span className="text-lg font-black text-emerald-700">{costPerBase} <span className="text-[10px] ml-0.5">TZS</span></span>
                    </div>
                  </div>
                </div>

                {/* Inventory Levels */}
                <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                  {sectionTitle('🔵', 'Inventory levels', 'text-blue-600')}
                  <div className="space-y-6">
                    <div>
                      {fieldLabel('Opening quantity', true)}
                      <Input type="number" className={inputCls} value={form.opening_qty} onChange={e => set('opening_qty', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        {fieldLabel('Reorder point')}
                        <Input type="number" className={inputCls} value={form.reorder_level} onChange={e => set('reorder_level', e.target.value)} />
                      </div>
                      <div>
                        {fieldLabel('Low alert')}
                        <Input type="number" className={inputCls} value={form.low_alert} onChange={e => set('low_alert', e.target.value)} />
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-blue-500" />
                      <span className="text-xs font-bold text-blue-700">Auto-restock notifications enabled</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical Specifications — hidden unless showMore */}
              {showMore && (
                <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                  {sectionTitle('🟠', 'Physical specifications', 'text-amber-600')}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      {fieldLabel('Material weight (GSM)')}
                      <Input className={inputCls} placeholder="e.g. 70" value={form.gsm} onChange={e => set('gsm', e.target.value)} />
                    </div>
                    <div>
                      {fieldLabel('Material color')}
                      <Input className={inputCls} placeholder="e.g. Blue" value={form.color} onChange={e => set('color', e.target.value)} />
                    </div>
                    <div>
                      {fieldLabel('Weight')}
                      <div className="flex gap-2">
                        <Input className={inputCls + ' flex-1'} value={form.weight} onChange={e => set('weight', e.target.value)} />
                        <select className="h-9 border border-slate-200 rounded-lg text-xs px-2 bg-white" value={form.weight_unit} onChange={e => set('weight_unit', e.target.value)}>
                          <option>kg</option><option>g</option><option>lb</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      {fieldLabel('Width (CM/MM)')}
                      <div className="flex gap-2">
                        <Input className={inputCls + ' flex-1'} placeholder="Width" value={form.width} onChange={e => set('width', e.target.value)} />
                        <button type="button" className="h-9 px-3 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 bg-slate-50">SPEC</button>
                      </div>
                    </div>
                    <div>
                      {fieldLabel('Length (M/CM)')}
                      <div className="flex gap-2">
                        <Input className={inputCls + ' flex-1'} placeholder="Length" value={form.length} onChange={e => set('length', e.target.value)} />
                        <button type="button" className="h-9 px-3 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 bg-slate-50">SPEC</button>
                      </div>
                    </div>
                    <div>
                      {fieldLabel('Box dimensions (L×W×H)')}
                      <div className="flex gap-1.5 items-center">
                        <Input className={inputCls + ' w-full'} placeholder="L" value={form.box_l} onChange={e => set('box_l', e.target.value)} />
                        <span className="text-slate-400 text-xs">×</span>
                        <Input className={inputCls + ' w-full'} placeholder="W" value={form.box_w} onChange={e => set('box_w', e.target.value)} />
                        <span className="text-slate-400 text-xs">×</span>
                        <Input className={inputCls + ' w-full'} placeholder="H" value={form.box_h} onChange={e => set('box_h', e.target.value)} />
                        <select className="h-9 border border-slate-200 rounded-lg text-xs px-1.5 bg-white" value={form.box_unit} onChange={e => set('box_unit', e.target.value)}>
                          <option>cm</option><option>mm</option><option>m</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sale Units & Market Pricing */}
              <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-rose-500">🏷️</span>
                    <h2 className="font-bold text-sm text-rose-600 tracking-tight">Sale units & market pricing</h2>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addPricingNode} className="h-9 px-4 border-slate-200 rounded-lg text-xs font-bold text-slate-600 gap-2 hover:bg-slate-50 transition-all">
                    <Plus className="h-3.5 w-3.5" /> Add pricing node
                  </Button>
                </div>  
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left text-[11px] font-bold text-slate-400 tracking-tight py-3 px-2">Unit name</th>
                        <th className="text-left text-[11px] font-bold text-slate-400 tracking-tight py-3 px-2">Pieces inside</th>
                        <th className="text-left text-[11px] font-bold text-slate-400 tracking-tight py-3 px-2">{form.product_type === 'trading' ? 'Selling price' : 'Market price'}</th>
                        <th className="text-left text-[11px] font-bold text-slate-400 tracking-tight py-3 px-2">Profit</th>
                        <th className="text-left text-[11px] font-bold text-slate-400 tracking-tight py-3 px-2">Margin</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricingNodes.map((node, i) => {
                        const marketPrice = Number(node.market_price) || 0;
                        const profit = marketPrice - (parseFloat(costPerBase) * node.factor);
                        const margin = marketPrice > 0 ? ((profit / marketPrice) * 100).toFixed(1) : '0.0';

                        return (
                          <tr key={i} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-2">
                              <select className="h-9 border border-slate-200 rounded-lg text-sm px-2 bg-white w-40 focus:ring-1 focus:ring-slate-400 outline-none" value={node.unit_name} onChange={e => updatePricingNode(i, 'unit_name', e.target.value)}>
                                <option value="">-- select unit --</option>
                                {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                              </select>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex flex-col gap-0.5">
                                <Input type="number" className="h-9 w-24 border-slate-200 rounded-lg text-sm" value={node.factor} onChange={e => updatePricingNode(i, 'factor', parseFloat(e.target.value) || 1)} />
                                {node.unit_name && <span className="text-[10px] text-slate-400 font-medium px-1">inside {node.unit_name}</span>}
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <div className="relative">
                                <Input type="number" className="h-9 w-32 border-slate-200 rounded-lg pl-8 text-sm font-bold" value={node.market_price} onChange={e => { const v = e.target.value; updatePricingNode(i, 'market_price', v === '' ? '' : parseFloat(v)); }} />
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">TZS</span>
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <span className={`text-sm font-black ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <Badge className={`rounded-full px-2.5 py-0.5 border-none font-bold text-[10px] ${parseFloat(margin) >= 20 ? 'bg-emerald-100 text-emerald-700' : parseFloat(margin) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                {margin}%
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <Button type="button" variant="ghost" size="icon" onClick={() => removePricingNode(i)} className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-slate-600">⚙️</span>
                    <h2 className="font-bold text-sm text-slate-700 tracking-tight">Technical specifications</h2>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addTechSpec} className="h-9 px-4 border-slate-200 rounded-lg text-xs font-bold text-slate-600 gap-2 hover:bg-slate-50 transition-all">
                    <Plus className="h-3.5 w-3.5" /> Add spec
                  </Button>
                </div>
                {techSpecs.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl">
                    <p className="text-sm text-slate-400 font-medium italic">No specifications added yet. Define technical traits here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left text-[11px] font-bold text-slate-400 tracking-tight py-3 px-2">Specification title</th>
                          <th className="text-left text-[11px] font-bold text-slate-400 tracking-tight py-3 px-2">Value / Grade</th>
                          <th className="py-3 px-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {techSpecs.map((spec, i) => (
                          <tr key={i} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-2">
                              <Input className="h-9 border-slate-200 rounded-lg text-sm bg-white" placeholder="e.g. Density" value={spec.title} onChange={e => updateTechSpec(i, 'title', e.target.value)} />
                            </td>
                            <td className="py-3 px-2">
                              <Input className="h-9 border-slate-200 rounded-lg text-sm bg-white" placeholder="e.g. High" value={spec.value} onChange={e => updateTechSpec(i, 'value', e.target.value)} />
                            </td>
                            <td className="py-3 px-2 text-right">
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeTechSpec(i)} className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">

              {/* Product Media */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-lg text-amber-500">🟡</span>
                  <h2 className="font-bold text-sm text-amber-600 tracking-tight">Product media</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className={i === 0 ? "col-span-2" : ""}>
                      <input ref={(el) => {
 fileRefs.current[i] = el; 
}} type="file" accept="image/*" className="hidden" onChange={e => handleImageChange(i, e)} />
                      <button
                        type="button"
                        onClick={() => handleImagePick(i)}
                        className={`w-full ${i === 0 ? 'aspect-[16/10]' : 'aspect-square'} rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-slate-400 hover:border-slate-400 hover:bg-slate-50 transition-all ${img ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200 bg-slate-50/50'}`}
                      >
                        {img ? (
                          <img src={URL.createObjectURL(img)} className="w-full h-full object-cover rounded-xl" alt="" />
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Camera className="h-6 w-6 opacity-40" />
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-black opacity-60">UPLOAD SLOT</span>
                              <span className="text-[12px] font-black text-blue-600">#{i + 1}</span>
                            </div>
                          </div>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-3 bg-blue-50/80 border border-blue-100 rounded-lg flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  <p className="text-[11px] text-blue-700 font-bold leading-tight">
                    Primary showcase: Slot #1
                  </p>
                </div>
              </div>

              {/* Visibility & Status */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-lg text-slate-500 text-[18px]">👁</span>
                  <h2 className="font-bold text-sm text-slate-700 tracking-tight">Visibility & status</h2>
                </div>
                <div className="space-y-4">
                  {[
                    { key: 'is_enabled', label: 'Enabled status', color: 'bg-emerald-500' },
                    { key: 'is_featured', label: 'Featured asset', color: 'bg-amber-500' },
                    { key: 'is_public', label: 'Publicly visible', color: 'bg-blue-500' },
                  ].map(({ key, label, color }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className={`h-2 w-2 rounded-full ${color}`} />
                         <label htmlFor={key} className="text-xs font-bold text-slate-700 cursor-pointer">{label}</label>
                      </div>
                      <Checkbox
                        id={key}
                        checked={(form as any)[key]}
                        onCheckedChange={v => set(key, v)}
                        className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Publish Actions */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                  {loading ? 'Publishing...' : 'Publish product'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={() => router.visit('/products-new')} 
                  className="w-full h-12 border border-slate-100 rounded-xl text-xs font-bold text-slate-500 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" /> Reset form
                </Button>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-4">
                  <ShieldCheck className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-900 font-bold leading-none">Security protection</p>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight">All fields are validated for integrity before blockchain storage.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </AppLayout>
    </>
  );
}
