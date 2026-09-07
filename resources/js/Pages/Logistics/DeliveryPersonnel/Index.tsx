import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Eye, Edit, User, Users, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
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

  const applyFilters = () => {
    const query: Record<string, string> = {};
    if (search.trim()) query.search = search.trim();
    if (statusFilter) query.status = statusFilter;
    if (zoneFilter) query.zone = zoneFilter;

    router.get('/delivery-personnel', query, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-emerald-50 border border-emerald-105 text-emerald-705 text-emerald-700',
      'inactive': 'bg-slate-50 border border-slate-200 text-slate-500',
      'on-leave': 'bg-amber-50 border border-amber-105 text-amber-705 text-amber-700',
    };
    return colors[status] || 'bg-slate-50 border border-slate-100 text-slate-700';
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
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Delivery Personnel</h1>
              <p className="text-xs font-medium text-slate-500 mt-1.5">Manage delivery staff and drivers</p>
            </div>
            <Link href="/delivery-personnel/create">
              <button className="rounded-xl gap-2 text-xs font-semibold h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/30 flex items-center transition-all">
                <Plus className="h-3.5 w-3.5" /> Add Personnel
              </button>
            </Link>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { 
                label: 'Total Personnel', 
                value: metrics.total_personnel, 
                subText: 'Registered drivers', 
                valueColor: 'text-slate-900', 
                border: 'border-slate-200', 
                bg: 'bg-white', 
                icon: <Users className="h-4 w-4 md:h-5 md:w-5" /> 
              },
              { 
                label: 'Active Drivers', 
                value: metrics.active_personnel, 
                subText: 'Currently working', 
                valueColor: 'text-emerald-700', 
                border: 'border-emerald-100', 
                bg: 'bg-emerald-50/30', 
                icon: <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" /> 
              },
              { 
                label: 'On Leave', 
                value: metrics.on_leave_personnel, 
                subText: 'Temporary out', 
                valueColor: 'text-amber-700', 
                border: 'border-amber-100', 
                bg: 'bg-amber-50/30', 
                icon: <AlertCircle className="h-4 w-4 md:h-5 md:w-5" /> 
              },
              { 
                label: 'Inactive Drivers', 
                value: metrics.inactive_personnel, 
                subText: 'Deactivated staff', 
                valueColor: 'text-slate-500', 
                border: 'border-slate-150', 
                bg: 'bg-slate-50/50', 
                icon: <ShieldAlert className="h-4 w-4 md:h-5 md:w-5" /> 
              },
            ].map((s, idx) => (
              <div key={idx} className={`rounded-xl border ${s.border} px-3 py-2.5 shadow-sm hover:shadow-md transition-all ${s.bg}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="bg-white p-1 rounded-lg shadow-sm text-slate-500 border border-slate-100">{s.icon}</div>
                  <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-400">Personnel</span>
                </div>
                <p className={`text-sm font-bold tabular-nums leading-none ${s.valueColor}`}>{s.value}</p>
                <p className="text-[10px] font-semibold text-slate-700 mt-1">{s.label}</p>
                <p className="text-[9px] font-medium text-slate-400 mt-0.5">{s.subText}</p>
              </div>
            ))}
          </div>

          {/* Table Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            
            {/* Toolbar Filters */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyFilters()}
                  placeholder="Search name, phone, or ID..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50 focus:bg-white transition-all h-9"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    router.get('/delivery-personnel', { search, status: e.target.value, zone: zoneFilter }, { preserveState: true });
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl outline-none bg-slate-50 hover:bg-slate-100 transition-all h-9 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on-leave">On Leave</option>
                </select>

                <select
                  value={zoneFilter}
                  onChange={(e) => {
                    setZoneFilter(e.target.value);
                    router.get('/delivery-personnel', { search, status: statusFilter, zone: e.target.value }, { preserveState: true });
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl outline-none bg-slate-50 hover:bg-slate-100 transition-all h-9 cursor-pointer"
                >
                  <option value="">All Zones</option>
                  <option value="city">City Center</option>
                  <option value="suburb">Suburbs</option>
                  <option value="rural">Rural Areas</option>
                  <option value="industrial">Industrial Zone</option>
                  <option value="airport">Airport Area</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[11px] font-semibold text-slate-400">
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-left">Phone</th>
                    <th className="px-5 py-3 text-left">ID Number</th>
                    <th className="px-5 py-3 text-left">Vehicle</th>
                    <th className="px-5 py-3 text-left">Zone</th>
                    <th className="px-5 py-3 text-right">Rate</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryPeople.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <User className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                        <p className="text-sm font-semibold text-slate-400">No personnel found</p>
                        <p className="text-[11px] text-slate-300 mt-1">Try a different search or filter query</p>
                      </td>
                    </tr>
                  ) : deliveryPeople.data.map((person) => (
                    <tr key={person.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-slate-150 bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-450 shrink-0">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                          <span className="font-semibold text-slate-900 leading-tight">{person.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-650">{person.phone}</td>
                      <td className="px-5 py-3 font-mono text-xs text-blue-600 font-semibold">{person.id_number}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-slate-600">
                        <span className="mr-1 text-sm">{getVehicleIcon(person.vehicle_type)}</span>
                        <span className="capitalize">{person.vehicle_type}</span>
                      </td>
                      <td className="px-5 py-3 text-xs font-bold text-slate-600 capitalize">{person.delivery_zone}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-800 tabular-nums">
                        {person.base_delivery_rate ? `TZS ${person.base_delivery_rate.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center justify-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg ${getStatusColor(person.status)}`}>
                          {person.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/delivery-personnel/${person.id}`}>
                            <button
                              title="View Profile"
                              className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>
                          <Link href={`/delivery-personnel/${person.id}/edit`}>
                            <button
                              title="Edit Profile"
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
