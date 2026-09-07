import { Head, router, useForm } from "@inertiajs/react";
import { Plus, Edit, Trash2, Search, Compass, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from "@/layouts/app-layout";

/* ─── Types ────────────────────────────────────── */
interface Unit {
  id: number;
  unit_name: string;
  symbol: string;
}

interface UnitsIndexProps {
  units: Unit[];
}

/* ─── Component ────────────────────────────────── */
export default function Index({ units }: UnitsIndexProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    unit_name: '',
    symbol: '',
  });

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Inventory', href: '#' },
    { title: 'Units', href: '#' },
  ];

  const openCreateModal = () => {
    setEditingUnit(null);
    reset();
    clearErrors();
    setIsModalOpen(true);
  };

  const openEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    setData({
      unit_name: unit.unit_name,
      symbol: unit.symbol,
    });
    clearErrors();
    setIsModalOpen(true);
  };

  const handleDelete = async (unit: Unit) => {
    if (!confirm(`Permanently delete unit "${unit.unit_name}"?`)) return;
    try {
      await axios.delete(`/units/${unit.id}`);
      toast.success('Unit deleted successfully');
      router.reload();
    } catch {
      toast.error('Failed to delete unit');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUnit) {
      put(`/units/${editingUnit.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          toast.success('Unit updated successfully');
          reset();
        },
        onError: (err) => {
          toast.error(err.error || 'Failed to save changes');
        }
      });
    } else {
      post('/units', {
        onSuccess: () => {
          setIsModalOpen(false);
          toast.success('Unit created successfully');
          reset();
        },
        onError: (err) => {
          toast.error(err.error || 'Failed to create unit');
        }
      });
    }
  };

  // Client-side search filtering
  const filteredUnits = units.filter(
    u =>
      u.unit_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uniqueSymbols = new Set(units.map(u => u.symbol.toLowerCase())).size;

  return (
    <>
      <Head title="Units of Measure" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="w-full space-y-6 pb-20">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Units of Measure</h1>
            </div>
            <Button 
              size="sm" 
              onClick={openCreateModal}
              className="rounded-xl gap-2 text-xs font-semibold h-9 bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/30"
            >
              <Plus className="h-3.5 w-3.5" /> Add Unit
            </Button>
          </div>

          {/* ── Stats bar ── */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total units', value: units.length, valueColor: 'text-slate-900', border: 'border-slate-200', bg: 'bg-white', chip: 'bg-slate-50/80', chipText: 'Units', icon: <Layers className="h-4 w-4 md:h-5 md:w-5" /> },
              { label: 'Unique symbols', value: uniqueSymbols, valueColor: 'text-violet-700', border: 'border-violet-200', bg: 'bg-violet-50/30', chip: 'bg-violet-50/80', chipText: 'Symbols', icon: <Compass className="h-4 w-4 md:h-5 md:w-5" /> },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border ${s.border} p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow ${s.bg}`}>
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="bg-white p-1.5 md:p-2 rounded-lg shadow-sm text-slate-500">{s.icon}</div>
                  <span className={`text-[8px] md:text-[10px] font-medium px-1.5 md:px-2 py-0.5 rounded-full ${s.chip} text-slate-600`}>
                    {s.chipText}
                  </span>
                </div>
                <p className={`text-lg md:text-2xl font-semibold tabular-nums leading-none ${s.valueColor}`}>{s.value}</p>
                <p className="text-[10px] md:text-xs font-medium text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Table card ── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="unit-search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or symbol..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[11px] font-semibold text-slate-400">
                    <th className="px-5 py-3 text-left">Unit Name</th>
                    <th className="px-5 py-3 text-left">Symbol</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnits.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-16 text-center">
                        <Layers className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                        <p className="text-sm font-semibold text-slate-400">No units found</p>
                        <p className="text-[11px] text-slate-300 mt-1">Try a different search query</p>
                      </td>
                    </tr>
                  ) : filteredUnits.map(row => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      
                      {/* Unit Name */}
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900 leading-tight">
                          {row.unit_name}
                        </p>
                      </td>

                      {/* Symbol */}
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg inline-block">
                          {row.symbol}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Edit unit"
                            onClick={() => openEditModal(row)}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            title="Delete unit"
                            onClick={() => handleDelete(row)}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {/* Shared Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingUnit ? 'Edit Unit of Measure' : 'Create Unit of Measure'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="unit_name" className="text-xs font-semibold text-slate-600">Unit Name <span className="text-red-500">*</span></Label>
              <Input
                id="unit_name"
                value={data.unit_name}
                onChange={(e) => setData('unit_name', e.target.value)}
                placeholder="e.g. Kilogram"
                className="rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-100"
              />
              {errors.unit_name && <p className="text-red-500 text-xs mt-0.5">{errors.unit_name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="symbol" className="text-xs font-semibold text-slate-600">Symbol <span className="text-red-500">*</span></Label>
              <Input
                id="symbol"
                value={data.symbol}
                onChange={(e) => setData('symbol', e.target.value)}
                placeholder="e.g. kg"
                className="rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-100"
              />
              {errors.symbol && <p className="text-red-500 text-xs mt-0.5">{errors.symbol}</p>}
            </div>
            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl text-xs font-semibold h-9">Cancel</Button>
              <Button type="submit" disabled={processing} className="rounded-xl text-xs font-semibold h-9 bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20">
                {processing ? 'Saving...' : (editingUnit ? 'Save Changes' : 'Create Unit')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
