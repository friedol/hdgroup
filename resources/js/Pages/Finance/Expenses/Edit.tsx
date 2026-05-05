import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface Expense {
  id: number;
  expense_number: string;
  category: string;
  amount: number;
  expense_date: string;
  description: string;
  status: string;
}

interface ExpensesEditProps {
  expense: Expense;
  categories: string[];
  errors?: Record<string, string>;
}

export default function ExpensesEdit({ expense, categories = [], errors = {} }: ExpensesEditProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '#' },
    { title: 'Expenses', href: '/expenses-crud' },
    { title: 'Edit Expense', href: '#' }
  ];

  const [formData, setFormData] = useState({
    category: expense.category,
    amount: expense.amount.toString(),
    expense_date: expense.expense_date,
    description: expense.description || ''
  });

  const handleSubmit = () => {
    router.put(`/expenses/${expense.id}`, formData);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this expense?')) {
      router.delete(`/expenses/${expense.id}`);
    }
  };

  return (
    <>
      <Head title={`Edit ${expense.expense_number}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.visit('/expenses')} className="p-2 hover:bg-slate-100 rounded">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-3xl font-bold">Edit {expense.expense_number}</h1>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
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
                <Button onClick={handleSubmit} className="bg-blue-600">Update Expense</Button>
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
