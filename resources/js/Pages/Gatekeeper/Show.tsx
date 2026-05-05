import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Calendar, User, Package, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";

interface GatekeeperLog {
  id: number;
  type: "IN" | "OUT";
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  handler_name: string;
  handler_type: string;
  source?: string;
  destination?: string;
  description?: string;
  reference_number?: string;
  contact_info?: string;
  notes?: string;
  status: "pending" | "verified" | "rejected";
  recorded_at: string;
  recorded_by_name: string;
}

interface ShowProps {
  log: GatekeeperLog;
}

export default function Show({ log }: ShowProps) {
  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Gatekeeper", href: "/gatekeeper" },
    { title: `Log #${log.id}`, href: "#" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalValue = log.quantity * log.unit_price;

  return (
    <>
      <Head title={`Gatekeeper Log #${log.id}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/gatekeeper">
                <ArrowLeft className="w-5 h-5 hover:text-blue-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-medium">
                  {log.type === "IN" ? "Product IN" : "Product OUT"} - #{log.id}
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Recorded on {new Date(log.recorded_at).toLocaleString()}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                log.status
              )}`}
            >
              {log.status === "verified" && (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {log.status === "pending" && (
                <AlertCircle className="w-4 h-4 mr-2" />
              )}
              {log.status}
            </span>
          </div>

          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Package className="w-5 h-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-600 mb-1">Product Name</p>
                <p className="text-lg font-medium">{log.product_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Quantity</p>
                <p className="text-lg font-medium">
                  {log.quantity} {log.unit}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Unit Price</p>
                <p className="text-lg font-medium">TZS {log.unit_price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Total Value</p>
                <p className="text-lg font-medium text-green-600">
                  TZS {totalValue.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Handler Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="w-5 h-5" />
                Handler Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-600 mb-1">Handler Name</p>
                <p className="text-base font-medium">{log.handler_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Handler Type</p>
                <p className="text-base font-medium">{log.handler_type}</p>
              </div>
              {log.contact_info && (
                <div>
                  <p className="text-xs text-slate-600 mb-1">Contact Info</p>
                  <p className="text-base font-medium">{log.contact_info}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Movement Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {log.type === "IN" ? "Source" : "Destination"} Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-600 mb-1">
                  {log.type === "IN" ? "Source / Origin" : "Destination"}
                </p>
                <p className="text-base font-medium">
                  {log.type === "IN" ? log.source : log.destination}
                </p>
              </div>
              {log.reference_number && (
                <div>
                  <p className="text-xs text-slate-600 mb-1">Reference Number</p>
                  <p className="text-base font-mono font-medium">
                    {log.reference_number}
                  </p>
                </div>
              )}
              {log.description && (
                <div>
                  <p className="text-xs text-slate-600 mb-1">Description</p>
                  <p className="text-base">{log.description}</p>
                </div>
              )}
              {log.notes && (
                <div>
                  <p className="text-xs text-slate-600 mb-1">Notes</p>
                  <p className="text-base text-slate-700 bg-slate-50 p-3 rounded">
                    {log.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recording Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="w-5 h-5" />
                Recording Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-600 mb-1">Recorded By</p>
                <p className="text-base font-medium">{log.recorded_by_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Recorded At</p>
                <p className="text-base font-medium">
                  {new Date(log.recorded_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Link href="/gatekeeper">
              <Button variant="outline">Back to Logs</Button>
            </Link>
            <Button
              onClick={() => {
                const printWindow = window.open("", "_blank");
                if (printWindow) {
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Gatekeeper Log #${log.id}</title>
                        <style>
                          body { font-family: Arial, sans-serif; margin: 20px; }
                          .section { margin-bottom: 20px; page-break-inside: avoid; }
                          .title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
                          .row { display: flex; margin-bottom: 10px; }
                          .label { width: 150px; font-weight: bold; }
                          .value { flex: 1; }
                          @media print { body { margin: 0; } }
                        </style>
                      </head>
                      <body>
                        <div class="section">
                          <div class="title">Gatekeeper Log #${log.id}</div>
                          <div class="row">
                            <div class="label">Type:</div>
                            <div class="value">${log.type}</div>
                          </div>
                          <div class="row">
                            <div class="label">Product:</div>
                            <div class="value">${log.product_name}</div>
                          </div>
                          <div class="row">
                            <div class="label">Quantity:</div>
                            <div class="value">${log.quantity} ${log.unit}</div>
                          </div>
                          <div class="row">
                            <div class="label">Unit Price:</div>
                            <div class="value">TZS ${log.unit_price.toLocaleString()}</div>
                          </div>
                          <div class="row">
                            <div class="label">Total Value:</div>
                            <div class="value">TZS ${(log.quantity * log.unit_price).toLocaleString()}</div>
                          </div>
                          <div class="row">
                            <div class="label">Handler:</div>
                            <div class="value">${log.handler_name} (${log.handler_type})</div>
                          </div>
                          <div class="row">
                            <div class="label">${log.type === "IN" ? "Source" : "Destination"}:</div>
                            <div class="value">${log.type === "IN" ? log.source : log.destination}</div>
                          </div>
                          ${log.reference_number ? `<div class="row"><div class="label">Reference:</div><div class="value">${log.reference_number}</div></div>` : ""}
                          <div class="row">
                            <div class="label">Status:</div>
                            <div class="value">${log.status}</div>
                          </div>
                          <div class="row">
                            <div class="label">Recorded At:</div>
                            <div class="value">${new Date(log.recorded_at).toLocaleString()}</div>
                          </div>
                          <div class="row">
                            <div class="label">Recorded By:</div>
                            <div class="value">${log.recorded_by_name}</div>
                          </div>
                        </div>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.print();
                }
              }}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>
        </div>
      </AppLayout>
    </>
  );
}

import { Printer } from "lucide-react";
