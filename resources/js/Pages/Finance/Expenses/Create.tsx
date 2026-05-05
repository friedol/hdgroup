import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

interface ExpensesCreateProps {
  categories: string[];
  errors?: Record<string, string>;
}

export default function ExpensesCreate({ categories = [], errors = {} }: ExpensesCreateProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '#' },
    { title: 'Expenses', href: '/expenses-crud' },
    { title: 'Create Expense', href: '#' }
  ];

  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const handleSubmit = () => {
    router.post('/expenses', formData);
  };

  return (
    <>
      <Head title="Create Expense" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.visit('/expenses')} className="p-2 hover:bg-slate-100 rounded">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">New Expense</h1>
              <p className="text-sm text-slate-600 mt-1">Record a new business expense</p>
            </div>
          </div>

          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-700">TZS </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expense Date *</label>
                <input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.expense_date && <p className="text-red-600 text-sm mt-1">{errors.expense_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter expense details..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSubmit} className="bg-blue-600">Save Expense</Button>
                <button
                  onClick={() => router.visit('/expenses')}
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
