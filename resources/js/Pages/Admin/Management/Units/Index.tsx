import { Head, Link, useForm } from "@inertiajs/react";
import { Plus, Edit } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from "@/layouts/app-layout";

interface Unit {
  id: number;
  unit_name: string;
  symbol: string;
}

interface UnitsIndexProps {
  units: Unit[];
}

export default function Index({ units }: UnitsIndexProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    unit_name: '',
    symbol: '',
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUnit) {
      put(`/units/${editingUnit.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        }
      });
    } else {
      post('/units', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        }
      });
    }
  };

  return (
    <AppLayout>
      <Head title="Units" />
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold">Units</h2>
       
          </div>
          <Button onClick={openCreateModal}><Plus className="h-4 w-4 mr-2" />New Unit</Button>
        </div>

        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Unit Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Symbol</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">No units found.</td>
                  </tr>
                ) : (
                  units.map((unit) => (
                    <tr key={unit.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-700 font-medium">{unit.unit_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{unit.symbol}</td>
                      <td className="px-4 py-3 text-sm">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(unit)}>
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Shared Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUnit ? 'Edit Unit' : 'Create Unit'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="unit_name">Unit Name <span className="text-red-500">*</span></Label>
              <Input
                id="unit_name"
                value={data.unit_name}
                onChange={(e) => setData('unit_name', e.target.value)}
                placeholder="e.g. Kilogram"
              />
              {errors.unit_name && <p className="text-red-500 text-xs">{errors.unit_name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol <span className="text-red-500">*</span></Label>
              <Input
                id="symbol"
                value={data.symbol}
                onChange={(e) => setData('symbol', e.target.value)}
                placeholder="e.g. kg"
              />
              {errors.symbol && <p className="text-red-500 text-xs">{errors.symbol}</p>}
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Saving...' : (editingUnit ? 'Save Changes' : 'Create Unit')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
