import { Head, Link } from "@inertiajs/react";
import { BarChart3, TrendingUp, Package, Truck, ArrowRight, Box, FileText } from "lucide-react";
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
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
          
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-blue-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Logistics Reports</h1>
              <p className="text-xs font-medium text-slate-500 mt-1.5">Detailed analytics and performance metrics</p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="bg-slate-100 p-1 rounded-xl h-auto gap-1 border border-slate-200">
                <TabsTrigger 
                  value="overview" 
                  className="rounded-lg text-xs font-semibold px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-slate-500 hover:text-slate-700 transition-all"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="containers" 
                  className="rounded-lg text-xs font-semibold px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-slate-500 hover:text-slate-700 transition-all"
                >
                  Containers
                </TabsTrigger>
                <TabsTrigger 
                  value="manifests" 
                  className="rounded-lg text-xs font-semibold px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-slate-500 hover:text-slate-700 transition-all"
                >
                  Manifests
                </TabsTrigger>
                <TabsTrigger 
                  value="products" 
                  className="rounded-lg text-xs font-semibold px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-slate-500 hover:text-slate-700 transition-all"
                >
                  Products
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 outline-none">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { 
                    label: 'Total Containers', 
                    value: data.total_containers || 0, 
                    subText: `${data.active_containers || 0} active`, 
                    valueColor: 'text-slate-900', 
                    border: 'border-slate-200', 
                    bg: 'bg-white', 
                    icon: <Box className="h-4 w-4 md:h-5 md:w-5" /> 
                  },
                  { 
                    label: 'Total Manifests', 
                    value: data.total_manifests || 0, 
                    subText: `${data.active_manifests || 0} active`, 
                    valueColor: 'text-violet-700', 
                    border: 'border-violet-100', 
                    bg: 'bg-violet-50/30', 
                    icon: <FileText className="h-4 w-4 md:h-5 md:w-5" /> 
                  },
                  { 
                    label: 'Total Weight', 
                    value: `${(data.total_weight / 1000 || 0).toFixed(1)} MT`, 
                    subText: 'Metric Tons loaded', 
                    valueColor: 'text-amber-700', 
                    border: 'border-amber-100', 
                    bg: 'bg-amber-50/30', 
                    icon: <TrendingUp className="h-4 w-4 md:h-5 md:w-5" /> 
                  },
                  { 
                    label: 'Total Volume', 
                    value: `${(data.total_cbm || 0).toFixed(1)} CBM`, 
                    subText: 'Volume in Cubic Meters', 
                    valueColor: 'text-emerald-700', 
                    border: 'border-emerald-100', 
                    bg: 'bg-emerald-50/30', 
                    icon: <Package className="h-4 w-4 md:h-5 md:w-5" /> 
                  },
                ].map((s, idx) => (
                  <div key={idx} className={`rounded-xl border ${s.border} px-3 py-2.5 shadow-sm hover:shadow-md transition-all ${s.bg}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="bg-white p-1 rounded-lg shadow-sm text-slate-500 border border-slate-100">{s.icon}</div>
                      <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-400">Reports</span>
                    </div>
                    <p className={`text-sm font-bold tabular-nums leading-none ${s.valueColor}`}>{s.value}</p>
                    <p className="text-[10px] font-semibold text-slate-700 mt-1">{s.label}</p>
                    <p className="text-[9px] font-medium text-slate-400 mt-0.5">{s.subText}</p>
                  </div>
                ))}
              </div>

              {/* Key Metrics */}
              <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50 pb-4">
                  <CardTitle className="text-sm font-bold text-slate-800">System Overview</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-semibold text-slate-600">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                        <span className="text-slate-500">Avg Container Utilization</span>
                        <span className="text-base font-bold text-blue-600">{data.avg_utilization_percent || 0}%</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                        <span className="text-slate-500">Total Containers Capacity</span>
                        <span className="text-base font-bold text-slate-800">{data.total_capacity || 0} CBM</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Available Capacity</span>
                        <span className="text-base font-bold text-emerald-600">{data.avail_capacity || 0} CBM</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                        <span className="text-slate-500">DRAFT Manifests</span>
                        <span className="text-base font-bold text-slate-600">{data.draft_manifests || 0}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                        <span className="text-slate-500">ACTIVE Manifests</span>
                        <span className="text-base font-bold text-blue-600">{data.active_manifests || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">DISPATCHED Manifests</span>
                        <span className="text-base font-bold text-emerald-600">{data.dispatched_manifests || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Containers Tab */}
            <TabsContent value="containers" className="space-y-4 outline-none">
              <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50 pb-4">
                  <CardTitle className="text-sm font-bold text-slate-800">Container Analysis</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Container status and utilization analysis</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-slate-100 rounded-xl p-4 text-center bg-slate-50/30">
                      <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Available</p>
                      <p className="text-2xl font-extrabold text-green-600">{data.container_status?.available || 0}</p>
                    </div>
                    <div className="border border-slate-100 rounded-xl p-4 text-center bg-slate-50/30">
                      <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Loading</p>
                      <p className="text-2xl font-extrabold text-amber-600">{data.container_status?.loading || 0}</p>
                    </div>
                    <div className="border border-slate-100 rounded-xl p-4 text-center bg-slate-50/30">
                      <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Full</p>
                      <p className="text-2xl font-extrabold text-rose-600">{data.container_status?.full || 0}</p>
                    </div>
                  </div>

                  <div className="text-center py-6">
                    <p className="text-xs font-semibold text-slate-500">For detailed container analysis and live statuses, visit the Containers dashboard.</p>
                    <Link href="/containers" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 mt-3 transition-all">
                      View All Containers <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Manifests Tab */}
            <TabsContent value="manifests" className="space-y-4 outline-none">
              <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50 pb-4">
                  <CardTitle className="text-sm font-bold text-slate-800">Manifest Analysis</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Manifest status and load distribution</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Manifest Status Distribution</p>
                      <div className="space-y-2.5 text-xs font-semibold text-slate-600">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                          <span>Draft</span>
                          <span className="text-slate-800">{data.draft_manifests || 0}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                          <span>Active</span>
                          <span className="text-blue-600">{data.active_manifests || 0}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                          <span>Dispatched</span>
                          <span className="text-green-600">{data.dispatched_manifests || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Cancelled</span>
                          <span className="text-slate-400">{data.cancelled_manifests || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Load Metrics</p>
                      <div className="space-y-2.5 text-xs font-semibold text-slate-600">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                          <span>Total Weight</span>
                          <span className="text-slate-800">{(data.total_weight / 1000 || 0).toFixed(1)} MT</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                          <span>Total Volume</span>
                          <span className="text-slate-800">{(data.total_cbm || 0).toFixed(2)} CBM</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Avg Weight per Manifest</span>
                          <span className="text-slate-850">
                            {data.total_manifests ? ((data.total_weight / data.total_manifests) / 1000).toFixed(1) : 0} MT
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-6 border-t border-slate-50">
                    <p className="text-xs font-semibold text-slate-500">For detailed manifest reports, visit the Manifests controls.</p>
                    <Link href="/parking_orders" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 mt-3 transition-all">
                      View All Manifests <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-4 outline-none">
              <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50 pb-4">
                  <CardTitle className="text-sm font-bold text-slate-800">Product Analysis</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Port product inventory and distribution</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                      <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Total Products</p>
                      <p className="text-2xl font-extrabold text-slate-900">{data.total_products || 0}</p>
                    </div>
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                      <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Total Volume</p>
                      <p className="text-2xl font-extrabold text-slate-900">{(data.products_total_cbm || 0).toFixed(1)} CBM</p>
                    </div>
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                      <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Total Weight</p>
                      <p className="text-2xl font-extrabold text-slate-900">{((data.products_total_weight || 0) / 1000).toFixed(1)} MT</p>
                    </div>
                  </div>

                  <div className="text-center py-6 border-t border-slate-50">
                    <p className="text-xs font-semibold text-slate-500">For detailed product information and analysis, visit the Products dashboard.</p>
                    <Link href="/register-products" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 mt-3 transition-all">
                      View All Products <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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
