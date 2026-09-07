import { Head, Link, router } from "@inertiajs/react";
import {
  Package,
  AlertTriangle,
  Search,
  Plus,
  Trophy,
  ShoppingCart,
  Printer,
  Download,
  Wallet,
  TrendingUp,
  Coins,
  Boxes,
  Layers,
  PackageX,
  ArrowLeftRight,
  ClipboardList,
  SlidersHorizontal,
  CalendarRange,
} from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";

interface TopProduct {
  name: string;
  image: string | null;
  qty: number;
  revenue: number;
}

interface Overview {
  stock_cost: number;
  expected_sale_value: number;
  expected_sell_profit: number;
  total_stock: number;
  total_products: number;
  low_stock: number;
  out_of_stock: number;
  stock_transfers: number;
  products_sold: number;
  stock_adjustments: number;
}

interface ProductRow {
  id: number;
  product_name: string;
  sku: string | null;
  unit_name: string | null;
  category_name: string | null;
  level: number | null;
  qty: number;
  buying_price: number;
  selling_price: number;
  stock_cost: number;
  stock_value: number;
  status: "ok" | "low" | "out";
}

interface TransferRow {
  unique_id: string;
  created_at: string;
  staff_name: string | null;
  status: string | null;
  product_count: number;
  total_quantity: number;
  total_buying_value: number;
  total_selling_value: number;
  source_store: string;
  destination_store: string;
}

interface StoreOption {
  id: number;
  store_name: string;
}

interface Filters {
  store_id: number | null;
  store_name: string;
  start_date: string | null;
  end_date: string | null;
}

interface InventoryReportProps {
  prd: any[];
  totalQty: number;
  inventory_profit: number;
  overview: Overview;
  productList: ProductRow[];
  transfers: TransferRow[];
  outStock: any[];
  categories: any[];
  topProducts?: TopProduct[];
  stores: StoreOption[];
  filters: Filters;
}

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Reports", href: "#" },
  { title: "Inventory Report", href: "/report_inventory" },
];

const RANK_COLORS = ["bg-amber-400 text-white", "bg-slate-400 text-white", "bg-orange-400 text-white"];

const tzs = (n: number) =>
  `TZS ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (n: number) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

type TabKey =
  | "product-list"
  | "transfers"
  | "top-selling"
  | "alerts"
  | "valued"
  | "unvalued";

const CARD_TONES = {
  blue: { chip: "bg-blue-100/70 text-blue-500", value: "text-blue-600" },
  emerald: { chip: "bg-emerald-100/70 text-emerald-500", value: "text-emerald-600" },
  violet: { chip: "bg-violet-100/70 text-violet-500", value: "text-violet-600" },
  amber: { chip: "bg-amber-100/70 text-amber-500", value: "text-amber-600" },
  cyan: { chip: "bg-cyan-100/70 text-cyan-500", value: "text-cyan-600" },
  rose: { chip: "bg-rose-100/70 text-rose-500", value: "text-rose-600" },
  indigo: { chip: "bg-indigo-100/70 text-indigo-500", value: "text-indigo-600" },
  slate: { chip: "bg-slate-100 text-slate-500", value: "text-slate-700" },
} as const;

function StatCard({
  title,
  value,
  topLabel,
  icon: Icon,
  tone,
  size = "lg",
}: {
  title: string;
  value: string;
  topLabel: string;
  icon: React.ElementType;
  tone: keyof typeof CARD_TONES;
  size?: "lg" | "md";
}) {
  const t = CARD_TONES[tone] ?? CARD_TONES.blue;
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.chip}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[11px] font-medium text-slate-400">{topLabel}</span>
      </div>
      <p
        className={`mt-2 font-bold leading-tight tracking-tight tabular-nums break-words ${t.value} ${
          size === "md" ? "text-[15px] sm:text-base" : "text-xl"
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[12px] font-medium text-slate-500 sm:text-[13px]">{title}</p>
    </div>
  );
}

export default function InventoryReport({
  prd,
  overview,
  productList,
  transfers,
  outStock,
  categories,
  topProducts = [],
  stores,
  filters,
}: InventoryReportProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [productSearch, setProductSearch] = React.useState("");
  const [tab, setTab] = React.useState<TabKey>("product-list");

  const [storeId, setStoreId] = React.useState<string>(filters.store_id ? String(filters.store_id) : "all");
  const [startDate, setStartDate] = React.useState<string>(filters.start_date ?? "");
  const [endDate, setEndDate] = React.useState<string>(filters.end_date ?? "");

  const applyFilters = (overrides?: { store_id?: string; start_date?: string; end_date?: string }) => {
    const s = overrides?.store_id ?? storeId;
    const sd = overrides?.start_date ?? startDate;
    const ed = overrides?.end_date ?? endDate;
    const query: Record<string, string> = {};
    if (s && s !== "all") query.store_id = s;
    if (sd && ed) {
      query.start_date = sd;
      query.end_date = ed;
    }
    router.get("/report_inventory", query, { preserveState: true, preserveScroll: true, replace: true });
  };

  // Auto-filter — no Apply button. Store changes reload immediately; a date
  // pair reloads once both ends are set (or when either is cleared).
  const onStoreChange = (v: string) => {
    setStoreId(v);
    applyFilters({ store_id: v });
  };
  const onStartChange = (v: string) => {
    setStartDate(v);
    if ((v && endDate) || !v) applyFilters({ start_date: v });
  };
  const onEndChange = (v: string) => {
    setEndDate(v);
    if ((startDate && v) || !v) applyFilters({ end_date: v });
  };
  const resetFilters = () => {
    setStoreId("all");
    setStartDate("");
    setEndDate("");
    router.get("/report_inventory", {}, { preserveScroll: true, replace: true });
  };

  const printQuery = React.useMemo(() => {
    const q = new URLSearchParams();
    q.set("type", tab === "unvalued" ? "unvalued" : tab === "alerts" ? "alerts" : tab === "top-selling" ? "top-selling" : "valued");
    if (storeId && storeId !== "all") q.set("store_id", storeId);
    if (startDate && endDate) {
      q.set("start_date", startDate);
      q.set("end_date", endDate);
    }
    return q.toString();
  }, [tab, storeId, startDate, endDate]);

  const filteredPrd = React.useMemo(() => {
    if (!prd) return [];
    return prd.filter((item) => item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [prd, searchTerm]);

  const filteredProductList = React.useMemo(() => {
    const q = productSearch.toLowerCase();
    return productList.filter(
      (p) =>
        p.product_name?.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        (p.category_name ?? "").toLowerCase().includes(q),
    );
  }, [productList, productSearch]);

  const maxRevenue = topProducts[0]?.revenue || 1;
  const periodLabel =
    filters.start_date && filters.end_date
      ? `${filters.start_date} → ${filters.end_date}`
      : "All dates (current stock position)";

  const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "product-list", label: "Product List", icon: ClipboardList },
    { key: "transfers", label: "Stock Transfers", icon: ArrowLeftRight },
    { key: "top-selling", label: "Top Sellers", icon: Trophy },
    { key: "alerts", label: "Stock Alerts", icon: AlertTriangle },
    { key: "valued", label: "In Stock (Valued)", icon: Coins },
    { key: "unvalued", label: "Out of Stock", icon: PackageX },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Inventory Report" />
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Inventory Report</h1>
            <p className="mt-0.5 hidden text-sm text-slate-500 sm:block">
              Stock overview, store-level inventory, product list &amp; stock transfers in one place
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={`/report_inventory/print?${printQuery}&print=true`}
              target="_blank"
              rel="noopener noreferrer"
              title="Print"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-2.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground sm:px-4"
            >
              <Printer className="h-4 w-4" /> <span className="hidden sm:inline">Print</span>
            </a>
            <a
              href={`/report_inventory/print?${printQuery}&download=true`}
              title="Download PDF"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-2.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground sm:px-4"
            >
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">Download PDF</span>
            </a>
            <Link href="/products-new">
              <Button size="sm" title="New Product">
                <Plus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">New Product</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard filter bar */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-end sm:gap-4">
            <div className="min-w-0">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[11px]">
                <span className="hidden sm:inline">You are viewing </span>store
              </label>
              <select
                value={storeId}
                onChange={(e) => onStoreChange(e.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:w-[220px] sm:px-3 sm:text-sm"
              >
                <option value="all">All Stores</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.store_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[11px]">
                <span className="sm:hidden">From</span>
                <span className="hidden sm:inline">Start date</span>
              </label>
              <Input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => onStartChange(e.target.value)}
                className="h-10 w-full px-2 text-xs sm:w-[170px] sm:text-sm"
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[11px]">
                <span className="sm:hidden">To</span>
                <span className="hidden sm:inline">End date</span>
              </label>
              <Input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => onEndChange(e.target.value)}
                className="h-10 w-full px-2 text-xs sm:w-[170px] sm:text-sm"
              />
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 sm:text-xs">
            <CalendarRange className="h-3.5 w-3.5 shrink-0" />
            <span>
              Period: <span className="font-semibold text-slate-700">{periodLabel}</span>
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Store: <span className="font-semibold text-slate-700">{filters.store_name}</span>
            </span>
            {(filters.start_date || filters.store_id) && (
              <button
                onClick={resetFilters}
                className="ml-auto font-semibold text-emerald-600 hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Stock overview cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Stock Cost"
            topLabel="Buying"
            value={tzs(overview.stock_cost)}
            icon={Wallet}
            tone="blue"
            size="md"
          />
          <StatCard
            title="Expected Sale Value"
            topLabel="Selling"
            value={tzs(overview.expected_sale_value)}
            icon={TrendingUp}
            tone="emerald"
            size="md"
          />
          <StatCard
            title="Expected Sell Profit"
            topLabel="Projected"
            value={tzs(overview.expected_sell_profit)}
            icon={Coins}
            tone="violet"
            size="md"
          />
          <StatCard
            title="Total Stock"
            topLabel="Units"
            value={num(overview.total_stock)}
            icon={Boxes}
            tone="amber"
          />
        </div>

        {/* Important inventory information */}
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Important Inventory Information</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard title="Total Products" topLabel="Catalog" value={num(overview.total_products)} icon={Layers} tone="slate" />
            <StatCard title="Low Stock Items" topLabel="Alert" value={num(overview.low_stock)} icon={AlertTriangle} tone="amber" />
            <StatCard title="Out of Stock" topLabel="Empty" value={num(overview.out_of_stock)} icon={PackageX} tone="rose" />
            <StatCard title="Stock Transfers" topLabel="Period" value={num(overview.stock_transfers)} icon={ArrowLeftRight} tone="blue" />
            <StatCard title="Products Sold" topLabel="Period" value={num(overview.products_sold)} icon={ShoppingCart} tone="emerald" />
            <StatCard title="Stock Adjustments" topLabel="Period" value={num(overview.stock_adjustments)} icon={SlidersHorizontal} tone="indigo" />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            Transfers, products sold &amp; adjustments reflect the selected reporting period. All figures are calculated
            from live data.
          </p>
        </div>

        {/* Tabs */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex w-full gap-1 self-start overflow-x-auto rounded-lg bg-slate-100 p-1 sm:w-auto">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition-all ${
                      tab === t.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === "product-list" && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search products, SKU, category..."
                    className="h-10 w-full pl-9 sm:w-[320px]"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
              )}
              {(tab === "valued" || tab === "unvalued") && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search products..."
                    className="h-10 w-full pl-9 sm:w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto p-0">
            {/* PRODUCT LIST */}
            {tab === "product-list" && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">Product</TableHead>
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">SKU</TableHead>
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">Category</TableHead>
                    <TableHead className="py-3 text-center text-[10px] font-bold uppercase text-slate-500">Stock</TableHead>
                    <TableHead className="py-3 text-center text-[10px] font-bold uppercase text-slate-500">Unit</TableHead>
                    <TableHead className="py-3 text-right text-[10px] font-bold uppercase text-slate-500">Buying</TableHead>
                    <TableHead className="py-3 text-right text-[10px] font-bold uppercase text-slate-500">Selling</TableHead>
                    <TableHead className="py-3 text-right text-[10px] font-bold uppercase text-slate-500">Stock Value</TableHead>
                    <TableHead className="py-3 text-center text-[10px] font-bold uppercase text-slate-500">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProductList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-12 text-center text-sm italic text-slate-400">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProductList.map((p) => (
                      <TableRow key={p.id} className="hover:bg-slate-50">
                        <TableCell className="py-3 font-semibold text-slate-900">{p.product_name}</TableCell>
                        <TableCell className="py-3 text-xs text-slate-500">{p.sku || "-"}</TableCell>
                        <TableCell className="py-3 text-xs text-slate-500">{p.category_name || "-"}</TableCell>
                        <TableCell className="py-3 text-center text-sm font-semibold">{num(p.qty)}</TableCell>
                        <TableCell className="py-3 text-center text-xs text-slate-500">{p.unit_name || "-"}</TableCell>
                        <TableCell className="py-3 text-right text-xs text-slate-600">{num(p.buying_price)}</TableCell>
                        <TableCell className="py-3 text-right text-xs text-slate-600">{num(p.selling_price)}</TableCell>
                        <TableCell className="py-3 text-right text-sm font-bold text-slate-900">{num(p.stock_value)}</TableCell>
                        <TableCell className="py-3 text-center">
                          {p.status === "out" ? (
                            <Badge variant="destructive" className="h-5 px-2 text-[9px] font-bold uppercase">Out</Badge>
                          ) : p.status === "low" ? (
                            <Badge className="h-5 border-amber-200 bg-amber-50 px-2 text-[9px] font-bold uppercase text-amber-700">Low</Badge>
                          ) : (
                            <Badge className="h-5 border-emerald-200 bg-emerald-50 px-2 text-[9px] font-bold uppercase text-emerald-700">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {/* STOCK TRANSFERS */}
            {tab === "transfers" && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">Reference</TableHead>
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">Source Store</TableHead>
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">Destination Store</TableHead>
                    <TableHead className="py-3 text-center text-[10px] font-bold uppercase text-slate-500">Items</TableHead>
                    <TableHead className="py-3 text-center text-[10px] font-bold uppercase text-slate-500">Qty</TableHead>
                    <TableHead className="py-3 text-right text-[10px] font-bold uppercase text-slate-500">Buying Value</TableHead>
                    <TableHead className="py-3 text-right text-[10px] font-bold uppercase text-slate-500">Selling Value</TableHead>
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">By</TableHead>
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">Date</TableHead>
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="py-12 text-center text-sm italic text-slate-400">
                        No stock transfers in this period
                      </TableCell>
                    </TableRow>
                  ) : (
                    transfers.map((t) => (
                      <TableRow key={t.unique_id} className="hover:bg-slate-50">
                        <TableCell className="py-3 text-xs font-semibold text-slate-900">{t.unique_id}</TableCell>
                        <TableCell className="py-3 text-xs capitalize text-slate-600">{t.source_store}</TableCell>
                        <TableCell className="py-3 text-xs font-medium capitalize text-slate-800">{t.destination_store}</TableCell>
                        <TableCell className="py-3 text-center text-xs">{t.product_count}</TableCell>
                        <TableCell className="py-3 text-center text-xs font-semibold">{num(t.total_quantity)}</TableCell>
                        <TableCell className="py-3 text-right text-xs font-semibold text-blue-700">{num(t.total_buying_value)}</TableCell>
                        <TableCell className="py-3 text-right text-xs font-semibold text-emerald-700">{num(t.total_selling_value)}</TableCell>
                        <TableCell className="py-3 text-xs capitalize text-slate-500">{t.staff_name || "—"}</TableCell>
                        <TableCell className="py-3 text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="py-3 text-right">
                          <a
                            href={`/transfers/${t.unique_id}`}
                            className="text-xs font-semibold text-emerald-600 hover:underline"
                          >
                            View
                          </a>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {/* TOP SELLERS */}
            {tab === "top-selling" && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">Rank</TableHead>
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">Product Name</TableHead>
                    <TableHead className="py-3 text-right text-[10px] font-bold uppercase text-slate-500">Units Sold</TableHead>
                    <TableHead className="py-3 text-right text-[10px] font-bold uppercase text-slate-500">Total Revenue</TableHead>
                    <TableHead className="py-3 text-right text-[10px] font-bold uppercase text-slate-500">Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-sm italic text-slate-400">
                        No sales data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    topProducts.map((p, i) => (
                      <TableRow key={i} className="hover:bg-slate-50">
                        <TableCell>
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${
                              RANK_COLORS[i] ?? "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {i + 1}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                              {p.image ? (
                                <img src={`/storage/${p.image}`} alt={p.name} className="h-full w-full object-cover" />
                              ) : (
                                <ShoppingCart className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                            {p.name}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-right">{p.qty.toLocaleString()}</TableCell>
                        <TableCell className="py-3 text-right font-bold text-slate-900">TZS {p.revenue.toLocaleString()}</TableCell>
                        <TableCell className="w-[200px] py-3 text-right">
                          <div className="ml-auto h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${Math.round((p.revenue / maxRevenue) * 100)}%` }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {/* STOCK ALERTS */}
            {tab === "alerts" && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">Product Name</TableHead>
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">SKU</TableHead>
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">Category</TableHead>
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">Store</TableHead>
                    <TableHead className="py-3 text-center text-[10px] font-bold uppercase text-slate-500">Qty</TableHead>
                    <TableHead className="py-3 text-center text-[10px] font-bold uppercase text-slate-500">Unit</TableHead>
                    <TableHead className="py-3 text-center text-[10px] font-bold uppercase text-slate-500">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!outStock?.length ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-sm font-semibold text-emerald-600">
                        All products are sufficiently stocked
                      </TableCell>
                    </TableRow>
                  ) : (
                    outStock.map((item, i) => (
                      <TableRow key={i} className="hover:bg-slate-50">
                        <TableCell className="py-3 font-semibold text-slate-900">{item.product_name}</TableCell>
                        <TableCell className="py-3 text-xs text-slate-500">{item.PRDID || "-"}</TableCell>
                        <TableCell className="py-3 text-xs text-slate-500">{item.category_name || "-"}</TableCell>
                        <TableCell className="py-3 text-xs text-slate-500">{item.store_name || "N/A"}</TableCell>
                        <TableCell className="py-3 text-center text-sm font-bold text-red-500">{item.pro_quantity ?? 0}</TableCell>
                        <TableCell className="py-3 text-center text-xs text-slate-500">{item.unit_name || "-"}</TableCell>
                        <TableCell className="py-3 text-center">
                          <Badge variant="destructive" className="h-5 px-2 text-[9px] font-bold uppercase">
                            {(item.pro_quantity ?? 0) === 0 ? "Out" : "Low"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {/* VALUED */}
            {tab === "valued" && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">Product Name</TableHead>
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">SKU</TableHead>
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">Category</TableHead>
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">Store</TableHead>
                    <TableHead className="py-3 text-center text-[10px] font-bold uppercase text-slate-500">Qty</TableHead>
                    <TableHead className="py-3 text-center text-[10px] font-bold uppercase text-slate-500">Unit</TableHead>
                    <TableHead className="py-3 text-right text-[10px] font-bold uppercase text-slate-500">Price</TableHead>
                    <TableHead className="py-3 text-right text-[10px] font-bold uppercase text-slate-500">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrd?.filter((item) => (item.pro_quantity || 0) > 0).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-sm italic text-slate-400">
                        No valued products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPrd
                      ?.filter((item) => (item.pro_quantity || 0) > 0)
                      .map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50">
                          <TableCell className="py-3 font-semibold text-slate-900">{item.product_name}</TableCell>
                          <TableCell className="py-3 text-xs text-slate-500">{item.PRDID || "-"}</TableCell>
                          <TableCell className="py-3 text-xs text-slate-500">{item.category_name || "-"}</TableCell>
                          <TableCell className="py-3 text-xs text-slate-500">{item.store_name || "N/A"}</TableCell>
                          <TableCell className="py-3 text-center text-sm font-semibold">
                            {(item.pro_quantity || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="py-3 text-center text-xs text-slate-500">{item.unit_name || "-"}</TableCell>
                          <TableCell className="py-3 text-right text-sm text-slate-600">
                            {(item.product_price || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="py-3 text-right text-sm font-bold text-slate-900">
                            {((item.pro_quantity || 0) * (item.product_price || 0)).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            )}

            {/* UNVALUED / OUT OF STOCK */}
            {tab === "unvalued" && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">Product Name</TableHead>
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">SKU</TableHead>
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">Category</TableHead>
                    <TableHead className="py-3 text-[10px] font-bold uppercase text-slate-500">Store</TableHead>
                    <TableHead className="py-3 text-center text-[10px] font-bold uppercase text-slate-500">Qty</TableHead>
                    <TableHead className="py-3 text-center text-[10px] font-bold uppercase text-slate-500">Unit</TableHead>
                    <TableHead className="py-3 text-center text-[10px] font-bold uppercase text-slate-500">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrd?.filter((item) => (item.pro_quantity || 0) <= 0).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-sm italic text-slate-400">
                        No out-of-stock products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPrd
                      ?.filter((item) => (item.pro_quantity || 0) <= 0)
                      .map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50">
                          <TableCell className="py-3 font-semibold text-slate-900">{item.product_name}</TableCell>
                          <TableCell className="py-3 text-xs text-slate-500">{item.PRDID || "-"}</TableCell>
                          <TableCell className="py-3 text-xs text-slate-500">{item.category_name || "-"}</TableCell>
                          <TableCell className="py-3 text-xs text-slate-500">{item.store_name || "N/A"}</TableCell>
                          <TableCell className="py-3 text-center text-sm font-bold text-red-500">0</TableCell>
                          <TableCell className="py-3 text-center text-xs text-slate-500">{item.unit_name || "-"}</TableCell>
                          <TableCell className="py-3 text-center">
                            <Badge variant="destructive" className="h-5 px-2 text-[9px] font-bold uppercase">
                              Out
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          {categories?.length ?? 0} product categories tracked
        </p>
      </div>
    </AppLayout>
  );
}
