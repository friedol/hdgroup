import { Head, Link, useForm } from "@inertiajs/react";
import { Search, Plus, Eye, Edit, Trash2, Filter } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function ManirestsIndex({ manifests = [], containers = [] }: { manifests: Manifest[]; containers: any[] }) {
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
      DRAFT: "bg-slate-100 text-slate-700",
      ACTIVE: "bg-blue-100 text-blue-700",
      CANCELLED: "bg-red-100 text-red-700",
      DISPATCHED: "bg-green-100 text-green-700"
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  return (
    <>
      <Head title="Manifests" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Shipping Manifests</h1>
              <p className="text-sm text-slate-600 mt-1">Create and manage cargo manifests</p>
            </div>
            <Link href="/parking_orders/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Manifest
              </Button>
            </Link>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Manifests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{manifests.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{manifests.filter((m) => m.status === "ACTIVE").length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{(manifests.reduce((sum, m) => sum + m.total_weight, 0) / 1000).toFixed(1)}K kg</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{manifests.reduce((sum, m) => sum + m.total_cbm, 0).toFixed(1)} CBM</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search manifest name or ID..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="DISPATCHED">Dispatched</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manifests Table */}
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Manifest ID</th>
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Container</th>
                      <th className="pb-3 font-medium">Weight</th>
                      <th className="pb-3 font-medium">Volume</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Created By</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.length > 0 ? (
                      filtered.map((manifest) => (
                        <tr key={manifest.id} className="hover:bg-slate-50">
                          <td className="py-3 font-mono text-xs">{manifest.unique_id}</td>
                          <td className="py-3 font-medium">{manifest.manifest_name}</td>
                          <td className="py-3 text-muted-foreground">CNT-{manifest.container_id}</td>
                          <td className="py-3">{(manifest.total_weight / 1000).toFixed(1)}K kg</td>
                          <td className="py-3">{manifest.total_cbm.toFixed(2)} CBM</td>
                          <td className="py-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(manifest.status)}`}>
                              {manifest.status}
                            </span>
                          </td>
                          <td className="py-3 text-muted-foreground">{manifest.created_by}</td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/parking_orders/${manifest.unique_id}`} title="View">
                                <Eye className="w-4 h-4 text-blue-600 hover:text-blue-700 cursor-pointer" />
                              </Link>
                              <Link href={`/parking_orders/${manifest.unique_id}/edit`} title="Edit">
                                <Edit className="w-4 h-4 text-amber-600 hover:text-amber-700 cursor-pointer" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                          No manifests found
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
