import { Head, Link } from "@inertiajs/react";
import { Plus, Search, Edit, Eye, Package, Weight, Box, DollarSign, Layers, Filter, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import AppLayout from "@/layouts/app-layout";

interface Product {
  id: number;
  product_id: string;
  product_name: string;
  cbm: number;
  weight: number;
  price?: number;
  pc_per_ctn?: number;
  created_at?: string;
}

export default function ProductsIndex({ posts = [] }: { posts: Product[] }) {
  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Logistics", href: "/logistics" },
    { title: "Port Products", href: "#" },
  ];

  const [search, setSearch] = useState("");

  const filtered = posts.filter(
    (p) =>
      p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      p.product_id.toLowerCase().includes(search.toLowerCase())
  );

  const totalCBM    = posts.reduce((s, p) => s + p.cbm, 0);
  const totalWeight = posts.reduce((s, p) => s + p.weight, 0);
  const totalValue  = posts.reduce((s, p) => s + (p.price || 0), 0);

  return (
    <>
      <Head title="Port Products" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">

          {/* ── Header ── */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Port Products</h1>
              <p className="text-sm text-slate-500 mt-0.5">Products registered for import / port clearance</p>
            </div>
            <Link href="/register-products/create">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors">
                <Plus className="w-4 h-4" />
                Register Product
              </button>
            </Link>
          </div>

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Package,     bg: 'bg-indigo-50', iconCls: 'text-indigo-600', label: 'Total Products', value: posts.length,                         sub: 'Registered' },
              { icon: Box,         bg: 'bg-blue-50',   iconCls: 'text-blue-600',   label: 'Total Volume',   value: `${totalCBM.toFixed(2)} CBM`,          sub: 'Cubic Metres' },
              { icon: Weight,      bg: 'bg-amber-50',  iconCls: 'text-amber-600',  label: 'Total Weight',   value: `${(totalWeight/1000).toFixed(1)} MT`, sub: 'Metric Tons' },
              { icon: DollarSign,  bg: 'bg-emerald-50',iconCls: 'text-emerald-600',label: 'Portfolio Value', value: `TZS ${(totalValue/1000000).toFixed(1)}M`, sub: 'Estimated' },
            ].map(({ icon: Icon, bg, iconCls, label, value, sub }) => (
              <div key={label} className="rounded-xl bg-white border border-slate-200 shadow-sm px-3 py-2.5 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${iconCls}`} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="text-base font-bold text-slate-800 mt-0">{value}</p>
                  <p className="text-[9px] text-slate-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Search ── */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by product name or ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50/50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-all"
                />
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-600 font-medium">No products found</p>
                <p className="text-slate-400 text-sm mt-1">
                  {search ? `No results for "${search}"` : 'Start by registering a product'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Product ID', 'Product Name', 'CBM / Unit', 'Weight (kg)', 'Price (TZS)', 'Qty/Ctn', 'Registered', 'Actions'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 tracking-wider bg-slate-50 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">{product.product_id}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-indigo-500" />
                            </div>
                            <span className="font-semibold text-slate-800">{product.product_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600 tabular-nums">{product.cbm.toFixed(3)}</td>
                        <td className="px-5 py-4 text-slate-600 tabular-nums">{product.weight.toLocaleString()}</td>
                        <td className="px-5 py-4 text-slate-600 tabular-nums">
                          {product.price ? `TZS ${product.price.toLocaleString()}` : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {product.pc_per_ctn ? (
                            <span className="inline-flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5 text-slate-400" />
                              {product.pc_per_ctn}
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs">
                          {product.created_at ? new Date(product.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/register-products/${product.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                              <Eye className="w-3.5 h-3.5" />View
                            </Link>
                            <Link href={`/register-products/${product.id}/edit`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                              <Edit className="w-3.5 h-3.5" />Edit
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Footer */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of <span className="font-semibold text-slate-700">{posts.length}</span> products</span>
                  <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3" />Port products registry</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}
