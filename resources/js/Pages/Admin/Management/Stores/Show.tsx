import { Head, Link } from '@inertiajs/react';
import {
    Package, Search, Image, MapPin, Store as StoreIcon,
    AlertTriangle, PackageX, ChevronLeft, TrendingDown,
    BarChart3, ArrowUpRight,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';

/* ─── Types ──────────────────────────────────────── */
interface Product {
    id: number;
    product_name: string;
    product_id: string;
    product_type: string;
    product_price: number;
    buying_price: number;
    selling_price?: number;
    plain_price?: number;
    printed_price?: number;
    status: string;
    image_url: string | null;
    total_qty: number;
    display_qty: number;
    stock_unit: string;
    stock_factor: number;
    category_name: string;
}

interface Store {
    id: number;
    store_id: string;
    store_name: string;
    store_location: string;
    district?: string;
    street?: string;
}

interface Metrics {
    total_skus: number;
    total_qty: number;
    total_value_cost: number;
    total_value_sales: number;
    low_stock: number;
    out_of_stock: number;
}

interface Props {
    store: Store;
    products: Product[];
    metrics: Metrics;
}

/* ─── Helpers ────────────────────────────────────── */
const TYPE_TABS = [
    { key: 'all',          label: 'All'          },
    { key: 'trading',      label: 'Trading'      },
    { key: 'manufactured', label: 'Manufactured' },
    { key: 'raw_material', label: 'Raw material' },
];

const typeBadge = (type: string) => {
    const map: Record<string, string> = {
        trading:      'bg-blue-50 text-blue-700',
        manufactured: 'bg-violet-50 text-violet-700',
        raw_material: 'bg-amber-50 text-amber-700',
    };
    return map[type] ?? 'bg-slate-100 text-slate-600';
};

const typeLabel = (type: string) => {
    const map: Record<string, string> = {
        trading:      'Trading',
        manufactured: 'Manufactured',
        raw_material: 'Raw material',
    };
    return map[type] ?? type;
};

const fmt = (n: number) => n.toLocaleString();

/* ─── Component ──────────────────────────────────── */
export default function StoreShow({ store, products, metrics }: Props) {
    const [search, setSearch]       = useState('');
    const [activeType, setActiveType] = useState('all');

    const breadcrumbs = [
        { title: 'Location', href: '#' },
        { title: 'Stores', href: '/all-stores' },
        { title: store.store_name, href: `/all-stores/${store.id}` },
    ];

    const filtered = useMemo(() => {
        let list = products;
        if (activeType !== 'all') {
            list = list.filter(p => p.product_type === activeType);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.product_name.toLowerCase().includes(q) ||
                p.product_id.toLowerCase().includes(q) ||
                (p.category_name ?? '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [products, search, activeType]);

    const inStockCount    = products.filter(p => (p.total_qty ?? 0) > 0).length;
    const outOfStockCount = metrics.out_of_stock;
    const lowStockCount   = metrics.low_stock;

    return (
        <>
            <Head title={`${store.store_name} — Stock`} />
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="max-w-[1700px] mx-auto space-y-6 pb-20">

                    {/* ── Header ── */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-teal-600 flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
                                <StoreIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-[18px] font-bold text-slate-900 leading-tight">{store.store_name}</h1>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{store.store_id}</span>
                                    {store.store_location && (
                                        <span className="flex items-center gap-1 text-xs text-slate-500">
                                            <MapPin className="h-3 w-3" />
                                            {store.store_location}{store.district ? `, ${store.district}` : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Link
                            href="/all-stores"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all shrink-0"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            Back to Stores
                        </Link>
                    </div>

                    {/* ── Stat cards ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {[
                            {
                                label: 'Total Products',
                                value: metrics.total_skus,
                                valueColor: 'text-slate-900',
                                border: 'border-slate-200',
                                bg: 'bg-white',
                                chip: 'bg-slate-50/80',
                                chipText: 'SKUs',
                                icon: <Package className="h-4 w-4 md:h-5 md:w-5" />,
                            },
                            {
                                label: 'In Stock',
                                value: inStockCount,
                                valueColor: 'text-emerald-700',
                                border: 'border-emerald-200',
                                bg: 'bg-emerald-50/30',
                                chip: 'bg-emerald-50/80',
                                chipText: 'Available',
                                icon: <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />,
                            },
                            {
                                label: 'Low Stock',
                                value: lowStockCount,
                                valueColor: 'text-amber-700',
                                border: 'border-amber-200',
                                bg: 'bg-amber-50/30',
                                chip: 'bg-amber-50/80',
                                chipText: 'Alert',
                                icon: <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />,
                            },
                            {
                                label: 'Out of Stock',
                                value: outOfStockCount,
                                valueColor: 'text-rose-700',
                                border: 'border-rose-200',
                                bg: 'bg-rose-50/30',
                                chip: 'bg-rose-50/80',
                                chipText: 'Empty',
                                icon: <PackageX className="h-4 w-4 md:h-5 md:w-5" />,
                            },
                        ].map(s => (
                            <div key={s.label} className={`rounded-xl border ${s.border} p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow ${s.bg}`}>
                                <div className="flex items-center justify-between mb-2 md:mb-3">
                                    <div className="bg-white p-1.5 md:p-2 rounded-lg shadow-sm text-slate-500">{s.icon}</div>
                                    <span className={`text-[8px] md:text-[10px] font-medium px-1.5 md:px-2 py-0.5 rounded-full ${s.chip} text-slate-600`}>{s.chipText}</span>
                                </div>
                                <p className={`text-lg md:text-2xl font-semibold tabular-nums leading-none ${s.valueColor}`}>{fmt(s.value)}</p>
                                <p className="text-[10px] md:text-xs font-medium text-slate-500 mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Value summary strip ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <TrendingDown className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Stock Value (Cost)</p>
                                <p className="text-sm font-bold text-slate-900">TZS {fmt(Math.round(metrics.total_value_cost))}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Potential Sales Value</p>
                                <p className="text-sm font-bold text-slateald-900 text-emerald-700">TZS {fmt(Math.round(metrics.total_value_sales))}</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Product table ── */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                        {/* Toolbar */}
                        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="relative flex-1 min-w-[200px] max-w-sm">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by name, SKU, category..."
                                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50 focus:bg-white transition-all"
                                />
                            </div>

                            {/* Type filter tabs */}
                            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                                {TYPE_TABS.map(t => (
                                    <button
                                        key={t.key}
                                        onClick={() => setActiveType(t.key)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeType === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            <p className="text-xs text-slate-400 font-medium shrink-0">
                                {filtered.length} of {products.length} products
                            </p>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[11px] font-semibold text-slate-400">
                                        <th className="px-5 py-3 text-left w-[60px]">Photo</th>
                                        <th className="px-5 py-3 text-left">Product Name</th>
                                        <th className="px-5 py-3 text-left">SKU</th>
                                        <th className="px-5 py-3 text-left">Category</th>
                                        <th className="px-5 py-3 text-right">Available Stock</th>
                                        <th className="px-5 py-3 text-right">Selling Price</th>
                                        <th className="px-5 py-3 text-right">Cost</th>
                                        <th className="px-5 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-5 py-16 text-center">
                                                <Package className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                                                <p className="text-sm font-semibold text-slate-400">No products found</p>
                                                <p className="text-[11px] text-slate-300 mt-1">
                                                    {search ? 'Try a different search term' : 'No products are stocked in this store yet'}
                                                </p>
                                            </td>
                                        </tr>
                                    ) : filtered.map(row => {
                                        const rawQty     = row.total_qty   ?? 0;
                                        const dispQty    = row.display_qty ?? rawQty;
                                        const stockUnit  = row.stock_unit  ?? 'pcs';
                                        const stockFactor = row.stock_factor ?? 1;
                                        const isLow      = rawQty > 0 && rawQty <= 5 * stockFactor;
                                        const isEmpty    = rawQty <= 0;

                                        return (
                                            <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">

                                                {/* Image */}
                                                <td className="px-5 py-3">
                                                    <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                                        {row.image_url ? (
                                                            <img
                                                                src={row.image_url}
                                                                alt={row.product_name}
                                                                className="h-full w-full object-cover"
                                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                            />
                                                        ) : (
                                                            <Image className="h-4 w-4 text-slate-300" />
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Name */}
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
                                                <td className="px-5 py-3 text-xs text-slate-600 font-bold">{row.category_name}</td>

                                                {/* Stock */}
                                                <td className="px-5 py-3 text-right">
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        <span className={`font-bold tabular-nums text-sm ${isEmpty ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                                                            {fmt(dispQty)}
                                                            <span className="text-[10px] font-normal text-slate-400 ml-1">{stockUnit}</span>
                                                        </span>
                                                        {isEmpty ? (
                                                            <span className="text-[9px] font-semibold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Out of stock</span>
                                                        ) : isLow ? (
                                                            <span className="text-[9px] font-semibold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">Low stock</span>
                                                        ) : null}
                                                    </div>
                                                </td>

                                                {/* Selling Price */}
                                                <td className="px-5 py-3 text-right tabular-nums">
                                                    {row.product_type === 'manufactured' ? (
                                                        <span className="text-xs leading-tight">
                                                            <span className="font-semibold text-slate-900">{fmt(row.plain_price ?? row.selling_price ?? row.product_price ?? 0)}</span>
                                                            <span className="text-slate-400 mx-0.5">/</span>
                                                            <span className="font-medium text-slate-600">{fmt(row.printed_price ?? row.plain_price ?? row.product_price ?? 0)}</span>
                                                            <span className="block text-[9px] text-slate-400 font-medium mt-0.5">plain / printed</span>
                                                        </span>
                                                    ) : row.product_type === 'raw_material' ? (
                                                        <span className="font-medium text-slate-400 text-xs">—</span>
                                                    ) : (
                                                        <span className="font-semibold text-slate-900">{fmt(row.selling_price ?? row.product_price ?? 0)}</span>
                                                    )}
                                                </td>

                                                {/* Cost */}
                                                <td className="px-5 py-3 text-right text-slate-500 font-bold tabular-nums">
                                                    {fmt(row.buying_price ?? 0)}
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-3 text-center">
                                                    <span className={`inline-flex items-center justify-center text-[10px] font-semibold px-2.5 py-1 rounded-lg ${row.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {row.status === 'active' ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {filtered.length > 0 && (
                            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                                <p className="text-xs font-semibold text-slate-500">
                                    Showing <span className="text-slate-800">{filtered.length}</span> products in <span className="text-slate-800">{store.store_name}</span>
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </AppLayout>
        </>
    );
}
