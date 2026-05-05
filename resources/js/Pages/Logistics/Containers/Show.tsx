import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
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
      AVAILABLE: "bg-green-100 text-green-700",
      LOADING: "bg-yellow-100 text-yellow-700",
      FULL: "bg-red-100 text-red-700"
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const getUtilizationColor = (percent: number) => {
    if (percent >= 90) return "text-red-600";
    if (percent >= 70) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <>
      <Head title={container.name} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/containers">
                <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </Link>
              <div>
                <h1 className="text-3xl font-medium">{container.name}</h1>
                <p className="text-sm text-slate-600 mt-1">ID: {container.container_id}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(container.status)}`}>
                {container.status}
              </span>
              <Link href={`/containers/${container.id}/edit`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Container Specifications</CardTitle>
              <CardDescription>Physical dimensions and weight limits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Length</p>
                  <p className="text-2xl font-medium">{container.length}</p>
                  <p className="text-xs text-muted-foreground">meters</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Width</p>
                  <p className="text-2xl font-medium">{container.width}</p>
                  <p className="text-xs text-muted-foreground">meters</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Height</p>
                  <p className="text-2xl font-medium">{container.height}</p>
                  <p className="text-xs text-muted-foreground">meters</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Capacity</p>
                  <p className="text-2xl font-medium">{container.capacity}</p>
                  <p className="text-xs text-muted-foreground">CBM</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tare Weight</p>
                  <p className="text-2xl font-medium">{container.tare_weight}</p>
                  <p className="text-xs text-muted-foreground">kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Gross Weight</p>
                  <p className="text-2xl font-medium">{container.gross_weight}</p>
                  <p className="text-xs text-muted-foreground">kg</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-2">Max Payload</p>
                  <p className="text-2xl font-medium">{container.max_payload}</p>
                  <p className="text-xs text-muted-foreground">kg</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacity Utilization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Weight Utilization</CardTitle>
                <CardDescription>Current load vs maximum payload</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Load: {(container.current_weight || 0) / 1000} / {container.max_payload / 1000} MT</span>
                    <span className={`text-lg font-medium ${getUtilizationColor(weightUtilization)}`}>{weightUtilization}%</span>
                  </div>
                  <Progress value={weightUtilization} className="h-3" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Volume Utilization</CardTitle>
                <CardDescription>Current volume vs container capacity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Volume: {(container.current_cbm || 0).toFixed(2)} / {container.capacity} CBM</span>
                    <span className={`text-lg font-medium ${getUtilizationColor(cbmUtilization)}`}>{cbmUtilization}%</span>
                  </div>
                  <Progress value={cbmUtilization} className="h-3" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Manifests */}
          <Card>
            <CardHeader>
              <CardTitle>Active Manifests</CardTitle>
              <CardDescription>Shipments currently using this container</CardDescription>
            </CardHeader>
            <CardContent>
              {manifests.length > 0 ? (
                <div className="space-y-2">
                  {manifests.map((manifest: any) => (
                    <Link key={manifest.id} href={`/parking_orders/${manifest.unique_id}`}>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 cursor-pointer">
                        <div>
                          <p className="font-medium">{manifest.manifest_name}</p>
                          <p className="text-xs text-muted-foreground">{manifest.unique_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">{(manifest.total_weight / 1000).toFixed(1)} MT</p>
                          <p className="text-xs text-muted-foreground">{manifest.total_cbm.toFixed(2)} CBM</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No active manifests for this container</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {container.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{container.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </AppLayout>
    </>
  );
}
