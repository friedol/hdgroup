import { Head, Link, useForm } from "@inertiajs/react";
import { Plus, Trash2, ArrowLeft, FileText } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AppLayout from "@/layouts/app-layout";

interface Product {
  product_id: string;
  product_name: string;
  cbm: number;
  weight: number;
}

export default function ManifestCreate({ containers = [], products = [] }: { containers: any[]; products: Product[] }) {
  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Logistics", href: "/logistics" },
    { title: "Manifests", href: "/parking_orders" },
    { title: "Create", href: "#" }
  ];

  const { data, setData, post, processing, errors } = useForm({
    order_name: "",
    container_id: "",
    product_id: [],
    quantity: []
  });

  const [items, setItems] = useState<Array<{ product_id: string; quantity: number }>>([]);

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: "product_id" | "quantity", value: any) => {
    const newItems = [...items];
    if (field === "quantity") {
      newItems[index].quantity = parseInt(value) || 0;
    } else {
      newItems[index].product_id = value;
    }
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product_ids = items.map((i) => i.product_id);
    const quantities = items.map((i) => i.quantity);
    post("/parking_orders", {
      data: {
        order_name: data.order_name,
        container_id: data.container_id,
        product_id: product_ids,
        quantity: quantities
      }
    });
  };

  const getTotalWeight = () => {
    return items.reduce((sum, item) => {
      const product = products.find((p) => p.product_id === item.product_id);
      return sum + (product ? product.weight * item.quantity : 0);
    }, 0);
  };

  const getTotalCBM = () => {
    return items.reduce((sum, item) => {
      const product = products.find((p) => p.product_id === item.product_id);
      return sum + (product ? product.cbm * item.quantity : 0);
    }, 0);
  };

  const labelClass = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block";
  const inputClass = "w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50/50 focus:bg-white transition-all h-10 shadow-none";
  const selectClass = "w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50/50 focus:bg-white transition-all h-10 shadow-none cursor-pointer";

  return (
    <>
      <Head title="Create Manifest" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
          
          {/* Header */}
          <div className="flex items-center gap-3">
            <Link href="/parking_orders" className="h-9 w-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 shadow-sm transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Create Manifest</h1>
              <p className="text-xs font-medium text-slate-500 mt-1.5">Create a new shipment manifest</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Manifest Header */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-bold text-slate-800">Manifest Information</CardTitle>
                <CardDescription className="text-xs text-slate-400">Basic details for the manifest</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Manifest Name *</label>
                    <Input
                      placeholder="e.g., Nairobi Shipment 001"
                      value={data.order_name}
                      onChange={(e) => setData("order_name", e.target.value)}
                      className={`${inputClass} ${errors.order_name ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""}`}
                    />
                    {errors.order_name && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.order_name}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Container *</label>
                    <select
                      className={`${selectClass} ${errors.container_id ? "border-red-500 focus:border-red-550 focus:ring-red-100" : ""}`}
                      value={data.container_id}
                      onChange={(e) => setData("container_id", e.target.value)}
                    >
                      <option value="">Select a container</option>
                      {containers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.container_id} - {c.name} ({c.capacity} CBM)
                        </option>
                      ))}
                    </select>
                    {errors.container_id && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.container_id}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800">Cargo Items</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Add products to the manifest</CardDescription>
                </div>
                <button 
                  type="button" 
                  onClick={addItem}
                  className="rounded-xl gap-2 text-xs font-semibold h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center transition-all"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </button>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                {items.length > 0 ? (
                  items.map((item, index) => {
                    const selectedProduct = products.find((p) => p.product_id === item.product_id);
                    return (
                      <div key={index} className="border border-slate-150 rounded-xl p-4 space-y-4 bg-slate-50/20">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className={labelClass}>Product *</label>
                            <select
                              className={selectClass}
                              value={item.product_id}
                              onChange={(e) => updateItem(index, "product_id", e.target.value)}
                            >
                              <option value="">Select product</option>
                              {products.map((p) => (
                                <option key={p.product_id} value={p.product_id}>
                                  {p.product_name} ({p.cbm} CBM)
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Quantity *</label>
                            <Input
                              type="number"
                              min="1"
                              placeholder="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", e.target.value)}
                              className={inputClass}
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              className="h-10 px-4 rounded-xl text-xs font-semibold border border-rose-250 text-rose-650 hover:bg-rose-50 hover:text-rose-700 transition-all flex items-center justify-center gap-1.5 w-full bg-white border-rose-100"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4" /> Remove
                            </button>
                          </div>
                        </div>
                        {selectedProduct && (
                          <div className="text-[11px] font-semibold text-slate-500 space-y-1 bg-slate-100/50 p-2.5 rounded-lg border border-slate-100 max-w-fit">
                            <p>⚖️ Weight: {(selectedProduct.weight * item.quantity / 1000).toFixed(2)} MT</p>
                            <p>📦 Volume: {(selectedProduct.cbm * item.quantity).toFixed(2)} CBM</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-400">No items added yet. Click "Add Item" to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            {items.length > 0 && (
              <Card className="rounded-2xl border border-slate-200 shadow-sm bg-slate-50 overflow-hidden">
                <CardHeader className="border-b border-slate-150 pb-4">
                  <CardTitle className="text-sm font-bold text-slate-800">Manifest Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="grid grid-cols-3 gap-4 text-xs font-semibold">
                    <div>
                      <p className="text-slate-450 uppercase tracking-wider mb-1">Total Items</p>
                      <p className="text-xl font-bold text-slate-900 tabular-nums">{items.length}</p>
                    </div>
                    <div>
                      <p className="text-slate-450 uppercase tracking-wider mb-1">Total Weight</p>
                      <p className="text-xl font-bold text-slate-900 tabular-nums">{(getTotalWeight() / 1000).toFixed(1)} MT</p>
                    </div>
                    <div>
                      <p className="text-slate-450 uppercase tracking-wider mb-1">Total Volume</p>
                      <p className="text-xl font-bold text-slate-900 tabular-nums">{getTotalCBM().toFixed(2)} CBM</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Link href="/parking_orders">
                <button type="button" className="h-9 px-4 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-650 transition-all">
                  Cancel
                </button>
              </Link>
              <button 
                type="submit" 
                disabled={processing || items.length === 0}
                className="rounded-xl h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Creating..." : "Create Manifest"}
              </button>
            </div>
          </form>
        </div>
      </AppLayout>
    </>
  );
}
