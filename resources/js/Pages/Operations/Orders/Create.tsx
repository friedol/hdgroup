import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface Customer {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

interface OrdersCreateProps {
  customers: Customer[];
  products: Product[];
  errors?: Record<string, string>;
}

export default function OrdersCreate({ customers = [], products = [], errors = {} }: OrdersCreateProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Operations', href: '#' },
    { title: 'Orders', href: '/orders-crud' },
    { title: 'Create Order', href: '#' }
  ];

  const [formData, setFormData] = useState({
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    line_items: [{ product_id: '', quantity: '', unit_price: '' }],
    notes: ''
  });

  const handleAddItem = () => {
    setFormData({
      ...formData,
      line_items: [...formData.line_items, { product_id: '', quantity: '', unit_price: '' }]
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      line_items: formData.line_items.filter((_, i) => i !== index)
    });
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...formData.line_items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, line_items: newItems });
  };

  const handleSubmit = () => {
    router.post('/orders', formData);
  };

  return (
    <>
      <Head title="Create Order" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.visit('/orders')} className="p-2 hover:bg-slate-100 rounded">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">New Order</h1>
              <p className="text-sm text-slate-600 mt-1">Create a new customer order</p>
            </div>
          </div>

          <Card className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer *</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.customer_id && <p className="text-red-600 text-sm mt-1">{errors.customer_id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Order Date *</label>
                  <input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Order Items</h3>
                  <button
                    onClick={handleAddItem}
                    className="flex items-center gap-1 px-3 py-2 bg-amber-50 text-amber-600 rounded hover:bg-amber-100"
                  >
                    <Plus className="h-4 w-4" />Add Item
                  </button>
                </div>

                {formData.line_items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Qty"
                    />
                    <div className="relative w-28">
                      <span className="absolute left-3 top-2 text-slate-700">TZS </span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Price"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Special instructions..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSubmit} className="bg-amber-600">Create Order</Button>
                <button
                  onClick={() => router.visit('/orders')}
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
