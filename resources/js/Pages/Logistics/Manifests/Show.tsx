import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Printer, Edit, Box, FileText, TrendingUp, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      DRAFT: "bg-slate-50 border border-slate-150 text-slate-500",
      ACTIVE: "bg-blue-50 border border-blue-100 text-blue-700",
      DISPATCHED: "bg-emerald-50 border border-emerald-100 text-emerald-700",
      CANCELLED: "bg-rose-50 border border-rose-100 text-rose-700",
    };
    return colors[status] || "bg-slate-50 border border-slate-100 text-slate-700";
  };

  return (
    <>
      <Head title={manifest.manifest_name} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/parking_orders" className="h-9 w-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 shadow-sm transition-all">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">{manifest.manifest_name}</h1>
                <p className="text-xs font-medium text-slate-500 mt-1.5">ID: {manifest.unique_id}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => window.print()}
                className="rounded-xl gap-2 text-xs font-semibold h-9 px-4 bg-white border border-slate-200 text-slate-700 shadow-sm flex items-center hover:bg-slate-50 transition-all"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <Link href={`/parking_orders/${manifest.unique_id}/edit`}>
                <button className="rounded-xl gap-2 text-xs font-semibold h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center transition-all">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              </Link>
            </div>
          </div>

          {/* Manifest Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { 
                label: 'Status', 
                value: manifest.status, 
                subText: 'Cargo stage', 
                isBadge: true,
                badgeColor: getStatusColor(manifest.status),
                border: 'border-slate-200', 
                bg: 'bg-white', 
                icon: <FileText className="h-4 w-4 md:h-5 md:w-5" /> 
              },
              { 
                label: 'Total Weight', 
                value: `${(manifest.total_weight / 1000).toFixed(1)} MT`, 
                subText: `${manifest.total_weight.toLocaleString()} kg total`, 
                valueColor: 'text-amber-700', 
                border: 'border-amber-100', 
                bg: 'bg-amber-50/30', 
                icon: <TrendingUp className="h-4 w-4 md:h-5 md:w-5" /> 
              },
              { 
                label: 'Total Volume', 
                value: `${manifest.total_cbm.toFixed(2)} CBM`, 
                subText: 'Cubic volume loaded', 
                valueColor: 'text-emerald-700', 
                border: 'border-emerald-100', 
                bg: 'bg-emerald-50/30', 
                icon: <Package className="h-4 w-4 md:h-5 md:w-5" /> 
              },
              { 
                label: 'Items Included', 
                value: manifest.orders?.length || 0, 
                subText: 'Distinct products', 
                valueColor: 'text-blue-700', 
                border: 'border-blue-100', 
                bg: 'bg-blue-50/30', 
                icon: <Box className="h-4 w-4 md:h-5 md:w-5" /> 
              },
            ].map((s, idx) => (
              <div key={idx} className={`rounded-xl border ${s.border} px-3 py-2.5 shadow-sm hover:shadow-md transition-all ${s.bg}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="bg-white p-1 rounded-lg shadow-sm text-slate-500 border border-slate-100">{s.icon}</div>
                  <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-400">Logistics</span>
                </div>
                {s.isBadge ? (
                  <div className="mt-0.5">
                    <span className={`inline-flex items-center justify-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg ${s.badgeColor}`}>
                      {s.value}
                    </span>
                  </div>
                ) : (
                  <p className={`text-sm font-bold tabular-nums leading-none ${s.valueColor}`}>{s.value}</p>
                )}
                <p className="text-[10px] font-semibold text-slate-700 mt-1">{s.label}</p>
                <p className="text-[9px] font-medium text-slate-400 mt-0.5">{s.subText}</p>
              </div>
            ))}
          </div>

          {/* Container Information */}
          <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-sm font-bold text-slate-800">Container Information</CardTitle>
              <CardDescription className="text-xs text-slate-400">Assigned shipping container</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-xs">
                <div>
                  <p className="text-slate-450 font-bold uppercase tracking-wider mb-1">Container No.</p>
                  <p className="text-sm font-bold text-blue-600 font-mono">{container?.container_id || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-450 font-bold uppercase tracking-wider mb-1">Name</p>
                  <p className="text-sm font-bold text-slate-800">{container?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-450 font-bold uppercase tracking-wider mb-1">Capacity</p>
                  <p className="text-sm font-bold text-slate-800">{container?.capacity || "0"} CBM</p>
                </div>
                <div>
                  <p className="text-slate-450 font-bold uppercase tracking-wider mb-1">Max Payload</p>
                  <p className="text-sm font-bold text-slate-800">{(container?.max_payload || 0).toLocaleString()} kg</p>
                </div>
                <div>
                  <p className="text-slate-450 font-bold uppercase tracking-wider mb-1">Utilization</p>
                  <p className="text-sm font-bold text-blue-600">
                    {container?.capacity ? Math.round((manifest.total_cbm / container.capacity) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cargo Items */}
          <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-sm font-bold text-slate-800">Cargo Items</CardTitle>
              <CardDescription className="text-xs text-slate-400">Products in this manifest</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[11px] font-semibold text-slate-400">
                      <th className="px-5 py-3 text-left">Product ID</th>
                      <th className="px-5 py-3 text-left">Product Name</th>
                      <th className="px-5 py-3 text-right">Quantity</th>
                      <th className="px-5 py-3 text-right">Weight (kg)</th>
                      <th className="px-5 py-3 text-right">Volume (CBM)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manifest.orders && manifest.orders.length > 0 ? (
                      manifest.orders.map((item) => (
                        <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 font-mono text-xs text-blue-600 font-semibold">{item.product_id}</td>
                          <td className="px-5 py-3 font-semibold text-slate-900">{item.product_name}</td>
                          <td className="px-5 py-3 text-right font-bold text-slate-800 tabular-nums">{item.quantity}</td>
                          <td className="px-5 py-3 text-right font-bold text-slate-800 tabular-nums">{(item.total_weight / 1000).toFixed(2)}K</td>
                          <td className="px-5 py-3 text-right font-bold text-slate-800 tabular-nums">{item.total_cbm.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-5 py-16 text-center">
                          <Box className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                          <p className="text-sm font-semibold text-slate-400">No items in this manifest</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <Card className="rounded-2xl border border-slate-200 shadow-sm bg-slate-50 overflow-hidden">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-600 items-center">
                <div>
                  <p className="text-slate-450 uppercase tracking-wider mb-1">Created By</p>
                  <p className="text-sm font-bold text-slate-800">{manifest.created_by}</p>
                </div>
                <div>
                  <p className="text-slate-450 uppercase tracking-wider mb-1">Created On</p>
                  <p className="text-sm font-bold text-slate-800">{new Date(manifest.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <Link href={`/parking_orders/${manifest.unique_id}/edit`}>
                    <button className="rounded-xl h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/30 transition-all">
                      Edit Manifest Details
                    </button>
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
