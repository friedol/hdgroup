import { Head, router, Link } from '@inertiajs/react';
import {
  Edit, ArrowLeft, Trash2, Package, TrendingUp, BarChart3,
  Clock, Store, Layers, Image as ImageIcon, Ruler, Tag, Wrench, ShoppingCart, Factory, Palette
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';

// ── Color utilities ──────────────────────────────────────────────────
const _CM: Record<string, string> = {
  '#ffffff':'White','#f5f5f5':'Off-White','#000000':'Black','#080808':'Black',
  '#0a0a0a':'Black','#111111':'Black','#1a1a1a':'Black','#222222':'Black',
  '#808080':'Grey','#a9a9a9':'Silver Grey','#d3d3d3':'Light Grey',
  '#ff0000':'Red','#cc0000':'Red','#8b0000':'Dark Red','#800000':'Maroon',
  '#ffa500':'Orange','#ffff00':'Yellow','#ffd700':'Gold','#f0e68c':'Khaki',
  '#008000':'Green','#006400':'Dark Green','#90ee90':'Light Green',
  '#0000ff':'Blue','#00008b':'Dark Blue','#add8e6':'Light Blue',
  '#87ceeb':'Sky Blue','#4169e1':'Royal Blue','#000080':'Navy Blue',
  '#ff00ff':'Magenta','#800080':'Purple','#ee82ee':'Violet','#dda0dd':'Plum',
  '#ffc0cb':'Pink','#ff69b4':'Hot Pink','#db7093':'Pale Pink',
  '#a52a2a':'Brown','#8b4513':'Saddle Brown','#d2691e':'Chocolate',
  '#ffe4c4':'Bisque','#f5deb3':'Wheat','#c8a96e':'Tan',
};
function colorToCss(c: string): string {
  if (!c) return '#ccc';
  if (c.startsWith('#')) return c;
  const low = c.trim().toLowerCase();
  for (const [hex, name] of Object.entries(_CM)) {
    if (name.toLowerCase() === low) return hex;
  }
  return low;
}
function resolveColorName(c: string): string {
  if (!c) return '';
  const low = c.trim().toLowerCase();
  if (!low.startsWith('#')) return c; // already a name
  return _CM[low] || c;
}
// ───────────────────────────────────────────────────────────

interface StoreQty    { store_name: string; qty: number; unit?: string; raw_qty?: number }
interface SaleUnit    { unit_name?: string; name?: string; factor: number; market_price?: number; price?: number; plain_price?: number; printed_price?: number }
interface TechSpec    { title: string; value: string }
interface BomItem     { material_name: string; qty_per_unit: number; unit: string }
interface Movement    { id: number; type: string; quantity: number; reference: string; store?: string; created_at: string }
interface ColorVariant {
  color: string;
  qty: number;
  plain_qty?: number;
  printed_qty?: number;
  buying_price: number;
  selling_price: number;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  product_type: 'trading' | 'manufactured' | 'raw_material';
  status: 'active' | 'inactive';
  selling_price: number;
  plain_price?: number;
  printed_price?: number;
  cost_price: number;
  category?: { name: string } | null;
  brand?: string | null;
  unit_of_measurement?: string | null;
  description?: string | null;
  reorder_level?: number;
  low_alert?: number;
  current_stock?: number;
  stock_unit?: string;
  total_stock_value?: number;
  inventories_by_store?: StoreQty[];
  material?: string | null;
  weight?: string | null;
  weight_unit?: string | null;
  width?: string | null;
  length?: string | null;
  height?: string | null;
  dimension_unit?: string | null;
  sale_units?: SaleUnit[];
  specifications?: TechSpec[];
  images?: string[];
  bom_items?: BomItem[];
  stock_movements?: Movement[];
  created_at: string;
  updated_at: string;
  color_variants?: ColorVariant[];
}

export default function ShowProduct({ product, color_variants = [] }: { product: Product; color_variants?: ColorVariant[] }) {
  const [activeImg, setActiveImg] = useState(0);

  const cost    = product.cost_price    ?? 0;
  const plainSelling = product.plain_price ?? product.selling_price ?? 0;
  const printedSelling = product.printed_price ?? plainSelling;
  const margin  = cost > 0 ? (((plainSelling - cost) / cost) * 100) : 0;
  const stock     = product.current_stock ?? 0;
  const stockUnit = product.stock_unit ?? product.unit_of_measurement ?? 'units';
  const reorder = product.reorder_level ?? 0;
  const images  = product.images ?? [];
  const saleUnits    = product.sale_units    ?? [];
  const specs        = product.specifications ?? [];
  const bomItems     = product.bom_items      ?? [];
  const storeQtys    = product.inventories_by_store ?? [];
  const variantsFromProps = color_variants ?? [];
  const variantsFromProduct = (product as any).variants ?? [];
  const colorVariants = variantsFromProps.length > 0 ? variantsFromProps : variantsFromProduct;
  const movements    = product.stock_movements ?? [];

  const isTrading      = product.product_type === 'trading';
  const isManufactured = product.product_type === 'manufactured';

  const fmt     = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const typeBadgeColor = isManufactured
    ? 'bg-violet-100 text-violet-700 border-violet-200'
    : isTrading
      ? 'bg-blue-100 text-blue-700 border-blue-200'
      : 'bg-amber-100 text-amber-700 border-amber-200';

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Products',  href: '/products-new' },
    { title: product.name ?? 'Product', href: '#' },
  ];

  const handleDelete = () => {
    if (confirm('Delete this product? This cannot be undone.')) {
      router.delete(`/products-new/${product.id}`);
    }
  };

  /* ─── Section header helpers ─── */
  const SectionTitle = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <div className="flex items-center gap-2 mb-6">
      <span className="text-slate-500 scale-110">{icon}</span>
      <h2 className="text-xs font-semibold text-slate-500 tracking-tight">{label}</h2>
    </div>
  );

  const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-slate-400 leading-none">{label}</p>
      <p className="text-sm font-semibold text-slate-800 tracking-tight">{value ?? '—'}</p>
    </div>
  );

  return (
    <>
      <Head title={product.name ?? 'Product'} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1400px] mx-auto space-y-8">

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Link href="/products-new">
                <Button variant="outline" size="icon" className="rounded-xl h-11 w-11 border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-[14px] sm:text-[16px] md:text-[18px] font-medium text-slate-900 tracking-tight leading-none truncate">{product.name}</h1>
               
                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className={`rounded-lg px-2.5 py-0.5 text-[10px] font-semibold ${product.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}>
                    {product.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-xs font-medium text-slate-400 mt-1.5 flex items-center gap-2">
                  SKU: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-medium">{product.sku}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link href={`/products-new/${product.id}/edit`}>
                <Button size="lg" className="rounded-xl h-11 px-6 bg-blue-600 hover:bg-blue-700 font-semibold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all">
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="rounded-xl h-11 px-4 border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-100 font-medium transition-all" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* ── Two-column layout ── */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">

            {/* LEFT */}
            <div className="space-y-8">

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: 'Buying price', value: 'TZS ' + fmt(cost), icon: <Package className="h-4 w-4 md:h-5 md:w-5" />, valueColor: 'text-slate-900', bg: 'bg-white', border: 'border-slate-200', chip: 'bg-slate-50/80', tone: 'Cost' },
                  isTrading
                    ? { label: 'Selling price', value: 'TZS ' + fmt(plainSelling), icon: <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />, valueColor: 'text-blue-600', bg: 'bg-blue-50/30', border: 'border-blue-200', chip: 'bg-blue-50/80', tone: 'Value' }
                    : { label: 'Plain/Printed', value: 'TZS ' + fmt(plainSelling) + ' / ' + fmt(printedSelling), icon: <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />, valueColor: 'text-blue-600', bg: 'bg-blue-50/30', border: 'border-blue-200', chip: 'bg-blue-50/80', tone: 'Value' },
                  { label: 'Profit margin', value: margin.toFixed(1) + '%', icon: <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />, valueColor: margin >= 0 ? 'text-emerald-600' : 'text-rose-600', bg: margin >= 0 ? 'bg-emerald-50/30' : 'bg-rose-50/30', border: margin >= 0 ? 'border-emerald-200' : 'border-rose-200', chip: margin >= 0 ? 'bg-emerald-50/80' : 'bg-rose-50/80', tone: margin >= 0 ? 'Healthy' : 'Risk' },
                  { label: 'Current stock', value: `${stock.toLocaleString()} ${stockUnit}`, icon: <Layers className="h-4 w-4 md:h-5 md:w-5" />, valueColor: stock < reorder && reorder > 0 ? 'text-rose-600' : 'text-slate-900', bg: stock < reorder && reorder > 0 ? 'bg-rose-50/30' : 'bg-white', border: stock < reorder && reorder > 0 ? 'border-rose-200' : 'border-slate-200', chip: stock < reorder && reorder > 0 ? 'bg-rose-50/80' : 'bg-slate-50/80', tone: stock < reorder && reorder > 0 ? 'Low' : 'Stable' },
                ].map(kpi => (
                  <div key={kpi.label} className={`rounded-xl border ${kpi.border} p-3 md:p-6 shadow-sm hover:shadow-md transition-shadow ${kpi.bg}`}>
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                      <div className="bg-white p-1.5 md:p-2 rounded-lg shadow-sm text-slate-500">{kpi.icon}</div>
                      <span className={`text-[8px] md:text-[10px] font-medium px-1.5 md:px-2 py-0.5 rounded-full ${kpi.chip} text-slate-600`}>
                        {kpi.tone}
                      </span>
                    </div>
                    <p className={`text-base sm:text-lg md:text-2xl font-medium tabular-nums leading-none ${kpi.valueColor}`}>{kpi.value}</p>
                    <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-1 truncate">{kpi.label}</p>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="rounded-xl bg-slate-100 p-1 mb-8 h-11 w-full sm:w-auto flex flex-wrap gap-1">
                  <TabsTrigger value="overview" className="rounded-lg h-9 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">Overview</TabsTrigger>
                  {saleUnits.length > 0 && <TabsTrigger value="pricing" className="rounded-lg h-9 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">Pricing</TabsTrigger>}
                  {isManufactured && bomItems.length > 0 && <TabsTrigger value="bom" className="rounded-lg h-9 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">Bill of materials</TabsTrigger>}
                  {(isManufactured || isTrading) && colorVariants.length > 0 && (
                    <TabsTrigger value="variants" className="rounded-lg h-9 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5" /> Color Variants
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="inventory" className="rounded-lg h-9 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">Stock</TabsTrigger>
                  {specs.length > 0 && <TabsTrigger value="specs" className="rounded-lg h-9 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">Specifications</TabsTrigger>}
                  <TabsTrigger value="history" className="rounded-lg h-9 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">Movement</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 space-y-6 outline-none">
                  {/* Basic Info */}
                  <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                    <SectionTitle icon={<Package className="h-5 w-5" />} label="Basic information" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12">
                      <Field label="Product name" value={product.name} />
                      <Field label="SKU identity"     value={product.sku} />
                      <Field label="Classification" value={isManufactured ? 'Manufactured' : isTrading ? 'Trading' : 'Raw material'} />
                      <Field label="Category"     value={product.category?.name} />
                      <Field label="Brand / Label"        value={product.brand} />
                      <Field label="Standard base unit"    value={product.unit_of_measurement} />
                    </div>
                    {product.description && (
                      <div className="mt-10 pt-8 border-t border-slate-100">
                        <p className="text-[11px] font-semibold text-slate-400 mb-3 tracking-tight">Product overview</p>
                        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl whitespace-pre-wrap font-medium">{product.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Pricing Summary */}
                  <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                    <SectionTitle icon={<Tag className="h-5 w-5" />} label="Standard costing" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <Field label="Standard buying cost" value={'TZS ' + fmt(cost)} />
                      {isTrading ? (
                        <Field label="Selling price" value={'TZS ' + fmt(plainSelling)} />
                      ) : (
                        <>
                          <Field label="Plain bag price" value={'TZS ' + fmt(plainSelling)} />
                          <Field label="Printed bag price" value={'TZS ' + fmt(printedSelling)} />
                        </>
                      )}
                      <Field label={isTrading ? 'Estimated profit' : 'Estimated plain profit'} value={'TZS ' + fmt(plainSelling - cost)} />
                      <div className="col-span-1">
                         <p className="text-[11px] font-medium text-slate-400 mb-1">Standard margin</p>
                         <Badge variant="outline" className={`h-7 px-3 rounded-lg font-semibold border-none ${margin >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                           {margin.toFixed(1)}% efficiency
                         </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Physical specifications */}
                  {(product.weight || product.width || product.length || product.material) && (
                    <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                      <SectionTitle icon={<Ruler className="h-5 w-5" />} label="Physical specifications" />
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {product.material && <Field label="Material aspect" value={product.material} />}
                        {product.weight   && <Field label="Net weight"          value={`${product.weight} ${product.weight_unit ?? ''}`} />}
                        {product.width    && <Field label="Overall width"           value={`${product.width} ${product.dimension_unit ?? ''}`} />}
                        {product.length   && <Field label="Standard length"          value={`${product.length} ${product.dimension_unit ?? ''}`} />}
                        {product.height   && <Field label="Object height"          value={`${product.height} ${product.dimension_unit ?? ''}`} />}
                      </div>
                    </div>
                  )}

                  {/* System audit log info */}
                  <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                    <SectionTitle icon={<Clock className="h-5 w-5" />} label="System lifecycle" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Field label="Registration timestamp"      value={fmtDate(product.created_at)} />
                      <Field label="Last modification" value={fmtDate(product.updated_at)} />
                    </div>
                  </div>
                </TabsContent>

                {/* Pricing Nodes Tab */}
                {saleUnits.length > 0 && (
                  <TabsContent value="pricing" className="mt-4">
                    <div className="bg-white border border-slate-200 rounded-sm p-5">
                      <SectionTitle icon={<ShoppingCart className="h-4 w-4" />} label="Sale Units & Pricing" />
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left text-[10px] font-medium uppercase text-slate-400 py-2">Unit</th>
                            <th className="text-left text-[10px] font-medium uppercase text-slate-400 py-2">Factor</th>
                            {isManufactured ? (
                              <>
                                <th className="text-left text-[10px] font-medium uppercase text-slate-400 py-2">Plain Price</th>
                                <th className="text-left text-[10px] font-medium uppercase text-slate-400 py-2">Printed Price</th>
                              </>
                            ) : (
                              <th className="text-left text-[10px] font-medium uppercase text-slate-400 py-2">Selling Price</th>
                            )}
                            <th className="text-left text-[10px] font-medium uppercase text-slate-400 py-2">Profit</th>
                            <th className="text-left text-[10px] font-medium uppercase text-slate-400 py-2">Margin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {saleUnits.map((u, i) => {
                            const sellingPrice = u.market_price ?? u.price ?? 0;
                            const base = cost * u.factor;
                            const profit = sellingPrice - base;
                            const mg = sellingPrice > 0 ? ((profit / sellingPrice) * 100).toFixed(1) : '0.0';

                            return (
                              <tr key={i} className="border-b border-slate-50">
                                <td className="py-2 font-medium">{u.unit_name || u.name || '—'}</td>
                                <td className="py-2">{u.factor}</td>
                                {isManufactured ? (
                                  <>
                                    <td className="py-2 font-medium">
                                      {u.plain_price != null ? 'TZS ' + fmt(u.plain_price) : '—'}
                                    </td>
                                    <td className="py-2 font-medium">
                                      {u.printed_price != null ? 'TZS ' + fmt(u.printed_price) : '—'}
                                    </td>
                                  </>
                                ) : (
                                  <td className="py-2 font-medium">TZS {fmt(sellingPrice)}</td>
                                )}
                                <td className={`py-2 font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>TZS {fmt(profit)}</td>
                                <td className={`py-2 font-medium ${parseFloat(mg) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{mg}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                )}

                {/* BOM Tab (manufactured only) */}
                {isManufactured && bomItems.length > 0 && (
                  <TabsContent value="bom" className="mt-4">
                    <div className="bg-white border border-slate-200 rounded-sm p-5">
                      <SectionTitle icon={<Factory className="h-4 w-4" />} label="Bill of Materials" />
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left text-[10px] font-medium uppercase text-slate-400 py-2">Raw Material</th>
                            <th className="text-left text-[10px] font-medium uppercase text-slate-400 py-2">Qty Per Unit</th>
                            <th className="text-left text-[10px] font-medium uppercase text-slate-400 py-2">Unit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bomItems.map((b, i) => (
                            <tr key={i} className="border-b border-slate-50">
                              <td className="py-2 font-medium">{b.material_name}</td>
                              <td className="py-2">{b.qty_per_unit}</td>
                              <td className="py-2 text-slate-500">{b.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                )}

                {/* Color Variants Tab */}
                {(isManufactured || isTrading) && colorVariants.length > 0 && (
                  <TabsContent value="variants" className="mt-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                      <SectionTitle icon={<Palette className="h-5 w-5" />} label="Color Variants" />
                      <p className="text-xs text-slate-400 mb-6">
                        Each batch produced from a colored roll is tracked here. Total stock = sum of all variants.
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100">
                              <th className="text-left text-[10px] font-medium uppercase text-slate-400 py-3 pr-4">Color</th>
                              <th className="text-right text-[10px] font-medium uppercase text-slate-400 py-3 px-4">Stock (pcs)</th>
                              <th className="text-right text-[10px] font-medium uppercase text-slate-400 py-3 px-4">Buying Price</th>
                              <th className="text-right text-[10px] font-medium uppercase text-slate-400 py-3 pl-4">Selling Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {colorVariants.map((v: ColorVariant, i: number) => {
                              const plainQty = Number((v as any).plain_qty ?? 0);
                              const printedQty = Number((v as any).printed_qty ?? 0);
                              const totalQty = Number(v.qty ?? (plainQty + printedQty));
                              const profit = v.selling_price - v.buying_price;
                              const margin = v.selling_price > 0 ? ((profit / v.selling_price) * 100).toFixed(1) : '0.0';
                              return (
                                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                                  <td className="py-4 pr-4">
                                    <div className="flex items-center gap-3">
                                      <span
                                        className="h-6 w-6 rounded-md border border-white shadow-sm ring-1 ring-slate-200 flex-shrink-0"
                                        style={{ background: colorToCss(v.color) }}
                                      />
                                      <span className="font-semibold text-slate-800 capitalize">{resolveColorName(v.color)}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-4 text-right font-semibold text-slate-900 tabular-nums">
                                    {totalQty.toLocaleString()} pcs
                                    {(plainQty > 0 || printedQty > 0) && (
                                      <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                                        Plain {plainQty.toLocaleString()} | Printed {printedQty.toLocaleString()}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-4 px-4 text-right font-medium text-slate-600 tabular-nums">
                                    TZS {fmt(v.buying_price)}
                                  </td>
                                  <td className="py-4 pl-4 text-right tabular-nums">
                                    <div className="font-medium text-blue-600">TZS {fmt(v.selling_price)}</div>
                                    <div className={`text-[10px] font-medium mt-0.5 ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      {profit >= 0 ? '+' : ''}{fmt(profit)} ({margin}%)
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-slate-200 bg-slate-50/50">
                              <td className="py-3 pr-4 text-xs font-semibold text-slate-500 uppercase">Total</td>
                              <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums">
                                {colorVariants.reduce((s: number, v: ColorVariant) => {
                                  const plainQty = Number((v as any).plain_qty ?? 0);
                                  const printedQty = Number((v as any).printed_qty ?? 0);
                                  const totalQty = Number(v.qty ?? (plainQty + printedQty));
                                  return s + totalQty;
                                }, 0).toLocaleString()} pcs
                              </td>
                              <td className="py-3 px-4" />
                              <td className="py-3 pl-4" />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </TabsContent>
                )}

                {/* Inventory Tab */}
                <TabsContent value="inventory" className="mt-4 space-y-4">
                  <div className="bg-white border border-slate-200 rounded-sm p-5">
                    <SectionTitle icon={<Store className="h-4 w-4" />} label="Stock by Store" />
                    {storeQtys.length > 0 ? (
                      <div className="space-y-2">
                        {storeQtys.map((s, i) => (
                          <div key={i} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-sm border border-slate-100">
                            <span className="text-sm font-medium text-slate-700">{s.store_name}</span>
                            <span className="text-sm font-medium text-slate-900">{s.qty.toLocaleString()} {s.unit ?? 'units'}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-sm border border-blue-100 mt-2">
                          <span className="text-xs font-medium uppercase text-blue-600">Total</span>
                          <span className="text-sm font-medium text-blue-700">{stock.toLocaleString()} {stockUnit}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 text-center py-6">No stock recorded yet.</p>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white border border-slate-200 rounded-sm p-4">
                      <p className="text-[10px] font-medium uppercase text-slate-400">Total Stock</p>
                      <p className={`text-2xl font-medium mt-1 ${stock < reorder && reorder > 0 ? 'text-red-600' : 'text-slate-900'}`}>{stock.toLocaleString()} <span className="text-sm font-normal text-slate-400">{stockUnit}</span></p>
                      {stock < reorder && reorder > 0 && <p className="text-[10px] text-red-500 mt-0.5">⚠ Below reorder level ({reorder})</p>}
                    </div>
                    <div className="bg-white border border-slate-200 rounded-sm p-4">
                      <p className="text-[10px] font-medium uppercase text-slate-400">Reorder Level</p>
                      <p className="text-2xl font-medium mt-1 text-slate-900">{reorder}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-sm p-4">
                      <p className="text-[10px] font-medium uppercase text-slate-400">Stock Value</p>
                      <p className="text-xl font-medium mt-1 text-blue-600">TZS {fmt(product.total_stock_value ?? 0)}</p>
                    </div>
                  </div>
                </TabsContent>

                {/* Tech Specs Tab */}
                {specs.length > 0 && (
                  <TabsContent value="specs" className="mt-4">
                    <div className="bg-white border border-slate-200 rounded-sm p-5">
                      <SectionTitle icon={<Wrench className="h-4 w-4" />} label="Technical Specifications" />
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left text-[10px] font-medium uppercase text-slate-400 py-2">Specification</th>
                            <th className="text-left text-[10px] font-medium uppercase text-slate-400 py-2">Value / Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {specs.map((s, i) => (
                            <tr key={i} className="border-b border-slate-50">
                              <td className="py-2 font-medium">{s.title}</td>
                              <td className="py-2 text-slate-600">{s.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                )}

                {/* History Tab */}
                <TabsContent value="history" className="mt-4">
                  <div className="bg-white border border-slate-200 rounded-sm p-5">
                    <SectionTitle icon={<Clock className="h-4 w-4" />} label="Stock Movements" />
                    {movements.length > 0 ? (
                      <div className="space-y-1.5">
                        {movements.map(m => (
                          <div key={m.id} className="flex items-center justify-between py-2 px-3 border border-slate-100 rounded-sm hover:bg-slate-50">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${m.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {m.type === 'in' ? '↑' : '↓'}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-700 truncate">{m.reference}</p>
                                {m.store && <p className="text-[10px] text-slate-400">{m.store}</p>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-sm font-medium ${m.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                {m.type === 'in' ? '+' : '-'}{Number(m.quantity).toLocaleString()}
                              </p>
                              <p className="text-[10px] text-slate-400">{fmtDate(m.created_at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 text-center py-8">No stock movements recorded yet.</p>
                    )}
                  </div>
                </TabsContent>

              </Tabs>
            </div>

            {/* RIGHT COLUMN — Images & Stats */}
            <div className="space-y-8">
              {/* Product Images */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <SectionTitle icon={<ImageIcon className="h-5 w-5" />} label="Product media" />
                {images.length > 0 ? (
                  <div className="space-y-4">
                    <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner group relative">
                      <img src={images[activeImg]} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>
                    {images.length > 1 && (
                      <div className="grid grid-cols-4 gap-3">
                        {images.map((img, i) => (
                          <button key={i} onClick={() => setActiveImg(i)}
                            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all shadow-sm ${activeImg === i ? 'border-blue-500 ring-2 ring-blue-500/20 active:scale-95' : 'border-slate-100 hover:border-slate-300'}`}>
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 transition-colors hover:bg-slate-100/50">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-xs font-semibold text-slate-400 tracking-tight">No digital assets found</p>
                  </div>
                )}
              </div>

              {/* Quick info card */}
              <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6 shadow-sm">
                <SectionTitle icon={<Package className="h-5 w-5" />} label="Quick statistics" />
                <div className="space-y-4">
                  {[
                    { label: 'Classification',      value: product.product_type },
                    { label: 'Active status',    value: product.status },
                    { label: 'Standard unit', value: product.unit_of_measurement },
                    { label: 'Restock threshold', value: product.low_alert ? String(product.low_alert) + ' units' : null },
                  ].map(({ label, value }) => value && (
                    <div key={label} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none last:pb-0">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">{label}</span>
                      <span className="text-xs font-semibold text-slate-800 tracking-tight capitalize">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                   <Link href={`/products-new/${product.id}/edit`}>
                     <Button variant="outline" className="w-full h-11 rounded-xl text-xs font-semibold border-slate-200">
                       Enhanced configuration
                     </Button>
                   </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
