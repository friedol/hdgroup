import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, CheckCircle, Factory, Package, PenLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/layouts/app-layout";
import { useState } from "react";

interface Product {
  id: number;
  product_name: string;
  product_price: number;
  unit_price: number;
}

interface RawMaterial {
  id: number;
  name: string;
  category: string;
  base_unit: string;
  cost_per_unit: number;
}

interface Supplier {
  id: number;
  staff_name: string;
}

interface RecordInProps {
  products: Product[];
  rawMaterials: RawMaterial[];
  suppliers: Supplier[];
}

export default function RecordIn({ products, rawMaterials }: RecordInProps) {
  const [productMode, setProductMode] = useState<"catalog" | "custom">("catalog");
  const [itemType, setItemType] = useState<"product" | "raw_material">("product");

  const { data, setData, post, processing, errors } = useForm({
    item_type: "product" as "product" | "raw_material",
    product_id: "",
    raw_material_id: "",
    product_name: "",
    quantity: "",
    unit_price: "",
    unit: "pcs",
    handler_type: "Supplier",
    handler_name: "",
    source: "",
    reference_number: "",
    contact_info: "",
    notes: "",
  });

  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Gatekeeper", href: "/gatekeeper" },
    { title: "Record IN", href: "#" },
  ];

  const switchItemType = (type: "product" | "raw_material") => {
    setItemType(type);
    setData((prev) => ({
      ...prev,
      item_type: type,
      product_id: "",
      raw_material_id: "",
      product_name: "",
      unit_price: "",
      unit: "pcs",
    }));
  };

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      setData((prev) => ({ ...prev, product_id: "", product_name: "", unit_price: "" }));
      return;
    }
    const selected = products.find((p) => p.id === parseInt(id));
    if (selected) {
      setData((prev) => ({
        ...prev,
        product_id: id,
        product_name: selected.product_name,
        unit_price: (selected.unit_price || selected.product_price || 0).toString(),
      }));
    }
  };

  const handleRawMaterialSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      setData((prev) => ({ ...prev, raw_material_id: "", product_name: "", unit_price: "", unit: "pcs" }));
      return;
    }
    const selected = rawMaterials.find((m) => m.id === parseInt(id));
    if (selected) {
      setData((prev) => ({
        ...prev,
        raw_material_id: id,
        product_name: selected.name,
        unit_price: (selected.cost_per_unit || 0).toString(),
        unit: selected.base_unit || "pcs",
      }));
    }
  };

  const switchMode = (mode: "catalog" | "custom") => {
    setProductMode(mode);
    setData((prev) => ({ ...prev, product_id: "", raw_material_id: "", product_name: "", unit_price: "" }));
  };

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    post("/gatekeeper/record-in");
  };

  const rawMaterialCategories = Array.from(new Set(rawMaterials.map((m) => m.category || "Uncategorized")));

  return (
    <>
      <Head title="Record Product IN - Gatekeeper" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/gatekeeper">
              <ArrowLeft className="w-5 h-5 hover:text-blue-600" />
            </Link>
            <h1 className="text-[18px] font-bold text-green-600">
              <CheckCircle className="inline-block mr-2 w-6 h-6" />
              Incoming Product
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product / Item Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Product / Item Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* Item Type Toggle */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Item Type *</label>
                    <div className="flex rounded-md border overflow-hidden text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => switchItemType("product")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 transition-colors ${
                          itemType === "product"
                            ? "bg-green-600 text-white"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <Package className="w-4 h-4" />
                        Finished Product
                      </button>
                      <button
                        type="button"
                        onClick={() => switchItemType("raw_material")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 transition-colors ${
                          itemType === "raw_material"
                            ? "bg-green-600 text-white"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <Factory className="w-4 h-4" />
                        Raw Material
                      </button>
                    </div>
                  </div>

                  {/* Catalog / Custom toggle */}
                  <div className="flex rounded-md border overflow-hidden text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => switchMode("catalog")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 transition-colors ${
                        productMode === "catalog"
                          ? "bg-green-600 text-white"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Package className="w-4 h-4" />
                      Select from Catalog
                    </button>
                    <button
                      type="button"
                      onClick={() => switchMode("custom")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 transition-colors ${
                        productMode === "custom"
                          ? "bg-green-600 text-white"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <PenLine className="w-4 h-4" />
                      Type Custom Item
                    </button>
                  </div>

                  {/* Catalog — Finished Products */}
                  {productMode === "catalog" && itemType === "product" && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Product *</label>
                      <select
                        value={data.product_id}
                        onChange={handleProductSelect}
                        className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700"
                        required
                      >
                        <option value="">Choose a product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.product_name} — TZS {(p.unit_price || p.product_price || 0).toLocaleString()}
                          </option>
                        ))}
                      </select>
                      {errors.product_id && <p className="text-red-600 text-xs mt-1">{errors.product_id}</p>}
                      {data.product_name && (
                        <p className="text-xs text-slate-500 mt-1">
                          Selected: <span className="font-medium text-slate-700 dark:text-slate-300">{data.product_name}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Catalog — Raw Materials */}
                  {productMode === "catalog" && itemType === "raw_material" && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Raw Material *</label>
                      <select
                        value={data.raw_material_id}
                        onChange={handleRawMaterialSelect}
                        className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700"
                        required
                      >
                        <option value="">Choose a raw material...</option>
                        {rawMaterialCategories.map((cat) => (
                          <optgroup key={cat} label={cat}>
                            {rawMaterials
                              .filter((m) => (m.category || "Uncategorized") === cat)
                              .map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} — TZS {(m.cost_per_unit || 0).toLocaleString()} / {m.base_unit}
                                </option>
                              ))}
                          </optgroup>
                        ))}
                      </select>
                      {errors.raw_material_id && <p className="text-red-600 text-xs mt-1">{errors.raw_material_id}</p>}
                      {data.product_name && (
                        <p className="text-xs text-slate-500 mt-1">
                          Selected: <span className="font-medium text-slate-700 dark:text-slate-300">{data.product_name}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Custom Mode */}
                  {productMode === "custom" && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {itemType === "raw_material" ? "Raw Material Name *" : "Item / Product Name *"}
                      </label>
                      <Input
                        type="text"
                        value={data.product_name}
                        onChange={(e) => setData("product_name", e.target.value)}
                        placeholder={
                          itemType === "raw_material"
                            ? "e.g., Cotton Fabric, Steel Rod..."
                            : "e.g., Office Chair, Equipment..."
                        }
                        required={productMode === "custom"}
                        autoFocus
                      />
                      {errors.product_name && <p className="text-red-600 text-xs mt-1">{errors.product_name}</p>}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Quantity *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={data.quantity}
                        onChange={(e) => setData("quantity", e.target.value)}
                        placeholder="Enter quantity"
                        required
                      />
                      {errors.quantity && <p className="text-red-600 text-xs mt-1">{errors.quantity}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Unit *</label>
                      <Input
                        type="text"
                        value={data.unit}
                        onChange={(e) => setData("unit", e.target.value)}
                        placeholder="pcs, kg, m, etc"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Unit Price (TZS) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={data.unit_price}
                      onChange={(e) => setData("unit_price", e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Source Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Source Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Handler Type *</label>
                    <select
                      value={data.handler_type}
                      onChange={(e) => setData("handler_type", e.target.value)}
                      className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700"
                    >
                      <option value="Supplier">Supplier</option>
                      <option value="Transporter">Transporter</option>
                      <option value="Staff">Staff</option>
                      <option value="Registered">Registered Person</option>
                      <option value="Customer">Customer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Handler Name *</label>
                    <Input
                      type="text"
                      value={data.handler_name}
                      onChange={(e) => setData("handler_name", e.target.value)}
                      placeholder="Name of person/company delivering"
                      required
                    />
                    {errors.handler_name && <p className="text-red-600 text-xs mt-1">{errors.handler_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Source / Origin *</label>
                    <Input
                      type="text"
                      value={data.source}
                      onChange={(e) => setData("source", e.target.value)}
                      placeholder="e.g., Supplier: ABC Company or Warehouse: Branch 1"
                      required
                    />
                    {errors.source && <p className="text-red-600 text-xs mt-1">{errors.source}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Contact Info (Optional)</label>
                      <Input
                        type="text"
                        value={data.contact_info}
                        onChange={(e) => setData("contact_info", e.target.value)}
                        placeholder="Phone or email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Reference Number (Optional)</label>
                      <Input
                        type="text"
                        value={data.reference_number}
                        onChange={(e) => setData("reference_number", e.target.value)}
                        placeholder="Invoice/PO number"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="block text-sm font-medium mb-2">Additional Notes (Optional)</label>
                <textarea
                  value={data.notes}
                  onChange={(e) => setData("notes", e.target.value)}
                  placeholder="Any additional information..."
                  className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700"
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={processing} className="flex-1 bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Record as INCOMING
              </Button>
              <Link href="/gatekeeper" className="flex-1">
                <Button variant="outline" className="w-full">Cancel</Button>
              </Link>
            </div>
          </form>
        </div>
      </AppLayout>
    </>
  );
}
