import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Printer, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface Manifest {
  id: number;
  unique_id: string;
  manifest_name: string;
  container_id: number;
  status: string;
  total_weight: number;
  total_cbm: number;
  created_by: string;
  created_at: string;
  orders?: ManifestItem[];
}

export default function ManifestShow({ manifest, container }: { manifest: Manifest; container: any }) {
  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Logistics", href: "/logistics" },
    { title: "Manifests", href: "/parking_orders" },
    { title: manifest.manifest_name, href: "#" }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-slate-100 text-slate-700",
      ACTIVE: "bg-blue-100 text-blue-700",
      CANCELLED: "bg-red-100 text-red-700",
      DISPATCHED: "bg-green-100 text-green-700"
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  return (
    <>
      <Head title={manifest.manifest_name} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/parking_orders">
                <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </Link>
              <div>
                <h1 className="text-3xl font-medium">{manifest.manifest_name}</h1>
                <p className="text-sm text-slate-600 mt-1">ID: {manifest.unique_id}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Link href={`/parking_orders/${manifest.unique_id}/edit`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>

          {/* Manifest Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(manifest.status)}`}>
                  {manifest.status}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-medium">{(manifest.total_weight / 1000).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Metric Tons</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-medium">{manifest.total_cbm.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">CBM</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Items</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-medium">{manifest.orders?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Products</p>
              </CardContent>
            </Card>
          </div>

          {/* Container Information */}
          <Card>
            <CardHeader>
              <CardTitle>Container Information</CardTitle>
              <CardDescription>Assigned shipping container</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Container No.</p>
                  <p className="font-semibold">{container?.container_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="font-semibold">{container?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Capacity</p>
                  <p className="font-semibold">{container?.capacity} CBM</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Max Payload</p>
                  <p className="font-semibold">{container?.max_payload} kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Utilization</p>
                  <p className="font-semibold text-blue-600">{Math.round((manifest.total_cbm / container?.capacity) * 100)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cargo Items */}
          <Card>
            <CardHeader>
              <CardTitle>Cargo Items</CardTitle>
              <CardDescription>Products in this manifest</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Product ID</th>
                      <th className="pb-3 font-medium">Product Name</th>
                      <th className="pb-3 font-medium">Quantity</th>
                      <th className="pb-3 font-medium">Weight (kg)</th>
                      <th className="pb-3 font-medium">Volume (CBM)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {manifest.orders && manifest.orders.length > 0 ? (
                      manifest.orders.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-3 font-mono text-xs">{item.product_id}</td>
                          <td className="py-3 font-medium">{item.product_name}</td>
                          <td className="py-3">{item.quantity}</td>
                          <td className="py-3">{(item.total_weight / 1000).toFixed(2)}K</td>
                          <td className="py-3">{item.total_cbm.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No items in this manifest
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <Card className="bg-slate-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Created By</p>
                  <p className="font-medium">{manifest.created_by}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Created On</p>
                  <p className="font-medium">{new Date(manifest.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <Link href={`/parking_orders/${manifest.unique_id}/edit`}>
                    <Button size="sm">Edit Manifest</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}
