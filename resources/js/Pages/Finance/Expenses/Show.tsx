import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit } from 'lucide-react';
import React from 'react';
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
  created_at: string;
}

interface ExpensesShowProps {
  expense: Expense;
}

export default function ExpensesShow({ expense }: ExpensesShowProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '#' },
    { title: 'Expenses', href: '/expenses-crud' },
    { title: expense.category, href: '#' }
  ];

  return (
    <>
      <Head title={expense.expense_number} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/expenses" className="p-2 hover:bg-slate-100 rounded">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-medium">{expense.expense_number}</h1>
                <span className={`inline-block mt-2 px-2 py-1 rounded text-sm ${expense.status === 'approved' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  {expense.status}
                </span>
              </div>
            </div>
            <Link href={`/expenses/${expense.id}/edit`}>
              <Button><Edit className="h-4 w-4 mr-2" />Edit</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-slate-600">Amount</p>
              <p className="text-2xl font-medium text-red-600 mt-1">TZS {expense.amount.toFixed(2)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600">Category</p>
              <p className="text-lg font-medium mt-1">{expense.category}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600">Date</p>
              <p className="text-lg font-medium mt-1">{new Date(expense.expense_date).toLocaleDateString()}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600">Status</p>
              <p className="text-lg font-medium mt-1 capitalize">{expense.status}</p>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">Description</p>
                <p className="mt-1">{expense.description || 'No description'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-slate-600">Created</p>
                  <p className="mt-1">{new Date(expense.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}
