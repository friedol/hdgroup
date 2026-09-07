import { Head, router, useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { 
  Plus, Search, Printer, Filter, 
  Calendar, Wallet, Smartphone, Landmark,
  Edit2, Trash2, TrendingDown, CreditCard,
  Building2, ArrowDownRight, History
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, DialogContent, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/KpiCard";

interface Expense {
  id: number;
  date: string;
  amount: number;
  category: string;
  payment_method: string;
  description: string;
  status: string;
  user?: { staff_name: string };
}

interface ExpensesIndexProps {
  expenses: { 
    data: Expense[]; 
    current_page: number; 
    last_page: number; 
    total: number;
    per_page: number;
  };
  filters: any;
  allCategories: string[];
  branches: Array<{ id: number, name: string }>;
  metrics: {
    total: number;
    cash: number;
    mobile: number;
    bank: number;
  };
}

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Finance", href: "/finance/dashboard" },
  { title: "Expenses Ledger", href: "#" },
];

export default function ExpensesIndex({ expenses, filters = {}, allCategories = [], branches = [], metrics = { total: 0, cash: 0, mobile: 0, bank: 0 } }: ExpensesIndexProps) {
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const [currentFilters, setCurrentFilters] = useState({
    search: filters?.search || '',
    date_from: filters?.date_from || '',
    date_to: filters?.date_to || '',
    category: filters?.category || '',
    branch_id: filters?.branch_id || ''
  });

  const { data, setData, post, put, processing, reset } = useForm({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'transport',
    payment_method: 'Cash',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExpense) {
      put(`/expenses-crud/${editingExpense.id}`, {
        onSuccess: () => {
          setIsRecordOpen(false);
          setEditingExpense(null);
          reset();
        },
      });
    } else {
      post('/expenses-crud', {
        onSuccess: () => {
          setIsRecordOpen(false);
          reset();
        },
      });
    }
  };

  const handleDelete = (id: number) => {
    router.delete(`/expenses-crud/${id}`);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setData({
      date: expense.date,
      amount: expense.amount.toString(),
      category: expense.category,
      payment_method: expense.payment_method,
      description: expense.description || '',
    });
    setIsRecordOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const applyFilters = () => {
    router.get('/expenses-crud', currentFilters, {
      preserveState: true,
      replace: true,
    });
    setIsFilterOpen(false);
  };

  const handlePrint = () => {
    const params = new URLSearchParams(currentFilters as any).toString();
    const printUrl = `/expenses-crud?action=print&${params}`;
    
    const existingIframe = document.getElementById('print-iframe');
    if (existingIframe) document.body.removeChild(existingIframe);

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

  const resetFilters = () => {
    const empty = { search: '', date_from: '', date_to: '', category: '', branch_id: '' };
    setCurrentFilters(empty);
    router.get('/expenses-crud', empty);
  };

  const defaultCategories = [
    { label: 'Transport & Logistics', value: 'transport' },
    { label: 'Raw Materials & Supplies', value: 'raw_materials' },
    { label: 'Salary & Wages', value: 'salary' },
    { label: 'Utilities (Water/Elec)', value: 'utilities' },
    { label: 'Office Supplies', value: 'office_supplies' },
    { label: 'Rent & Leasing', value: 'rent' },
    { label: 'Maintenance & Repairs', value: 'maintenance' },
    { label: 'Marketing & Adverts', value: 'marketing' },
    { label: 'Communication & Airtime', value: 'communication' },
    { label: 'Fuel & Oil', value: 'fuel' },
    { label: 'Staff Welfare & Meals', value: 'staff_welfare' },
    { label: 'Licenses & Permits', value: 'licenses' },
    { label: 'Insurance', value: 'insurance' },
    { label: 'Tax & Government', value: 'taxes' },
    { label: 'Bank Fees', value: 'bank_fees' },
    { label: 'Printing & Stationery', value: 'stationery' },
    { label: 'Security Services', value: 'security' },
    { label: 'Cleaning & Sanitation', value: 'cleaning' },
    { label: 'Other', value: 'other' },
  ];

  const kpis = [
    { title: "Total Expenses", value: `TZS ${formatCurrency(metrics.total)}`, change: 0, icon: TrendingDown, href: "#", bgClass: "bg-rose-500 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", subtitle: "All expenditures" },
    { title: "Cash Payment", value: `TZS ${formatCurrency(metrics.cash)}`, change: 0, icon: Wallet, href: "#", bgClass: "bg-amber-500 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", subtitle: "Paid via cash" },
    { title: "Mobile Money", value: `TZS ${formatCurrency(metrics.mobile)}`, change: 0, icon: Smartphone, href: "#", bgClass: "bg-blue-600 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", subtitle: "Mobile payments" },
    { title: "Bank Transfer", value: `TZS ${formatCurrency(metrics.bank)}`, change: 0, icon: Landmark, href: "#", bgClass: "bg-emerald-600 text-white border-none shadow-sm", iconBgClass: "bg-white/10 text-white", subtitle: "Direct bank transfer" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Expense Ledger" />
      
      <div className="space-y-6 pb-10">
        
        {/* Header Section */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-black tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-rose-600" />
              Expenses Audit Ledger
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <Calendar className="w-3.5 h-3.5" />
              <span>{filters.date_from || 'Beginning'} — {filters.date_to || 'Today'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative max-md:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input 
                className="h-9 w-64 pl-9 text-xs font-medium bg-white border-slate-200"
                placeholder="Search ledger..."
                value={currentFilters.search}
                onChange={e => setCurrentFilters({...currentFilters, search: e.target.value})}
                onKeyDown={e => e.key === 'Enter' && applyFilters()}
              />
            </div>
            
            <Button 
                onClick={handlePrint}
                className="bg-white hover:bg-slate-50 text-black border border-slate-200 h-9 px-4 rounded-lg shadow-sm text-xs font-bold flex items-center gap-2"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>

            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 text-black border-slate-200 hover:bg-slate-50 font-bold">
                  <Filter className="w-4 h-4" /> Filter
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader><DialogTitle className="text-sm font-bold">Filter Ledger</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-xs font-bold">From Date</Label><Input type="date" value={currentFilters.date_from} onChange={e => setCurrentFilters({...currentFilters, date_from: e.target.value})} className="text-xs" /></div>
                    <div className="space-y-2"><Label className="text-xs font-bold">To Date</Label><Input type="date" value={currentFilters.date_to} onChange={e => setCurrentFilters({...currentFilters, date_to: e.target.value})} className="text-xs" /></div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Category</Label>
                    <Select value={currentFilters.category} onValueChange={(val) => setCurrentFilters({...currentFilters, category: val})}>
                      <SelectTrigger className="text-xs"><SelectValue placeholder="All Categories" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {allCategories.map(cat => (<SelectItem key={cat} value={cat} className="text-xs">{cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  {branches?.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Branch</Label>
                      <Select value={currentFilters.branch_id} onValueChange={(val) => setCurrentFilters({...currentFilters, branch_id: val})}>
                        <SelectTrigger className="text-xs"><SelectValue placeholder="All Branches" /></SelectTrigger>
                        <SelectContent>{branches.map(b => (<SelectItem key={b.id} value={b.id.toString()} className="text-xs">{b.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="ghost" className="text-xs font-bold" onClick={resetFilters}>Reset</Button>
                  <Button className="bg-black text-white hover:bg-slate-800 text-xs font-bold" onClick={applyFilters}>Apply Filter</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-100">
                  <Plus className="w-4 h-4" /> Record Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader><DialogTitle className="text-sm font-bold">{editingExpense ? 'Edit Ledger Entry' : 'Record New Expense'}</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="text-xs font-bold">Date</Label><Input type="date" value={data.date} onChange={e => setData('date', e.target.value)} className="text-xs" /></div>
                      <div className="space-y-2"><Label className="text-xs font-bold">Amount (TZS)</Label><Input type="number" placeholder="0.00" value={data.amount} onChange={e => setData('amount', e.target.value)} className="text-xs" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold">Category</Label>
                        <Select value={data.category} onValueChange={(val) => setData('category', val)}>
                          <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{defaultCategories.map(cat => (<SelectItem key={cat.value} value={cat.value} className="text-xs">{cat.label}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold">Payment Method</Label>
                        <Select value={data.payment_method} onValueChange={(val) => setData('payment_method', val)}>
                          <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cash" className="text-xs">Cash</SelectItem>
                            <SelectItem value="Mobile money" className="text-xs">Mobile money</SelectItem>
                            <SelectItem value="Bank transfer" className="text-xs">Bank transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2"><Label className="text-xs font-bold">Notes / Description</Label><Input placeholder="Additional details..." value={data.description} onChange={e => setData('description', e.target.value)} className="text-xs" /></div>
                  </div>
                  <DialogFooter><Button type="button" variant="ghost" className="text-xs font-bold" onClick={() => setIsRecordOpen(false)}>Cancel</Button><Button type="submit" disabled={processing} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold">Save Record</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <div key={kpi.title} className={`animate-fade-up stagger-${i + 1}`}>
              <KpiCard {...kpi} className="shadow-sm hover:shadow-md transition-shadow" />
            </div>
          ))}
        </div>

        {/* Expenses Ledger Table */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase border border-slate-200">Date</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase border border-slate-200">Category</th>
                    <th className="px-4 py-3 text-right font-bold text-rose-700 uppercase border border-slate-200">Amount (TZS)</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase border border-slate-200">Payment Method</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase border border-slate-200">Approved By</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase border border-slate-200">Description</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-600 uppercase border border-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.data.map((item, i) => {
                    const dateObj = new Date(item.date);
                    const formattedDate = dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
                    
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-black font-semibold border border-slate-100">{formattedDate}</td>
                        <td className="px-4 py-3 text-black font-bold uppercase tracking-tighter border border-slate-100">{item.category.replace('_', ' ')}</td>
                        <td className="px-4 py-3 text-right font-bold text-rose-600 border border-slate-100">{formatCurrency(item.amount)}</td>
                        <td className="px-4 py-3 border border-slate-100">
                          <div className="flex items-center gap-2">
                             {item.payment_method === 'Cash' && <Wallet className="w-3 h-3 text-amber-500" />}
                             {item.payment_method === 'Mobile money' && <Smartphone className="w-3 h-3 text-blue-500" />}
                             {item.payment_method === 'Bank transfer' && <Landmark className="w-3 h-3 text-emerald-500" />}
                             <span className="font-semibold text-black">{item.payment_method}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium border border-slate-100">{item.user?.staff_name || 'System'}</td>
                        <td className="px-4 py-3 text-slate-600 border border-slate-100 italic">{item.description || '-'}</td>
                        <td className="px-4 py-3 text-right space-x-1 border border-slate-100">
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 rounded-md" onClick={() => handleEdit(item)}>
                            <Edit2 className="w-3 h-3 text-blue-600" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-rose-50 rounded-md">
                                <Trash2 className="w-3 h-3 text-rose-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle className="text-sm font-bold">Confirm Deletion</AlertDialogTitle><AlertDialogDescription className="text-xs">Permanently remove this ledger entry?</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold">Delete</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 font-bold text-black border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-center uppercase tracking-widest border border-slate-200">Ledger Totals</td>
                    <td className="px-4 py-3 text-right border border-slate-200 text-rose-700">TZS {formatCurrency(metrics.total)}</td>
                    <td colSpan={4} className="px-4 py-3 border border-slate-200"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
        
        {/* Pagination */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Page {expenses.current_page} of {expenses.last_page} ({expenses.total} Records)
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-tight" disabled={expenses.current_page === 1} onClick={() => router.get('/expenses-crud', { ...filters, page: expenses.current_page - 1 })}>Prev</Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-tight" disabled={expenses.current_page === expenses.last_page} onClick={() => router.get('/expenses-crud', { ...filters, page: expenses.current_page + 1 })}>Next</Button>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
