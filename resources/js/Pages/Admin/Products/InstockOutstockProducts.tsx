import { Head, Link } from "@inertiajs/react";
import { Package, Search, Eye, Edit, Image, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/layouts/app-layout";

/* ─── Types ────────────────────────────────────── */
interface Product {
  id: number;
  product_id: string; // SKU
  product_name: string;
  product_type: string;
  total_qty: number;
  level: number; // Low stock threshold
  buying_price: number;
  product_management?: {
    category_name?: string;
    image_url?: string | null;
    product_price?: number;
    plain_selling_price?: number;
    printed_selling_price?: number;
  };
}

interface Props {
  products: Product[];
  title: string;
  addTrue: boolean;
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

const typeLabel = (type: string) => {
  const map: Record<string, string> = {
    trading: 'Trading',
    manufactured: 'Manufactured',
    raw_material: 'Raw material',
  };

  return map[type] ?? type;
};

/* ─── Component ────────────────────────────────── */
export default function InstockOutstockProducts({ products, title, addTrue }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter(p =>
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.product_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Products', href: '/products-new' },
    { title: title, href: '#' }
  ];

  const totalQuantity = filteredProducts.reduce((sum, p) => sum + (p.total_qty ?? 0), 0);
  const isOutofStock = title.toLowerCase().includes('outstock');
  const isLowStock = title.toLowerCase().includes('low') || title.toLowerCase().includes('less');

  return (
    <>
      <Head title={title} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">{title}</h1>
            </div>
          </div>

          {/* ── Stats bar ── */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { 
                label: 'Products listed', 
                value: filteredProducts.length, 
                valueColor: 'text-slate-900', 
                border: 'border-slate-200', 
                bg: 'bg-white', 
                chip: 'bg-slate-50/80', 
                chipText: 'Count', 
                icon: <Package className="h-4 w-4 md:h-5 md:w-5" /> 
              },
              { 
                label: 'Total units in stock', 
                value: totalQuantity.toLocaleString(), 
                valueColor: isOutofStock ? 'text-rose-700' : isLowStock ? 'text-amber-700' : 'text-emerald-700', 
                border: isOutofStock ? 'border-rose-200' : isLowStock ? 'border-amber-200' : 'border-emerald-200', 
                bg: isOutofStock ? 'bg-rose-50/30' : isLowStock ? 'bg-amber-50/30' : 'bg-emerald-50/30', 
                chip: isOutofStock ? 'bg-rose-50/80' : isLowStock ? 'bg-amber-50/80' : 'bg-emerald-50/80', 
                chipText: 'Inventory', 
                icon: isOutofStock ? <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" /> : <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" /> 
              },
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
                  id="stock-search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or SKU..."
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
                    <th className="px-5 py-3 text-right">Stock</th>
                    <th className="px-5 py-3 text-right">Selling Price</th>
                    <th className="px-5 py-3 text-right">Cost</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <Package className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                        <p className="text-sm font-semibold text-slate-400">No products found</p>
                        <p className="text-[11px] text-slate-300 mt-1">Try a different search query</p>
                      </td>
                    </tr>
                  ) : filteredProducts.map(row => {
                    const pm = row.product_management;
                    const categoryName = pm?.category_name || 'General';
                    const imageUrl = pm?.image_url;
                    
                    const sellingPrice = pm?.product_price ?? 0;
                    const plainPrice = pm?.plain_selling_price ?? pm?.product_price ?? 0;
                    const printedPrice = pm?.printed_selling_price ?? pm?.plain_selling_price ?? pm?.product_price ?? 0;

                    return (
                      <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        
                        {/* Image */}
                        <td className="px-5 py-3">
                          <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
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

                        {/* Product info */}
                        <td className="px-5 py-3">
                          <Link href={`/products-new/${row.id}`} className="group/link">
                            <p className="font-semibold text-slate-900 group-hover/link:text-blue-600 transition-colors leading-tight">
                              {row.product_name}
                            </p>
                            <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeBadge(row.product_type)}`}>
                              {typeLabel(row.product_type)}
                            </span>
                          </Link>
                        </td>

                        {/* SKU */}
                        <td className="px-5 py-3 font-mono text-xs text-blue-600 font-semibold">{row.product_id}</td>

                        {/* Category */}
                        <td className="px-5 py-3 text-xs text-slate-600 font-bold">{categoryName}</td>

                        {/* Stock */}
                        <td className="px-5 py-3 text-right tabular-nums">
                          <span className={`font-semibold text-sm ${row.total_qty <= 0 ? 'text-rose-600' : row.total_qty <= (row.level ?? 5) ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {row.total_qty.toLocaleString()}
                          </span>
                        </td>

                        {/* Selling Price */}
                        <td className="px-5 py-3 text-right tabular-nums">
                          {row.product_type === 'manufactured' ? (
                            <span className="text-xs leading-tight">
                              <span className="font-semibold text-slate-900">{plainPrice.toLocaleString()}</span>
                              <span className="text-slate-400 mx-0.5">/</span>
                              <span className="font-medium text-slate-600">{printedPrice.toLocaleString()}</span>
                              <span className="block text-[9px] text-slate-400 font-medium mt-0.5">plain / printed</span>
                            </span>
                          ) : row.product_type === 'raw_material' ? (
                            <span className="font-medium text-slate-400 text-xs">—</span>
                          ) : (
                            <span className="font-semibold text-slate-900">{sellingPrice.toLocaleString()}</span>
                          )}
                        </td>

                        {/* Cost */}
                        <td className="px-5 py-3 text-right text-slate-500 font-bold tabular-nums">
                          {(row.buying_price ?? 0).toLocaleString()}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/products-new/${row.id}`} id={`view-product-${row.id}`}>
                              <button
                                title="View product"
                                className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </Link>
                            <Link href={`/products-new/${row.id}/edit`} id={`edit-product-${row.id}`}>
                              <button
                                title="Edit product"
                                className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            </Link>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </AppLayout>
    </>
  );
}
