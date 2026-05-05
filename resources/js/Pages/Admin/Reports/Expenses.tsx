import { Head } from "@inertiajs/react";
import { 
  ArrowDownRight, 
  Calendar,
  Download,
  Search,
  Wallet,
  Activity
} from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";

interface ExpensesReportProps {
  weeklyExpenses: number[];
  totalExpenses: number;
  mostExpensive: any;
  recentExpenses: any[];
  categories: any[];
}

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Reports", href: "#" },
  { title: "Expense Audit", href: "/report_expenses" },
];

export default function ExpensesReport({ 
  weeklyExpenses, 
  totalExpenses, 
  mostExpensive, 
  recentExpenses, 
  categories 
}: ExpensesReportProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredExpenses = React.useMemo(() => {
    if (!recentExpenses) {
return [];
}

    return recentExpenses.filter(e => 
      e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recentExpenses, searchTerm]);

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxExpense = Math.max(...(weeklyExpenses || [1]));

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Expense Audit" />
      <div className="space-y-6 pb-10">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expense Audit</h1>
            <p className="text-sm text-slate-500">Tracking operational outflows and capital expenditure</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> Export Ledger
             </Button>
             <Button size="sm" className="bg-rose-600 hover:bg-rose-700">
                <Calendar className="h-4 w-4 mr-2" /> Custom Range
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
           <Card className="border-slate-200 shadow-none bg-rose-50/30">
              <CardContent className="p-6">
                 <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">Total Outflow</p>
                 <h2 className="text-3xl font-bold">TZS {(totalExpenses || 0).toLocaleString()}</h2>
                 <div className="mt-4 flex items-center gap-2 text-xs font-medium text-rose-600">
                    <Activity size={14} /> Approved System Outflows
                 </div>
              </CardContent>
           </Card>

           <Card className="border-slate-200 shadow-none md:col-span-2">
              <CardHeader className="pb-2">
                 <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weekly Trend</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="h-24 w-full flex items-end gap-2">
                    {weeklyExpenses?.map((val, idx) => (
                       <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                          <div 
                             className="w-full bg-slate-100 group-hover:bg-rose-100 rounded-sm transition-colors"
                             style={{ height: `${(val / (maxExpense || 1)) * 100}%`, minHeight: '4px' }}
                          />
                          <span className="text-[10px] font-bold text-slate-400">{daysOfWeek[idx]}</span>
                       </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>

        <Card className="border-slate-200 shadow-none overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Wallet className="h-4 w-4 text-slate-400" />
                 <CardTitle className="text-sm font-semibold">Audit Ledger</CardTitle>
              </div>
              <div className="flex items-center gap-3">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search ledger..." 
                        className="pl-9 h-9 w-[280px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <Select>
                    <SelectTrigger className="w-[180px] h-9 text-xs">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories?.map(cat => (
                           <SelectItem key={cat.id} value={cat.id.toString()}>{cat.category_name}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/30">
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500">Description</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500">Category</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 text-right">Amount</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 text-center">Platform</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-500 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses?.map((e, idx) => (
                   <TableRow key={e.id || idx}>
                      <TableCell>
                         <div className="space-y-0.5">
                            <p className="text-sm font-medium text-slate-900">{e.description}</p>
                            <p className="text-[10px] text-slate-400">{new Date(e.date).toLocaleDateString()}</p>
                         </div>
                      </TableCell>
                      <TableCell>
                         <Badge variant="outline" className="text-[10px] font-medium">{e.category || 'Operations'}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-rose-600">
                         -TZS {(e.amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center text-[10px] font-bold text-slate-500 uppercase">
                         {e.payment_method || 'Direct'}
                      </TableCell>
                      <TableCell className="text-center">
                         <Badge variant="secondary" className="text-[10px] font-bold uppercase">{e.status || 'Approved'}</Badge>
                      </TableCell>
                   </TableRow>
                ))}
              </TableBody>
            </Table>
            {!filteredExpenses?.length && (
               <div className="py-20 text-center text-slate-400 italic text-sm">No expenses found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
