import { Head, router } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";
import {
  Download,
  Printer,
  TrendingUp,
  Wallet,
  Banknote,
  CreditCard,
  Package,
  PieChart,
  Share2,
  Filter,
  Calendar,
  Scale,
} from "lucide-react";
import { useState } from "react";

interface BalanceSheetProps {
  period: string;
  dateFrom: string;
  dateTo: string;
  asAt: string;
  currentBranchId: string | number | null;
  isGlobal: boolean;
  assets: Array<{ name: string; amount: number; in_period: boolean }>;
  liabilitiesBreakdown: Array<{ name: string; amount: number }>;
  equityBreakdown: Array<{ name: string; amount: number }>;
  department_breakdown: Array<{
    branch_name: string;
    mobile: number;
    cash: number;
    bank: number;
    receivables: number;
    total_assets: number;
    revenue: number;
    expenses: number;
  }>;
  summary: {
    mobile: number;
    cash: number;
    bank: number;
    receivables: number;
    inventory: number;
    total_assets: number;
    liabilities: number;
    equity: number;
    total_liabilities_equity: number;
  };
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function BalanceSheet({
  period,
  dateFrom,
  dateTo,
  asAt,
  currentBranchId,
  isGlobal,
  assets,
  liabilitiesBreakdown,
  equityBreakdown,
  department_breakdown,
  summary,
}: BalanceSheetProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Finance", href: "/finance/dashboard" },
    { title: "Balance Sheet", href: "#" },
  ];

  const handleFilter = () => {
    router.get("/finance/balance-sheet", {
      period: selectedPeriod,
      branch: currentBranchId,
    });
  };

  const handlePrint = () => {
    const printUrl = `/finance/balance-sheet/pdf?period=${selectedPeriod}&branch=${currentBranchId ?? "all"}&action=print`;
    const existingIframe = document.getElementById("print-iframe");
    if (existingIframe) {
      document.body.removeChild(existingIframe);
    }

    const iframe = document.createElement("iframe");
    iframe.id = "print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.visibility = "hidden";
    iframe.src = printUrl;
    document.body.appendChild(iframe);
  };

  const handleExportPDF = () => {
    window.location.href = `/finance/balance-sheet/pdf?period=${selectedPeriod}&branch=${currentBranchId ?? "all"}`;
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = `Balance Sheet Report - ${dateFrom} to ${dateTo}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Check out the Balance Sheet for ${isGlobal ? "Global" : "Branch"}`,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Report link copied to clipboard!");
    } catch {
      alert("Unable to share automatically.");
    }
  };

  const isBalanced = Math.abs(summary.total_assets - summary.total_liabilities_equity) < 0.01;

  return (
    <>
      <Head title="Balance Sheet" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight">Balance Sheet</h1>
              <p className="text-xs font-bold text-slate-500">
                As at {asAt} • {dateFrom} - {dateTo} • {currentBranchId === "all" || !currentBranchId ? "Global View" : "Branch Report"} • Base currency: TZS
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="h-10 border-slate-200 font-bold text-xs gap-2 px-4 shadow-sm"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                variant="outline"
                className="h-10 border-slate-200 font-bold text-xs gap-2 px-4 shadow-sm"
                onClick={handleExportPDF}
              >
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                className="h-10 border-slate-200 font-bold text-xs gap-2 px-4 shadow-sm"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <Filter className="w-4 h-4" />
              <span className="text-xs font-bold text-slate-600">Filter Period</span>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="h-9 px-3 border rounded-md bg-background text-xs font-bold text-foreground cursor-pointer border-slate-200"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <Button
              onClick={handleFilter}
              className="h-9 bg-slate-900 hover:bg-black font-bold text-xs gap-2 px-5"
            >
              <Calendar className="w-4 h-4" />
              Apply
            </Button>
            <Button
              variant="outline"
              className="h-9 border-slate-200 font-bold text-xs px-4"
              onClick={() => setSelectedPeriod("month")}
            >
              Reset
            </Button>
          </div>

          {!isBalanced && (
            <Card className="border-l-4 border-l-amber-500 bg-amber-50/60 border-amber-200">
              <CardContent className="py-3">
                <p className="text-xs font-bold text-amber-800">
                  Balance mismatch: Assets {formatCurrency(summary.total_assets)} vs Liabilities & Equity {formatCurrency(summary.total_liabilities_equity)}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <Wallet className="w-3 h-3 text-blue-500" />
                  MOBILE
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg font-bold text-foreground">{formatCurrency(summary.mobile)}</div>
                <p className="text-xs text-muted-foreground mt-0.5">In period</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <Banknote className="w-3 h-3 text-emerald-500" />
                  CASH
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg font-bold text-foreground">{formatCurrency(summary.cash)}</div>
                <p className="text-xs text-muted-foreground mt-0.5">In hand</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-violet-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-violet-500" />
                  BANK
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg font-bold text-foreground">{formatCurrency(summary.bank)}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Accounts</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-orange-500" />
                  RECEIVABLES
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg font-bold text-foreground">{formatCurrency(summary.receivables)}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Outstanding</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-cyan-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <Package className="w-3 h-3 text-cyan-500" />
                  INVENTORY
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg font-bold text-foreground">{formatCurrency(summary.inventory)}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Stock value</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <Scale className="w-3 h-3 text-indigo-500" />
                  TOTAL ASSETS
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg font-bold text-foreground">{formatCurrency(summary.total_assets)}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Statement total</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-rose-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <PieChart className="w-3 h-3 text-rose-500" />
                  LIABILITIES
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg font-bold text-foreground">{formatCurrency(summary.liabilities)}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Obligations</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-600">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                  EQUITY
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className={`text-lg font-bold ${summary.equity >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatCurrency(summary.equity)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Net position</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-[14px] font-bold tracking-wide text-slate-900">ASSETS</CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <table className="w-full text-[13px]">
                  <tbody>
                    {assets.map((asset, idx) => (
                      <tr key={idx} className={idx !== assets.length - 1 ? "border-b border-slate-100" : ""}>
                        <td className="py-2 font-medium text-slate-600">{asset.name}</td>
                        <td className="py-2 text-right font-semibold text-slate-900">{formatCurrency(asset.amount)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-slate-900 bg-slate-50 font-bold">
                      <td className="py-3 text-slate-900">Total assets</td>
                      <td className="py-3 text-right text-slate-900">{formatCurrency(summary.total_assets)}</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-[14px] font-bold tracking-wide text-slate-900">LIABILITIES & EQUITY</CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <table className="w-full text-[13px]">
                  <tbody>
                    {liabilitiesBreakdown.length > 0 && (
                      <>
                        {liabilitiesBreakdown.map((liability, idx) => (
                          <tr key={`liability-${idx}`} className="border-b border-slate-100">
                            <td className="py-2 text-slate-600">{liability.name}</td>
                            <td className="py-2 text-right text-slate-900">{formatCurrency(liability.amount)}</td>
                          </tr>
                        ))}
                        <tr className="border-b border-slate-100">
                          <td className="py-2 font-medium text-slate-700">Liabilities</td>
                          <td className="py-2 text-right font-semibold text-slate-900">{formatCurrency(summary.liabilities)}</td>
                        </tr>
                      </>
                    )}

                    {equityBreakdown.map((equity, idx) => (
                      <tr key={`equity-${idx}`} className="border-b border-slate-100">
                        <td className="py-2 text-slate-600">{equity.name} (net position)</td>
                        <td className="py-2 text-right text-slate-900">{formatCurrency(equity.amount)}</td>
                      </tr>
                    ))}

                    <tr className="border-t-2 border-slate-900 bg-slate-50 font-bold">
                      <td className="py-3 text-slate-900">Total liabilities & equity</td>
                      <td className="py-3 text-right text-slate-900">{formatCurrency(summary.total_liabilities_equity)}</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {department_breakdown.length > 0 && (
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-[14px] font-bold tracking-wide text-slate-900">
                  By branch ({dateFrom} - {dateTo})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="overflow-x-auto rounded-md border border-slate-200">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="px-3 py-2 text-left text-xs font-bold text-slate-700">BRANCH</th>
                        <th className="px-3 py-2 text-right text-xs font-bold text-slate-700">MOBILE</th>
                        <th className="px-3 py-2 text-right text-xs font-bold text-slate-700">CASH</th>
                        <th className="px-3 py-2 text-right text-xs font-bold text-slate-700">BANK</th>
                        <th className="px-3 py-2 text-right text-xs font-bold text-slate-700">RECEIVABLES</th>
                        <th className="px-3 py-2 text-right text-xs font-bold text-slate-700">TOTAL ASSETS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {department_breakdown.map((dept, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/70">
                          <td className="px-3 py-2 font-semibold text-[13px] text-slate-800">{dept.branch_name}</td>
                          <td className="px-3 py-2 text-right text-slate-600 text-[13px]">{formatCurrency(dept.mobile)}</td>
                          <td className="px-3 py-2 text-right text-slate-600 text-[13px]">{formatCurrency(dept.cash)}</td>
                          <td className="px-3 py-2 text-right text-slate-600 text-[13px]">{formatCurrency(dept.bank)}</td>
                          <td className="px-3 py-2 text-right text-slate-600 text-[13px]">{formatCurrency(dept.receivables)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-[13px] text-slate-900">{formatCurrency(dept.total_assets)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </AppLayout>
    </>
  );
}
