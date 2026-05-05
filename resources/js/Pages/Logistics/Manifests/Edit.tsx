import { Head, Link } from "@inertiajs/react";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";

interface ManifestItem {
  id: number;
  product_id: string;
  product_name: string;
  quantity: number;
  total_weight: number;
  total_cbm: number;
}

interface Product {
  product_id: string;
  product_name: string;
  cbm: number;
  weight: number;
}

interface Manifest {
  id: number;
  unique_id: string;
  manifest_name: string;
  container_id: number;
  status: string;
  orders?: ManifestItem[];
}

export default function ManifestEdit({ 
  manifest, 
  containers = [], 
  products = [] 
}: { 
  manifest: Manifest; 
  containers: any[]; 
  products: Product[] 
}) {
  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Logistics", href: "/logistics" },
    { title: "Manifests", href: "/parking_orders" },
    { title: "Edit", href: "#" }
  ];

  const [formData, setFormData] = useState({
    order_name: manifest.manifest_name,
    container_id: manifest.container_id.toString(),
    product_id: [],
    quantity: []
  });

  const [items, setItems] = useState<Array<{ product_id: string; quantity: number }>>(
    manifest.orders?.map((o) => ({
      product_id: o.product_id,
      quantity: o.quantity
    })) || []
  );

  const [processing, setProcessing] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    const product_ids = items.map((i) => i.product_id);
    const quantities = items.map((i) => i.quantity);

    try {
      const response = await fetch(`/parking_orders/${manifest.unique_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || ""
        },
        body: JSON.stringify({
          order_name: formData.order_name,
          container_id: formData.container_id,
          product_id: product_ids,
          quantity: quantities
        })
      });

      if (response.ok) {
        window.location.href = `/parking_orders/${manifest.unique_id}`;
      } else {
        alert("Error updating manifest");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error updating manifest");
    } finally {
      setProcessing(false);
    }
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

  return (
    <>
      <Head title={`Edit ${manifest.manifest_name}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Link href={`/parking_orders/${manifest.unique_id}`}>
              <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Edit Manifest</h1>
              <p className="text-sm text-slate-600 mt-1">{manifest.manifest_name}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Manifest Header */}
            <Card>
              <CardHeader>
                <CardTitle>Manifest Information</CardTitle>
                <CardDescription>Update manifest details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Manifest Name *</label>
                    <Input
                      placeholder="e.g., Nairobi Shipment 001"
                      value={formData.order_name}
                      onChange={(e) => setFormData({ ...formData, order_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Container *</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg"
                      value={formData.container_id}
                      onChange={(e) => setFormData({ ...formData, container_id: e.target.value })}
                    >
                      <option value="">Select a container</option>
                      {containers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.container_id} - {c.name} ({c.capacity} CBM)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Cargo Items</CardTitle>
                  <CardDescription>Update products in the manifest</CardDescription>
                </div>
                <Button type="button" onClick={addItem} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.length > 0 ? (
                  items.map((item, index) => {
                    const selectedProduct = products.find((p) => p.product_id === item.product_id);
                    return (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Product *</label>
                            <select
                              className="w-full px-3 py-2 border rounded-lg text-sm"
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
                            <label className="block text-sm font-medium mb-2">Quantity *</label>
                            <Input
                              type="number"
                              min="1"
                              placeholder="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", e.target.value)}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-full text-red-600 hover:text-red-700"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                        {selectedProduct && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>× Weight: {(selectedProduct.weight * item.quantity / 1000).toFixed(2)} MT</p>
                            <p>× Volume: {(selectedProduct.cbm * item.quantity).toFixed(2)} CBM</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No items added yet. Click "Add Item" to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            {items.length > 0 && (
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-base">Manifest Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Items</p>
                      <p className="text-2xl font-bold">{items.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Weight</p>
                      <p className="text-2xl font-bold">{(getTotalWeight() / 1000).toFixed(1)} MT</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
                      <p className="text-2xl font-bold">{getTotalCBM().toFixed(2)} CBM</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Link href={`/parking_orders/${manifest.unique_id}`}>
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={processing || items.length === 0}>
                {processing ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </>
  );
}
