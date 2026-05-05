import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface BOM {
  id: number;
  bom_number: string;
  product_name: string;
}

interface ProductionOrdersCreateProps {
  boms: BOM[];
  errors?: Record<string, string>;
}

export default function ProductionOrdersCreate({ boms = [], errors = {} }: ProductionOrdersCreateProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Operations', href: '#' },
    { title: 'Production Orders', href: '/production-orders-new' },
    { title: 'Create Order', href: '#' }
  ];

  const [formData, setFormData] = useState({
    bom_id: '',
    quantity: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleSubmit = () => {
    router.post('/production-orders', formData);
  };

  return (
    <>
      <Head title="Create Production Order" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.visit('/production-orders')} className="p-2 hover:bg-slate-100 rounded">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">New Production Order</h1>
              <p className="text-sm text-slate-600 mt-1">Schedule a new manufacturing order</p>
            </div>
          </div>

          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bill of Materials *</label>
                <select
                  value={formData.bom_id}
                  onChange={(e) => setFormData({ ...formData, bom_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select BOM</option>
                  {boms.map((bom) => (
                    <option key={bom.id} value={bom.id}>{bom.bom_number} - {bom.product_name}</option>
                  ))}
                </select>
                {errors.bom_id && <p className="text-red-600 text-sm mt-1">{errors.bom_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="0"
                />
                {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Date *</label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {errors.scheduled_date && <p className="text-red-600 text-sm mt-1">{errors.scheduled_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Production notes, special instructions, etc."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSubmit} className="bg-amber-600">Create Order</Button>
                <button
                  onClick={() => router.visit('/production-orders')}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}
