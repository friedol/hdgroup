import { Head, Link } from "@inertiajs/react";
import { BarChart3, TrendingUp, Package, Truck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/layouts/app-layout";

export default function LogisticsReports({ data }: { data: any }) {
  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Logistics", href: "/logistics" },
    { title: "Reports", href: "#" }
  ];

  return (
    <>
      <Head title="Logistics Reports" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Logistics Reports</h1>
              <p className="text-sm text-slate-600 mt-1">Detailed analytics and performance metrics</p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full max-w-xl grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="containers">Containers</TabsTrigger>
              <TabsTrigger value="manifests">Manifests</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Total Containers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{data.total_containers || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">{data.active_containers || 0} active</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Total Manifests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{data.total_manifests || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">{data.active_manifests || 0} active</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Total Weight
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{(data.total_weight / 1000 || 0).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Metric Tons</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Total Volume
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{(data.total_cbm || 0).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground mt-1">CBM</p>
                  </CardContent>
                </Card>
              </div>

              {/* Key Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>System Overview</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b">
                        <span className="text-muted-foreground">Avg Container Utilization</span>
                        <span className="text-2xl font-bold text-primary">{data.avg_utilization_percent || 0}%</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b">
                        <span className="text-muted-foreground">Total Containers Capacity</span>
                        <span className="text-2xl font-bold">{data.total_capacity || 0} CBM</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Available Capacity</span>
                        <span className="text-2xl font-bold text-green-600">{data.avail_capacity || 0} CBM</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b">
                        <span className="text-muted-foreground">DRAFT Manifests</span>
                        <span className="text-2xl font-bold text-slate-600">{data.draft_manifests || 0}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b">
                        <span className="text-muted-foreground">ACTIVE Manifests</span>
                        <span className="text-2xl font-bold text-blue-600">{data.active_manifests || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">DISPATCHED Manifests</span>
                        <span className="text-2xl font-bold text-green-600">{data.dispatched_manifests || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Containers Tab */}
            <TabsContent value="containers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Container Analysis</CardTitle>
                  <CardDescription>Container status and utilization analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-4 text-center">
                        <p className="text-muted-foreground mb-2">Available</p>
                        <p className="text-3xl font-bold text-green-600">{data.container_status?.available || 0}</p>
                      </div>
                      <div className="border rounded-lg p-4 text-center">
                        <p className="text-muted-foreground mb-2">Loading</p>
                        <p className="text-3xl font-bold text-yellow-600">{data.container_status?.loading || 0}</p>
                      </div>
                      <div className="border rounded-lg p-4 text-center">
                        <p className="text-muted-foreground mb-2">Full</p>
                        <p className="text-3xl font-bold text-red-600">{data.container_status?.full || 0}</p>
                      </div>
                    </div>

                    <div className="text-center py-8 text-muted-foreground">
                      <p>For detailed container analysis, visit the Containers page</p>
                      <Link href="/containers" className="text-primary hover:underline text-sm mt-2 inline-block">
                        View All Containers →
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Manifests Tab */}
            <TabsContent value="manifests" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Manifest Analysis</CardTitle>
                  <CardDescription>Manifest status and load distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-3">Manifest Status Distribution</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Draft</span>
                            <span className="font-medium">{data.draft_manifests || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Active</span>
                            <span className="font-medium">{data.active_manifests || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Dispatched</span>
                            <span className="font-medium">{data.dispatched_manifests || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Cancelled</span>
                            <span className="font-medium">{data.cancelled_manifests || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-3">Load Metrics</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Total Weight</span>
                            <span className="font-medium">{(data.total_weight / 1000 || 0).toFixed(1)} MT</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total Volume</span>
                            <span className="font-medium">{(data.total_cbm || 0).toFixed(2)} CBM</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Avg Weight</span>
                            <span className="font-medium">
                              {data.total_manifests ? ((data.total_weight / data.total_manifests) / 1000).toFixed(1) : 0} MT
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center py-8 text-muted-foreground">
                      <p>For detailed manifest reports, visit the Manifests page</p>
                      <Link href="/parking_orders" className="text-primary hover:underline text-sm mt-2 inline-block">
                        View All Manifests →
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Product Analysis</CardTitle>
                  <CardDescription>Port product inventory and distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-2">Total Products</p>
                        <p className="text-3xl font-bold">{data.total_products || 0}</p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-2">Total CBM</p>
                        <p className="text-3xl font-bold">{(data.products_total_cbm || 0).toFixed(1)}</p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-2">Total Weight</p>
                        <p className="text-3xl font-bold">{((data.products_total_weight || 0) / 1000).toFixed(1)} MT</p>
                      </div>
                    </div>

                    <div className="text-center py-8 text-muted-foreground">
                      <p>For detailed product information and analysis, visit the Products page</p>
                      <Link href="/register-products" className="text-primary hover:underline text-sm mt-2 inline-block">
                        View All Products →
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </>
  );
}
