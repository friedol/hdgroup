import { Head, router, useForm } from "@inertiajs/react";
import {
  Plus, Edit, Trash2, Search, Building2, Globe, Shield,
  ImageIcon, Upload, Compass, ChevronLeft, ChevronRight,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from "@/layouts/app-layout";

/* ─── Types ────────────────────────────────────── */
interface Branch {
  id: number;
  name: string;
  system_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string | null;
  favicon?: string | null;
  is_active: boolean | number;
  is_manufacturing_enabled: boolean | number;
}

interface BranchesIndexProps {
  branches: { data: Branch[]; current_page: number; per_page: number; total: number };
}

/* ─── Component ────────────────────────────────── */
export default function Index({ branches }: BranchesIndexProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, setData, processing, errors, reset, clearErrors } = useForm({
    name: "",
    system_name: "",
    address: "",
    phone: "",
    email: "",
    is_active: true,
    is_manufacturing_enabled: false,
    logo: null as File | null,
    favicon: null as File | null,
    _method: 'POST'
  });

  const breadcrumbs = [
    { title: 'Location', href: '#' },
    { title: 'Branches', href: '/branches' },
  ];

  const handlePage = (page: number) => {
    router.get('/branches', { page }, { preserveState: true });
  };

  const openCreateModal = () => {
    setEditingBranch(null);
    setData({
      name: "", system_name: "", address: "", phone: "", email: "",
      is_active: true, is_manufacturing_enabled: false,
      logo: null, favicon: null, _method: 'POST'
    });
    clearErrors();
    setIsModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setData({
      name: branch.name || "",
      system_name: branch.system_name || "",
      address: branch.address || "",
      phone: branch.phone || "",
      email: branch.email || "",
      is_active: !!branch.is_active,
      is_manufacturing_enabled: !!branch.is_manufacturing_enabled,
      logo: null, favicon: null, _method: 'PUT'
    });
    clearErrors();
    setIsModalOpen(true);
  };

  const handleDelete = async (branch: Branch) => {
    if (!confirm(`Are you sure you want to delete branch "${branch.name}"? This action cannot be undone.`)) return;
    try {
      const response = await axios.post(`/branches/${branch.id}/delete`);
      toast.success(response.data.message || 'Branch deleted successfully');
      router.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete branch');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("system_name", data.system_name || "");
    formData.append("address", data.address || "");
    formData.append("phone", data.phone || "");
    formData.append("email", data.email || "");
    formData.append("is_active", data.is_active ? "1" : "0");
    formData.append("is_manufacturing_enabled", data.is_manufacturing_enabled ? "1" : "0");
    if (data.logo)    formData.append("logo", data.logo);
    if (data.favicon) formData.append("favicon", data.favicon);

    if (editingBranch) {
      formData.append("_method", "PUT");
      router.post(`/branches/${editingBranch.id}`, formData, {
        onSuccess: () => { setIsModalOpen(false); toast.success('Branch updated successfully'); reset(); },
        onError: () => { toast.error('Failed to update branch'); },
      });
    } else {
      router.post('/branches', formData, {
        onSuccess: () => { setIsModalOpen(false); toast.success('Branch created successfully'); reset(); },
        onError: () => { toast.error('Failed to create branch'); },
      });
    }
  };

  const filteredBranches = branches.data.filter(
    b =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.system_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = branches.data.filter(b => b.is_active).length;
  const totalPages = Math.ceil(branches.total / branches.per_page);

  return (
    <>
      <Head title="Branches" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="w-full space-y-8 pb-10">

          <div className="mt-0 space-y-6">

              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Operational Branches</h3>
                <Button
                  size="sm"
                  onClick={openCreateModal}
                  className="rounded-xl gap-2 text-xs font-semibold h-9 bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/30"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Branch
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total branches',          value: branches.total,                                          valueColor: 'text-slate-900',   border: 'border-slate-200',  bg: 'bg-white',         chip: 'bg-slate-50/80',  chipText: 'Units',        icon: <Building2 className="h-4 w-4 md:h-5 md:w-5" /> },
                  { label: 'Active branches',          value: activeCount,                                             valueColor: 'text-emerald-700', border: 'border-emerald-200',bg: 'bg-emerald-50/30', chip: 'bg-emerald-50/80',chipText: 'Status',       icon: <Globe className="h-4 w-4 md:h-5 md:w-5" /> },
                  { label: 'Manufacturing enabled',    value: branches.data.filter(b => b.is_manufacturing_enabled).length, valueColor: 'text-blue-700',    border: 'border-blue-200',   bg: 'bg-blue-50/30',    chip: 'bg-blue-50/80',   chipText: 'Capabilities', icon: <Compass className="h-4 w-4 md:h-5 md:w-5" /> },
                  { label: 'Inactive branches',        value: branches.total - activeCount,                            valueColor: 'text-slate-500',   border: 'border-slate-200',  bg: 'bg-slate-50/10',   chip: 'bg-slate-100',    chipText: 'Archived',     icon: <Shield className="h-4 w-4 md:h-5 md:w-5" /> },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl border ${s.border} p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow ${s.bg}`}>
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <div className="bg-white p-1.5 md:p-2 rounded-lg shadow-sm text-slate-500">{s.icon}</div>
                      <span className={`text-[8px] md:text-[10px] font-medium px-1.5 md:px-2 py-0.5 rounded-full ${s.chip} text-slate-600`}>{s.chipText}</span>
                    </div>
                    <p className={`text-lg md:text-2xl font-semibold tabular-nums leading-none ${s.valueColor}`}>{s.value}</p>
                    <p className="text-[10px] md:text-xs font-medium text-slate-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Table card */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by name, system name, email..."
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[11px] font-semibold text-slate-400">
                        <th className="px-5 py-3 text-left w-[80px]">Logo</th>
                        <th className="px-5 py-3 text-left">Branch Name</th>
                        <th className="px-5 py-3 text-left">System Name</th>
                        <th className="px-5 py-3 text-left">Phone</th>
                        <th className="px-5 py-3 text-left">Email</th>
                        <th className="px-5 py-3 text-left">Address</th>
                        <th className="px-5 py-3 text-center">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBranches.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-5 py-16 text-center">
                            <Building2 className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                            <p className="text-sm font-semibold text-slate-400">No branches found</p>
                            <p className="text-[11px] text-slate-300 mt-1">Try another search query or add a branch</p>
                          </td>
                        </tr>
                      ) : filteredBranches.map(row => (
                        <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              {row.logo ? (
                                <img src={`/storage/${row.logo}`} alt={row.name} className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              ) : (
                                <Building2 className="h-4 w-4 text-slate-300" />
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-900">{row.name}</td>
                          <td className="px-5 py-3 text-slate-600 font-medium">{row.system_name || '-'}</td>
                          <td className="px-5 py-3 text-xs font-mono text-slate-600">{row.phone || '-'}</td>
                          <td className="px-5 py-3 text-slate-600">{row.email || '-'}</td>
                          <td className="px-5 py-3 text-xs text-slate-500 max-w-xs truncate">{row.address || '-'}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`inline-flex items-center justify-center text-[10px] font-semibold px-2.5 py-1 rounded-lg ${row.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {row.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => openEditModal(row)} title="Edit" className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(row)} title="Delete" className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {branches.total > branches.per_page && (
                  <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500">
                      Showing <span className="text-slate-800">{branches.data.length}</span> of <span className="text-slate-800">{branches.total}</span> branches
                    </p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handlePage(branches.current_page - 1)} disabled={branches.current_page === 1} className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:border-blue-200 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-xs font-semibold text-slate-700 px-2">{branches.current_page} / {totalPages}</span>
                      <button onClick={() => handlePage(branches.current_page + 1)} disabled={branches.current_page >= totalPages} className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:border-blue-200 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
        </div>
      </AppLayout>

      {/* Create / Edit dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingBranch ? 'Edit Branch' : 'Add Branch'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-600">Branch Name <span className="text-red-500">*</span></Label>
                <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Kariakoo Hub" className="rounded-xl border-slate-200" required />
                {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="system_name" className="text-xs font-semibold text-slate-600">System Display Name</Label>
                <Input id="system_name" value={data.system_name} onChange={e => setData('system_name', e.target.value)} placeholder="e.g. Jopo Kariakoo Branch" className="rounded-xl border-slate-200" />
                {errors.system_name && <p className="text-red-500 text-xs mt-0.5">{errors.system_name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold text-slate-600">Phone</Label>
                <Input id="phone" value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="+255..." className="rounded-xl border-slate-200" />
                {errors.phone && <p className="text-red-500 text-xs mt-0.5">{errors.phone}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-600">Email Address</Label>
                <Input id="email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="manager@branch.com" className="rounded-xl border-slate-200" />
                {errors.email && <p className="text-red-500 text-xs mt-0.5">{errors.email}</p>}
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="address" className="text-xs font-semibold text-slate-600">Physical Address</Label>
                <Textarea id="address" value={data.address} onChange={e => setData('address', e.target.value)} placeholder="Operational center location details..." rows={2} className="rounded-xl border-slate-200" />
                {errors.address && <p className="text-red-500 text-xs mt-0.5">{errors.address}</p>}
              </div>

              <div className="flex items-center gap-6 md:col-span-2 py-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_active" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <Label htmlFor="is_active" className="text-xs font-semibold text-slate-600 cursor-pointer">Active operational status</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_manufacturing_enabled" checked={data.is_manufacturing_enabled} onChange={e => setData('is_manufacturing_enabled', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <Label htmlFor="is_manufacturing_enabled" className="text-xs font-semibold text-slate-600 cursor-pointer">Enable manufacturing assets</Label>
                </div>
              </div>

              {/* Logo */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Logo Image</Label>
                <div className="border border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-3 bg-slate-50/50">
                  <div className="h-14 w-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-300 overflow-hidden shadow-sm shrink-0">
                    {data.logo ? <img src={URL.createObjectURL(data.logo)} alt="Preview" className="w-full h-full object-cover" />
                      : editingBranch?.logo ? <img src={`/storage/${editingBranch.logo}`} alt="Current" className="w-full h-full object-cover" />
                      : <ImageIcon size={20} />}
                  </div>
                  <label htmlFor="branch-logo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-blue-600 bg-white px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
                      <Upload size={12} /> Upload Logo
                    </div>
                    <input id="branch-logo-upload" type="file" className="hidden" accept="image/*" onChange={e => setData('logo', e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>

              {/* Favicon */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Favicon</Label>
                <div className="border border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-3 bg-slate-50/50">
                  <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-300 overflow-hidden shadow-sm shrink-0">
                    {data.favicon ? <img src={URL.createObjectURL(data.favicon)} alt="Preview" className="w-full h-full object-contain p-1" />
                      : editingBranch?.favicon ? <img src={`/storage/${editingBranch.favicon}`} alt="Current" className="w-full h-full object-contain p-1" />
                      : <ImageIcon size={16} />}
                  </div>
                  <label htmlFor="branch-favicon-upload" className="cursor-pointer">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-blue-600 bg-white px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
                      <Upload size={12} /> Upload Favicon
                    </div>
                    <input id="branch-favicon-upload" type="file" className="hidden" accept="image/*" onChange={e => setData('favicon', e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>

            </div>
            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl text-xs font-semibold h-9">Cancel</Button>
              <Button type="submit" disabled={processing} className="rounded-xl text-xs font-semibold h-9 bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20">
                {processing ? 'Saving...' : (editingBranch ? 'Save Changes' : 'Add Branch')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
