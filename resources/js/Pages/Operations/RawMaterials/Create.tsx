import { Head, router } from '@inertiajs/react';
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
  Camera,
  Palette,
  Image as ImageIcon
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

// ── Fabric color name resolver ─────────────────────────────────────────
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
  // Nearest color: compare RGB distances
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
// ─────────────────────────────────────────────────────────────────────────
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

interface RawMaterialsCreateProps {
  units: { id: number; unit_name: string }[];
  categories: string[];
  stores: { id: number; store_name: string; branches: { id: number; name: string }[] }[];
  branches: { id: number; name: string }[];
  suppliers: { id: number; supplier_name: string }[];
  errors?: Record<string, string>;
}

export default function RawMaterialsCreate({ 
  units = [], 
  categories = [], 
  stores = [], 
  branches = [],
  suppliers = [],
  errors = {} 
}: RawMaterialsCreateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    category: '',
    base_unit: '',
    code: '',
    barcode: '',
    brand: '',
    material: '',
    branch_id: branches[0]?.id?.toString() || '',
    opening_store_id: stores[0]?.id?.toString() || '',
    supplier: '',
    minimum_stock: '0',
    reorder_point: '10',
    weight_kg: '',
    is_roll: false,
    is_accessory: false,
    opening_stock: '0',
    description: '',
    status: true,
    buying_unit_source: 'Same as Base',
    conv_ratio: '1',
    cost_per_unit: '',
    gsm: '70',
    width: '',
    total_length: '500',
    color: '',
    usd_price: '',
    exchange_rate: '2650',
    image: null as File | null
  });

  const totalTzsValue = form.is_roll 
    ? (Number(form.weight_kg) || 0) * (Number(form.usd_price) || 0) * (Number(form.exchange_rate) || 0)
    : (Number(form.opening_stock) || 0) * (Number(form.cost_per_unit) || 0);

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Operations', href: '#' },
    { title: 'Raw Materials', href: '/raw-materials' },
    { title: 'Register Material', href: '#' }
  ];

  const generateSKU = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    setForm({ ...form, code: `RM-${random}` });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null) {
        if (key === 'is_roll' || key === 'is_accessory' || key === 'status') {
          formData.append(key, value ? '1' : '0');
        } else if (key === 'cost_per_unit' && form.is_roll) {
          const totalVal = (Number(form.weight_kg) || 0) * (Number(form.usd_price) || 0) * (Number(form.exchange_rate) || 0);
          const perUnit = Number(form.opening_stock) > 0 ? totalVal / Number(form.opening_stock) : totalVal;
          formData.append(key, perUnit.toString());
        } else {
          formData.append(key, value as string | Blob);
        }
      }
    });

    router.post('/raw-materials', formData as any, {
      onSuccess: () => {
        toast.success("Material registered successfully");
      },
      onError: () => {
        toast.error("Please check the form for errors");
      },
      onFinish: () => setIsSubmitting(false)
    });
  };

  return (
    <>
      <Head title="Register New Material" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1400px] mx-auto py-2 animate-in fade-in duration-500">
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
               <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Register New Material</h1>
               <p className="text-xs font-medium text-slate-400 mt-1">Define core specifications and initialize stock for a new processing component.</p>
            </div>
            <div className="flex gap-2">
               <Button variant="outline" onClick={() => router.visit('/raw-materials')} className="rounded-lg border-slate-200 text-slate-600 font-semibold h-11">
                  Cancel
               </Button>
               <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg h-11 px-8 shadow-lg shadow-slate-100">
                  <Save className="h-4 w-4 mr-2" /> Save & Continue
               </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Columns - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Basic Information Card */}
              <Card className="p-6 border-slate-100 shadow-sm rounded-xl">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                   <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                     <Info className="h-4 w-4" />
                   </div>
                   <h2 className="font-bold text-sm text-slate-800 tracking-tight">Basic Information</h2>
                   <div className="ml-auto flex items-center gap-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="is_roll" 
                          checked={form.is_roll} 
                          onCheckedChange={(checked) => setForm({...form, is_roll: !!checked})} 
                          className="rounded-lg"
                        />
                        <Label htmlFor="is_roll" className="text-xs font-semibold text-slate-600 cursor-pointer">Fabric Roll</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="is_accessory" 
                          checked={form.is_accessory} 
                          onCheckedChange={(checked) => setForm({...form, is_accessory: !!checked})} 
                          className="rounded-lg"
                        />
                        <Label htmlFor="is_accessory" className="text-xs font-semibold text-slate-600 cursor-pointer">Accessory</Label>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500">Material Name *</Label>
                    <Input 
                      required
                      placeholder="Enter material identification name" 
                      value={form.name} 
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="h-11 bg-slate-50/50 border-slate-200 focus:ring-amber-500 rounded-lg font-medium text-slate-900"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500">Category</Label>
                    <Select value={form.category} onValueChange={val => setForm({...form, category: val})}>
                      <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 rounded-lg font-medium">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500">Base Unit *</Label>
                    <Select required value={form.base_unit} onValueChange={val => setForm({...form, base_unit: val})}>
                      <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 rounded-lg font-medium">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(u => <SelectItem key={u.id} value={u.unit_name}>{u.unit_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500">SKU / Item NO</Label>
                    <div className="flex gap-1">
                      <Input 
                        placeholder="Auto-generate if empty" 
                        value={form.code} 
                        onChange={e => setForm({...form, code: e.target.value})}
                        className="h-11 bg-slate-50/50 border-slate-200 rounded-lg font-medium text-slate-900"
                      />
                      <Button type="button" variant="outline" size="icon" onClick={generateSKU} className="h-11 w-11 border-slate-200 text-slate-400 hover:text-amber-600 rounded-lg">
                        <Dices className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500">Barcode</Label>
                    <div className="relative">
                      <Input 
                        placeholder="Scan or type barcode" 
                        value={form.barcode} 
                        onChange={e => setForm({...form, barcode: e.target.value})}
                        className="h-11 bg-slate-50/50 border-slate-200 rounded-lg font-medium text-slate-900 pr-10"
                      />
                      <Barcode className="absolute right-3 top-3.5 h-4 w-4 text-slate-300" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500">Brand / Manufacturer</Label>
                    <Input 
                      placeholder="e.g. Acme Fabric" 
                      value={form.brand} 
                      onChange={e => setForm({...form, brand: e.target.value})}
                      className="h-11 bg-slate-50/50 border-slate-200 rounded-lg font-medium text-slate-900"
                    />
                  </div>

                  <div className="lg:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500">Technical Composition</Label>
                    <Input 
                      placeholder="e.g. 100% Polypropylene Non-Woven" 
                      value={form.material} 
                      onChange={e => setForm({...form, material: e.target.value})}
                      className="h-11 bg-slate-50/50 border-slate-200 rounded-lg font-medium text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500">Primary Branch *</Label>
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
                      <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 rounded-lg font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500">Opening Store Location *</Label>
                    <Select value={form.opening_store_id} onValueChange={val => setForm({...form, opening_store_id: val})}>
                      <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 rounded-lg font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(stores || []).filter(s => 
                           (s.branches || []).some((b: any) => b.id.toString() === form.branch_id)
                        ).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.store_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500">Certified Supplier</Label>
                    <Select value={form.supplier} onValueChange={val => setForm({...form, supplier: val})}>
                      <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 rounded-lg font-medium">
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(s => <SelectItem key={s.id} value={s.supplier_name}>{s.supplier_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:col-span-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500">Safety Stock</Label>
                      <Input 
                        type="number"
                        value={form.minimum_stock} 
                        onChange={e => setForm({...form, minimum_stock: e.target.value})}
                        className="h-11 bg-slate-50/50 border-slate-200 rounded-lg font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500">Reorder Alert</Label>
                      <Input 
                        type="number"
                        value={form.reorder_point} 
                        onChange={e => setForm({...form, reorder_point: e.target.value})}
                        className="h-11 bg-slate-50/50 border-slate-200 rounded-lg font-bold text-rose-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500">Standard GSM</Label>
                    <Input 
                      placeholder="e.g. 72" 
                      value={form.gsm} 
                      onChange={e => setForm({...form, gsm: e.target.value})}
                      className="h-11 bg-slate-50/50 border-slate-200 rounded-lg font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
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
                          className="w-11 h-11 rounded-lg border-2 border-slate-200 shadow-sm cursor-pointer flex items-center justify-center"
                          style={{ background: colorToCss(form.color) }}
                          title="Click to pick color"
                        />
                      </div>
                      <Input
                        placeholder="e.g. Black, Red, Sky Blue"
                        value={form.color}
                        onChange={e => setForm({...form, color: e.target.value})}
                        className="h-11 bg-slate-50/50 border-slate-200 rounded-lg font-bold flex-1 capitalize"
                      />
                    </div>
                    {form.color && (
                      <p className="text-[10px] text-slate-400 font-semibold pl-1">
                        Stored as: <span className="capitalize text-slate-600">{form.color}</span>
                      </p>
                    )}
                  </div>

                  <div className="lg:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500">Material Media</Label>
                    <div className="flex items-center gap-4">
                        <div className="relative group w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-100/50 overflow-hidden hover:border-amber-400 transition-colors">
                            {form.image ? (
                                <img 
                                    src={URL.createObjectURL(form.image as any)} 
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
                        <div className="flex-1 text-[11px] text-slate-500 font-medium">
                            <p className="font-bold text-slate-700 flex items-center gap-1"><Camera className="h-3 w-3" /> Material Thumbnail</p>
                            <p>Upload a clear photo of the material texture.</p>
                            {form.image && (
                                <Button 
                                    type="button" 
                                    variant="link" 
                                    size="sm" 
                                    className="h-auto p-0 text-rose-500 font-bold"
                                    onClick={() => setForm({...form, image: null})}
                                >
                                    clear selection
                                </Button>
                            )}
                        </div>
                    </div>
                  </div>
                </div>

                {/* Conditional Roll Specs */}
                {form.is_roll && (
                  <div className="mt-8 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-2 mb-4 text-slate-600">
                      <Settings className="h-4 w-4 text-amber-400" />
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Roll-Based Engineering Specs</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500 italic">Fabric Density (GSM)</Label>
                        <Input 
                          type="number"
                          placeholder="e.g. 72" 
                          value={form.gsm} 
                          onChange={e => setForm({...form, gsm: e.target.value})}
                          className="h-11 bg-white border-slate-200 rounded-lg font-bold text-amber-900"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500 italic">Roll Width (cm)</Label>
                        <Input 
                          type="number"
                          placeholder="e.g. 100" 
                          value={form.width} 
                          onChange={e => setForm({...form, width: e.target.value})}
                          className="h-11 bg-white border-slate-200 rounded-lg font-bold text-amber-900"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500 italic">Target Run Length (m)</Label>
                        <Input 
                          type="number"
                          placeholder="e.g. 500" 
                          value={form.total_length} 
                          onChange={e => setForm({...form, total_length: e.target.value})}
                          className="h-11 bg-white border-slate-200 rounded-lg font-bold text-amber-900"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Costing Information Card */}
              <Card className="p-6 border-slate-100 shadow-sm rounded-xl">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                   <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                     <Palette className="h-4 w-4" />
                   </div>
                   <h2 className="font-bold text-sm text-slate-800 tracking-tight">Financial & Costing Profile</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {form.is_roll ? (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500">USD Rate (per KG)</Label>
                        <div className="relative">
                           <div className="absolute left-0 top-0 bottom-0 px-2.5 bg-slate-50 border-r flex items-center rounded-l-lg text-xs font-bold text-emerald-600">$</div>
                           <Input 
                             type="number"
                             placeholder="1.22" 
                             value={form.usd_price} 
                             onChange={e => setForm({...form, usd_price: e.target.value})}
                             className="h-11 bg-white border-slate-200 pl-10 rounded-lg font-bold"
                           />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500">Exchange (TZS)</Label>
                        <Input 
                          type="number"
                          value={form.exchange_rate} 
                          onChange={e => setForm({...form, exchange_rate: e.target.value})}
                          className="h-11 bg-white border-slate-200 rounded-lg font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500">Weight (KG)</Label>
                        <Input 
                          type="number"
                          placeholder="5000" 
                          value={form.weight_kg} 
                          onChange={e => setForm({...form, weight_kg: e.target.value})}
                          className="h-11 bg-amber-50 border-amber-100 rounded-lg font-bold text-amber-900"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-amber-900 italic">Financial Value (TZS)</Label>
                        <div className="relative">
                          <div className="absolute left-0 top-0 bottom-0 px-3 bg-amber-50 border-r flex items-center rounded-l-lg text-[10px] font-bold text-amber-400">TZS</div>
                          <Input 
                            readOnly
                            value={Math.round(totalTzsValue).toLocaleString()} 
                            className="h-11 bg-amber-50/30 border-amber-100 pl-14 font-bold text-amber-900 rounded-lg text-lg"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500">Purchasing Source</Label>
                        <Input 
                          readOnly
                          value={form.buying_unit_source} 
                          className="h-11 bg-slate-50 border-slate-100 rounded-lg font-medium text-slate-500 italic"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500">Conv Ratio</Label>
                        <Input 
                          type="number"
                          value={form.conv_ratio} 
                          onChange={e => setForm({...form, conv_ratio: e.target.value})}
                          className="h-11 bg-white border-slate-200 rounded-lg font-bold"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-xs font-bold text-amber-900">Purchase Unit Cost (TZS) *</Label>
                        <div className="relative">
                          <div className="absolute left-0 top-0 bottom-0 px-3 bg-slate-50 border-r flex items-center rounded-l-lg text-[10px] font-bold text-slate-500">TZS</div>
                          <Input 
                            required
                            type="number"
                            value={form.cost_per_unit} 
                            onChange={e => setForm({...form, cost_per_unit: e.target.value})}
                            className="h-11 bg-white border-slate-200 pl-14 rounded-lg font-bold text-amber-900"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column - Status & Sidebar Content */}
            <div className="space-y-6">
              
              {/* Inventory Entry Card */}
              <Card className="p-6 border-slate-100 shadow-sm rounded-xl">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                   <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                     <Package className="h-4 w-4" />
                   </div>
                   <h2 className="font-bold text-sm text-slate-800 tracking-tight">Stock Initialization</h2>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500">Opening Stock (In Hand) *</Label>
                    <Input 
                      required
                      type="number"
                      value={form.opening_stock} 
                      onChange={e => setForm({...form, opening_stock: e.target.value})}
                      className="h-11 bg-white border-slate-300 rounded-lg font-bold text-slate-900 text-lg"
                    />
                  </div>

                  <div className="bg-slate-900 text-white rounded-xl p-6 space-y-4 shadow-xl shadow-slate-200 animation-pulse-subtle">
                     <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest border-b border-slate-800 pb-2">Valuation Engine</p>
                     <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-amber-400">Initial Asset Value</p>
                        <p className="text-2xl font-bold tracking-tight">
                        TZS {Math.round(totalTzsValue).toLocaleString()}
                        </p>
                     </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs font-semibold text-slate-500">Intelligence Note</Label>
                    <textarea 
                      placeholder="Add registration notes for audit trail..." 
                      rows={4}
                      value={form.description} 
                      onChange={e => setForm({...form, description: e.target.value})}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <Checkbox 
                      id="status" 
                      checked={form.status} 
                      onCheckedChange={(checked) => setForm({...form, status: !!checked})} 
                      className="border-slate-300 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600 rounded-lg h-5 w-5"
                    />
                    <Label htmlFor="status" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Activate upon registration
                    </Label>
                  </div>

                  <div className="pt-6 space-y-4">
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3">
                       <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                       <p className="text-[11px] text-amber-700 leading-relaxed font-medium">Verify all technical metrics. Initial stock cannot be changed after registration without an adjustment log.</p>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
                    >
                      {isSubmitting ? 'Registering...' : 'Register Material'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

          </form>
        </div>
      </AppLayout>
    </>
  );
}
