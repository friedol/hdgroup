import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Edit, Box, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/layouts/app-layout";

interface Container {
  id: number;
  container_id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  capacity: number;
  tare_weight: number;
  gross_weight: number;
  max_payload: number;
  used_capacity?: number;
  current_weight?: number;
  current_cbm?: number;
  status: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export default function ContainerShow({ container, manifests = [] }: { container: Container; manifests: any[] }) {
  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Logistics", href: "/logistics" },
    { title: "Containers", href: "/containers" },
    { title: container.name, href: "#" }
  ];

  const weightUtilization = Math.round(((container.current_weight || 0) / container.max_payload) * 100);
  const cbmUtilization = Math.round(((container.current_cbm || 0) / container.capacity) * 100);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      AVAILABLE: "bg-emerald-50 border border-emerald-100 text-emerald-700",
      LOADING: "bg-amber-50 border border-amber-100 text-amber-700",
      FULL: "bg-rose-50 border border-rose-100 text-rose-700"
    };
    return colors[status] || "bg-slate-50 border border-slate-100 text-slate-700";
  };

  const getUtilizationColor = (percent: number) => {
    if (percent >= 90) return "text-rose-600";
    if (percent >= 70) return "text-amber-600";
    return "text-emerald-600";
  };

  const getUtilizationBg = (percent: number) => {
    if (percent >= 90) return "bg-rose-500";
    if (percent >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <>
      <Head title={container.name} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/containers" className="h-9 w-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 shadow-sm transition-all">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">{container.name}</h1>
                <p className="text-xs font-medium text-slate-500 mt-1.5">ID: {container.container_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center justify-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg ${getStatusColor(container.status)}`}>
                {container.status}
              </span>
              <Link href={`/containers/${container.id}/edit`}>
                <button className="rounded-xl gap-2 text-xs font-semibold h-9 px-4 bg-blue-650 hover:bg-blue-700 text-slate-800 border border-slate-200 shadow-sm flex items-center transition-all bg-white">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              </Link>
            </div>
          </div>

          {/* Specifications */}
          <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-sm font-bold text-slate-800">Container Specifications</CardTitle>
              <CardDescription className="text-xs text-slate-400">Physical dimensions and weight limits</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
                <div>
                  <p className="text-slate-450 font-bold uppercase tracking-wider mb-1">Length</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{container.length}</p>
                  <p className="text-[10px] text-slate-400 font-medium">meters</p>
                </div>
                <div>
                  <p className="text-slate-450 font-bold uppercase tracking-wider mb-1">Width</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{container.width}</p>
                  <p className="text-[10px] text-slate-400 font-medium">meters</p>
                </div>
                <div>
                  <p className="text-slate-450 font-bold uppercase tracking-wider mb-1">Height</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{container.height}</p>
                  <p className="text-[10px] text-slate-400 font-medium">meters</p>
                </div>
                <div>
                  <p className="text-slate-450 font-bold uppercase tracking-wider mb-1">Capacity</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{container.capacity}</p>
                  <p className="text-[10px] text-slate-400 font-medium">CBM</p>
                </div>
                <div>
                  <p className="text-slate-450 font-bold uppercase tracking-wider mb-1">Tare Weight</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{container.tare_weight.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 font-medium">kg</p>
                </div>
                <div>
                  <p className="text-slate-450 font-bold uppercase tracking-wider mb-1">Gross Weight</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{container.gross_weight.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 font-medium">kg</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-slate-450 font-bold uppercase tracking-wider mb-1">Max Payload</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{container.max_payload.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 font-medium">kg</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacity Utilization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-bold text-slate-800">Weight Utilization</CardTitle>
                <CardDescription className="text-xs text-slate-400">Current load vs maximum payload</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div>
                  <div className="flex justify-between items-center mb-2 text-xs">
                    <span className="font-bold text-slate-500">Load: {(container.current_weight || 0).toLocaleString()} / {container.max_payload.toLocaleString()} kg</span>
                    <span className={`font-extrabold ${getUtilizationColor(weightUtilization)}`}>{weightUtilization}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className={`h-full ${getUtilizationBg(weightUtilization)} transition-all`} style={{ width: `${weightUtilization}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-bold text-slate-800">Volume Utilization</CardTitle>
                <CardDescription className="text-xs text-slate-400">Current volume vs container capacity</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div>
                  <div className="flex justify-between items-center mb-2 text-xs">
                    <span className="font-bold text-slate-500">Volume: {(container.current_cbm || 0).toFixed(2)} / {container.capacity} CBM</span>
                    <span className={`font-extrabold ${getUtilizationColor(cbmUtilization)}`}>{cbmUtilization}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className={`h-full ${getUtilizationBg(cbmUtilization)} transition-all`} style={{ width: `${cbmUtilization}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Manifests */}
          <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-sm font-bold text-slate-800">Active Manifests</CardTitle>
              <CardDescription className="text-xs text-slate-400">Shipments currently using this container</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {manifests.length > 0 ? (
                <div className="space-y-3">
                  {manifests.map((manifest: any) => (
                    <Link key={manifest.id} href={`/parking_orders/${manifest.unique_id}`}>
                      <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 hover:border-slate-200 transition-all cursor-pointer">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{manifest.manifest_name}</p>
                          <p className="text-[10px] font-mono text-blue-600 font-semibold mt-0.5">{manifest.unique_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-800">{(manifest.total_weight / 1000).toFixed(1)} MT</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{manifest.total_cbm.toFixed(2)} CBM</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
                    <Box className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-405 text-slate-400">No active manifests for this container</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {container.description && (
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-bold text-slate-800">Description</CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <p className="text-xs font-medium text-slate-600 leading-relaxed">{container.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </AppLayout>
    </>
  );
}
