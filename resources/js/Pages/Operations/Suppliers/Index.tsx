import { Head, Link, router } from '@inertiajs/react';
import {
  Plus, Search, Truck, Phone, Mail, MapPin,
  ChevronLeft, ChevronRight, Edit2, Trash2,
  Globe, Building2, ShieldCheck, Tag, Filter,
  ArrowUpRight, Users,
} from 'lucide-react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';

interface Supplier {
  id: number;
  supplier_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  category: string | null;
  tax_id: string | null;
  status: boolean;
  branch?: { name: string };
}

interface SuppliersIndexProps {
  suppliers: {
    data: Supplier[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  filters: { search?: string };
  metrics: {
    total_suppliers: number;
    active_suppliers: number;
    categories_count: number;
  };
}

export default function SuppliersIndex({ suppliers, filters, metrics }: SuppliersIndexProps) {
  const [search, setSearch] = useState(filters.search || '');

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Operations', href: '#' },
    { title: 'Suppliers', href: '#' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/suppliers', { search }, { preserveState: true });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      router.delete(`/suppliers/${id}`);
    }
  };

  const inactive = (metrics?.total_suppliers || 0) - (metrics?.active_suppliers || 0);

  return (
    <>
      <Head title="Suppliers" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">

          {/* ── Header ── */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Suppliers</h1>
              <p className="text-sm text-slate-500 mt-0.5">Manage your procurement network and vendor relationships</p>
            </div>
            <Link href="/suppliers/create">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors">
                <Plus className="w-4 h-4" />
                Register Supplier
              </button>
            </Link>
          </div>

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Users,       bg: 'bg-indigo-50',  iconCls: 'text-indigo-600',  label: 'Total Vendors',   value: metrics?.total_suppliers  || 0, sub: 'Registered' },
              { icon: ShieldCheck, bg: 'bg-emerald-50', iconCls: 'text-emerald-600', label: 'Active',           value: metrics?.active_suppliers  || 0, sub: 'In service' },
              { icon: Truck,       bg: 'bg-rose-50',    iconCls: 'text-rose-500',    label: 'Inactive',         value: inactive,                       sub: 'Off service' },
              { icon: Tag,         bg: 'bg-amber-50',   iconCls: 'text-amber-600',   label: 'Categories',       value: metrics?.categories_count  || 0, sub: 'Unique types' },
            ].map(({ icon: Icon, bg, iconCls, label, value, sub }) => (
              <div key={label} className="rounded-xl bg-white border border-slate-200 shadow-sm px-3 py-2.5 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${iconCls}`} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="text-base font-bold text-slate-800 mt-0">{value}</p>
                  <p className="text-[9px] text-slate-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Search / Toolbar ── */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
            <div className="flex flex-wrap items-center gap-3">
              <form onSubmit={handleSearch} className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search suppliers by name, email, city…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50/50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-all"
                />
              </form>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            {suppliers.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Truck className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-600 font-medium">No suppliers found</p>
                <p className="text-slate-400 text-sm mt-1">
                  {search ? `No results for "${search}"` : 'Start by registering your first supplier'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Supplier', 'Contact', 'Location', 'Category', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 tracking-wider bg-slate-50 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suppliers.data.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-slate-50/80 transition-colors group">

                        {/* Supplier */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{supplier.supplier_name}</p>
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                                Branch: {supplier.branch?.name || 'All'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            {supplier.phone ? (
                              <a href={`tel:${supplier.phone}`} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline">
                                <Phone className="w-3 h-3 text-slate-400" />{supplier.phone}
                              </a>
                            ) : null}
                            {supplier.email ? (
                              <a href={`mailto:${supplier.email}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600">
                                <Mail className="w-3 h-3 text-slate-400" />{supplier.email}
                              </a>
                            ) : null}
                            {!supplier.phone && !supplier.email && (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-5 py-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700">
                              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              {supplier.city || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <Globe className="w-3 h-3 flex-shrink-0" />
                              {supplier.country}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase tracking-wider">
                            {supplier.category || 'Standard'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            supplier.status
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${supplier.status ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                            {supplier.status ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/suppliers/${supplier.id}/edit`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(supplier.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* ── Pagination / Footer ── */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Showing <span className="font-semibold text-slate-700">{suppliers.data.length}</span> of{' '}
                    <span className="font-semibold text-slate-700">{suppliers.total}</span> suppliers
                    {search && <> for "<span className="italic">{search}</span>"</>}
                  </span>

                  {suppliers.last_page > 1 && (
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/suppliers?page=${suppliers.current_page - 1}${search ? `&search=${search}` : ''}`}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-white transition-colors ${suppliers.current_page === 1 ? 'pointer-events-none opacity-40' : ''}`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Link>
                      <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-semibold text-xs">
                        {suppliers.current_page}
                      </span>
                      <span className="text-slate-400 text-xs px-1">of {suppliers.last_page}</span>
                      <Link
                        href={`/suppliers?page=${suppliers.current_page + 1}${search ? `&search=${search}` : ''}`}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-white transition-colors ${suppliers.current_page === suppliers.last_page ? 'pointer-events-none opacity-40' : ''}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
}
