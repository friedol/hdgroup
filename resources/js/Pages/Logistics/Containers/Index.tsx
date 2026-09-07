import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Eye, Edit, Box, Package, TrendingUp, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
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

  // Check if it is paginated
  const isPaginated = !Array.isArray(rawContainers);
  const paginationData = isPaginated ? (rawContainers as any) : null;
  const current_page = paginationData?.current_page || 1;
  const total = paginationData?.total || 0;
  const per_page = paginationData?.per_page || 15;
  const totalPages = Math.ceil(total / per_page);

  // Initialize search with either url parameter or empty
  const [search, setSearch] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('search') || '';
    }
    return '';
  });

  const handlePage = (page: number) => {
    router.get('/containers', { page, search }, { preserveState: true });
  };

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
      AVAILABLE: 'bg-emerald-50 border border-emerald-100 text-emerald-700',
      LOADING: 'bg-amber-50 border border-amber-100 text-amber-700',
      FULL: 'bg-rose-50 border border-rose-100 text-rose-700'
    };
    return colors[status] || 'bg-slate-50 border border-slate-100 text-slate-700';
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/containers', { search }, { preserveState: true });
  };

  return (
    <>
      <Head title="Containers" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Shipping Containers</h1>
              <p className="text-xs font-medium text-slate-500 mt-1.5">Manage logistics containers and capacity</p>
            </div>
            <Link href="/containers/create">
              <button className="rounded-xl gap-2 text-xs font-semibold h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/30 flex items-center transition-all">
                <Plus className="h-3.5 w-3.5" /> New Container
              </button>
            </Link>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { 
                label: 'Total Containers', 
                value: totalContainers, 
                subText: 'Registered assets', 
                valueColor: 'text-slate-900', 
                border: 'border-slate-200', 
                bg: 'bg-white', 
                icon: <Box className="h-4 w-4 md:h-5 md:w-5" /> 
              },
              { 
                label: 'Total Capacity', 
                value: `${totalCapacity.toFixed(0)} CBM`, 
                subText: 'Volume limit', 
                valueColor: 'text-blue-700', 
                border: 'border-blue-100', 
                bg: 'bg-blue-50/30', 
                icon: <Package className="h-4 w-4 md:h-5 md:w-5" /> 
              },
              { 
                label: 'Used Capacity', 
                value: `${usedCapacity.toFixed(1)} CBM`, 
                subText: `${utilization}% utilized`, 
                valueColor: 'text-violet-700', 
                border: 'border-violet-100', 
                bg: 'bg-violet-50/30', 
                icon: <TrendingUp className="h-4 w-4 md:h-5 md:w-5" /> 
              },
              { 
                label: 'Available Capacity', 
                value: `${availCapacity.toFixed(1)} CBM`, 
                subText: 'Remaining space', 
                valueColor: 'text-emerald-700', 
                border: 'border-emerald-100', 
                bg: 'bg-emerald-50/30', 
                icon: <Truck className="h-4 w-4 md:h-5 md:w-5" /> 
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
            
            {/* Search Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by container ID or name..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50 focus:bg-white transition-all h-9"
                />
              </form>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[11px] font-semibold text-slate-400">
                    <th className="px-5 py-3 text-left">Container ID</th>
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-right">Capacity</th>
                    <th className="px-5 py-3 text-right">Current Load</th>
                    <th className="px-5 py-3 text-center">Utilization</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <Box className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                        <p className="text-sm font-semibold text-slate-400">No containers found</p>
                        <p className="text-[11px] text-slate-300 mt-1">Try a different search or create one</p>
                      </td>
                    </tr>
                  ) : filtered.map((container) => {
                    const capacity = toNumber(container.capacity);
                    const currentCbm = toNumber(container.current_cbm);
                    const utilized = capacity > 0 ? Math.max(0, Math.min(100, (currentCbm / capacity) * 100)) : 0;
                    
                    return (
                      <tr key={container.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-blue-600 font-semibold">{container.container_id}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900">{container.name}</td>
                        <td className="px-5 py-3 text-right font-bold text-slate-800 tabular-nums">{capacity.toFixed(2)} CBM</td>
                        <td className="px-5 py-3 text-right font-bold text-slate-800 tabular-nums">{currentCbm.toFixed(2)} CBM</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-100">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${utilized}%` }} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-650 w-8 tabular-nums">{Math.round(utilized)}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center justify-center text-[10px] font-bold px-2.5 py-0.5 rounded-lg ${getStatusColor(container.status)}`}>
                            {container.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/containers/${container.id}`}>
                              <button
                                title="View Container"
                                className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </Link>
                            <Link href={`/containers/${container.id}/edit`}>
                              <button
                                title="Edit Container"
                                className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {isPaginated && total > per_page && (
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500">
                  Showing <span className="text-slate-800">{containers.length}</span> of <span className="text-slate-800">{total}</span> containers
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePage(current_page - 1)}
                    disabled={current_page === 1}
                    className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:border-blue-200 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-700 px-2">
                    {current_page} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePage(current_page + 1)}
                    disabled={current_page >= totalPages}
                    className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:border-blue-200 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}
