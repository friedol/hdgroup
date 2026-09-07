import { Head, router } from "@inertiajs/react";
import axios from "axios";
import {
  AlertTriangle, Plus, Search, Trash2, Package,
  TrendingDown, Calendar, X, ChevronDown, Loader2
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import AppLayout from "@/layouts/app-layout";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DamageRecord {
  id: number;
  product_name: string;
  variant_color: string | null;
  store: string;
  adjustment_type: string;
  damage_category: string;
  quantity: number;
  financial_loss_value: number;
  reason: string;
  notes: string;
  reported_by: string;
  status: string;
  date: string;
  time: string;
}

interface PageProps {
  records: any;
  kpis: { total_loss: number; today_loss: number; total_records: number; total_qty: number };
  products: Array<{ id: number; product_name: string; product_price: number; product_type: string; variants: any[] }>;
  stores: Array<{ id: number; store_name: string }>;
  damage_categories: string[];
  filters: Record<string, string>;
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  Damage: { label: "Damage", color: "bg-rose-50 text-rose-700" },
  Loss: { label: "Loss", color: "bg-amber-50 text-amber-700" },
  Expiry: { label: "Expired", color: "bg-orange-50 text-orange-700" },
};

const fmt = (n: number) => "TZS " + n.toLocaleString("en-US", { minimumFractionDigits: 0 });

export default function DamagedProductsIndex({
  records, kpis, products, stores, damage_categories, filters = {},
}: PageProps) {
  const [search, setSearch] = useState(filters.search ?? "");
  const [typeFilter, setTypeFilter] = useState(filters.type ?? "");
  const [startDate, setStartDate] = useState(filters.start_date ?? "");
  const [endDate, setEndDate] = useState(filters.end_date ?? "");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [form, setForm] = useState({
    product_id: "",
    variant_id: "",
    store_id: "",
    adjustment_type: "Damage",
    damage_category: "",
    quantity: "",
    financial_loss_value: "",
    reason: "",
    notes: "",
  });

  const selectedProduct = products.find(p => p.id === Number(form.product_id));
  const productPrice = selectedProduct?.product_price ?? 0;
  const autoLoss = form.quantity ? (parseFloat(form.quantity) * productPrice).toFixed(0) : "";

  const handleFilter = () => {
    router.get("/damaged-products", { search, type: typeFilter, start_date: startDate, end_date: endDate }, { preserveState: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id || !form.store_id || !form.quantity) {
      toast.error("Product, store, and quantity are required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        product_id: form.product_id,
        store_id: form.store_id,
        adjustment_type: form.adjustment_type,
        damage_category: form.damage_category || null,
        quantity: form.quantity,
        financial_loss_value: form.financial_loss_value || autoLoss || null,
        reason: form.reason || null,
        notes: form.notes || null,
      };
      if (form.variant_id) payload.variant_id = form.variant_id;

      await axios.post("/damaged-products", payload, {
        headers: { "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? "" },
      });
      toast.success("Damage record saved and inventory updated.");
      setModalOpen(false);
      setForm({ product_id: "", variant_id: "", store_id: "", adjustment_type: "Damage", damage_category: "", quantity: "", financial_loss_value: "", reason: "", notes: "" });
      router.reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to save record.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this damage record?")) return;
    setDeleting(id);
    try {
      await axios.delete(`/damaged-products/${id}`, {
        headers: { "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? "" },
      });
      toast.success("Record deleted.");
      router.reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Cannot delete approved record.");
    } finally {
      setDeleting(null);
    }
  };

  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Damaged Products", href: "/damaged-products" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Damaged Products" />
      <div className="space-y-6 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-[18px] font-bold text-slate-900 tracking-tight">Damaged Products</h1>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black rounded-xl shadow-sm shadow-rose-500/20 transition-colors"
          >
            <Plus className="h-4 w-4" /> Record Damage
          </button>
        </div>

        {/* KPI cards — delivery dashboard style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {([
            { label: "Total Financial Loss", value: fmt(kpis.total_loss),              sub: "All time",     icon: TrendingDown,  dotColor: "bg-rose-500",   bg: "bg-rose-50/50",   border: "border-rose-200",   iconBg: "bg-rose-100 text-rose-600" },
            { label: "Today's Loss",         value: fmt(kpis.today_loss),              sub: "Current day",  icon: Calendar,      dotColor: "bg-amber-500",  bg: "bg-amber-50/50",  border: "border-amber-200",  iconBg: "bg-amber-100 text-amber-600" },
            { label: "Total Records",        value: kpis.total_records.toLocaleString(), sub: "All entries", icon: Package,       dotColor: "bg-slate-400",  bg: "bg-slate-50/50",  border: "border-slate-200",  iconBg: "bg-slate-100 text-slate-600" },
            { label: "Total Qty Damaged",    value: kpis.total_qty.toLocaleString(),   sub: "Units / pcs",  icon: AlertTriangle, dotColor: "bg-orange-500", bg: "bg-orange-50/50", border: "border-orange-200", iconBg: "bg-orange-100 text-orange-600" },
          ] as const).map(card => (
            <div key={card.label}
              className={`rounded-xl border ${card.border} p-4 sm:p-5 ${card.bg} flex flex-col justify-between h-full group transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-1.5 sm:p-2 rounded-lg shadow-sm ${card.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                  <card.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 tracking-widest uppercase">{card.label}</span>
              </div>
              <div>
                <p className="text-[13px] sm:text-[14px] font-bold text-slate-900 tracking-tight leading-none">{card.value}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${card.dotColor} animate-pulse`} />
                  <span className="text-[9px] sm:text-[11px] font-bold text-slate-500">{card.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="col-span-2 md:col-span-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-rose-400 transition-all" />
            </div>
            <div className="relative">
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-rose-400 appearance-none">
                <option value="">All types</option>
                <option value="Damage">Damage</option>
                <option value="Loss">Loss</option>
                <option value="Expiry">Expiry</option>
              </select>
            </div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="py-2 px-3 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-rose-400" />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="py-2 px-3 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-rose-400" />
            <button onClick={handleFilter}
              className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black rounded-xl transition-colors">
              Filter
            </button>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Product", "Store", "Type", "Category", "Qty", "Financial Loss", "Reason", "Reported By", "Date", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.data.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-16">
                      <AlertTriangle className="h-8 w-8 mx-auto text-slate-200 mb-2" />
                      <p className="text-sm font-bold text-slate-400">No damage records found</p>
                    </td>
                  </tr>
                ) : records.data.map((row: DamageRecord) => (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-black text-slate-800 text-sm">{row.product_name}</p>
                      {row.variant_color && <p className="text-[10px] text-slate-400 font-bold">{row.variant_color}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">{row.store}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] font-black border-none ${TYPE_CONFIG[row.adjustment_type]?.color ?? 'bg-slate-50 text-slate-700'}`}>
                        {TYPE_CONFIG[row.adjustment_type]?.label ?? row.adjustment_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">{row.damage_category}</td>
                    <td className="px-4 py-3 font-black text-slate-900 text-center">{row.quantity}</td>
                    <td className="px-4 py-3 font-black text-rose-600 whitespace-nowrap">{fmt(row.financial_loss_value)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] truncate">{row.reason}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">{row.reported_by}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap">{row.date}<br />{row.time}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(row.id)}
                        disabled={deleting === row.id || row.status === 'Approved'}
                        className="h-7 w-7 rounded-lg hover:bg-rose-50 flex items-center justify-center transition-colors disabled:opacity-30"
                        title={row.status === 'Approved' ? 'Cannot delete approved record' : 'Delete record'}
                      >
                        {deleting === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" /> : <Trash2 className="h-3.5 w-3.5 text-rose-500" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {records.last_page > 1 && (
          <div className="flex justify-center gap-2">
            {records.links.map((link: any) => (
              <button
                key={link.label}
                disabled={!link.url}
                onClick={() => link.url && router.get(link.url)}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${link.active ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40'}`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        )}

        {/* Record Damage Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-black flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" /> Record Damaged Product
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">

              {/* Product */}
              <div>
                <label className="text-[11px] font-black text-slate-500 mb-1.5 block">Product *</label>
                <div className="relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <select value={form.product_id} onChange={e => setForm(p => ({ ...p, product_id: e.target.value, variant_id: "" }))} required
                    className="w-full pl-3 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:border-rose-400 appearance-none">
                    <option value="">— Select product —</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.product_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Variant (if applicable) */}
              {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
                <div>
                  <label className="text-[11px] font-black text-slate-500 mb-1.5 block">Color Variant</label>
                  <div className="relative">
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <select value={form.variant_id} onChange={e => setForm(p => ({ ...p, variant_id: e.target.value }))}
                      className="w-full pl-3 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:border-rose-400 appearance-none">
                      <option value="">— No specific variant —</option>
                      {selectedProduct.variants.map((v: any) => (
                        <option key={v.id} value={v.id}>{v.color} ({v.qty} in stock)</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Store */}
              <div>
                <label className="text-[11px] font-black text-slate-500 mb-1.5 block">Store / Location *</label>
                <div className="relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <select value={form.store_id} onChange={e => setForm(p => ({ ...p, store_id: e.target.value }))} required
                    className="w-full pl-3 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:border-rose-400 appearance-none">
                    <option value="">— Select store —</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.store_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Type + Category (2 cols) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-slate-500 mb-1.5 block">Type *</label>
                  <div className="relative">
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <select value={form.adjustment_type} onChange={e => setForm(p => ({ ...p, adjustment_type: e.target.value }))}
                      className="w-full pl-3 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:border-rose-400 appearance-none">
                      <option value="Damage">Damage</option>
                      <option value="Loss">Loss / Theft</option>
                      <option value="Expiry">Expired</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-500 mb-1.5 block">Category</label>
                  <div className="relative">
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <select value={form.damage_category} onChange={e => setForm(p => ({ ...p, damage_category: e.target.value }))}
                      className="w-full pl-3 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:border-rose-400 appearance-none">
                      <option value="">— Select category —</option>
                      {damage_categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Qty + Loss value (2 cols) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-slate-500 mb-1.5 block">Quantity *</label>
                  <input type="number" min="0.01" step="0.01" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} required
                    placeholder="e.g., 10"
                    className="w-full py-2.5 px-3 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:border-rose-400" />
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-500 mb-1.5 block">
                    Financial Loss (TZS)
                    {autoLoss && !form.financial_loss_value && (
                      <span className="text-slate-400 font-normal ml-1">(auto: {Number(autoLoss).toLocaleString()})</span>
                    )}
                  </label>
                  <input type="number" min="0" step="1" value={form.financial_loss_value} onChange={e => setForm(p => ({ ...p, financial_loss_value: e.target.value }))}
                    placeholder={autoLoss || "auto-calculated"}
                    className="w-full py-2.5 px-3 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:border-rose-400" />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-[11px] font-black text-slate-500 mb-1.5 block">Reason / Description</label>
                <input value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                  placeholder="Brief reason for damage..."
                  className="w-full py-2.5 px-3 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:border-rose-400" />
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-black text-slate-500 mb-1.5 block">Additional Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                  placeholder="Optional additional notes..."
                  className="w-full py-2.5 px-3 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:border-rose-400 resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-black shadow-sm shadow-rose-500/20 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</> : <><AlertTriangle className="h-3.5 w-3.5" /> Record Damage</>}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}
