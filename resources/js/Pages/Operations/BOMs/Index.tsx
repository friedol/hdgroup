import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

interface BOM {
  id: number;
  bom_number: string;
  product_name: string;
  quantity: number;
  unit: string;
  status: string;
}

interface BOMsIndexProps {
  boms: { data: BOM[]; current_page: number; per_page: number; total: number };
  metrics: { total_boms: number; active_boms: number; total_components: number };
}

export default function BOMsIndex({ boms, metrics }: BOMsIndexProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Operations', href: '#' },
    { title: 'BOMs', href: '#' }
  ];

  const columns = [
    {
      key: 'bom_number',
      label: 'BOM No.',
      render: (value: string, row: BOM) => (
        <Link href={`/boms/${row.id}`} className="text-amber-600 hover:underline font-medium">{value}</Link>
      ),
      sortable: true
    },
    { key: 'product_name', label: 'Product', sortable: true },
    { key: 'quantity', label: 'Quantity', sortable: true },
    { key: 'unit', label: 'Unit', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded text-sm ${value === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>
          {value}
        </span>
      )
    }
  ];

  return (
    <>
      <Head title="Bills of Materials" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold">Bills of Materials</h1>

            </div>
            <Link href="/boms/create">
              <Button><Plus className="h-4 w-4 mr-2" />New BOM</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-slate-600">Total BOMs</p>
              <p className="text-2xl font-bold mt-1">{boms.total}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-slate-600">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{boms.data.filter(b => b.status === 'active').length}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-slate-600">Total Components</p>
              <p className="text-2xl font-bold mt-1">{boms.data.reduce((sum, b) => sum + b.quantity, 0)}</p>
            </div>
          </div>

          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">BOM No.</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Unit</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {boms.data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No BOM records found.</td>
                    </tr>
                  ) : (
                    boms.data.map((bom) => (
                      <tr key={bom.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-700">
                          <Link href={`/boms/${bom.id}`} className="text-amber-600 hover:underline font-medium">{bom.bom_number}</Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{bom.product_name}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{bom.quantity}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{bom.unit}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${bom.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                            {bom.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <Link href={`/boms/${bom.id}`} className="text-amber-600 hover:underline">View</Link>
                            <Link href={`/boms/${bom.id}/edit`} className="text-amber-600 hover:underline">Edit</Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
              <div className="text-sm text-slate-500">
                Showing page {boms.current_page} of {Math.ceil(boms.total / boms.per_page)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={boms.current_page <= 1}
                  className="px-3 py-1 border rounded text-sm text-slate-700 disabled:opacity-50"
                  onClick={() => { /* page change handler */ }}
                >
                  Previous
                </button>
                <button
                  disabled={boms.current_page >= Math.ceil(boms.total / boms.per_page)}
                  className="px-3 py-1 border rounded text-sm text-slate-700 disabled:opacity-50"
                  onClick={() => { /* page change handler */ }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
