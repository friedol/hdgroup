import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface Component {
  id: number;
  material_name: string;
  quantity: number;
  unit: string;
}

interface BOM {
  id: number;
  bom_number: string;
  product_name: string;
  status: string;
  components: Component[];
  created_at: string;
}

interface BOMsShowProps {
  bom: BOM;
}

export default function BOMsShow({ bom }: BOMsShowProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Operations', href: '#' },
    { title: 'BOMs', href: '/boms-crud' },
    { title: bom.bom_number, href: '#' }
  ];

  return (
    <>
      <Head title={bom.bom_number} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/boms" className="p-2 hover:bg-slate-100 rounded">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-medium">{bom.bom_number}</h1>
                <p className="text-sm text-slate-600 mt-1">{bom.product_name}</p>
              </div>
            </div>
            <Link href={`/boms/${bom.id}/edit`}>
              <Button><Edit className="h-4 w-4 mr-2" />Edit</Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-slate-600">Product</p>
              <p className="text-lg font-medium mt-1">{bom.product_name}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600">Total Components</p>
              <p className="text-2xl font-medium mt-1">{bom.components.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600">Status</p>
              <p className="text-lg font-medium mt-1 capitalize">{bom.status}</p>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Components</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Material</th>
                    <th className="px-4 py-2 text-right font-medium">Quantity</th>
                    <th className="px-4 py-2 text-left font-medium">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bom.components.map((component) => (
                    <tr key={component.id}>
                      <td className="px-4 py-2">{component.material_name}</td>
                      <td className="px-4 py-2 text-right">{component.quantity}</td>
                      <td className="px-4 py-2">{component.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}
