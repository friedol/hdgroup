import { Head, Link } from "@inertiajs/react";
import { TrendingUp, Truck, Package, AlertCircle, MapPin, Box, FileText, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const utilizationColor = utilizationPercent >= 90 ? "text-rose-600" : utilizationPercent >= 70 ? "text-amber-600" : "text-emerald-600";
  const utilizationBg = utilizationPercent >= 90 ? "bg-rose-500" : utilizationPercent >= 70 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <>
      <Head title="Logistics Dashboard" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Logistics Hub</h1>
              <p className="text-xs font-medium text-slate-500 mt-1.5">Monitor containers, manifests, and shipments</p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {[
              { 
                label: 'Active Containers', 
                value: data.active_containers, 
                subText: `of ${data.total_containers} total`, 
                valueColor: 'text-blue-700', 
                border: 'border-blue-100', 
                bg: 'bg-blue-50/30', 
                chip: 'bg-blue-50/80 text-blue-700', 
                icon: <Box className="h-4 w-4 md:h-5 md:w-5" /> 
              },
              { 
                label: 'Active Manifests', 
                value: data.active_manifests, 
                subText: `${data.pending_manifests} pending`, 
                valueColor: 'text-violet-700', 
                border: 'border-violet-100', 
                bg: 'bg-violet-50/30', 
                chip: 'bg-violet-50/80 text-violet-700', 
                icon: <FileText className="h-4 w-4 md:h-5 md:w-5" /> 
              },
              { 
                label: 'Total Capacity', 
                value: `${(data.total_capacity / 1000).toFixed(1)}K CBM`, 
                subText: 'Volume limit', 
                valueColor: 'text-slate-900', 
                border: 'border-slate-200', 
                bg: 'bg-white', 
                chip: 'bg-slate-50/80 text-slate-600', 
                icon: <Package className="h-4 w-4 md:h-5 md:w-5" /> 
              },
              { 
                label: 'Used Capacity', 
                value: `${(data.used_capacity / 1000).toFixed(1)}K CBM`, 
                subText: `${utilizationPercent}% utilized`, 
                valueColor: utilizationColor, 
                border: 'border-amber-100', 
                bg: 'bg-amber-50/30', 
                chip: 'bg-amber-50/80 text-amber-700', 
                icon: <TrendingUp className="h-4 w-4 md:h-5 md:w-5" /> 
              },
              { 
                label: 'Available Capacity', 
                value: `${(data.avail_capacity / 1000).toFixed(1)}K CBM`, 
                subText: 'Remaining space', 
                valueColor: 'text-emerald-700', 
                border: 'border-emerald-100', 
                bg: 'bg-emerald-50/30', 
                chip: 'bg-emerald-50/80 text-emerald-700', 
                icon: <Truck className="h-4 w-4 md:h-5 md:w-5" /> 
              },
            ].map((s, idx) => (
              <div key={idx} className={`rounded-xl border ${s.border} px-3 py-2.5 shadow-sm hover:shadow-md transition-all ${s.bg}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="bg-white p-1 rounded-lg shadow-sm text-slate-500 border border-slate-100">{s.icon}</div>
                  <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${s.chip}`}>
                    Logistics
                  </span>
                </div>
                <p className={`text-sm font-bold tabular-nums leading-none ${s.valueColor}`}>{s.value}</p>
                <p className="text-[10px] font-semibold text-slate-700 mt-1">{s.label}</p>
                <p className="text-[9px] font-medium text-slate-400 mt-0.5">{s.subText}</p>
              </div>
            ))}
          </div>

          {/* Main Content Tabs */}
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
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Capacity Utilization */}
                <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b border-slate-50 pb-4">
                    <CardTitle className="text-sm font-bold text-slate-800">Capacity Utilization</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Overall system capacity</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-5">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500">Total: {(data.total_capacity / 1000).toFixed(1)}K CBM</span>
                        <span className={`text-base font-bold ${utilizationColor}`}>{utilizationPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className={`h-full ${utilizationBg} transition-all`} style={{ width: `${utilizationPercent}%` }} />
                      </div>
                    </div>
                    <div className="space-y-3 pt-2 text-xs">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <span className="text-slate-500 font-semibold">Used Space:</span>
                        <span className="font-bold text-slate-800">{(data.used_capacity / 1000).toFixed(1)}K CBM</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-semibold">Available Space:</span>
                        <span className="font-bold text-emerald-600">{(data.avail_capacity / 1000).toFixed(1)}K CBM</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Weight Distribution */}
                <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b border-slate-50 pb-4">
                    <CardTitle className="text-sm font-bold text-slate-800">Weight Distribution</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Current load distribution</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    <div className="text-center py-2">
                      <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{(data.total_weight / 1000).toFixed(1)}</div>
                      <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Metric Tons</p>
                    </div>
                    <div className="h-20 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                      <div className="text-xs font-semibold text-slate-400">Distribution graph details</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status Summary */}
                <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b border-slate-50 pb-4">
                    <CardTitle className="text-sm font-bold text-slate-800">Status Summary</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Container statuses</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span className="text-xs font-semibold text-slate-600">Available</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100">
                        {data.container_status?.available || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                        <span className="text-xs font-semibold text-slate-600">Loading</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-100">
                        {data.container_status?.loading || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                        <span className="text-xs font-semibold text-slate-600">Full</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-lg border border-rose-100">
                        {data.container_status?.full || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Containers Tab */}
            <TabsContent value="containers" className="space-y-4 outline-none">
              <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800">All Containers</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Manage shipping containers</CardDescription>
                  </div>
                  <Link href="/containers/create">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all">
                      + New Container
                    </button>
                  </Link>
                </CardHeader>
                <CardContent className="pt-10 pb-10">
                  <div className="text-center max-w-sm mx-auto">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-4">
                      <Box className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Containers Central Management</p>
                    <p className="text-xs text-slate-400 mt-1">View capacity logs and detailed dimensions of registered containers.</p>
                    <Link href="/containers" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 mt-4 transition-all">
                      Go to Containers <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Manifests Tab */}
            <TabsContent value="manifests" className="space-y-4 outline-none">
              <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800">Recent Manifests</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Latest cargo shipment manifests</CardDescription>
                  </div>
                  <Link href="/parking_orders/create">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all">
                      + New Manifest
                    </button>
                  </Link>
                </CardHeader>
                <CardContent className="pt-6">
                  {data.recent_manifests && data.recent_manifests.length > 0 ? (
                    <div className="space-y-3">
                      {data.recent_manifests.map((manifest: any) => (
                        <div key={manifest.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 hover:border-slate-200 transition-all">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{manifest.manifest_name}</p>
                            <p className="text-[10px] font-mono text-blue-600 font-semibold mt-0.5">{manifest.unique_id}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-800">{manifest.total_weight.toLocaleString()} kg</span>
                            <p className="text-[10px] text-slate-400 mt-0.5">{manifest.total_cbm} CBM</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
                        <Truck className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-400">No manifests found</p>
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
