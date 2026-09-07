import { Head, Link, router } from '@inertiajs/react';
import { Search, Eye, Edit, MapPin, Truck, Clock3, CheckCircle2, XCircle, DollarSign, Package, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

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
      'pending': 'bg-slate-50 border border-slate-150 text-slate-500',
      'confirmed': 'bg-indigo-50 border border-indigo-100 text-indigo-755 text-indigo-700',
      'processing': 'bg-purple-50 border border-purple-100 text-purple-700',
      'assigned': 'bg-blue-50 border border-blue-100 text-blue-700',
      'picked-up': 'bg-cyan-50 border border-cyan-100 text-cyan-700',
      'in-transit': 'bg-amber-50 border border-amber-100 text-amber-705 text-amber-700',
      'delivered': 'bg-emerald-50 border border-emerald-100 text-emerald-700',
      'failed': 'bg-rose-50 border border-rose-100 text-rose-700',
      'cancelled': 'bg-slate-100 border border-slate-200 text-slate-500',
    };
    return colors[normalizedStatus] || 'bg-slate-50 border border-slate-100 text-slate-700';
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
    if (delivery.assignment_mode === 'bolt' || delivery.external_partner === 'bolt') return 'Bolt Partner';
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
      'normal': 'text-slate-650',
      'urgent': 'text-rose-600 font-extrabold',
      'scheduled': 'text-blue-600 font-semibold',
    };
    return colors[priority] || 'text-slate-500';
  };

  return (
    <>
      <Head title="Delivery Management" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Delivery Management</h1>
              <p className="text-xs font-medium text-slate-500 mt-1.5">Track and manage all deliveries</p>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[
              { label: 'Total Deliveries', value: (metrics.total_deliveries || 0).toLocaleString(), subText: 'All logs', border: 'border-slate-200', bg: 'bg-white', icon: <Package className="h-3.5 w-3.5" /> },
              { label: 'Pending', value: (metrics.pending_deliveries || 0).toLocaleString(), subText: 'Awaiting action', border: 'border-slate-100', bg: 'bg-slate-50/50', icon: <Clock3 className="h-3.5 w-3.5" /> },
              { label: 'In Transit', value: (metrics.in_transit_deliveries || 0).toLocaleString(), subText: 'On the road', valueColor: 'text-amber-700', border: 'border-amber-100', bg: 'bg-amber-50/30', icon: <Truck className="h-3.5 w-3.5" /> },
              { label: 'Completed', value: (metrics.completed_deliveries || 0).toLocaleString(), subText: 'Arrived safely', valueColor: 'text-emerald-700', border: 'border-emerald-100', bg: 'bg-emerald-50/30', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
              { label: 'Failed', value: (metrics.failed_deliveries || 0).toLocaleString(), subText: 'Issues reported', valueColor: 'text-rose-700', border: 'border-rose-100', bg: 'bg-rose-50/30', icon: <XCircle className="h-3.5 w-3.5" /> },
              { label: 'Revenue', value: `TZS ${(metrics.total_revenue || 0).toLocaleString()}`, subText: 'Total costs', valueColor: 'text-blue-700', border: 'border-blue-100', bg: 'bg-blue-50/30', icon: <DollarSign className="h-3.5 w-3.5" /> },
            ].map((s, idx) => (
              <div key={idx} className={`rounded-xl border ${s.border} px-3 py-2.5 shadow-sm hover:shadow-md transition-all ${s.bg}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="bg-white p-1 rounded-lg shadow-sm text-slate-500 border border-slate-100">{s.icon}</div>
                  <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-400">Delivery</span>
                </div>
                <p className={`text-sm font-bold tabular-nums leading-none ${s.valueColor || 'text-slate-900'}`}>{s.value}</p>
                <p className="text-[10px] font-semibold text-slate-700 mt-1">{s.label}</p>
                <p className="text-[9px] font-medium text-slate-400 mt-0.5">{s.subText}</p>
              </div>
            ))}
          </div>

          {/* Filters Card */}
          <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-sm font-bold text-slate-800">Filter Deliveries</CardTitle>
              <CardDescription className="text-xs text-slate-400">Search and narrow deliveries quickly</CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                
                <div className="space-y-2">
                  <label className="text-slate-500 uppercase tracking-wider block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      placeholder="Delivery ID, customer, or phone..."
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50 focus:bg-white transition-all h-10 shadow-none font-medium"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') applyFilters();
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-500 uppercase tracking-wider block">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-10 px-3.5 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50 hover:bg-slate-100/50 transition-all cursor-pointer font-medium"
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

                <div className="space-y-2">
                  <label className="text-slate-500 uppercase tracking-wider block">Driver</label>
                  <select
                    value={driverFilter}
                    onChange={(e) => setDriverFilter(e.target.value)}
                    className="w-full h-10 px-3.5 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50 hover:bg-slate-100/50 transition-all cursor-pointer font-medium"
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

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={applyingFilters}
                  className="rounded-xl h-9 px-4 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-650 transition-all disabled:opacity-50"
                >
                  <span className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Reset</span>
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  disabled={applyingFilters}
                  className="rounded-xl h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/30 transition-all disabled:opacity-50"
                >
                  {applyingFilters ? 'Applying...' : 'Apply Filters'}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Deliveries Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Deliveries Log</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[11px] font-semibold text-slate-400">
                    <th className="px-5 py-3 text-left">Delivery #</th>
                    <th className="px-5 py-3 text-left">Customer</th>
                    <th className="px-5 py-3 text-left">Assignee</th>
                    <th className="px-5 py-3 text-left">Address</th>
                    <th className="px-5 py-3 text-right">Total Cost</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-center">Priority</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <Truck className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                        <p className="text-sm font-semibold text-slate-400">No deliveries found</p>
                      </td>
                    </tr>
                  ) : deliveries.data.map((delivery) => (
                    <tr key={delivery.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-blue-600 font-semibold">{delivery.delivery_number}</td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{delivery.customer_name}</p>
                          <p className="text-[10px] text-slate-450 mt-0.5">{delivery.phone}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs font-bold text-slate-650">{getAssigneeLabel(delivery)}</td>
                      <td className="px-5 py-3 text-xs text-slate-600 max-w-xs truncate">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{delivery.delivery_address}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900 tabular-nums">
                        TZS {delivery.delivery_total.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center justify-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg ${getStatusColor(delivery.status)}`}>
                          {getStatusLabel(delivery.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-xs font-bold">
                        <span className={getPriorityColor(delivery.priority)}>
                          {delivery.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {(() => {
                            const rowKey = String(delivery.id);
                            const modeValue = assignmentMode[rowKey] || delivery.assignment_mode || 'delivery_personnel';
                            const isSubmitting = !!submitting[rowKey];

                            return (
                              <>
                                <select
                                  className="h-8 px-2 border border-slate-200 rounded-xl text-[10px] font-bold bg-slate-50 cursor-pointer outline-none focus:ring-1 focus:ring-blue-100"
                                  value={modeValue}
                                  onChange={(e) => setAssignmentMode((prev) => ({ ...prev, [rowKey]: e.target.value }))}
                                  disabled={isSubmitting}
                                >
                                  <option value="delivery_personnel">Personnel</option>
                                  <option value="bolt">Bolt</option>
                                  <option value="saler">Saler</option>
                                </select>

                                {modeValue === 'delivery_personnel' && (
                                  <select
                                    className="h-8 px-2 border border-slate-200 rounded-xl text-[10px] font-bold bg-slate-50 cursor-pointer outline-none focus:ring-1 focus:ring-blue-100 max-w-[120px]"
                                    value={driverSelection[rowKey] || (delivery.assigned_saler_id ? String(delivery.assigned_saler_id) : '')}
                                    onChange={(e) => setDriverSelection((prev) => ({ ...prev, [rowKey]: e.target.value }))}
                                    disabled={isSubmitting}
                                  >
                                    <option value="">Select Driver</option>
                                    {deliveryUsers.map((person) => (
                                      <option key={person.id} value={person.id}>{person.staff_name}</option>
                                    ))}
                                  </select>
                                )}

                                {modeValue === 'saler' && (
                                  <select
                                    className="h-8 px-2 border border-slate-200 rounded-xl text-[10px] font-bold bg-slate-50 cursor-pointer outline-none focus:ring-1 focus:ring-blue-100 max-w-[120px]"
                                    value={salerSelection[rowKey] || (delivery.assigned_saler_id ? String(delivery.assigned_saler_id) : '')}
                                    onChange={(e) => setSalerSelection((prev) => ({ ...prev, [rowKey]: e.target.value }))}
                                    disabled={isSubmitting}
                                  >
                                    <option value="">Select Saler</option>
                                    {salers.map((saler) => (
                                      <option key={saler.id} value={saler.id}>{saler.staff_name}</option>
                                    ))}
                                  </select>
                                )}

                                <button
                                  className="h-8 px-2.5 rounded-xl text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition-all flex items-center justify-center shrink-0"
                                  onClick={() => handleAssign(delivery)}
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? '...' : 'Assign'}
                                </button>
                              </>
                            );
                          })()}

                          {delivery.source !== 'online_order' && delivery.source !== 'sales_order' && (
                            <>
                              <Link href={`/deliveries/${delivery.id}`}>
                                <button
                                  title="View Details"
                                  className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </Link>
                              {delivery.status === 'pending' && (
                                <Link href={`/deliveries/${delivery.id}/edit`}>
                                  <button
                                    title="Edit Delivery"
                                    className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
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
          </div>
        </div>
      </AppLayout>
    </>
  );
}
