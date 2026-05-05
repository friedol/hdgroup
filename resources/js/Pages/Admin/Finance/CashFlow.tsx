import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { 
  Search, Printer, Filter, ArrowDownLeft, ArrowUpRight, 
  Phone, Landmark, Users, List, Download, ChevronRight, ChevronLeft
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface CashFlowProps {
  paginatedEntries: {
    data: any[];
    current_page: number;
    last_page: number;
    total: number;
  };
  summary: {
    totalIn: number;
    totalOut: number;
    count: number;
  };
  branches: any[];
  isGlobal: boolean;
  filters: any;
  view: string;
}

const breadcrumbs = [
  { title: "Finance", href: "/finance" },
  { title: "Cash Flow", href: "/finance/cash-flow" },
];

export default function CashFlow({ 
  paginatedEntries, summary, branches, isGlobal, filters, view: currentView 
}: CashFlowProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(filters?.period || 'month');
  const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
  const [dateTo, setDateTo] = useState(filters?.date_to || '');
  const [searchTerm, setSearchTerm] = useState(filters?.search || '');
  
  const transactions = paginatedEntries?.data || [];
  
  const handleFilter = (period?: string, dFrom?: string, dTo?: string) => {
    const p = period || selectedPeriod;
    const params: any = { 
        period: p,
        branch_id: filters?.branch_id
    };
    if (p === 'custom') {
        params.date_from = dFrom || dateFrom;
        params.date_to = dTo || dateTo;
    }
    router.get('/finance/cash-flow', params, { preserveState: true });
  };

  const handleSearch = () => {
    router.get('/finance/cash-flow', { ...filters, search: searchTerm, page: 1 }, { preserveState: true });
  };

  const handlePrint = () => {
    const params = new URLSearchParams({
      period: selectedPeriod,
      date_from: selectedPeriod === 'custom' ? dateFrom : '',
      date_to: selectedPeriod === 'custom' ? dateTo : '',
      branch_id: filters?.branch_id || '',
      action: 'print'
    });
    const printUrl = `/finance/cash-flow/print?${params.toString()}`;
    
    // Check if iframe already exists and remove it
    const existingIframe = document.getElementById('print-iframe');
    if (existingIframe) {
      document.body.removeChild(existingIframe);
    }

    // Create a hidden iframe
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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Cash Flow Report', url });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-TZ', {
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Cash Flow" />
      
      <div className="max-w-[1600px] mx-auto space-y-4 pb-10 px-2 sm:px-6">
        {/* Header with Integrated Filter */}
        <div className="flex flex-row items-center justify-between gap-2 border-b pb-3 pt-4 px-1">
          <div className="flex-shrink-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">Cash Flow</h1>
          </div>
          
          <div className="flex flex-row items-center justify-end gap-1 sm:gap-2 ml-auto overflow-hidden">
            <Select 
              value={selectedPeriod} 
              onValueChange={(val) => {
                setSelectedPeriod(val);
                if (val !== 'custom') handleFilter(val);
              }}
            >
              <SelectTrigger className="w-[110px] sm:w-[140px] h-8 sm:h-9 text-[11px] sm:text-xs bg-white border-slate-200 rounded-md shadow-sm">
                <SelectValue placeholder="Period" />
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

            {selectedPeriod === 'custom' && (
              <div className="hidden lg:flex items-center gap-2">
                <Input 
                  type="date" 
                  value={dateFrom} 
                  onChange={e => setDateFrom(e.target.value)}
                  onBlur={() => handleFilter('custom', dateFrom)}
                  className="h-8 sm:h-9 w-[110px] sm:w-[130px] text-[11px] sm:text-xs rounded-md border-slate-200"
                />
                <Input 
                  type="date" 
                  value={dateTo} 
                  onChange={e => setDateTo(e.target.value)}
                  onBlur={() => handleFilter('custom', dateFrom, dateTo)}
                  className="h-8 sm:h-9 w-[110px] sm:w-[130px] text-[11px] sm:text-xs rounded-md border-slate-200"
                />
              </div>
            )}

            <div className="flex items-center gap-1 sm:gap-2 border-l pl-2 border-slate-200 ml-1">
              <Button variant="outline" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0 border-slate-200 rounded-md font-medium" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0 border-slate-200 rounded-md font-medium" onClick={handleShare}>
                <Download className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Ledger Table Section */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          {/* Table Search bar */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/10">
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input 
                    placeholder="Search by source, ref or details..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onBlur={handleSearch}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="pl-9 h-8 text-xs border-slate-200 rounded-md focus:ring-1 focus:ring-blue-100 placeholder:text-slate-400"
                />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Date & Time</th>
                  <th className="text-center px-4 py-4 font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Flow</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Source</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Details</th>
                  <th className="text-center px-6 py-4 font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Method</th>
                  <th className="text-right px-6 py-4 font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Amount</th>
                  <th className="text-center px-4 py-4 font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">No transactions found for this period</td>
                  </tr>
                ) : (
                  transactions.map((item, i) => {
                    const dateObj = new Date(item.date);
                    const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                    const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                    
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-700 whitespace-nowrap">{formattedDate}</div>
                          <div className="text-[11px] text-slate-400">{formattedTime}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Badge variant="outline" className={`px-2 py-0 h-5 text-[10px] font-bold border ${
                            item.flow === 'IN' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {item.flow}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-700 whitespace-nowrap uppercase">{item.source || 'Direct'}</div>
                          <div className="text-[11px] text-slate-400">{item.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px]">{item.details}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
                            {item.method}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-right font-semibold tabular-nums ${item.flow === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.flow === 'IN' ? '+' : '-'} {formatCurrency(item.amount)}
                        </td>
                        <td className="px-4 py-4 text-center text-slate-400 text-xs font-medium">
                          {item.ref || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <div className="text-xs text-slate-500 font-semibold">
              Page {paginatedEntries.current_page} of {paginatedEntries.last_page} • {paginatedEntries.total} Records
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-md"
                disabled={paginatedEntries.current_page === 1}
                onClick={() => router.get('/finance/cash-flow', { ...filters, page: paginatedEntries.current_page - 1 })}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-md"
                disabled={paginatedEntries.current_page === paginatedEntries.last_page}
                onClick={() => router.get('/finance/cash-flow', { ...filters, page: paginatedEntries.current_page + 1 })}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
