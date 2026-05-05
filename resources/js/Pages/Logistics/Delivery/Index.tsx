import { Head, Link, router } from '@inertiajs/react';
import { Search, Eye, Edit, MapPin, Truck, Clock3, CheckCircle2, XCircle, DollarSign, Package } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { KpiCard } from '@/components/dashboard/KpiCard';

interface Delivery {
  id: number | string;
  delivery_number: string;
  customer_name: string;
  phone: string;
  delivery_address: string;
  delivery_cost: number;
  delivery_discount: number;
  delivery_total: number;
  status: string;
  priority: string;
  delivery_person_id?: number | null;
  assignment_mode?: 'delivery_personnel' | 'bolt' | 'saler' | null;
  assigned_saler_id?: number | null;
  assigned_saler?: { id: number; staff_name: string } | null;
  external_partner?: string | null;
  delivery_person?: { name: string };
  created_at: string;
  source?: string;
}

interface Saler {
  id: number;
  staff_name: string;
}

interface DeliveryIndexProps {
  deliveries: { data: Delivery[]; current_page: number; per_page: number; total: number };
  drivers: any[];
  deliveryUsers: Saler[];
  salers: Saler[];
  metrics: {
    total_deliveries: number;
    pending_deliveries: number;
    in_transit_deliveries: number;
    completed_deliveries: number;
    failed_deliveries: number;
    total_revenue: number;
  };
  filters: { search: string; status: string; driver_id: string };
}

export default function DeliveryIndex({ deliveries, drivers, deliveryUsers, salers, metrics, filters }: DeliveryIndexProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Logistics', href: '/logistics' },
    { title: 'Delivery Management', href: '#' }
  ];

  const [search, setSearch] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || '');
  const [driverFilter, setDriverFilter] = useState(filters.driver_id || '');
  const [assignmentMode, setAssignmentMode] = useState<Record<string, string>>({});
  const [driverSelection, setDriverSelection] = useState<Record<string, string>>({});
  const [salerSelection, setSalerSelection] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [applyingFilters, setApplyingFilters] = useState(false);

  const applyFilters = () => {
    setApplyingFilters(true);

    const query: Record<string, string> = {};
    if (search.trim()) query.search = search.trim();
    if (statusFilter) query.status = statusFilter;
    if (driverFilter) query.driver_id = driverFilter;

    router.get('/deliveries', query, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onFinish: () => setApplyingFilters(false),
    });
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDriverFilter('');
    setApplyingFilters(true);

    router.get('/deliveries', {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onFinish: () => setApplyingFilters(false),
    });
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = String(status || '').toLowerCase().replace('_', '-');
    const colors: Record<string, string> = {
      'pending': 'bg-slate-100 text-slate-700',
      'confirmed': 'bg-indigo-100 text-indigo-700',
      'processing': 'bg-purple-100 text-purple-700',
      'assigned': 'bg-blue-100 text-blue-700',
      'picked-up': 'bg-cyan-100 text-cyan-700',
      'in-transit': 'bg-yellow-100 text-yellow-700',
      'delivered': 'bg-green-100 text-green-700',
      'failed': 'bg-red-100 text-red-700',
      'cancelled': 'bg-slate-400 text-slate-700',
    };
    return colors[normalizedStatus] || 'bg-slate-100 text-slate-700';
  };

  const getStatusLabel = (status: string) => {
    const normalizedStatus = String(status || '').toLowerCase().replace('_', '-');
    const labels: Record<string, string> = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'processing': 'Processing',
      'assigned': 'Assigned',
      'picked-up': 'Picked Up',
      'in-transit': 'In Transit',
      'delivered': 'Delivered',
      'failed': 'Failed',
      'cancelled': 'Cancelled',
    };
    return labels[normalizedStatus] || status;
  };

  const getAssigneeLabel = (delivery: Delivery) => {
    if (delivery.assignment_mode === 'bolt' || delivery.external_partner === 'bolt') return 'Bolt';
    if (delivery.assignment_mode === 'delivery_personnel') return delivery.assigned_saler?.staff_name || 'Delivery Personnel Assigned';
    if (delivery.assignment_mode === 'saler') return delivery.assigned_saler?.staff_name || 'Saler Assigned';
    if (delivery.delivery_person?.name) return delivery.delivery_person.name;
    return 'Unassigned';
  };

  const getSourceType = (delivery: Delivery): 'delivery' | 'online_order' | 'sales_order' => {
    if (delivery.source === 'online_order') return 'online_order';
    if (delivery.source === 'sales_order') return 'sales_order';
    return 'delivery';
  };

  const handleAssign = (delivery: Delivery) => {
    const key = String(delivery.id);
    const mode = assignmentMode[key] || delivery.assignment_mode || 'delivery_personnel';
    const selectedDriver = driverSelection[key] || (delivery.assigned_saler_id ? String(delivery.assigned_saler_id) : '');
    const selectedSaler = salerSelection[key] || (delivery.assigned_saler_id ? String(delivery.assigned_saler_id) : '');

    const payload: Record<string, string | number | null> = {
      source_type: getSourceType(delivery),
      order_number: delivery.delivery_number,
      assignment_mode: mode,
      delivery_user_id: mode === 'delivery_personnel' && selectedDriver ? Number(selectedDriver) : null,
      saler_id: mode === 'saler' && selectedSaler ? Number(selectedSaler) : null,
    };

    setSubmitting((prev) => ({ ...prev, [key]: true }));
    router.post('/deliveries/assign-order', payload, {
      preserveScroll: true,
      onFinish: () => {
        setSubmitting((prev) => ({ ...prev, [key]: false }));
      },
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'normal': 'text-slate-600',
      'urgent': 'text-red-600 font-bold',
      'scheduled': 'text-blue-600',
    };
    return colors[priority] || 'text-slate-600';
  };

  const kpis = [
    {
      title: 'Total Deliveries',
      value: Number(metrics.total_deliveries || 0).toLocaleString(),
      icon: Package,
      bgClass: 'bg-blue-50/50',
      iconBgClass: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Pending',
      value: Number(metrics.pending_deliveries || 0).toLocaleString(),
      icon: Clock3,
      bgClass: 'bg-slate-50/50',
      iconBgClass: 'bg-slate-100 text-slate-600',
    },
    {
      title: 'In Transit',
      value: Number(metrics.in_transit_deliveries || 0).toLocaleString(),
      icon: Truck,
      bgClass: 'bg-amber-50/50',
      iconBgClass: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Completed',
      value: Number(metrics.completed_deliveries || 0).toLocaleString(),
      icon: CheckCircle2,
      bgClass: 'bg-emerald-50/50',
      iconBgClass: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Failed',
      value: Number(metrics.failed_deliveries || 0).toLocaleString(),
      icon: XCircle,
      bgClass: 'bg-rose-50/50',
      iconBgClass: 'bg-rose-100 text-rose-600',
    },
    {
      title: 'Revenue',
      value: `TZS ${Number(metrics.total_revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      bgClass: 'bg-indigo-50/50',
      iconBgClass: 'bg-indigo-100 text-indigo-600',
    },
  ];

  return (
    <>
      <Head title="Delivery Management" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Delivery Management</h1>
              <p className="text-sm text-slate-600 mt-1">Track and manage all deliveries</p>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            {kpis.map((kpi) => (
              <KpiCard
                key={kpi.title}
                title={kpi.title}
                value={kpi.value}
                change={0}
                icon={kpi.icon}
                href="/deliveries"
                bgClass={kpi.bgClass}
                iconBgClass={kpi.iconBgClass}
              />
            ))}
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Filters</CardTitle>
              <CardDescription>Search and narrow deliveries quickly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Delivery ID, customer, or phone"
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') applyFilters();
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-10 px-3 py-2 border rounded-md text-sm bg-white"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="assigned">Assigned</option>
                    <option value="picked-up">Picked Up</option>
                    <option value="in-transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Driver</label>
                  <select
                    value={driverFilter}
                    onChange={(e) => setDriverFilter(e.target.value)}
                    className="w-full h-10 px-3 py-2 border rounded-md text-sm bg-white"
                  >
                    <option value="">All Drivers</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={clearFilters}
                  disabled={applyingFilters}
                >
                  Clear Filters
                </Button>
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={applyFilters}
                  disabled={applyingFilters}
                >
                  {applyingFilters ? 'Applying...' : 'Apply Filters'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Deliveries Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Deliveries List</CardTitle>
              <CardDescription>All registered deliveries and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Delivery #</th>
                      <th className="pb-3 font-medium">Customer</th>
                      <th className="pb-3 font-medium">Assignee</th>
                      <th className="pb-3 font-medium">Address</th>
                      <th className="pb-3 font-medium">Cost</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Priority</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {deliveries.data.map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-slate-50">
                        <td className="py-3 font-mono text-xs font-medium">{delivery.delivery_number}</td>
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{delivery.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{delivery.phone}</p>
                          </div>
                        </td>
                        <td className="py-3 text-sm">{getAssigneeLabel(delivery)}</td>
                        <td className="py-3 text-sm max-w-xs truncate">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {delivery.delivery_address}
                          </div>
                        </td>
                        <td className="py-3 font-medium">TZS {delivery.delivery_total.toLocaleString()}</td>
                        <td className="py-3">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(delivery.status)}`}>
                            {getStatusLabel(delivery.status)}
                          </span>
                        </td>
                        <td className={`py-3 text-sm font-medium ${getPriorityColor(delivery.priority)}`}>
                          {delivery.priority.toUpperCase()}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end items-center gap-2">
                            {(() => {
                              const rowKey = String(delivery.id);
                              const modeValue = assignmentMode[rowKey] || delivery.assignment_mode || 'delivery_personnel';
                              const isSubmitting = !!submitting[rowKey];

                              return (
                                <>
                            <select
                              className="h-8 px-2 border rounded text-xs"
                              value={modeValue}
                              onChange={(e) => setAssignmentMode((prev) => ({ ...prev, [rowKey]: e.target.value }))}
                              disabled={isSubmitting}
                            >
                              <option value="delivery_personnel">Delivery Personnel</option>
                              <option value="bolt">Bolt</option>
                              <option value="saler">Saler</option>
                            </select>

                            {modeValue === 'delivery_personnel' && (
                              <select
                                className="h-8 px-2 border rounded text-xs"
                                value={driverSelection[rowKey] || (delivery.assigned_saler_id ? String(delivery.assigned_saler_id) : '')}
                                onChange={(e) => setDriverSelection((prev) => ({ ...prev, [rowKey]: e.target.value }))}
                                disabled={isSubmitting}
                              >
                                <option value="">Select delivery personnel</option>
                                {deliveryUsers.map((person) => (
                                  <option key={person.id} value={person.id}>{person.staff_name}</option>
                                ))}
                              </select>
                            )}

                            {modeValue === 'saler' && (
                              <select
                                className="h-8 px-2 border rounded text-xs"
                                value={salerSelection[rowKey] || (delivery.assigned_saler_id ? String(delivery.assigned_saler_id) : '')}
                                onChange={(e) => setSalerSelection((prev) => ({ ...prev, [rowKey]: e.target.value }))}
                                disabled={isSubmitting}
                              >
                                <option value="">Select saler</option>
                                {salers.map((saler) => (
                                  <option key={saler.id} value={saler.id}>{saler.staff_name}</option>
                                ))}
                              </select>
                            )}

                            <Button
                              className="h-8 px-2 text-xs"
                              onClick={() => handleAssign(delivery)}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Assigning...' : 'Assign'}
                            </Button>

                                </>
                              );
                            })()}

                            {delivery.source !== 'online_order' && delivery.source !== 'sales_order' && (
                              <>
                                <Link href={`/deliveries/${delivery.id}`} title="View">
                                  <Eye className="w-4 h-4 text-blue-600 hover:text-blue-700 cursor-pointer" />
                                </Link>
                                {delivery.status === 'pending' && (
                                  <Link href={`/deliveries/${delivery.id}/edit`} title="Edit">
                                    <Edit className="w-4 h-4 text-amber-600 hover:text-amber-700 cursor-pointer" />
                                  </Link>
                                )}
                              </>
                            )}
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
