import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";

interface Export {
  id: number;
  reference_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface ExportedProductsProps {
  exports?: Export[];
}

export default function ExportedProducts({ exports = [] }: ExportedProductsProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Logistics', href: '/logistics' },
    { title: 'Exported Products', href: '#' }
  ];

  return (
    <>
      <Head title="Exported Products" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/logistics">
                <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Exported Products</h1>
                <p className="text-sm text-slate-600 mt-1">View all export transactions</p>
              </div>
            </div>
            <Link href="/orders-crud">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Export
              </Button>
            </Link>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Exports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{exports?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  TZS {(exports?.reduce((sum: number, exp: Export) => sum + (exp.total_amount || 0), 0) || 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {exports?.filter((e: Export) => e.status === 'pending')?.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {exports?.filter((e: Export) => e.status === 'completed')?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Exports Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Exports</CardTitle>
            </CardHeader>
            <CardContent>
              {exports && exports.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Reference</th>
                        <th className="text-left py-3 px-4 font-medium">Customer</th>
                        <th className="text-left py-3 px-4 font-medium">Amount (TZS)</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exports.map((exp: Export) => (
                        <tr key={exp.id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4">{exp.reference_number}</td>
                          <td className="py-3 px-4">{exp.customer_name}</td>
                          <td className="py-3 px-4 font-medium">{exp.total_amount?.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              exp.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {exp.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">{new Date(exp.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No exports found</p>
                  <Link href="/orders-crud">
                    <Button variant="outline" className="mt-4">
                      Create First Export
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}

