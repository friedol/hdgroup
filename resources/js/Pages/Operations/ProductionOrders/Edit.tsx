import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface BOM {
  id: number;
  bom_number: string;
  product_name: string;
}

interface ProductionOrder {
  id: number;
  order_number: string;
  bom_id: number;
  quantity: number;
  status: string;
  scheduled_date: string;
  notes?: string;
}

interface ProductionOrdersEditProps {
  order: ProductionOrder;
  boms: BOM[];
  errors?: Record<string, string>;
}

export default function ProductionOrdersEdit({ order, boms = [], errors = {} }: ProductionOrdersEditProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Operations', href: '#' },
    { title: 'Production Orders', href: '/production-orders-new' },
    { title: 'Edit Order', href: '#' }
  ];

  const [formData, setFormData] = useState({
    bom_id: order.bom_id.toString(),
    quantity: order.quantity.toString(),
    status: order.status,
    scheduled_date: order.scheduled_date,
    notes: order.notes || ''
  });

  const handleSubmit = () => {
    router.put(`/production-orders/${order.id}`, formData);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this production order?')) {
      router.delete(`/production-orders/${order.id}`);
    }
  };

  return (
    <>
      <Head title={`Edit ${order.order_number}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.visit('/production-orders')} className="p-2 hover:bg-slate-100 rounded">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-3xl font-bold">Edit {order.order_number}</h1>
            </div>
            <button
              onClick={handleDelete}
              className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />Delete
            </button>
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
                />
                {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Date *</label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Production notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSubmit} className="bg-amber-600">Update Order</Button>
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
