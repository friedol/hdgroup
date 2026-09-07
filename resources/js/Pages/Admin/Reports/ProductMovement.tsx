import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { Package, Search, Download, TrendingUp, ShoppingCart, BarChart2, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/layouts/app-layout";

interface Movement {
  product_id: number;
  product_name: string;
  sku: string;
  category: string;
  unit_price: number;
  total_qty_sold: number;
  total_revenue: number;
  num_transactions: number;
}

interface Props {
  movements: Movement[];
  products: { id: number; name: string; sku: string }[];
  categories: { id: number; category_name: string }[];
  branches: { id: number; name: string }[];
  dateFrom: string;
  dateTo: string;
  productId: string | null;
  category: string | null;
  branchId: string | null;
}

export default function ProductMovement({
  movements,
  products,
  categories,
  branches,
  dateFrom,
  dateTo,
  productId,
  category,
  branchId,
}: Props) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    date_from: dateFrom,
    date_to: dateTo,
    product_id: productId ?? "",
    category: category ?? "",
    branch_id: branchId ?? "",
  });

  const applyFilters = () => {
    router.get("/report_product_movement", filters, { preserveState: true });
  };

  const filtered = movements.filter(
    (m) =>
      m.product_name.toLowerCase().includes(search.toLowerCase()) ||
      m.sku?.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalQty = filtered.reduce((s, m) => s + Number(m.total_qty_sold), 0);
  const totalRevenue = filtered.reduce((s, m) => s + Number(m.total_revenue), 0);
  const totalTxn = filtered.reduce((s, m) => s + Number(m.num_transactions), 0);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <AppLayout breadcrumbs={[{ title: "Reports", href: "/report_sales" }, { title: "Product Movement", href: "/report_product_movement" }]}>
      <Head title="Product Movement Report" />
      <div className="w-full space-y-4 pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-800 tracking-tight">Product Movement</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs font-bold"
            onClick={() => {
              const params = new URLSearchParams({
                date_from: filters.date_from,
                date_to: filters.date_to,
                ...(filters.category ? { category: filters.category } : {}),
                ...(filters.branch_id ? { branch_id: filters.branch_id } : {}),
                ...(filters.product_id ? { product_id: filters.product_id } : {}),
              });
              const existing = document.getElementById('print-iframe');
              if (existing) document.body.removeChild(existing);
              const iframe = document.createElement('iframe');
              iframe.id = 'print-iframe';
              iframe.style.position = 'fixed';
              iframe.style.right = '0';
              iframe.style.bottom = '0';
              iframe.style.width = '0';
              iframe.style.height = '0';
              iframe.style.border = 'none';
              iframe.style.visibility = 'hidden';
              iframe.src = `/report_product_movement/print?${params}`;
              document.body.appendChild(iframe);
            }}
          >
            <Download className="h-3.5 w-3.5" /> Print Report
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">From</label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">To</label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Category</label>
              <select
                className="h-9 w-full border border-slate-200 rounded-lg text-xs px-2 bg-white outline-none focus:border-blue-400"
                value={filters.category}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.category_name}>{c.category_name}</option>
                ))}
              </select>
            </div>
            {branches.length > 0 && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Branch</label>
                <select
                  className="h-9 w-full border border-slate-200 rounded-lg text-xs px-2 bg-white outline-none focus:border-blue-400"
                  value={filters.branch_id}
                  onChange={(e) => setFilters((f) => ({ ...f, branch_id: e.target.value }))}
                >
                  <option value="">All branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-end">
              <Button onClick={applyFilters} size="sm" className="h-9 w-full gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700">
                <Filter className="h-3.5 w-3.5" /> Apply
              </Button>
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="p-1.5 rounded-lg bg-blue-50">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Units Sold</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{fmt(totalQty)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="p-1.5 rounded-lg bg-emerald-50">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</span>
            </div>
            <p className="text-2xl font-black text-slate-800">TZS {fmt(totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="p-1.5 rounded-lg bg-amber-50">
                <BarChart2 className="h-4 w-4 text-amber-500" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transactions</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{fmt(totalTxn)}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search product, SKU, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none shadow-none h-8 text-sm focus-visible:ring-0 p-0"
            />
            <Badge variant="outline" className="text-[10px] font-bold shrink-0">
              {filtered.length} products
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 px-4">#</th>
                  <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 px-4">Product</th>
                  <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 px-4">SKU</th>
                  <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 px-4">Category</th>
                  <th className="text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 px-4">Qty Sold</th>
                  <th className="text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 px-4">Revenue (TZS)</th>
                  <th className="text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 px-4">Transactions</th>
                  <th className="text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 px-4">Avg Price</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400 text-sm font-medium">
                      <Package className="h-10 w-10 mx-auto mb-2 text-slate-200" />
                      No product movement data for the selected period
                    </td>
                  </tr>
                ) : (
                  filtered.map((m, i) => {
                    const avgPrice = m.num_transactions > 0 ? Number(m.total_revenue) / Number(m.total_qty_sold) : 0;
                    return (
                      <tr key={`${m.product_id}-${i}`} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-xs text-slate-400 font-bold">{i + 1}</td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800 text-sm">{m.product_name}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-mono text-slate-500">{m.sku || '—'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-[10px] font-bold text-slate-600">
                            {m.category}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm font-black text-blue-600">{fmt(Number(m.total_qty_sold))}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm font-black text-emerald-600">{fmt(Number(m.total_revenue))}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-xs font-bold text-slate-600">{m.num_transactions}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-xs font-bold text-slate-500">{fmt(avgPrice)}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
