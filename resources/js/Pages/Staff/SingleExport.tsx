import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Package, User, DollarSign, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/layouts/app-layout";

interface ExportItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Export {
  id: number;
  reference_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  total_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  items?: ExportItem[];
}

interface SingleExportProps {
  export: Export;
}

export default function SingleExport({ export: exportData }: SingleExportProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Logistics', href: '/logistics' },
    { title: 'Exported Products', href: '/exported-products' },
    { title: exportData?.reference_number, href: '#' }
  ];

  if (!exportData) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Export not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Head title={`Export - ${exportData.reference_number}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/exported-products">
              <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">{exportData.reference_number}</h1>
              <p className="text-sm text-slate-600 mt-1">Export Details</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              exportData.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : exportData.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-slate-100 text-slate-800'
            }`}>
              {exportData.status?.toUpperCase()}
            </span>
          </div>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-600">Customer Name</p>
                  <p className="font-medium text-lg">{exportData.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Phone</p>
                  <a href={`tel:${exportData.customer_phone}`} className="font-medium text-blue-600 hover:underline">
                    {exportData.customer_phone}
                  </a>
                </div>
                {exportData.customer_email && (
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <a href={`mailto:${exportData.customer_email}`} className="font-medium text-blue-600 hover:underline">
                      {exportData.customer_email}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          {exportData.items && exportData.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Package className="w-5 h-5" />
                  Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Product</th>
                        <th className="text-left py-3 px-4 font-medium">Quantity</th>
                        <th className="text-left py-3 px-4 font-medium">Unit Price</th>
                        <th className="text-left py-3 px-4 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exportData.items.map((item: ExportItem) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-3 px-4">{item.product_name}</td>
                          <td className="py-3 px-4">{item.quantity}</td>
                          <td className="py-3 px-4">TZS {item.unit_price?.toLocaleString()}</td>
                          <td className="py-3 px-4 font-medium">TZS {item.total?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <DollarSign className="w-5 h-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-600">Total Items</span>
                <span className="font-medium">{exportData.items?.length || 0}</span>
              </div>
              <div className="flex justify-between py-2 text-lg font-bold">
                <span>Total Amount</span>
                <span>TZS {exportData.total_amount?.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="w-5 h-5" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Reference Number</p>
                <p className="font-medium">{exportData.reference_number}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Created Date</p>
                <p className="font-medium">{new Date(exportData.created_at).toLocaleString()}</p>
              </div>
              {exportData.notes && (
                <div>
                  <p className="text-sm text-slate-600">Notes</p>
                  <p className="font-medium">{exportData.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}

