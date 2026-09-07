import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, Package, Ruler, DollarSign, Layers, Save, Info } from "lucide-react";
import AppLayout from "@/layouts/app-layout";

interface Product {
  id: number;
  product_id: string;
  product_name: string;
  cbm: number;
  weight: number;
  price?: number;
  pc_per_ctn?: number;
}

export default function ProductEdit({ post }: { post: Product }) {
  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Logistics", href: "/logistics" },
    { title: "Port Products", href: "/register-products" },
    { title: "Edit", href: "#" },
  ];

  const { data, setData, put, processing, errors } = useForm({
    product_id:   post.product_id,
    product_name: post.product_name,
    cbm:          post.cbm.toString(),
    weight:       post.weight.toString(),
    price:        (post.price ?? "").toString(),
    pc_per_ctn:   (post.pc_per_ctn ?? "").toString(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/register-products/${post.id}`);
  };

  const Field = ({
    label, required, error, children,
  }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><Info className="w-3 h-3" />{error}</p>}
    </div>
  );

  const inputCls = (err?: string, disabled?: boolean) =>
    `w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white ${
      disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200" :
      err       ? "border-red-400 bg-red-50/30 bg-slate-50/50" :
                  "bg-slate-50/50 border-slate-200"
    }`;

  return (
    <>
      <Head title={`Edit — ${post.product_name}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">

          {/* ── Header ── */}
          <div className="flex items-center gap-4">
            <Link href="/register-products" className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
              <ArrowLeft className="w-4 h-4 text-slate-500" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Edit Port Product</h1>
              <p className="text-sm text-slate-500">{post.product_name}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left: forms ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Product Identification */}
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-3.5 h-3.5" />Product Identification
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <Field label="Product ID">
                    <div className="relative">
                      <input
                        value={data.product_id}
                        disabled
                        className={inputCls(undefined, true)}
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">READ ONLY</span>
                    </div>
                  </Field>
                  <Field label="Product Name" required error={errors.product_name}>
                    <input
                      placeholder="e.g. Steel Rods 10mm"
                      value={data.product_name}
                      onChange={(e) => setData("product_name", e.target.value)}
                      className={inputCls(errors.product_name)}
                    />
                  </Field>
                </div>
              </div>

              {/* Physical Specifications */}
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5" />Physical Specifications
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="CBM per Unit" required error={errors.cbm}>
                    <div className="relative">
                      <input
                        type="number" step="0.001" placeholder="0.000"
                        value={data.cbm}
                        onChange={(e) => setData("cbm", e.target.value)}
                        className={inputCls(errors.cbm) + " pr-14"}
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">CBM</span>
                    </div>
                  </Field>
                  <Field label="Weight per Unit" required error={errors.weight}>
                    <div className="relative">
                      <input
                        type="number" step="0.01" placeholder="0.00"
                        value={data.weight}
                        onChange={(e) => setData("weight", e.target.value)}
                        className={inputCls(errors.weight) + " pr-10"}
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">kg</span>
                    </div>
                  </Field>
                </div>
              </div>

              {/* Pricing & Packaging */}
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5" />Pricing & Packaging
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Price per Unit (TZS)" error={errors.price}>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">TZS</span>
                      <input
                        type="number" step="0.01" placeholder="0.00"
                        value={data.price}
                        onChange={(e) => setData("price", e.target.value)}
                        className={inputCls(errors.price) + " pl-12"}
                      />
                    </div>
                  </Field>
                  <Field label="Pieces per Carton" error={errors.pc_per_ctn}>
                    <div className="relative">
                      <input
                        type="number" placeholder="0"
                        value={data.pc_per_ctn}
                        onChange={(e) => setData("pc_per_ctn", e.target.value)}
                        className={inputCls(errors.pc_per_ctn) + " pr-14"}
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">pcs</span>
                    </div>
                  </Field>
                </div>
              </div>
            </div>

            {/* ── Right: Current Values + Actions ── */}
            <div className="space-y-6">
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden sticky top-4">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Values</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 space-y-2">
                    {[
                      { label: 'Product ID',   value: data.product_id },
                      { label: 'Product Name', value: data.product_name || '—' },
                      { label: 'Volume',       value: data.cbm    ? `${data.cbm} CBM` : '—' },
                      { label: 'Weight',       value: data.weight ? `${data.weight} kg` : '—' },
                      { label: 'Price',        value: data.price  ? `TZS ${Number(data.price).toLocaleString()}` : '—' },
                      { label: 'Qty/Ctn',     value: data.pc_per_ctn || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[140px]">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={processing}
                      className="w-full px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                      ) : (
                        <><Save className="w-4 h-4" />Save Changes</>
                      )}
                    </button>
                    <Link href="/register-products">
                      <button type="button" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors">
                        Cancel
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
                <div className="flex items-start gap-3">
                  <Layers className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 mb-1">Editing Notes</p>
                    <ul className="text-xs text-amber-700 space-y-1">
                      <li>• Product ID cannot be changed after registration</li>
                      <li>• Weight changes may affect container load calculations</li>
                      <li>• Price updates take effect on new manifests only</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </AppLayout>
    </>
  );
}
