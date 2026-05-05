import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Search, Eye, Edit, User } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

interface DeliveryPerson {
  id: number;
  name: string;
  phone: string;
  email: string;
  id_number: string;
  vehicle_type: string;
  status: string;
  delivery_zone: string;
  base_delivery_rate: number;
}

interface DeliveryPersonnelIndexProps {
  deliveryPeople: { data: DeliveryPerson[]; current_page: number; per_page: number; total: number };
  metrics: {
    total_personnel: number;
    active_personnel: number;
    inactive_personnel: number;
    on_leave_personnel: number;
  };
  filters: { search: string; status: string; zone: string };
}

export default function DeliveryPersonnelIndex({ deliveryPeople, metrics, filters }: DeliveryPersonnelIndexProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Logistics', href: '/logistics' },
    { title: 'Delivery Personnel', href: '#' }
  ];

  const [search, setSearch] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || '');
  const [zoneFilter, setZoneFilter] = useState(filters.zone || '');

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-700',
      'inactive': 'bg-slate-100 text-slate-700',
      'on-leave': 'bg-yellow-100 text-yellow-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getVehicleIcon = (vehicleType: string) => {
    const icons: Record<string, string> = {
      'motorcycle': '🏍️',
      'car': '🚗',
      'van': '🚐',
      'truck': '🚚',
    };
    return icons[vehicleType] || '🚗';
  };

  return (
    <>
      <Head title="Delivery Personnel" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Delivery Personnel</h1>
              <p className="text-sm text-slate-600 mt-1">Manage delivery staff and drivers</p>
            </div>
            <Link href="/delivery-personnel/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Personnel
              </Button>
            </Link>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Personnel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{metrics.total_personnel}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{metrics.active_personnel}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">On Leave</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">{metrics.on_leave_personnel}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-600">{metrics.inactive_personnel}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, phone, or ID..."
                    className="pl-9"
                    defaultValue={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <select
                  defaultValue={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on-leave">On Leave</option>
                </select>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <select
                  defaultValue={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm"
                >
                  <option value="">All Zones</option>
                  <option value="city">City Center</option>
                  <option value="suburb">Suburbs</option>
                  <option value="rural">Rural Areas</option>
                  <option value="industrial">Industrial Zone</option>
                  <option value="airport">Airport Area</option>
                </select>
              </CardContent>
            </Card>
          </div>

          {/* Personnel List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Personnel List</CardTitle>
              <CardDescription>All registered delivery personnel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Phone</th>
                      <th className="pb-3 font-medium">ID Number</th>
                      <th className="pb-3 font-medium">Vehicle</th>
                      <th className="pb-3 font-medium">Zone</th>
                      <th className="pb-3 font-medium">Rate</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {deliveryPeople.data.map((person) => (
                      <tr key={person.id} className="hover:bg-slate-50">
                        <td className="py-3 font-medium flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {person.name}
                        </td>
                        <td className="py-3 text-sm">{person.phone}</td>
                        <td className="py-3 font-mono text-xs">{person.id_number}</td>
                        <td className="py-3 text-lg">{getVehicleIcon(person.vehicle_type)} {person.vehicle_type}</td>
                        <td className="py-3 text-sm capitalize">{person.delivery_zone}</td>
                        <td className="py-3">TZS {person.base_delivery_rate?.toLocaleString() || '-'}</td>
                        <td className="py-3">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(person.status)}`}>
                            {person.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/delivery-personnel/${person.id}`} title="View">
                              <Eye className="w-4 h-4 text-blue-600 hover:text-blue-700 cursor-pointer" />
                            </Link>
                            <Link href={`/delivery-personnel/${person.id}/edit`} title="Edit">
                              <Edit className="w-4 h-4 text-amber-600 hover:text-amber-700 cursor-pointer" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
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
