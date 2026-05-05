import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";

export default function ProductCreate() {
  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Logistics", href: "/logistics" },
    { title: "Port Products", href: "/register-products" },
    { title: "Create", href: "#" }
  ];

  const { data, setData, post, processing, errors } = useForm({
    product_id: "",
    product_name: "",
    cbm: "",
    weight: "",
    price: "",
    pc_per_ctn: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/register-products");
  };

  return (
    <>
      <Head title="Register Product" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Link href="/register-products">
              <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Register Product</h1>
              <p className="text-sm text-slate-600 mt-1">Register a new product for import/port</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
                <CardDescription>Basic product identification and details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Product ID *</label>
                  <Input
                    placeholder="e.g., PROD-001"
                    value={data.product_id}
                    onChange={(e) => setData("product_id", e.target.value)}
                    className={errors.product_id ? "border-red-500" : ""}
                  />
                  {errors.product_id && <p className="text-red-500 text-xs mt-1">{errors.product_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Product Name *</label>
                  <Input
                    placeholder="e.g., Steel Rods 10mm"
                    value={data.product_name}
                    onChange={(e) => setData("product_name", e.target.value)}
                    className={errors.product_name ? "border-red-500" : ""}
                  />
                  {errors.product_name && <p className="text-red-500 text-xs mt-1">{errors.product_name}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Physical Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Physical Specifications</CardTitle>
                <CardDescription>Dimensions and weight per unit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">CBM per Unit *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={data.cbm}
                      onChange={(e) => setData("cbm", e.target.value)}
                      className={errors.cbm ? "border-red-500" : ""}
                    />
                    {errors.cbm && <p className="text-red-500 text-xs mt-1">{errors.cbm}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Weight per Unit (kg) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={data.weight}
                      onChange={(e) => setData("weight", e.target.value)}
                      className={errors.weight ? "border-red-500" : ""}
                    />
                    {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Packaging</CardTitle>
                <CardDescription>Cost and packaging information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Price per Unit (TZS)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={data.price}
                      onChange={(e) => setData("price", e.target.value)}
                    />
                    {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Pieces per Carton</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={data.pc_per_ctn}
                      onChange={(e) => setData("pc_per_ctn", e.target.value)}
                    />
                    {errors.pc_per_ctn && <p className="text-red-500 text-xs mt-1">{errors.pc_per_ctn}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Link href="/register-products">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={processing}>
                {processing ? "Creating..." : "Register Product"}
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </>
  );
}
