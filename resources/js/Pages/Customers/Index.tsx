import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Users, ShieldCheck, CreditCard, PieChart, MoreHorizontal, Eye, Edit, Trash2, Building2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface Customer {
  id: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  is_walking_customer?: boolean;
  customer_address?: string;
  credit_limit: number;
  is_active: boolean;
  created_at: string;
  branch?: {
    id: number;
    name: string;
  };
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
}

interface CustomersIndexProps {
  customers: PaginatedResponse<Customer>;
  kpis: {
    total: number;
    active: number;
    guests: number;
    total_credit: number;
    avg_credit: number;
  };
  filters?: {
    search?: string;
    status?: string;
    customer_type?: string;
  };
}

export default function CustomersIndex({ customers, kpis, filters = {} }: CustomersIndexProps) {
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [filterStatus, setFilterStatus] = useState(filters.status || 'all');
  const [customerType, setCustomerType] = useState(filters.customer_type || 'all');

  const customerKpis = [
    {
      title: 'Total Directory',
      value: kpis.total.toLocaleString(),
      icon: Users,
      chipLabel: 'Global',
      cardClass: 'border-blue-200 bg-blue-50/30',
      iconClass: 'bg-blue-100 text-blue-600',
      chipClass: 'text-blue-700 bg-blue-100/70',
      valueClass: 'text-slate-900',
    },
    {
      title: 'Active Accounts',
      value: kpis.active.toLocaleString(),
      icon: ShieldCheck,
      chipLabel: 'Healthy',
      cardClass: 'border-emerald-200 bg-emerald-50/30',
      iconClass: 'bg-emerald-100 text-emerald-600',
      chipClass: 'text-emerald-700 bg-emerald-100/70',
      valueClass: 'text-emerald-700',
    },
    {
      title: 'Group Credit',
      value: `${Math.round(kpis.total_credit).toLocaleString()} TZS`,
      icon: CreditCard,
      chipLabel: 'Exposure',
      cardClass: 'border-amber-200 bg-amber-50/30',
      iconClass: 'bg-amber-100 text-amber-600',
      chipClass: 'text-amber-700 bg-amber-100/70',
      valueClass: 'text-amber-700',
    },
    {
      title: 'Avg Credit',
      value: `${Math.round(kpis.avg_credit).toLocaleString()} TZS`,
      icon: PieChart,
      chipLabel: 'Average',
      cardClass: 'border-indigo-200 bg-indigo-50/30',
      iconClass: 'bg-indigo-100 text-indigo-600',
      chipClass: 'text-indigo-700 bg-indigo-100/70',
      valueClass: 'text-indigo-700',
    },
    {
      title: 'Guest List',
      value: kpis.guests.toLocaleString(),
      icon: Users,
      chipLabel: 'Guests',
      cardClass: 'border-rose-200 bg-rose-50/30',
      iconClass: 'bg-rose-100 text-rose-600',
      chipClass: 'text-rose-700 bg-rose-100/70',
      valueClass: 'text-rose-700',
    },
  ];

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'CRM', href: '#' },
    { title: 'Customers', href: '#' }
  ];

  // Manual debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
        if (searchQuery !== (filters.search || '')) {
            handleFilterChange();
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleFilterChange = (statusOverride?: string) => {
    router.get('/customers', {
      search: searchQuery,
      status: statusOverride || filterStatus,
      customer_type: customerType,
    }, {
      preserveState: true,
      replace: true
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this customer?')) {
        router.delete(`/customers/${id}`);
    }
  };

  const handlePageChange = (page: number) => {
    router.visit(`/customers?page=${page}&search=${searchQuery}&status=${filterStatus}`);
  };

  return (
    <>
      <Head title="Customers" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="w-full mx-auto space-y-6 pb-10 px-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight">Customers</h1>
           
            </div>
            <Link href="/customers/create">
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm transition-all active:scale-95">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </Link>
          </div>

            {/* Premium Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {customerKpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
              <Card key={kpi.title} className={`rounded-xl border shadow-sm hover:shadow-md transition-shadow ${kpi.cardClass}`}>
                <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg shadow-sm ${kpi.iconClass}`}>
                  <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full ${kpi.chipClass}`}>
                  {kpi.chipLabel}
                  </span>
                </div>
                <p className={`text-[13px] sm:text-[14px] font-semibold leading-none tabular-nums ${kpi.valueClass}`}>{kpi.value}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-2 tracking-wide">{kpi.title}</p>
                </CardContent>
              </Card>
              );
            })}
            </div>

          {/* Search & Filters */}
          <Card className="border-none shadow-sm overflow-hidden bg-slate-50/50">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-700 ml-1">Search</label>
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      placeholder="Type name, email or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-10 bg-white border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-none"
                    />
                  </div>
                </div>
                
                <div className="w-full md:w-[150px] space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-700 ml-1">Status</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => {
                            const nextStatus = e.target.value;
                            setFilterStatus(nextStatus);
                            router.get('/customers', {
                              search: searchQuery,
                              status: nextStatus,
                              customer_type: customerType,
                            }, {
                              preserveState: true,
                              replace: true,
                            });
                        }}
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                    >
                        <option value="all">Show all</option>
                        <option value="active">Active only</option>
                        <option value="inactive">Inactive only</option>
                    </select>
                </div>

                    <div className="w-full md:w-[170px] space-y-1.5">
                      <label className="text-[12px] font-bold text-slate-700 ml-1">Type</label>
                      <select
                        value={customerType}
                        onChange={(e) => {
                          setCustomerType(e.target.value);
                          router.get('/customers', {
                            search: searchQuery,
                            status: filterStatus,
                            customer_type: e.target.value,
                          }, {
                            preserveState: true,
                            replace: true,
                          });
                        }}
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                      >
                        <option value="all">All types</option>
                        <option value="regular">Regular only</option>
                        <option value="guest">Guest / walk-in only</option>
                      </select>
                    </div>

                <Button 
                    variant="outline" 
                    className="h-10 border-slate-200 text-slate-600 hover:bg-slate-100"
                    onClick={() => {
                        setSearchQuery('');
                        setFilterStatus('all');
                      setCustomerType('all');
                        router.visit('/customers');
                    }}
                >
                    Clear filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 font-mono">Directory</span>
                <span className="text-[11px] font-medium text-slate-400">Total entries: {customers.total}</span>
            </div>
            
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="p-4 py-3 text-[11px] font-bold text-slate-500">Customer profile</th>
                    <th className="p-4 py-3 text-[11px] font-bold text-slate-500">Branch</th>
                    <th className="p-4 py-3 text-[11px] font-bold text-slate-500">Contact line</th>
                    <th className="p-4 py-3 text-[11px] font-bold text-slate-500 text-right">Credit limit</th>
                    <th className="p-4 py-3 text-[11px] font-bold text-slate-500 text-center">Status</th>
                    <th className="p-4 py-3 text-[11px] font-bold text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {customers.data.length > 0 ? (
                    customers.data.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="p-4">
                          <div className="flex flex-col">
                            <Link 
                              href={`/customers/${row.id}`}
                              className="text-blue-600 hover:text-blue-800 font-bold text-sm tracking-tight"
                            >
                              {row.customer_name}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-bold">ID: HD-{row.id}</span>
                              {row.is_walking_customer && (
                                <Badge className="h-5 px-1.5 text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-100">Guest</Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                           <div className="flex items-center gap-2">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span className="text-xs font-bold text-slate-600">{row.branch?.name || 'Global / Unknown'}</span>
                           </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">{row.customer_phone || 'No phone'}</span>
                            <span className="text-xs text-slate-400 truncate max-w-[180px]">{row.customer_email || 'No email artifact'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono">
                          <div className="flex flex-col items-end">
                              <span className="font-black text-slate-900 leading-none">{(parseFloat(row.credit_limit?.toString() || '0')).toLocaleString()}</span>
                              <span className="text-[9px] text-slate-400 font-black mt-1 tracking-tighter">TZS</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant={row.is_active ? 'default' : 'secondary'} className={row.is_active ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100 h-5 px-1.5 text-[10px] font-black' : 'h-5 px-1.5 text-[10px] font-black'}>
                            {row.is_active ? 'Active' : 'Locked'}
                          </Badge>
                        </td>
                        <td className="p-4 pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              title="View profile"
                              onClick={() => router.visit(`/customers/${row.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              title="Edit profile"
                              onClick={() => router.visit(`/customers/${row.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete record"
                              onClick={() => handleDelete(row.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-slate-400 font-bold tracking-widest text-xs">
                         Zero records found. Clear filters to synchronize.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-400">Page {customers.current_page} artifacts</p>
                <div className="flex items-center gap-1.5">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 border-slate-200 text-xs font-bold disabled:opacity-30"
                        disabled={customers.current_page === 1}
                        onClick={() => handlePageChange(customers.current_page - 1)}
                    >
                        Prev
                    </Button>
                    <div className="flex gap-1 h-8 px-2 items-center bg-white border border-slate-100 rounded text-[11px] font-black text-slate-900">
                        {customers.current_page}
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 border-slate-200 text-xs font-bold disabled:opacity-30"
                        disabled={customers.data.length < customers.per_page}
                        onClick={() => handlePageChange(customers.current_page + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
