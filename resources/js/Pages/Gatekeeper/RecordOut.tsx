import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, Plus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/layouts/app-layout";
import { FormEventHandler } from "react";

interface Product {
  id: number;
  product_name: string;
  product_price: number;
  unit_price: number;
}

interface Customer {
  id: number;
  staff_name: string;
}

interface RecordOutProps {
  products: Product[];
  customers: Customer[];
}

export default function RecordOut({ products, customers }: RecordOutProps) {
  const { data, setData, post, processing, errors } = useForm({
    product_id: "",
    product_name: "",
    quantity: "",
    unit_price: "",
    unit: "pcs",
    handler_type: "Customer",
    handler_name: "",
    destination: "",
    reference_number: "",
    contact_info: "",
    verification_code: "",
    notes: "",
  });

  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Gatekeeper", href: "/gatekeeper" },
    { title: "Record OUT", href: "#" },
  ];

  const handleProductSelect: FormEventHandler = (e: any) => {
    const productId = e.target.value;
    const selected = products.find((p) => p.id === parseInt(productId));
    if (selected) {
      setData((prev) => ({
        ...prev,
        product_id: productId,
        product_name: selected.product_name,
        unit_price: selected.unit_price.toString(),
      }));
    }
  };

  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    post("/gatekeeper/record-out", {
      onSuccess: () => {
        // Form will be reset after navigation
      },
    });
  };

  return (
    <>
      <Head title="Record Product OUT - Gatekeeper" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/gatekeeper">
              <ArrowLeft className="w-5 h-5 hover:text-blue-600" />
            </Link>
            <div>
              <h1 className="text-[18px] font-bold text-orange-600">
                <ArrowRight className="inline-block mr-2 w-6 h-6" />
                Outgoing Product
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select Product *
                    </label>
                  <select
                    value={data.product_id}
                    onChange={handleProductSelect}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Choose a product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.product_name} - TZS {p.product_price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {errors.product_id && (
                    <p className="text-red-600 text-xs mt-1">{errors.product_id}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Quantity *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={data.quantity}
                      onChange={(e) => setData("quantity", e.target.value)}
                      placeholder="Enter quantity"
                      required
                    />
                    {errors.quantity && (
                      <p className="text-red-600 text-xs mt-1">{errors.quantity}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Unit *
                    </label>
                    <Input
                      type="text"
                      value={data.unit}
                      onChange={(e) => setData("unit", e.target.value)}
                      placeholder="pcs, kg, etc"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Unit Price (TZS) *
                  </label>
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

            {/* Destination Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Destination Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Handler Type *
                  </label>
                  <select
                    value={data.handler_type}
                    onChange={(e) => setData("handler_type", e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="Customer">Customer</option>
                    <option value="Staff">Staff</option>
                    <option value="Delivery">Delivery Person</option>
                    <option value="Registered">Registered Person</option>
                    <option value="Supplier">Supplier (Return)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Handler Name *
                  </label>
                  <Input
                    type="text"
                    value={data.handler_name}
                    onChange={(e) => setData("handler_name", e.target.value)}
                    placeholder="Name of person/company receiving"
                    required
                  />
                  {errors.handler_name && (
                    <p className="text-red-600 text-xs mt-1">{errors.handler_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Destination *
                  </label>
                  <Input
                    type="text"
                    value={data.destination}
                    onChange={(e) => setData("destination", e.target.value)}
                    placeholder="e.g., Customer: ABC Store or Location: Branch 2"
                    required
                  />
                  {errors.destination && (
                    <p className="text-red-600 text-xs mt-1">{errors.destination}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Contact Info (Optional)
                    </label>
                    <Input
                      type="text"
                      value={data.contact_info}
                      onChange={(e) => setData("contact_info", e.target.value)}
                      placeholder="Phone or email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Reference Number (Optional)
                    </label>
                    <Input
                      type="text"
                      value={data.reference_number}
                      onChange={(e) => setData("reference_number", e.target.value)}
                      placeholder="Order/Delivery number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Security Verification */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Security Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Verification Code (4 digits) *
                  </label>
                  <Input
                    type="password"
                    maxLength={4}
                    value={data.verification_code}
                    onChange={(e) => setData("verification_code", e.target.value)}
                    placeholder="Enter 4-digit code"
                    required
                    className="text-center text-lg tracking-widest"
                  />
                  {errors.verification_code && (
                    <p className="text-red-600 text-xs mt-1">
                      {errors.verification_code}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    Enter the 4-digit verification code for security
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={data.notes}
                    onChange={(e) => setData("notes", e.target.value)}
                    placeholder="Any additional information..."
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={processing}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Record as OUTGOING
              </Button>
              <Link href="/gatekeeper" className="flex-1">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </AppLayout>
    </>
  );
}
