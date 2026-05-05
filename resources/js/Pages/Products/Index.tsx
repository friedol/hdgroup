import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
  Plus, Download, Eye, Edit, Trash2, Search, Package,
  Globe, EyeOff, Filter, ChevronLeft, ChevronRight, Image, RotateCcw
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

/* ─── Types ────────────────────────────────────── */
interface Product {
  id: number;
  product_name: string;
  clean_name: string;
  product_id: string;
  product_type: string;
  product_price: number;
  buying_price: number;
  current_stock: number;
  total_qty: number;
  status: 'active' | 'inactive';
  is_public: boolean;
  category_name: string;
  image_url: string | null;
}

interface Paginated {
  data: Product[];
  current_page: number;
  per_page: number;
  total: number;
}

interface Props {
  products: Paginated;
  filters?: { search?: string; status?: string; type?: string };
}

/* ─── Helpers ──────────────────────────────────── */
const TYPE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'trading', label: 'Trading' },
  { key: 'manufactured', label: 'Manufactured' },
  { key: 'raw_material', label: 'Raw material' },
];

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
export default function ProductsIndex({ products, filters = {} }: Props) {
  const [searchQuery, setSearchQuery]   = useState(filters.search ?? '');
  const [activeType, setActiveType]     = useState(filters.type ?? 'all');
  const [toggling, setToggling]         = useState<number | null>(null);

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Products', href: '#' },
  ];

  const applyFilters = (overrides: Record<string, string> = {}) => {
    router.get(
      '/products-new',
      { search: searchQuery, type: activeType, ...overrides },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const handleTypeChange = (type: string) => {
    setActiveType(type);
    applyFilters({ type });
  };

  const handlePage = (page: number) => {
    router.get('/products-new', { page, search: searchQuery, type: activeType }, { preserveState: true });
  };

  const handleDelete = (row: Product) => {
    if (!confirm(`Permanently delete "${row.clean_name || row.product_name}"?`)) {
return;
}

    router.delete(`/products-new/${row.id}`, {
      onSuccess: () => toast.success('Product removed or archived successfully'),
      onError: (errors) => toast.error((errors?.error as string) || 'Failed to delete product'),
    });
  };

  const handleReactivate = (row: Product) => {
    router.post(`/products-new/${row.id}/reactivate`, {}, {
      onSuccess: () => toast.success('Product reactivated'),
      onError: (errors) => toast.error((errors?.error as string) || 'Failed to reactivate product'),
    });
  };

  const handleToggleVisibility = async (row: Product) => {
    setToggling(row.id);

    try {
      await axios.post('/product-toggle-visibility', { product_id: row.id });
      toast.success(row.is_public ? 'Product set to private' : 'Product is now public');
      router.reload();
    } catch {
      toast.error('Failed to toggle visibility');
    } finally {
      setToggling(null);
    }
  };

  const totalPages = Math.ceil(products.total / products.per_page);

  return (
    <>
      <Head title="Products management" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Products</h1>
           
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/products-new/create">
                <Button size="sm" className="rounded-xl gap-2 text-xs font-semibold h-9 bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/30">
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </Link>
            </div>
          </div>

          {/* ── Stats bar ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Total products', value: products.total, valueColor: 'text-slate-900', border: 'border-slate-200', bg: 'bg-white', chip: 'bg-slate-50/80', chipText: 'Total', icon: <Package className="h-4 w-4 md:h-5 md:w-5" /> },
              { label: 'Showing', value: products.data.length, valueColor: 'text-blue-700', border: 'border-blue-200', bg: 'bg-blue-50/30', chip: 'bg-blue-50/80', chipText: 'Page', icon: <Search className="h-4 w-4 md:h-5 md:w-5" /> },
              { label: 'Public', value: products.data.filter(p => p.is_public).length, valueColor: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50/30', chip: 'bg-emerald-50/80', chipText: 'Visible', icon: <Globe className="h-4 w-4 md:h-5 md:w-5" /> },
              { label: 'Active', value: products.data.filter(p => p.status === 'active').length, valueColor: 'text-violet-700', border: 'border-violet-200', bg: 'bg-violet-50/30', chip: 'bg-violet-50/80', chipText: 'Status', icon: <Eye className="h-4 w-4 md:h-5 md:w-5" /> },
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
              <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="product-search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or SKU..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50 focus:bg-white transition-all"
                />
              </form>

              {/* Type tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {TYPE_TABS.map(t => (
                  <button
                    key={t.key}
                    id={`type-tab-${t.key}`}
                    onClick={() => handleTypeChange(t.key)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeType === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[11px] font-semibold text-slate-400">
                    <th className="px-5 py-3 text-left">Photo</th>
                    <th className="px-5 py-3 text-left">Product Name</th>
                    <th className="px-5 py-3 text-left">SKU</th>
                    <th className="px-5 py-3 text-left">Category</th>
                    <th className="px-5 py-3 text-right">Stock</th>
                    <th className="px-5 py-3 text-right">Price</th>
                    <th className="px-5 py-3 text-right">Cost</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-center">Visibility</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.data.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-16 text-center">
                        <Package className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                        <p className="text-sm font-semibold text-slate-400">No products found</p>
                        <p className="text-[11px] text-slate-300 mt-1">Try a different search or filter</p>
                      </td>
                    </tr>
                  ) : products.data.map(row => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">

                      {/* Image */}
                      <td className="px-5 py-3">
                        <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          {row.image_url ? (
                            <img
                              src={row.image_url}
                              alt={row.clean_name || row.product_name}
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

                      {/* Product name */}
                      <td className="px-5 py-3">
                        <Link href={`/products-new/${row.id}`} className="group/link">
                          <p className="font-semibold text-slate-900 group-hover/link:text-blue-600 transition-colors leading-tight">
                            {row.clean_name || row.product_name}
                          </p>
                          <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeBadge(row.product_type)}`}>
                            {typeLabel(row.product_type)}
                          </span>
                        </Link>
                      </td>

                      {/* SKU */}
                      <td className="px-5 py-3 font-mono text-xs text-blue-600 font-semibold">{row.product_id}</td>

                      {/* Category */}
                      <td className="px-5 py-3 text-xs text-slate-600 font-bold">{row.category_name}</td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-800 tabular-nums">
                        {(row.current_stock ?? 0).toLocaleString()}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3 text-right font-semibold text-slate-900 tabular-nums">
                        {(row.product_price ?? 0).toLocaleString()}
                      </td>

                      {/* Cost */}
                      <td className="px-5 py-3 text-right text-slate-500 font-bold tabular-nums">
                        {(row.buying_price ?? 0).toLocaleString()}
                      </td>

                      {/* Status badge */}
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center justify-center text-[10px] font-semibold px-2.5 py-1 rounded-lg ${row.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {row.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Visibility toggle */}
                      <td className="px-5 py-3 text-center">
                        <button
                          id={`visibility-toggle-${row.id}`}
                          onClick={() => handleToggleVisibility(row)}
                          disabled={toggling === row.id}
                          title={row.is_public ? 'Public — click to make private' : 'Private — click to make public'}
                          className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${toggling === row.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'} ${row.is_public ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                        >
                          {row.is_public
                            ? <><Globe className="h-3 w-3" /> Public</>
                            : <><EyeOff className="h-3 w-3" /> Private</>}
                        </button>
                      </td>

                      {/* Actions — always visible */}
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
                          <button
                            id={`delete-product-${row.id}`}
                            title="Delete product"
                            onClick={() => handleDelete(row)}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {row.status === 'inactive' && (
                            <button
                              id={`reactivate-product-${row.id}`}
                              title="Reactivate product"
                              onClick={() => handleReactivate(row)}
                              className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {products.total > products.per_page && (
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500">
                  Showing <span className="text-slate-800">{products.data.length}</span> of <span className="text-slate-800">{products.total}</span> products
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePage(products.current_page - 1)}
                    disabled={products.current_page === 1}
                    className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:border-blue-200 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-700 px-2">
                    {products.current_page} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePage(products.current_page + 1)}
                    disabled={products.current_page >= totalPages}
                    className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:border-blue-200 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}
