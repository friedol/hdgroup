import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";

export default function ContainerCreate() {
  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Logistics", href: "/logistics" },
    { title: "Containers", href: "/containers" },
    { title: "Create", href: "#" }
  ];

  const { data, setData, post, processing, errors } = useForm({
    container_id: "",
    name: "",
    length: "",
    width: "",
    height: "",
    capacity: "",
    tare_weight: "",
    gross_weight: "",
    max_payload: "",
    description: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/containers");
  };

  return (
    <>
      <Head title="Create Container" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Link href="/containers">
              <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Create Container</h1>
              <p className="text-sm text-slate-600 mt-1">Register a new shipping container</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Container identification and naming</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Container ID *</label>
                    <Input
                      placeholder="e.g., CNT-001"
                      value={data.container_id}
                      onChange={(e) => setData("container_id", e.target.value)}
                      className={errors.container_id ? "border-red-500" : ""}
                    />
                    {errors.container_id && <p className="text-red-500 text-xs mt-1">{errors.container_id}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Container Name *</label>
                    <Input
                      placeholder="e.g., Container Alpha"
                      value={data.name}
                      onChange={(e) => setData("name", e.target.value)}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dimensions */}
            <Card>
              <CardHeader>
                <CardTitle>Physical Dimensions</CardTitle>
                <CardDescription>Container measurements in meters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Length (m) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={data.length}
                      onChange={(e) => setData("length", e.target.value)}
                      className={errors.length ? "border-red-500" : ""}
                    />
                    {errors.length && <p className="text-red-500 text-xs mt-1">{errors.length}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Width (m) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={data.width}
                      onChange={(e) => setData("width", e.target.value)}
                      className={errors.width ? "border-red-500" : ""}
                    />
                    {errors.width && <p className="text-red-500 text-xs mt-1">{errors.width}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Height (m) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={data.height}
                      onChange={(e) => setData("height", e.target.value)}
                      className={errors.height ? "border-red-500" : ""}
                    />
                    {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Capacity (CBM) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={data.capacity}
                      onChange={(e) => setData("capacity", e.target.value)}
                      className={errors.capacity ? "border-red-500" : ""}
                    />
                    {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weight Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Weight Specifications</CardTitle>
                <CardDescription>Weight limits and specifications in kilograms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tare Weight (kg) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={data.tare_weight}
                      onChange={(e) => setData("tare_weight", e.target.value)}
                      className={errors.tare_weight ? "border-red-500" : ""}
                    />
                    {errors.tare_weight && <p className="text-red-500 text-xs mt-1">{errors.tare_weight}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Gross Weight (kg) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={data.gross_weight}
                      onChange={(e) => setData("gross_weight", e.target.value)}
                      className={errors.gross_weight ? "border-red-500" : ""}
                    />
                    {errors.gross_weight && <p className="text-red-500 text-xs mt-1">{errors.gross_weight}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Payload (kg) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={data.max_payload}
                      onChange={(e) => setData("max_payload", e.target.value)}
                      className={errors.max_payload ? "border-red-500" : ""}
                    />
                    {errors.max_payload && <p className="text-red-500 text-xs mt-1">{errors.max_payload}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    placeholder="Optional notes about this container..."
                    className="w-full px-3 py-2 border rounded-lg min-h-[100px]"
                    value={data.description}
                    onChange={(e) => setData("description", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Link href="/containers">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={processing}>
                {processing ? "Creating..." : "Create Container"}
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </>
  );
}
