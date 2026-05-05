import { Head, router, Link } from '@inertiajs/react';
import { 
  ArrowLeft, 
  Barcode, 
  Dices, 
  Save, 
  Undo2, 
  Info,
  ChevronDown,
  Package,
  Settings,
  History,
  AlertCircle,
  Camera,
  Palette,
  Image as ImageIcon,
  Badge
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

// ── Fabric color name resolver ──────────────────────────────────────────
const FABRIC_COLORS: Record<string, string> = {
  '#ffffff': 'White',      '#f5f5f5': 'Off-White',  '#fffdd0': 'Cream',
  '#000000': 'Black',      '#1a1a1a': 'Black',       '#222222': 'Black',
  '#808080': 'Grey',       '#a9a9a9': 'Silver Grey', '#d3d3d3': 'Light Grey',
  '#ff0000': 'Red',        '#cc0000': 'Red',         '#8b0000': 'Dark Red',
  '#ff6666': 'Light Red',  '#ff4500': 'Orange Red',  '#800000': 'Maroon',
  '#ffa500': 'Orange',     '#ff8c00': 'Dark Orange',
  '#ffff00': 'Yellow',     '#ffd700': 'Gold',        '#f0e68c': 'Khaki',
  '#008000': 'Green',      '#006400': 'Dark Green',  '#90ee90': 'Light Green',
  '#00ff00': 'Lime Green', '#32cd32': 'Lime',        '#228b22': 'Forest Green',
  '#0000ff': 'Blue',       '#00008b': 'Dark Blue',   '#add8e6': 'Light Blue',
  '#87ceeb': 'Sky Blue',   '#4169e1': 'Royal Blue',  '#000080': 'Navy Blue',
  '#00ffff': 'Cyan',       '#00ced1': 'Dark Cyan',
  '#ff00ff': 'Magenta',    '#ee82ee': 'Violet',      '#bf00ff': 'Purple',
  '#800080': 'Purple',     '#dda0dd': 'Plum',        '#9400d3': 'Dark Violet',
  '#ffc0cb': 'Pink',       '#ff69b4': 'Hot Pink',    '#db7093': 'Pale Pink',
  '#a52a2a': 'Brown',      '#8b4513': 'Saddle Brown','#d2691e': 'Chocolate',
  '#ffe4c4': 'Bisque',     '#f5deb3': 'Wheat',       '#c8a96e': 'Tan',
};
function hexToColorName(hex: string): string {
  const h = hex.toLowerCase();
  if (FABRIC_COLORS[h]) return FABRIC_COLORS[h];
  const r1 = parseInt(h.slice(1,3),16), g1 = parseInt(h.slice(3,5),16), b1 = parseInt(h.slice(5,7),16);
  let best = '', bestDist = Infinity;
  for (const [k, v] of Object.entries(FABRIC_COLORS)) {
    const r2 = parseInt(k.slice(1,3),16), g2 = parseInt(k.slice(3,5),16), b2 = parseInt(k.slice(5,7),16);
    const d = Math.sqrt((r1-r2)**2+(g1-g2)**2+(b1-b2)**2);
    if (d < bestDist) { bestDist = d; best = v; }
  }
  return best || hex;
}
function colorToCss(color: string): string {
  if (!color) return '#ccc';
  if (color.startsWith('#')) return color;
  const lower = color.trim().toLowerCase();
  for (const [hex, name] of Object.entries(FABRIC_COLORS)) {
    if (name.toLowerCase() === lower) return hex;
  }
  return lower;
}
// ───────────────────────────────────────────────────────────────────────
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

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
  is_accessory: boolean;
  gsm?: number;
  width?: number;
  total_length?: number;
  remaining_length?: number;
  color?: string;
  cost_per_kg?: number;
  sku?: string;
  barcode?: string;
  brand?: string;
  description?: string;
  reorder_point?: number;
  material?: string;
  minimum_stock?: number;
  branch_id?: number | string;
  purchase_unit?: string;
  conversion_ratio?: number;
  weight_kg?: number;
  image_url?: string;
  current_store_id?: number | string;
}

interface RawMaterialsEditProps {
  rawMaterial: RawMaterial;
  units: { id: number; unit_name: string }[];
  categories: string[];
  stores: { id: number; store_name: string; branches: { id: number; name: string }[] }[];
  branches: { id: number; name: string }[];
  suppliers: { id: number; supplier_name: string }[];
  errors?: Record<string, string>;
}

export default function RawMaterialsEdit({ 
  rawMaterial,
  units = [], 
  categories = [], 
  stores = [], 
  branches = [],
  suppliers = [],
  errors = {} 
}: RawMaterialsEditProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    name: rawMaterial.name || '',
    category: rawMaterial.category === 'Uncategorized' ? '' : rawMaterial.category,
    base_unit: rawMaterial.base_unit || '',
    code: rawMaterial.code || '',
    barcode: rawMaterial.barcode || '',
    brand: rawMaterial.brand || '',
    material: rawMaterial.material || '',
    branch_id: rawMaterial.branch_id?.toString() || branches[0]?.id?.toString() || '',
    opening_store_id: rawMaterial.current_store_id?.toString() || stores[0]?.id?.toString() || '',
    supplier: rawMaterial.supplier || '',
    minimum_stock: rawMaterial.minimum_stock?.toString() || '0',
    reorder_point: rawMaterial.reorder_point?.toString() || '10',
    weight_kg: rawMaterial.weight_kg?.toString() || '',
    is_roll: !!rawMaterial.is_roll,
    is_accessory: !!rawMaterial.is_accessory,
    opening_stock: '0', 
    description: rawMaterial.description || '',
    status: true,
    purchase_unit: rawMaterial.purchase_unit || 'Same as Base',
    conversion_ratio: rawMaterial.conversion_ratio?.toString() || '1',
    cost_per_unit: rawMaterial.cost_per_unit?.toString() || '',
    gsm: rawMaterial.gsm?.toString() || '',
    width: rawMaterial.width?.toString() || '',
    total_length: rawMaterial.total_length?.toString() || '',
    color: rawMaterial.color || '',
    image: null as File | null
  });

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Operations', href: '#' },
    { title: 'Raw Materials', href: '/raw-materials' },
    { title: 'Edit Material', href: '#' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null) {
        if (key === 'is_roll' || key === 'is_accessory' || key === 'status') {
          formData.append(key, value ? '1' : '0');
        } else if (key !== 'image') {
          formData.append(key, value as string | Blob);
        }
      }
    });
    
    if (form.image) {
        formData.append('image', form.image);
    }
    
    formData.append('_method', 'PUT');

    router.post(`/raw-materials/${rawMaterial.id}`, formData as any, {
      onSuccess: () => {
        toast.success("Material updated successfully");
      },
      onError: () => {
        toast.error("Please check the form for errors");
      },
      onFinish: () => setIsSubmitting(false)
    });
  };

  return (
    <>
      <Head title={`Edit ${rawMaterial.name}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1400px] mx-auto py-2 animate-in fade-in duration-500">
          
          <div className="flex items-center justify-between mb-8 border-b pb-6 border-slate-100">
             <div className="flex flex-col">
                <Link href="/raw-materials" className="flex items-center text-xs text-slate-400 hover:text-amber-600 transition-colors font-bold mb-2 group">
                   <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Back
                </Link>
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Modify Material: <span className="text-amber-600">{rawMaterial.name}</span></h1>
                  <Badge className="bg-slate-100 text-slate-600 border-none font-bold rounded-lg">{rawMaterial.code}</Badge>
                </div>
             </div>
             <div className="flex gap-3">
                <Button 
                   variant="outline" 
                   onClick={() => router.visit('/raw-materials')}
                   className="rounded-lg border-slate-200 text-slate-600 font-bold h-11 px-6 shadow-sm shadow-slate-50"
                >
                   Discard
                </Button>
                <Button 
                   onClick={handleSubmit} 
                   disabled={isSubmitting}
                   className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold h-11 px-8 shadow-lg shadow-slate-100"
                >
                   <Save className="h-4 w-4 mr-2" />Updates
                </Button>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-6">
              
              <Card className="p-6 border-slate-100 shadow-sm rounded-xl">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                   <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                     <Package className="h-4 w-4" />
                   </div>
                   <h2 className="font-bold text-sm text-slate-800 tracking-tight">Core Specifications</h2>
                   
                   <div className="ml-auto flex items-center gap-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="is_roll" 
                          checked={form.is_roll} 
                          onCheckedChange={(checked) => setForm({...form, is_roll: !!checked})} 
                          className="rounded-lg h-5 w-5"
                        />
                        <Label htmlFor="is_roll" className="text-xs font-bold text-slate-600 cursor-pointer">Fabric Roll</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="is_accessory" 
                          checked={form.is_accessory} 
                          onCheckedChange={(checked) => setForm({...form, is_accessory: !!checked})} 
                          className="rounded-lg h-5 w-5"
                        />
                        <Label htmlFor="is_accessory" className="text-xs font-bold text-slate-600 cursor-pointer">Accessory</Label>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">Material Name *</Label>
                    <Input 
                      required
                      value={form.name} 
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="h-11 bg-slate-50/50 border-slate-200 focus:ring-amber-500 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">Category Selection</Label>
                    <Select value={form.category} onValueChange={val => setForm({...form, category: val})}>
                      <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 rounded-lg font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">Base Unit</Label>
                    <Select required value={form.base_unit} onValueChange={val => setForm({...form, base_unit: val})}>
                      <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 rounded-lg font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(u => <SelectItem key={u.id} value={u.unit_name}>{u.unit_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">Internal SKU / Code</Label>
                    <Input 
                      value={form.code} 
                      onChange={e => setForm({...form, code: e.target.value})}
                      className="h-11 bg-slate-100 border-slate-200 rounded-lg font-mono text-xs text-slate-600 select-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">Physical Barcode</Label>
                    <div className="relative">
                      <Input 
                        value={form.barcode} 
                        onChange={e => setForm({...form, barcode: e.target.value})}
                        className="h-11 bg-slate-50/50 border-slate-200 rounded-lg pl-4 pr-10 font-bold"
                      />
                      <Barcode className="absolute right-3 top-3.5 h-4 w-4 text-slate-300" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">Manufacturer / Brand</Label>
                    <Input 
                      placeholder="Enter brand name" 
                      value={form.brand} 
                      onChange={e => setForm({...form, brand: e.target.value})}
                      className="h-11 bg-slate-50/50 border-slate-200 rounded-lg font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">Visual Identification</Label>
                    <div className="flex gap-2 items-center">
                      <div className="relative">
                        <input
                          type="color"
                          value={form.color && form.color.startsWith('#') ? form.color : '#000000'}
                          onChange={e => setForm({...form, color: hexToColorName(e.target.value)})}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          title="Pick a color"
                        />
                        <div
                          className="w-11 h-11 rounded-lg border-2 border-slate-200 shadow-sm cursor-pointer"
                          style={{ background: colorToCss(form.color) }}
                          title="Click to pick color"
                        />
                      </div>
                      <Input
                        placeholder="e.g. Black, Red, Sky Blue"
                        value={form.color}
                        onChange={e => setForm({...form, color: e.target.value})}
                        className="h-11 bg-slate-50/50 border-slate-200 rounded-lg flex-1 font-bold capitalize"
                      />
                    </div>
                    {form.color && (
                      <p className="text-[10px] text-slate-400 font-semibold pl-1">
                        Stored as: <span className="capitalize text-slate-600">{form.color}</span>
                      </p>
                    )}
                  </div>

                  <div className="lg:col-span-2 space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">Material Aesthetics (Photo)</Label>
                    <div className="flex items-center gap-4">
                        <div className="relative group w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden transition-all hover:border-amber-400">
                            {form.image ? (
                                <img 
                                    src={URL.createObjectURL(form.image as any)} 
                                    className="w-full h-full object-cover"
                                />
                            ) : rawMaterial.image_url ? (
                                <img 
                                    src={rawMaterial.image_url} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <ImageIcon className="h-6 w-6 text-slate-300" />
                            )}
                            <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setForm({...form, image: file});
                                }}
                                accept="image/*"
                            />
                        </div>
                         <div className="flex-1 text-xs text-slate-500">
                             <p className="font-bold text-slate-800 flex items-center gap-1"><Camera className="h-3 w-3" /> Update Profile Image</p>
                             <p className="font-medium">Supports JPG/PNG. 800x800px recommended.</p>
                            {form.image && (
                                <Button 
                                    type="button" 
                                    variant="link" 
                                    size="sm" 
                                    className="h-auto p-0 text-rose-500 font-bold"
                                    onClick={() => setForm({...form, image: null})}
                                >
                                    revert to original
                                </Button>
                            )}
                        </div>
                    </div>
                  </div>
                </div>

                {/* Roll Specs */}
                {form.is_roll && (
                  <div className="mt-10 pt-8 border-t border-slate-100 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-2 mb-6">
                       <Settings className="h-4 w-4 text-amber-400" />
                       <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Technical Data Sheet</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-amber-900 border-b border-amber-50">GSM (Weight)</Label>
                        <Input 
                          type="number"
                          value={form.gsm} 
                          onChange={e => setForm({...form, gsm: e.target.value})}
                          className="h-11 rounded-lg border-amber-100 bg-amber-50/20 font-bold text-amber-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-amber-900 border-b border-amber-50">Width (cm)</Label>
                        <Input 
                          type="number"
                          value={form.width} 
                          onChange={e => setForm({...form, width: e.target.value})}
                          className="h-11 rounded-lg border-amber-100 bg-amber-50/20 font-bold text-amber-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-amber-900 border-b border-amber-50">Total Run (m)</Label>
                        <Input 
                          type="number"
                          value={form.total_length} 
                          onChange={e => setForm({...form, total_length: e.target.value})}
                          className="h-11 rounded-lg border-amber-100 bg-amber-50/20 font-bold text-amber-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-amber-900 border-b border-amber-50">Technical Color</Label>
                        <div className="flex gap-2 items-center">
                          <div className="relative">
                            <input
                              type="color"
                              value={form.color && form.color.startsWith('#') ? form.color : '#000000'}
                              onChange={e => setForm({...form, color: hexToColorName(e.target.value)})}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            />
                            <div
                              className="w-11 h-11 rounded-lg border-2 border-amber-100 cursor-pointer"
                              style={{ background: colorToCss(form.color) }}
                            />
                          </div>
                          <Input
                            value={form.color}
                            onChange={e => setForm({...form, color: e.target.value})}
                            className="h-11 rounded-lg border-amber-100 bg-amber-50/20 font-bold text-amber-900 flex-1 capitalize"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-6 border-slate-100 shadow-sm rounded-xl">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                   <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                     <Save className="h-4 w-4" />
                   </div>
                   <h2 className="font-bold text-sm text-slate-800 tracking-tight">Supply Chain & Costing</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500">Unit Valuation (TZS) *</Label>
                      <Input 
                        required
                        type="number"
                        value={form.cost_per_unit} 
                        onChange={e => setForm({...form, cost_per_unit: e.target.value})}
                        className="h-11 border-amber-100 focus:ring-amber-500 rounded-lg font-bold text-amber-900 bg-amber-50/30"
                      />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500">Assigned Facility</Label>
                      <Select 
                        value={form.branch_id} 
                        onValueChange={val => {
                          const filtered = (stores || []).filter(s => 
                            (s.branches || []).some((b: any) => b.id.toString() === val)
                          );
                          setForm({
                            ...form, 
                            branch_id: val,
                            opening_store_id: filtered[0]?.id?.toString() || ''
                          });
                        }}
                      >
                        <SelectTrigger className="h-11 rounded-lg border-slate-200 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                       <Label className="text-xs font-semibold text-slate-500">Primary Warehouse</Label>
                       <Select value={form.opening_store_id} onValueChange={val => setForm({...form, opening_store_id: val})}>
                         <SelectTrigger className="h-11 rounded-lg border-slate-200 font-bold">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           {(stores || []).filter(s => 
                              (s.branches || []).some((b: any) => b.id.toString() === form.branch_id)
                           ).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.store_name}</SelectItem>)}
                         </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs font-semibold text-slate-500">Preferred Supplier</Label>
                       <Select value={form.supplier} onValueChange={val => setForm({...form, supplier: val})}>
                         <SelectTrigger className="h-11 rounded-lg border-slate-200 font-bold">
                           <SelectValue placeholder="Select supplier" />
                         </SelectTrigger>
                         <SelectContent>
                           {suppliers.map(s => <SelectItem key={s.id} value={s.supplier_name}>{s.supplier_name}</SelectItem>)}
                         </SelectContent>
                       </Select>
                    </div>
                </div>
              </Card>
            </div>

            {/* Right Content */}
            <div className="space-y-6">
              <Card className="p-6 border-slate-100 shadow-sm rounded-xl">
                 <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                    <History className="h-4 w-4 text-slate-400" />
                    <h2 className="font-bold text-sm text-slate-800 tracking-tight">Inventory Pulse</h2>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl flex flex-col gap-1">
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time Stock</p>
                       <p className="text-3xl font-bold text-white tracking-tight">
                         {rawMaterial.current_stock?.toLocaleString()} 
                         <span className="text-xs text-amber-400 font-bold ml-2">{rawMaterial.base_unit}</span>
                       </p>
                    </div>

                   <div className="space-y-2 pt-2">
                      <Label className="text-xs font-bold text-slate-700">Safety Threshold</Label>
                      <Input 
                        type="number"
                        value={form.minimum_stock} 
                        onChange={e => setForm({...form, minimum_stock: e.target.value})}
                        className="h-11 rounded-lg border-slate-200 font-bold"
                      />
                   </div>

                   <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Procurement Buffer</Label>
                      <Input 
                        type="number"
                        value={form.reorder_point} 
                        onChange={e => setForm({...form, reorder_point: e.target.value})}
                        className="h-11 rounded-lg border-slate-200 font-bold text-rose-500"
                      />
                   </div>

                   <div className="space-y-3 pt-6 border-t border-slate-100">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id="status" 
                          checked={form.status} 
                          onCheckedChange={(val) => setForm({...form, status: !!val})} 
                          className="rounded-lg h-5 w-5 data-[state=checked]:bg-amber-600 border-slate-300"
                        />
                        <Label htmlFor="status" className="text-xs font-bold text-slate-700 cursor-pointer">Active State</Label>
                      </div>
                   </div>

                   <div className="pt-6">
                      <Button 
                         type="submit" 
                         className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 shadow-xl shadow-slate-100 rounded-xl"
                         disabled={isSubmitting}
                      >
                         <Save className="h-4 w-4 mr-2" /> Commit Updates
                      </Button>
                      <Button 
                         type="button" 
                         variant="ghost" 
                         onClick={() => router.visit('/raw-materials')}
                         className="w-full mt-2 text-slate-400 hover:text-slate-800 text-xs font-bold"
                      >
                         Discard & Return
                      </Button>
                   </div>
                </div>
              </Card>

              <div className="p-5 bg-amber-50 border border-amber-100 rounded-xl space-y-3">
                 <div className="flex items-center gap-2 opacity-70">
                    <Undo2 className="h-3 w-3 text-amber-600" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Audit Alert</p>
                 </div>
                 <p className="text-[11px] font-semibold leading-relaxed text-amber-700">Directly modifying specifications here will update the core master record. Stock movements should be managed via formal adjustment Logs.</p>
              </div>
            </div>
          </form>
        </div>
      </AppLayout>
    </>
  );
}
