import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Trash2, Plus, X } from 'lucide-react';
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

interface LineItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  order_date: string;
  status: string;
  line_items: LineItem[];
  notes?: string;
}

interface OrdersEditProps {
  order: Order;
  customers: Customer[];
  products: Product[];
  errors?: Record<string, string>;
}

export default function OrdersEdit({ order, customers = [], products = [], errors = {} }: OrdersEditProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Operations', href: '#' },
    { title: 'Orders', href: '/orders-crud' },
    { title: 'Edit Order', href: '#' }
  ];

  const [formData, setFormData] = useState({
    customer_id: order.customer_id.toString(),
    order_date: order.order_date,
    status: order.status,
    line_items: order.line_items.map(li => ({ id: li.id, product_id: li.product_id, quantity: li.quantity, unit_price: li.unit_price })),
    notes: order.notes || ''
  });

  const handleAddItem = () => {
    setFormData({
      ...formData,
      line_items: [...formData.line_items, { id: 0, product_id: 0, quantity: 0, unit_price: 0 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      line_items: formData.line_items.filter((_, i) => i !== index)
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.line_items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, line_items: newItems });
  };

  const handleSubmit = () => {
    router.put(`/orders/${order.id}`, formData);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this order?')) {
      router.delete(`/orders/${order.id}`);
    }
  };

  return (
    <>
      <Head title={`Edit ${order.order_number}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.visit('/orders')} className="p-2 hover:bg-slate-100 rounded">
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
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer *</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                  </select>
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
                      onChange={(e) => handleItemChange(index, 'product_id', parseInt(e.target.value))}
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Qty"
                    />
                    <div className="relative w-28">
                      <span className="absolute left-3 top-2 text-slate-700">TZS </span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
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
                  placeholder="Order notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSubmit} className="bg-amber-600">Update Order</Button>
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
