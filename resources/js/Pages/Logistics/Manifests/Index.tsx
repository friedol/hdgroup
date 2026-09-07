import { Head, Link } from "@inertiajs/react";
import { Search, Plus, Eye, Edit, Box, FileText, TrendingUp, Package } from "lucide-react";
import { useState } from "react";
import AppLayout from "@/layouts/app-layout";

interface Manifest {
  id: number;
  unique_id: string;
  manifest_name: string;
  container_id: number;
  status: "DRAFT" | "ACTIVE" | "CANCELLED" | "DISPATCHED";
  total_weight: number;
  total_cbm: number;
  created_by: string;
  created_at: string;
  items_count?: number;
}

export default function ManifestsIndex({ manifests = [], containers = [] }: { manifests: Manifest[]; containers: any[] }) {
  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Logistics", href: "/logistics" },
    { title: "Manifests", href: "#" }
  ];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = manifests.filter((m) => {
    const matchesSearch = m.manifest_name.toLowerCase().includes(search.toLowerCase()) || m.unique_id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      <Head title="Manifests" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Shipping Manifests</h1>
              <p className="text-xs font-medium text-slate-500 mt-1.5">Create and manage cargo manifests</p>
            </div>
            <Link href="/parking_orders/create">
              <button className="rounded-xl gap-2 text-xs font-semibold h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/30 flex items-center transition-all">
                <Plus className="h-3.5 w-3.5" /> New Manifest
              </button>
            </Link>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { 
                label: 'Total Manifests', 
                value: manifests.length, 
                subText: 'Cargo orders', 
                valueColor: 'text-slate-900', 
                border: 'border-slate-200', 
                bg: 'bg-white', 
                icon: <FileText className="h-4 w-4 md:h-5 md:w-5" /> 
              },
              { 
                label: 'Active Manifests', 
                value: manifests.filter((m) => m.status === "ACTIVE").length, 
                subText: 'In progress manifests', 
                valueColor: 'text-blue-700', 
                border: 'border-blue-100', 
                bg: 'bg-blue-50/30', 
                icon: <Box className="h-4 w-4 md:h-5 md:w-5" /> 
              },
              { 
                label: 'Total Weight', 
                value: `${(manifests.reduce((sum, m) => sum + m.total_weight, 0) / 1000).toFixed(1)}K kg`, 
                subText: 'Metric weight sum', 
                valueColor: 'text-amber-700', 
                border: 'border-amber-100', 
                bg: 'bg-amber-50/30', 
                icon: <TrendingUp className="h-4 w-4 md:h-5 md:w-5" /> 
              },
              { 
                label: 'Total Volume', 
                value: `${manifests.reduce((sum, m) => sum + m.total_cbm, 0).toFixed(1)} CBM`, 
                subText: 'Cubic space total', 
                valueColor: 'text-emerald-700', 
                border: 'border-emerald-100', 
                bg: 'bg-emerald-50/30', 
                icon: <Package className="h-4 w-4 md:h-5 md:w-5" /> 
              },
            ].map((s, idx) => (
              <div key={idx} className={`rounded-xl border ${s.border} px-3 py-2.5 shadow-sm hover:shadow-md transition-all ${s.bg}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="bg-white p-1 rounded-lg shadow-sm text-slate-500 border border-slate-100">{s.icon}</div>
                  <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-400">Logistics</span>
                </div>
                <p className={`text-sm font-bold tabular-nums leading-none ${s.valueColor}`}>{s.value}</p>
                <p className="text-[10px] font-semibold text-slate-700 mt-1">{s.label}</p>
                <p className="text-[9px] font-medium text-slate-400 mt-0.5">{s.subText}</p>
              </div>
            ))}
          </div>

          {/* Table Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search manifest name or ID..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50 focus:bg-white transition-all h-9"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl outline-none bg-slate-50 hover:bg-slate-100 transition-all h-9 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DISPATCHED">Dispatched</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[11px] font-semibold text-slate-400">
                    <th className="px-5 py-3 text-left">Manifest ID</th>
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-left">Container</th>
                    <th className="px-5 py-3 text-right">Weight</th>
                    <th className="px-5 py-3 text-right">Volume</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-left">Created By</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <FileText className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                        <p className="text-sm font-semibold text-slate-400">No manifests found</p>
                        <p className="text-[11px] text-slate-300 mt-1">Try a different filter or search query</p>
                      </td>
                    </tr>
                  ) : filtered.map((manifest) => (
                    <tr key={manifest.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-blue-600 font-semibold">{manifest.unique_id}</td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{manifest.manifest_name}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-650">CNT-{manifest.container_id}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-800 tabular-nums">{(manifest.total_weight / 1000).toFixed(1)}K kg</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-800 tabular-nums">{manifest.total_cbm.toFixed(2)} CBM</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center justify-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg ${getStatusColor(manifest.status)}`}>
                          {manifest.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-slate-600">{manifest.created_by}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/parking_orders/${manifest.unique_id}`}>
                            <button
                              title="View Manifest"
                              className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>
                          <Link href={`/parking_orders/${manifest.unique_id}/edit`}>
                            <button
                              title="Edit Manifest"
                              className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
