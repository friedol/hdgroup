import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface Product {
  id: number;
  name: string;
}

interface BOMsCreateProps {
  products: Product[];
  materials: Product[];
  errors?: Record<string, string>;
}

export default function BOMsCreate({ products = [], materials = [], errors = {} }: BOMsCreateProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Operations', href: '#' },
    { title: 'BOMs', href: '/boms-crud' },
    { title: 'Create BOM', href: '#' }
  ];

  const [formData, setFormData] = useState({
    product_id: '',
    components: [{ material_id: '', quantity: '', unit: '' }]
  });

  const handleAddComponent = () => {
    setFormData({
      ...formData,
      components: [...formData.components, { material_id: '', quantity: '', unit: '' }]
    });
  };

  const handleRemoveComponent = (index: number) => {
    setFormData({
      ...formData,
      components: formData.components.filter((_, i) => i !== index)
    });
  };

  const handleComponentChange = (index: number, field: string, value: string) => {
    const newComponents = [...formData.components];
    newComponents[index] = { ...newComponents[index], [field]: value };
    setFormData({ ...formData, components: newComponents });
  };

  const handleSubmit = () => {
    router.post('/boms', formData);
  };

  return (
    <>
      <Head title="Create BOM" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.visit('/boms')} className="p-2 hover:bg-slate-100 rounded">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">New Bill of Materials</h1>
              <p className="text-sm text-slate-600 mt-1">Define product components</p>
            </div>
          </div>

          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product *</label>
                <select
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.product_id && <p className="text-red-600 text-sm mt-1">{errors.product_id}</p>}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Components</h3>
                  <button
                    onClick={handleAddComponent}
                    className="flex items-center gap-1 px-3 py-2 bg-amber-50 text-amber-600 rounded hover:bg-amber-100"
                  >
                    <Plus className="h-4 w-4" />Add
                  </button>
                </div>

                {formData.components.map((component, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <select
                      value={component.material_id}
                      onChange={(e) => handleComponentChange(index, 'material_id', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Select material</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={component.quantity}
                      onChange={(e) => handleComponentChange(index, 'quantity', e.target.value)}
                      className="w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Qty"
                    />
                    <select
                      value={component.unit}
                      onChange={(e) => handleComponentChange(index, 'unit', e.target.value)}
                      className="w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Unit</option>
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="l">l</option>
                      <option value="m">m</option>
                    </select>
                    <button
                      onClick={() => handleRemoveComponent(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSubmit} className="bg-amber-600">Create BOM</Button>
                <button
                  onClick={() => router.visit('/boms')}
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
