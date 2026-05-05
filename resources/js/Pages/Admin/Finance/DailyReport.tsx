import { Head, router } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/layouts/app-layout";
import { Download, Printer, Share2, TrendingUp, DollarSign, CreditCard, Wallet } from "lucide-react";
import { useState } from "react";

interface Branch {
  id: number;
  name: string;
  system_name?: string;
}

interface IncomeItem {
  customer_name: string;
  description: string;
  mobile: number;
  cash: number;
  bank: number;
  remain: number;
  is_debt: boolean;
}

interface ExpenseItem {
  description: string;
  mobile: number;
  cash: number;
  bank: number;
}

interface BranchReport {
  branch: Branch;
  incomeItems: IncomeItem[];
  expenseItems: ExpenseItem[];
}

interface DailyReportProps {
  reportData: BranchReport[];
  dateFrom: string;
  dateTo: string;
  period: string;
  grandTotals: {
    income: { mobile: number; cash: number; bank: number; remain: number; total_debt: number };
    expense: { mobile: number; cash: number; bank: number };
  };
  pdfUrl: string;
  pdfFilename: string;
  currentBranch?: Branch | null;
  isGlobal?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCurrencyOrBlank = (value: number) => {
  if (value === 0) return "";
  return formatCurrency(value);
};

export default function DailyReport({
  reportData,
  dateFrom,
  dateTo,
  period,
  grandTotals,
  pdfUrl,
  pdfFilename,
  currentBranch,
  isGlobal,
}: DailyReportProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Finance", href: "/finance/dashboard" },
    { title: currentBranch ? currentBranch.name : "Global Daily Report", href: "#" },
  ];

  const handleFilter = () => {
    router.get("/finance/daily-report", { period: selectedPeriod });
  };

  const handlePrint = () => {
    const printUrl = `/finance/daily-report/pdf?period=${selectedPeriod}&action=print`;
    
    // Check if iframe already exists and remove it
    const existingIframe = document.getElementById('print-iframe');
    if (existingIframe) {
      document.body.removeChild(existingIframe);
    }

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    // Use visibility: hidden and position: absolute to ensure it "exists" for the browser
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    iframe.src = printUrl;
    
    // Append to body
    document.body.appendChild(iframe);
    
    // The iframe will handle window.print() itself when it loads action=print
  };

  const handleDownloadPDF = () => {
    // Download PDF file
    const downloadUrl = `/finance/daily-report/download?period=${selectedPeriod}`;
    window.location.href = downloadUrl;
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = `Daily Financial Report - ${dateFrom}`;
    
    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: 'Check out the Daily Financial Report',
          url: url,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.log('Share error:', err);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(url);
      alert('Report link copied to clipboard!');
    }
  };

  const incomeTotal = grandTotals.income.mobile + grandTotals.income.cash + grandTotals.income.bank;
  const expenseTotal = grandTotals.expense.mobile + grandTotals.expense.cash + grandTotals.expense.bank;
  const netCash = incomeTotal - expenseTotal;

  return (
    <>
      <Head title="Daily Report" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1600px] mx-auto space-y-6 pb-10">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-[18px] font-bold text-foreground">
              {currentBranch ? currentBranch.name : "Global View"} - Daily Report
            </h1>
            <p className="text-[14px] text-muted-foreground">
              {dateFrom} {dateFrom !== dateTo && `– ${dateTo}`} • {currentBranch ? "Branch" : "Global"} Financial Report
            </p>
          </div>

          {/* Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-[14px] font-medium">Period</label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>



                <Button onClick={handleFilter} className="bg-blue-600 hover:bg-blue-700">
                  Update
                </Button>

                <Button variant="outline" onClick={() => window.location.reload()}>
                  Reset
                </Button>

                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleDownloadPDF}
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handlePrint}
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Branch Reports */}
          {reportData.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8">No data available for selected period</p>
              </CardContent>
            </Card>
          ) : (
            reportData.map((report) => (
              <div key={report.branch.id} className="space-y-4">
                {/* Income and Expenses Side-by-Side */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[14px]">
                        <thead className="bg-muted">
                          <tr>
                            {/* Income Columns */}
                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Customer</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 border-l border-gray-300 whitespace-nowrap">{report.branch.name}</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-700 border-l border-gray-300">Mobile</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-700 border-l border-gray-300">Cash</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-700 border-l border-gray-300">Bank</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-700 border-l border-gray-300">Remaining</th>
                            {/* Expenses Columns */}
                            <th className="px-3 py-2 text-left font-semibold text-red-700 border-l-2 border-gray-400">Cashout (Expenses)</th>
                            <th className="px-3 py-2 text-right font-semibold text-red-700 border-l border-gray-300">Mobile</th>
                            <th className="px-3 py-2 text-right font-semibold text-red-700 border-l border-gray-300">Cash</th>
                            <th className="px-3 py-2 text-right font-semibold text-red-700 border-l border-gray-300">Bank</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Math.max(report.incomeItems.length, report.expenseItems.length) === 0 ? (
                            <tr>
                              <td colSpan={10} className="px-3 py-4 text-center text-muted-foreground">
                                No data available
                              </td>
                            </tr>
                          ) : (
                            Array.from({ length: Math.max(report.incomeItems.length, report.expenseItems.length) }).map((_, idx) => {
                              const incomeItem = report.incomeItems[idx];
                              const expenseItem = report.expenseItems[idx];
                              const isAlternate = idx % 2 === 0;
                              
                              return (
                                <tr key={idx} className={`${isAlternate ? 'bg-white' : 'bg-muted/10'} border-b border-gray-200`}>
                                  {/* Income Row */}
                                  {incomeItem ? (
                                    <>
                                      <td className="px-3 py-2 text-[14px] font-medium">{incomeItem.customer_name}</td>
                                      <td className="px-3 py-2 text-[14px] text-foreground font-medium border-l border-gray-300">{incomeItem.description}</td>
                                      <td className="px-3 py-2 text-right text-[14px] font-medium border-l border-gray-300">{formatCurrencyOrBlank(incomeItem.mobile)}</td>
                                      <td className="px-3 py-2 text-right text-[14px] font-medium border-l border-gray-300">{formatCurrencyOrBlank(incomeItem.cash)}</td>
                                      <td className="px-3 py-2 text-right text-[14px] font-medium border-l border-gray-300">{formatCurrencyOrBlank(incomeItem.bank)}</td>
                                      <td className="px-3 py-2 text-right text-[14px] font-medium border-l border-gray-300">{formatCurrencyOrBlank(incomeItem.remain)}</td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="px-3 py-2"></td>
                                      <td className="px-3 py-2 border-l border-gray-300"></td>
                                      <td className="px-3 py-2 border-l border-gray-300"></td>
                                      <td className="px-3 py-2 border-l border-gray-300"></td>
                                      <td className="px-3 py-2 border-l border-gray-300"></td>
                                      <td className="px-3 py-2 border-l border-gray-300"></td>
                                    </>
                                  )}
                                  
                                  {/* Expenses Row */}
                                  {expenseItem ? (
                                    <>
                                      <td className="px-3 py-2 text-[14px] font-medium border-l-2 border-gray-400 text-red-700">{expenseItem.description}</td>
                                      <td className="px-3 py-2 text-right text-[14px] font-medium text-red-700 border-l border-gray-300">{formatCurrencyOrBlank(expenseItem.mobile)}</td>
                                      <td className="px-3 py-2 text-right text-[14px] font-medium text-red-700 border-l border-gray-300">{formatCurrencyOrBlank(expenseItem.cash)}</td>
                                      <td className="px-3 py-2 text-right text-[14px] font-medium text-red-700 border-l border-gray-300">{formatCurrencyOrBlank(expenseItem.bank)}</td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="px-3 py-2 border-l-2 border-gray-400"></td>
                                      <td className="px-3 py-2 border-l border-gray-300"></td>
                                      <td className="px-3 py-2 border-l border-gray-300"></td>
                                      <td className="px-3 py-2 border-l border-gray-300"></td>
                                    </>
                                  )}
                                </tr>
                              );
                            })
                          )}
                          
                          {/* Branch Total Row */}
                          {Math.max(report.incomeItems.length, report.expenseItems.length) > 0 && (
                            <tr className="bg-gray-100/80 font-bold border-b border-gray-300">
                              {/* Income Totals */}
                              <td className="px-3 py-2 text-[14px]" colSpan={2}>Total for {report.branch.name}</td>
                              <td className="px-3 py-2 text-right border-l border-gray-300">{formatCurrencyOrBlank(report.incomeItems.reduce((acc, item) => acc + item.mobile, 0))}</td>
                              <td className="px-3 py-2 text-right border-l border-gray-300">{formatCurrencyOrBlank(report.incomeItems.reduce((acc, item) => acc + item.cash, 0))}</td>
                              <td className="px-3 py-2 text-right border-l border-gray-300">{formatCurrencyOrBlank(report.incomeItems.reduce((acc, item) => acc + item.bank, 0))}</td>
                              <td className="px-3 py-2 text-right border-l border-gray-300">{formatCurrencyOrBlank(report.incomeItems.reduce((acc, item) => acc + item.remain, 0))}</td>
                              
                              {/* Expenses Totals */}
                              <td className="px-3 py-2 border-l-2 border-gray-400 text-red-700">Exp. Total</td>
                              <td className="px-3 py-2 text-right text-red-700 border-l border-gray-300">{formatCurrencyOrBlank(report.expenseItems.reduce((acc, item) => acc + item.mobile, 0))}</td>
                              <td className="px-3 py-2 text-right text-red-700 border-l border-gray-300">{formatCurrencyOrBlank(report.expenseItems.reduce((acc, item) => acc + item.cash, 0))}</td>
                              <td className="px-3 py-2 text-right text-red-700 border-l border-gray-300">{formatCurrencyOrBlank(report.expenseItems.reduce((acc, item) => acc + item.bank, 0))}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))
          )}

          {/* Detailed Summary Section */}
          {reportData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-10 border-t-2 border-gray-100">
              {/* Left Column: Consolidated Summary */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <h3 className="text-[14px] font-bold text-gray-800 uppercase tracking-wider">Financial Summary</h3>
                </div>
                
                <div className="space-y-4 px-2">
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="text-muted-foreground">Total Revenue (In):</span>
                    <span className="font-bold text-gray-900 border-b-2 border-gray-100 pb-1 w-32 text-right">{formatCurrency(incomeTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="text-muted-foreground">Total Expenses (Out):</span>
                    <span className="font-bold text-orange-500 border-b-2 border-gray-100 pb-1 w-32 text-right">{formatCurrency(expenseTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="text-muted-foreground">Total Outstanding (Remain):</span>
                    <span className="font-bold text-cyan-500 border-b-2 border-gray-100 pb-1 w-32 text-right">{formatCurrency(grandTotals.income.remain)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="text-muted-foreground">Total Debt Collected:</span>
                    <span className="font-bold text-green-600 border-b-2 border-gray-100 pb-1 w-32 text-right">{formatCurrency(grandTotals.income.total_debt)}</span>
                  </div>
                  
                  <div className="pt-8 flex justify-between items-end">
                    <span className="text-[15px] font-black text-gray-900 uppercase">Net Position:</span>
                    <span className="text-3xl font-black text-blue-600 tracking-tighter">{formatCurrency(incomeTotal - expenseTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Payment Breakdown */}
              <div className="space-y-6 lg:border-l lg:pl-12 border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h3 className="text-[14px] font-bold text-gray-800 uppercase tracking-wider">Payment Breakdown</h3>
                </div>

                <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cash (In)</span>
                    <div className="text-[18px] font-black text-green-600">{formatCurrency(grandTotals.income.cash)}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Mobile (In)</span>
                    <div className="text-[18px] font-black text-blue-600">{formatCurrency(grandTotals.income.mobile)}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bank (In)</span>
                    <div className="text-[18px] font-black text-cyan-600">{formatCurrency(grandTotals.income.bank)}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total In</span>
                    <div className="text-[18px] font-black text-gray-900">{formatCurrency(incomeTotal)}</div>
                  </div>
                </div>

                <div className="pt-8 space-y-4">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Expenses Detail</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="font-medium text-gray-600">Cash:</span>
                      <span className="font-bold text-red-500">- {formatCurrency(grandTotals.expense.cash)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="font-medium text-gray-600">Mobile:</span>
                      <span className="font-bold text-gray-800">- {formatCurrency(grandTotals.expense.mobile)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="font-medium text-gray-600">Bank:</span>
                      <span className="font-bold text-gray-800">- {formatCurrency(grandTotals.expense.bank)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
}
