import { Head, Link } from '@inertiajs/react';
import { Plus, Search, Eye, Edit, Package } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

interface Container {
  id: number;
  container_id: string;
  name: string;
  capacity: number;
  used_capacity?: number;
  current_weight?: number;
  current_cbm?: number;
  status: string;
}

interface ContainersIndexProps {
  containers: { data?: Container[]; current_page?: number; per_page?: number; total?: number } | Container[];
  metrics?: { total_containers: number; total_capacity: number; total_used_capacity: number; avail_capacity: number };
}

export default function ContainersIndex({ containers: rawContainers, metrics }: ContainersIndexProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Logistics', href: '/logistics' },
    { title: 'Containers', href: '#' }
  ];

  const [search, setSearch] = useState('');

  const toNumber = (value: unknown, fallback = 0): number => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  // Handle both paginated and regular array formats
  const containers = Array.isArray(rawContainers) 
    ? rawContainers 
    : (rawContainers?.data || []);

  const filtered = containers.filter(
    (c) =>
      c.container_id.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      AVAILABLE: 'bg-green-100 text-green-700',
      LOADING: 'bg-yellow-100 text-yellow-700',
      FULL: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const totalContainers = toNumber(metrics?.total_containers, containers.length);
  const totalCapacity = metrics?.total_capacity != null
    ? toNumber(metrics.total_capacity)
    : containers.reduce((sum, c) => sum + toNumber(c.capacity), 0);
  const usedCapacity = metrics?.total_used_capacity != null
    ? toNumber(metrics.total_used_capacity)
    : containers.reduce((sum, c) => sum + toNumber(c.current_cbm), 0);
  const availCapacity = metrics?.avail_capacity != null
    ? toNumber(metrics.avail_capacity)
    : (totalCapacity - usedCapacity);

  const utilization = totalCapacity > 0 ? Math.max(0, Math.min(100, Math.round((usedCapacity / totalCapacity) * 100))) : 0;

  return (
    <>
      <Head title="Containers" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Shipping Containers</h1>
              <p className="text-sm text-slate-600 mt-1">Manage logistics containers and capacity</p>
            </div>
            <Link href="/containers/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Container
              </Button>
            </Link>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Containers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalContainers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalCapacity.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">CBM</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Used Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{usedCapacity.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">{utilization}% utilized</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{availCapacity.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">CBM</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by container ID or name..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Containers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Containers List</CardTitle>
              <CardDescription>All registered shipping containers</CardDescription>
            </CardHeader>
            <CardContent>
              {filtered.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-left text-muted-foreground">
                        <th className="pb-3 font-medium">Container ID</th>
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Capacity</th>
                        <th className="pb-3 font-medium">Current Load</th>
                        <th className="pb-3 font-medium">Utilization</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.map((container) => {
                        const capacity = toNumber(container.capacity);
                        const currentCbm = toNumber(container.current_cbm);
                        const utilized = capacity > 0 ? Math.max(0, Math.min(100, (currentCbm / capacity) * 100)) : 0;
                        return (
                          <tr key={container.id} className="hover:bg-slate-50">
                            <td className="py-3 font-mono text-xs font-medium">{container.container_id}</td>
                            <td className="py-3 font-medium">{container.name}</td>
                            <td className="py-3">{capacity.toFixed(2)} CBM</td>
                            <td className="py-3">{currentCbm.toFixed(2)} CBM</td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden">
                                  <div className="h-full bg-blue-500" style={{ width: `${utilized}%` }} />
                                </div>
                                <span className="text-xs font-medium w-8">{Math.round(utilized)}%</span>
                              </div>
                            </td>
                            <td className="py-3">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(container.status)}`}>
                                {container.status}
                              </span>
                            </td>
                            <td className="py-3 text-right flex justify-end gap-2">
                              <Link href={`/containers/${container.id}`} title="View">
                                <Eye className="w-4 h-4 text-blue-600 hover:text-blue-700 cursor-pointer" />
                              </Link>
                              <Link href={`/containers/${container.id}/edit`} title="Edit">
                                <Edit className="w-4 h-4 text-amber-600 hover:text-amber-700 cursor-pointer" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-2">No containers found</p>
                  {containers.length === 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">Get started by creating your first container</p>
                      <Link href="/containers/create">
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Create Container
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Try adjusting your search criteria</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}
