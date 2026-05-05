import { Head, Link } from "@inertiajs/react";
import { Plus, Search, Edit, Eye } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";

interface Product {
  id: number;
  product_id: string;
  product_name: string;
  cbm: number;
  weight: number;
  price?: number;
  pc_per_ctn?: number;
  created_at?: string;
}

export default function ProductsIndex({ posts = [] }: { posts: Product[] }) {
  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Logistics", href: "/logistics" },
    { title: "Port Products", href: "#" }
  ];

  const [search, setSearch] = useState("");

  const filtered = posts.filter(
    (p) =>
      p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      p.product_id.toLowerCase().includes(search.toLowerCase())
  );

  const totalCBM = posts.reduce((sum, p) => sum + p.cbm, 0);
  const totalWeight = posts.reduce((sum, p) => sum + p.weight, 0);
  const totalValue = posts.reduce((sum, p) => sum + (p.price || 0), 0);

  return (
    <>
      <Head title="Port Products" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Port Products</h1>
              <p className="text-sm text-slate-600 mt-1">Manage products registered for import/port</p>
            </div>
            <Link href="/register-products/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Register Product
              </Button>
            </Link>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{posts.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalCBM.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">CBM</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{(totalWeight / 1000).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Metric Tons</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">TZS {(totalValue / 1000).toFixed(0)}K</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search product name or ID..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Product ID</th>
                      <th className="pb-3 font-medium">Product Name</th>
                      <th className="pb-3 font-medium">CBM</th>
                      <th className="pb-3 font-medium">Weight (kg)</th>
                      <th className="pb-3 font-medium">Price (TZS)</th>
                      <th className="pb-3 font-medium">Qty/Ctn</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.length > 0 ? (
                      filtered.map((product) => (
                        <tr key={product.id} className="hover:bg-slate-50">
                          <td className="py-3 font-mono text-xs">{product.product_id}</td>
                          <td className="py-3 font-medium">{product.product_name}</td>
                          <td className="py-3">{product.cbm.toFixed(2)}</td>
                          <td className="py-3">{(product.weight / 1000).toFixed(2)}K</td>
                          <td className="py-3">{product.price ? `TZS ${product.price.toLocaleString()}` : "-"}</td>
                          <td className="py-3">{product.pc_per_ctn || "-"}</td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/register-products/${product.id}`} title="View">
                                <Eye className="w-4 h-4 text-blue-600 hover:text-blue-700 cursor-pointer" />
                              </Link>
                              <Link href={`/register-products/${product.id}/edit`} title="Edit">
                                <Edit className="w-4 h-4 text-amber-600 hover:text-amber-700 cursor-pointer" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No products found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}
