import { Head } from "@inertiajs/react";
import { TrendingUp, Truck, Package, AlertCircle, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/layouts/app-layout";

interface Dashboard {
  total_containers: number;
  active_containers: number;
  total_capacity: number;
  used_capacity: number;
  avail_capacity: number;
  active_manifests: number;
  pending_manifests: number;
  total_weight: number;
  total_cbm: number;
  utilization_percent: number;
  recent_manifests?: any[];
  container_status?: Record<string, number>;
}

export default function LogisticsDashboard({ data }: { data: Dashboard }) {
  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Logistics", href: "#" }
  ];

  const utilizationPercent = Math.round(data.utilization_percent || 0);
  const utilizationColor = utilizationPercent >= 90 ? "text-red-600" : utilizationPercent >= 70 ? "text-yellow-600" : "text-green-600";

  return (
    <>
      <Head title="Logistics Dashboard" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Logistics Hub</h1>
              <p className="text-sm text-slate-600 mt-1">Monitor containers, manifests, and shipments</p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-l-4 border-l-blue-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Containers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.active_containers}</div>
                <p className="text-xs text-muted-foreground mt-1">of {data.total_containers} total</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Manifests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.active_manifests}</div>
                <p className="text-xs text-muted-foreground mt-1">{data.pending_manifests} pending</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(data.total_capacity / 1000).toFixed(1)}K</div>
                <p className="text-xs text-muted-foreground mt-1">CBM</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Used Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${utilizationColor}`}>{(data.used_capacity / 1000).toFixed(1)}K</div>
                <p className="text-xs text-muted-foreground mt-1">{utilizationPercent}% utilized</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-cyan-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(data.avail_capacity / 1000).toFixed(1)}K</div>
                <p className="text-xs text-muted-foreground mt-1">CBM remaining</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="containers">Containers</TabsTrigger>
              <TabsTrigger value="manifests">Manifests</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Capacity Utilization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Capacity Utilization</CardTitle>
                    <CardDescription>Overall system capacity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Total: {(data.total_capacity / 1000).toFixed(1)}K CBM</span>
                        <span className={`text-lg font-bold ${utilizationColor}`}>{utilizationPercent}%</span>
                      </div>
                      <Progress value={utilizationPercent} className="h-3" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Used:</span>
                        <span className="font-medium">{(data.used_capacity / 1000).toFixed(1)}K CBM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Available:</span>
                        <span className="font-medium text-green-600">{(data.avail_capacity / 1000).toFixed(1)}K CBM</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Weight Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Weight Distribution</CardTitle>
                    <CardDescription>Current load distribution</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{(data.total_weight / 1000).toFixed(1)}</div>
                      <p className="text-sm text-muted-foreground">Metric Tons</p>
                    </div>
                    <div className="h-20 bg-slate-100 rounded flex items-center justify-center">
                      <div className="text-sm text-muted-foreground">Distribution chart</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Status Summary</CardTitle>
                    <CardDescription>Container statuses</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm">Available</span>
                      </div>
                      <span className="font-medium">{data.container_status?.available || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span className="text-sm">Loading</span>
                      </div>
                      <span className="font-medium">{data.container_status?.loading || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-sm">Full</span>
                      </div>
                      <span className="font-medium">{data.container_status?.full || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Containers Tab */}
            <TabsContent value="containers" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>All Containers</CardTitle>
                    <CardDescription>Manage shipping containers</CardDescription>
                  </div>
                  <a href="/containers/create" className="px-3 py-2 bg-primary text-white rounded text-sm font-medium">
                    + New Container
                  </a>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>View all containers using the dedicated Containers page</p>
                    <a href="/containers" className="text-primary hover:underline text-sm mt-2 inline-block">
                      Go to Containers →
                    </a>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Manifests Tab */}
            <TabsContent value="manifests" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Recent Manifests</CardTitle>
                    <CardDescription>Latest shipment manifests</CardDescription>
                  </div>
                  <a href="/parking_orders/create" className="px-3 py-2 bg-primary text-white rounded text-sm font-medium">
                    + New Manifest
                  </a>
                </CardHeader>
                <CardContent>
                  {data.recent_manifests && data.recent_manifests.length > 0 ? (
                    <div className="space-y-2">
                      {data.recent_manifests.map((manifest: any) => (
                        <div key={manifest.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                          <div>
                            <p className="font-medium">{manifest.manifest_name}</p>
                            <p className="text-xs text-muted-foreground">{manifest.unique_id}</p>
                          </div>
                          <span className="text-sm">{manifest.total_weight} kg</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No manifests yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </>
  );
}
