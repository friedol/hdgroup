import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, Plus, Download, Printer, Eye, Trash2, ArrowRightFromLine, ArrowLeftToLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";
import { useState } from "react";

interface Log {
  id: number;
  type: "IN" | "OUT";
  product_name: string;
  quantity: number;
  unit: string;
  handler_name: string;
  handler_type: string;
  source?: string;
  destination?: string;
  reference_number?: string;
  status: "pending" | "verified" | "rejected";
  recorded_at: string;
  recorded_by_name: string;
}

interface GatekeeperLogsProps {
  logs: {
    data: Log[];
    current_page: number;
    last_page: number;
    total: number;
  };
  summary: {
    total_in: number;
    total_out: number;
    total_quantity_in: number;
    total_quantity_out: number;
  };
  filters: {
    search?: string;
    type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  };
}

export default function Logs({ logs, summary, filters }: GatekeeperLogsProps) {
  const [filterType, setFilterType] = useState(filters.type || "");
  const [filterStatus, setFilterStatus] = useState(filters.status || "");
  const [searchTerm, setSearchTerm] = useState(filters.search || "");

  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Gatekeeper Logs", href: "#" },
  ];

  const handleFilter = () => {
    router.get("/gatekeeper", {
      search: searchTerm,
      type: filterType,
      status: filterStatus,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    return type === "IN"
      ? "bg-green-50 border-l-4 border-green-500"
      : "bg-orange-50 border-l-4 border-orange-500";
  };

  return (
    <>
      <Head title="Gatekeeper Logs" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold">Gatekeeper Logs</h1>
              <p className="text-sm text-slate-600 mt-1">
                Monitor all product movements in and out
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/gatekeeper/record-in">
                <Button className="gap-2 bg-green-600 hover:bg-green-700">
                  <ArrowLeftToLine className="w-4 h-4" />
                  Record IN
                </Button>
              </Link>
              <Link href="/gatekeeper/record-out">
                <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
                  <ArrowRightFromLine className="w-4 h-4" />
                  Record OUT
                </Button>
              </Link>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Incoming Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{summary.total_in}</div>
                <p className="text-xs text-slate-600 mt-1">
                  {summary.total_quantity_in.toLocaleString()} units
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Outgoing Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{summary.total_out}</div>
                <p className="text-xs text-slate-600 mt-1">
                  {summary.total_quantity_out.toLocaleString()} units
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{logs.total}</div>
                <p className="text-xs text-slate-600 mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => window.open(`/gatekeeper/print?search=${searchTerm}&type=${filterType}&status=${filterStatus}`, "_blank")}
                >
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Search</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Product, handler, ref..."
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="IN">Incoming</option>
                    <option value="OUT">Outgoing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button onClick={handleFilter} className="w-full">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">All Records</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-3 px-4 font-medium">Type</th>
                        <th className="text-left py-3 px-4 font-medium">Product</th>
                        <th className="text-left py-3 px-4 font-medium">Quantity</th>
                        <th className="text-left py-3 px-4 font-medium">Handler</th>
                        <th className="text-left py-3 px-4 font-medium">From/To</th>
                        <th className="text-left py-3 px-4 font-medium">Ref #</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Date & Time</th>
                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.data.map((log) => (
                        <tr key={log.id} className={`border-b hover:bg-slate-50 ${getTypeColor(log.type)}`}>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                log.type === "IN"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              {log.type === "IN" ? (
                                <>
                                  <ArrowLeftToLine className="w-3 h-3 mr-1" />
                                  IN
                                </>
                              ) : (
                                <>
                                  <ArrowRightFromLine className="w-3 h-3 mr-1" />
                                  OUT
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium">{log.product_name}</td>
                          <td className="py-3 px-4">
                            {log.quantity} {log.unit}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-xs">
                              <p className="font-medium">{log.handler_name}</p>
                              <p className="text-slate-500">{log.handler_type}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {log.type === "IN" ? log.source : log.destination}
                          </td>
                          <td className="py-3 px-4 text-xs font-mono">
                            {log.reference_number || "-"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                log.status
                              )}`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {new Date(log.recorded_at).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Link href={`/gatekeeper/${log.id}`}>
                                <Button size="sm" variant="outline" className="gap-1">
                                  <Eye className="w-3 h-3" />
                                  View
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-600">
                  <p>No gatekeeper logs found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {logs.last_page > 1 && (
            <div className="flex justify-center gap-2">
              {logs.current_page > 1 && (
                <Button variant="outline" onClick={() => router.get("/gatekeeper", { page: logs.current_page - 1 })}>
                  Previous
                </Button>
              )}
              <span className="flex items-center px-3">
                Page {logs.current_page} of {logs.last_page}
              </span>
              {logs.current_page < logs.last_page && (
                <Button variant="outline" onClick={() => router.get("/gatekeeper", { page: logs.current_page + 1 })}>
                  Next
                </Button>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
}
