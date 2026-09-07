import { KpiCard } from "@/components/dashboard/KpiCard";
import { Head, router, Link } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/layouts/app-layout";
import { Download, Printer, Share2, TrendingUp, DollarSign, CreditCard, Wallet, ArrowUpRight, ArrowDownLeft, Plus, Filter, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";

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
  if (!value || value === 0) return "-";
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
  const [viewMode, setViewMode] = useState<'all' | 'credits' | 'debits' | 'debts'>('all');

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
    const existingIframe = document.getElementById('print-iframe');
    if (existingIframe) {
      document.body.removeChild(existingIframe);
    }
    const iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    iframe.src = printUrl;
    document.body.appendChild(iframe);
  };

  const handleDownloadPDF = () => {
    const downloadUrl = `/finance/daily-report/download?period=${selectedPeriod}`;
    window.location.href = downloadUrl;
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = `Daily Financial Report - ${dateFrom}`;
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
      navigator.clipboard.writeText(url);
      alert('Report link copied to clipboard!');
    }
  };

  const incomeTotal = grandTotals.income.mobile + grandTotals.income.cash + grandTotals.income.bank;
  const expenseTotal = grandTotals.expense.mobile + grandTotals.expense.cash + grandTotals.expense.bank;
  const netCash = incomeTotal - expenseTotal;

  return (
    <>
      <Head title="Daily Financial Ledger" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="w-full space-y-8 pb-20 animate-in fade-in duration-500">
          
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Wallet className="h-6 w-6 text-indigo-600" />
                Daily Financial Ledger
              </h1>
              <p className="text-xs text-slate-500">
                {currentBranch ? currentBranch.name : "Global View"} • {dateFrom} {dateFrom !== dateTo && `– ${dateTo}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
               <Link href="/expenses">
                 <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg px-4 h-10 shadow-sm text-xs">
                   <Plus className="h-4 w-4 mr-1.5" /> Debit Option (Record Cashout)
                 </Button>
               </Link>
               <Button 
                 variant="outline" 
                 onClick={handleDownloadPDF} 
                 className="border-slate-200 text-slate-700 font-bold rounded-lg px-3.5 h-10 text-xs hover:bg-slate-50"
               >
                 <Download className="h-4 w-4 mr-1.5 text-slate-400" /> PDF
               </Button>
               <Button 
                 variant="outline" 
                 onClick={handlePrint} 
                 className="border-slate-200 text-indigo-600 font-bold rounded-lg px-3.5 h-10 text-xs hover:bg-indigo-50"
               >
                 <Printer className="h-4 w-4 mr-1.5" /> Print
               </Button>
               <Button 
                 variant="outline" 
                 onClick={handleShare} 
                 className="border-slate-200 text-slate-700 font-bold rounded-lg px-3.5 h-10 text-xs hover:bg-slate-50"
               >
                 <Share2 className="h-4 w-4 mr-1.5 text-slate-400" /> Share
               </Button>
            </div>
          </div>

          {/* Metrics Card Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="Total Credit Revenue (In)"
              value={formatCurrency(incomeTotal)}
              change={0}
              icon={TrendingUp}
              bgClass="bg-emerald-50/20"
              iconBgClass="bg-emerald-100 text-emerald-600"
            />
            <KpiCard
              title="Total Debit (Cashouts)"
              value={formatCurrency(expenseTotal)}
              change={0}
              icon={CreditCard}
              bgClass="bg-rose-50/20"
              iconBgClass="bg-rose-100 text-rose-600"
            />
            <KpiCard
              title="Net Cash Balance"
              value={formatCurrency(netCash)}
              change={0}
              icon={DollarSign}
              bgClass="bg-indigo-50/20"
              iconBgClass="bg-indigo-100 text-indigo-600"
            />
            <KpiCard
              title="Customer Debt Outstanding"
              value={formatCurrency(grandTotals.income.remain)}
              change={0}
              icon={AlertTriangle}
              bgClass="bg-amber-50/20"
              iconBgClass="bg-amber-100 text-amber-600"
            />
          </div>

          {/* Controls & Transaction View Filters */}
          <Card className="border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-5 bg-slate-50/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ledger Period</label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-44 h-10 bg-white border-slate-200 rounded-lg text-xs font-bold shadow-sm focus:ring-indigo-500">
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
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-transparent select-none">Action</label>
                  <div className="flex gap-2">
                    <Button onClick={handleFilter} className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 rounded-lg text-xs px-5 shadow-sm">
                      Apply Filter
                    </Button>
                    <Button variant="outline" onClick={() => window.location.reload()} className="border-slate-200 text-slate-600 font-bold h-10 rounded-lg text-xs px-4">
                      Reset
                    </Button>
                  </div>
                </div>
              </div>

              {/* Debit vs Credit Option Toggles */}
              <div className="space-y-1 w-full lg:w-auto">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Debit / Credit View Option</label>
                <div className="flex flex-wrap gap-1.5 p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                   <Button 
                     variant={viewMode === 'all' ? 'default' : 'ghost'} 
                     onClick={() => setViewMode('all')} 
                     className={`h-8 px-3 rounded-md text-xs font-bold transition-all ${viewMode === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                   >
                     All Entries
                   </Button>
                   <Button 
                     variant={viewMode === 'credits' ? 'default' : 'ghost'} 
                     onClick={() => setViewMode('credits')} 
                     className={`h-8 px-3 rounded-md text-xs font-bold transition-all ${viewMode === 'credits' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-emerald-600'}`}
                   >
                     <ArrowDownLeft className="h-3.5 w-3.5 mr-1" /> Receipts (Credit)
                   </Button>
                   <Button 
                     variant={viewMode === 'debits' ? 'default' : 'ghost'} 
                     onClick={() => setViewMode('debits')} 
                     className={`h-8 px-3 rounded-md text-xs font-bold transition-all ${viewMode === 'debits' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-rose-600'}`}
                   >
                     <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> Cashouts (Debit Option)
                   </Button>
                   <Button 
                     variant={viewMode === 'debts' ? 'default' : 'ghost'} 
                     onClick={() => setViewMode('debts')} 
                     className={`h-8 px-3 rounded-md text-xs font-bold transition-all ${viewMode === 'debts' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-amber-600'}`}
                   >
                     <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Customer Debts
                   </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branch Reports */}
          {reportData.length === 0 ? (
            <Card className="border-slate-200 bg-white rounded-xl shadow-sm">
              <CardContent className="p-16 text-center">
                <AlertTriangle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-600">No financial transactions recorded for selected period</p>
              </CardContent>
            </Card>
          ) : (
            reportData.map((report) => {
              const filteredIncome = report.incomeItems.filter(item => {
                if (viewMode === 'debits') return false;
                if (viewMode === 'debts') return item.is_debt || item.remain > 0;
                return true;
              });

              const filteredExpenses = report.expenseItems.filter(item => {
                if (viewMode === 'credits' || viewMode === 'debts') return false;
                return true;
              });

              const maxRows = Math.max(filteredIncome.length, filteredExpenses.length);

              return (
                <div key={report.branch.id} className="space-y-4">
                  <Card className="border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                       <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">{report.branch.name} Activity</h3>
                       <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 font-bold text-[10px] px-2.5 py-0.5">Active Branch</Badge>
                    </div>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left divide-y divide-slate-100">
                          <thead className="bg-slate-50/80">
                            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              {/* Income Columns */}
                              <th className="px-6 py-3.5 font-bold">Customer</th>
                              <th className="px-6 py-3.5 font-bold">Description</th>
                              <th className="px-6 py-3.5 text-right font-bold">Mobile In</th>
                              <th className="px-6 py-3.5 text-right font-bold">Cash In</th>
                              <th className="px-6 py-3.5 text-right font-bold">Bank In</th>
                              <th className="px-6 py-3.5 text-right font-bold">Debt</th>
                              {/* Expenses Columns */}
                              <th className="px-6 py-3.5 font-bold text-rose-600 border-l border-slate-200 bg-rose-50/30">Debit Entry</th>
                              <th className="px-6 py-3.5 text-right font-bold text-rose-600 bg-rose-50/30">Mobile Out</th>
                              <th className="px-6 py-3.5 text-right font-bold text-rose-600 bg-rose-50/30">Cash Out</th>
                              <th className="px-6 py-3.5 text-right font-bold text-rose-600 bg-rose-50/30">Bank Out</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {maxRows === 0 ? (
                              <tr>
                                <td colSpan={10} className="px-6 py-12 text-center text-slate-400 font-bold italic">
                                  No records found matching current view option
                                </td>
                              </tr>
                            ) : (
                              Array.from({ length: maxRows }).map((_, idx) => {
                                const incomeItem = filteredIncome[idx];
                                const expenseItem = filteredExpenses[idx];
                                const isAlternate = idx % 2 === 0;
                                
                                return (
                                  <tr key={idx} className={`${isAlternate ? 'bg-white' : 'bg-slate-50/30'} hover:bg-slate-50/80 transition-colors`}>
                                    {/* Income Row */}
                                    {incomeItem ? (
                                      <>
                                        <td className="px-6 py-4 font-semibold text-slate-900">
                                          <div className="flex items-center gap-2">
                                            <span className="uppercase tracking-wide">{incomeItem.customer_name?.toUpperCase()}</span>
                                            {incomeItem.is_debt && (
                                              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] px-2 py-0.5 font-bold whitespace-nowrap shadow-sm">
                                                Customer Debt
                                              </Badge>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium max-w-[200px] truncate">{incomeItem.description}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-800 tabular-nums">{formatCurrencyOrBlank(incomeItem.mobile)}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-800 tabular-nums">{formatCurrencyOrBlank(incomeItem.cash)}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-800 tabular-nums">{formatCurrencyOrBlank(incomeItem.bank)}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-rose-600 tabular-nums">
                                          {incomeItem.remain > 0 ? (
                                            <span className="bg-rose-50 text-rose-700 px-2 py-1 rounded font-bold tracking-tight border border-rose-100">
                                              {formatCurrency(incomeItem.remain)}
                                            </span>
                                          ) : "-"}
                                        </td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="px-6 py-4 text-slate-300 italic text-xs">No entry</td>
                                        <td className="px-6 py-4"></td>
                                        <td className="px-6 py-4"></td>
                                        <td className="px-6 py-4"></td>
                                        <td className="px-6 py-4"></td>
                                        <td className="px-6 py-4"></td>
                                      </>
                                    )}
                                    
                                    {/* Expenses Row */}
                                    {expenseItem ? (
                                      <>
                                        <td className="px-6 py-4 font-semibold text-rose-700 border-l border-slate-200 bg-rose-50/20 max-w-[200px] truncate">{expenseItem.description}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-rose-700 bg-rose-50/20 tabular-nums">{formatCurrencyOrBlank(expenseItem.mobile)}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-rose-700 bg-rose-50/20 tabular-nums">{formatCurrencyOrBlank(expenseItem.cash)}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-rose-700 bg-rose-50/20 tabular-nums">{formatCurrencyOrBlank(expenseItem.bank)}</td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="px-6 py-4 border-l border-slate-200 bg-rose-50/10 text-rose-300 italic text-xs">No debit entry</td>
                                        <td className="px-6 py-4 bg-rose-50/10"></td>
                                        <td className="px-6 py-4 bg-rose-50/10"></td>
                                        <td className="px-6 py-4 bg-rose-50/10"></td>
                                      </>
                                    )}
                                  </tr>
                                );
                              })
                            )}
                            
                            {/* Branch Total Row */}
                            {maxRows > 0 && (
                              <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-200 text-sm">
                                {/* Income Totals */}
                                <td className="px-6 py-4 uppercase tracking-wider text-slate-700 text-xs" colSpan={2}>Total Receipts</td>
                                <td className="px-6 py-4 text-right text-emerald-600 font-bold tabular-nums">{formatCurrencyOrBlank(report.incomeItems.reduce((acc, item) => acc + item.mobile, 0))}</td>
                                <td className="px-6 py-4 text-right text-emerald-600 font-bold tabular-nums">{formatCurrencyOrBlank(report.incomeItems.reduce((acc, item) => acc + item.cash, 0))}</td>
                                <td className="px-6 py-4 text-right text-emerald-600 font-bold tabular-nums">{formatCurrencyOrBlank(report.incomeItems.reduce((acc, item) => acc + item.bank, 0))}</td>
                                <td className="px-6 py-4 text-right text-rose-600 font-bold tabular-nums">{formatCurrencyOrBlank(report.incomeItems.reduce((acc, item) => acc + item.remain, 0))}</td>
                                
                                {/* Expenses Totals */}
                                <td className="px-6 py-4 border-l border-slate-200 bg-rose-100/50 uppercase tracking-wider text-rose-700 text-xs">Total Cashout</td>
                                <td className="px-6 py-4 text-right text-rose-700 bg-rose-100/50 font-bold tabular-nums">{formatCurrencyOrBlank(report.expenseItems.reduce((acc, item) => acc + item.mobile, 0))}</td>
                                <td className="px-6 py-4 text-right text-rose-700 bg-rose-100/50 font-bold tabular-nums">{formatCurrencyOrBlank(report.expenseItems.reduce((acc, item) => acc + item.cash, 0))}</td>
                                <td className="px-6 py-4 text-right text-rose-700 bg-rose-100/50 font-bold tabular-nums">{formatCurrencyOrBlank(report.expenseItems.reduce((acc, item) => acc + item.bank, 0))}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })
          )}

          {/* Detailed Summary Section */}
          {reportData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
              {/* Left Column: Consolidated Summary */}
              <Card className="border-slate-200 bg-white rounded-xl shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">Consolidated Financial Summary</h3>
                      <p className="text-xs text-slate-500">Overall cash receipts, debit cashouts, and debt balances</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Total Credit Revenue (In):</span>
                      <span className="font-bold text-slate-900 text-sm tabular-nums">{formatCurrency(incomeTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Total Debit Option (Cashouts):</span>
                      <span className="font-bold text-rose-600 text-sm tabular-nums">{formatCurrency(expenseTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Customer Debt Outstanding:</span>
                      <span className="font-bold text-amber-600 text-sm tabular-nums">{formatCurrency(grandTotals.income.remain)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Customer Debt Collected:</span>
                      <span className="font-bold text-emerald-600 text-sm tabular-nums">{formatCurrency(grandTotals.income.total_debt)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Cash Balance</span>
                    <p className="text-2xl font-black text-indigo-600 tracking-tight mt-0.5">{formatCurrency(netCash)}</p>
                  </div>
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 px-3 py-1 text-xs font-bold rounded-lg shadow-sm">
                    Reconciled
                  </Badge>
                </div>
              </Card>

              {/* Right Column: Payment Breakdown */}
              <Card className="border-slate-200 bg-white rounded-xl shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">Channel Payment Breakdown</h3>
                      <p className="text-xs text-slate-500">Distribution of receipts and expenses by method</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cash Receipt</span>
                      <p className="text-base font-black text-emerald-600 mt-1 tabular-nums">{formatCurrency(grandTotals.income.cash)}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile Receipt</span>
                      <p className="text-base font-black text-blue-600 mt-1 tabular-nums">{formatCurrency(grandTotals.income.mobile)}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank Receipt</span>
                      <p className="text-base font-black text-indigo-600 mt-1 tabular-nums">{formatCurrency(grandTotals.income.bank)}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100 space-y-3">
                  <h4 className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Debit Channels Breakdown</h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-medium">Cash Outflow:</span>
                      <span className="font-bold text-rose-600 tabular-nums">- {formatCurrency(grandTotals.expense.cash)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-medium">Mobile Outflow:</span>
                      <span className="font-bold text-rose-600 tabular-nums">- {formatCurrency(grandTotals.expense.mobile)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-medium">Bank Outflow:</span>
                      <span className="font-bold text-rose-600 tabular-nums">- {formatCurrency(grandTotals.expense.bank)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
}
