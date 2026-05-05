import { Head, router, useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { 
  Plus, Search, Printer, Filter, 
  MoreVertical, Calendar, Phone, Landmark, Wallet, Smartphone,
  Download, Edit2, Trash2, FileText, CheckCircle2
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
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

interface Expense {
  id: number;
  date: string;
  amount: number;
  category: string;
  payment_method: string;
  description: string;
  status: string;
  user?: { name: string };
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
}

const breadcrumbs = [
  { title: "Finance", href: "/finance" },
  { title: "Expense Tracking", href: "/expenses-crud" },
];

export default function ExpensesIndex({ expenses, filters, allCategories, branches }: ExpensesIndexProps) {
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const [currentFilters, setCurrentFilters] = useState({
    search: filters.search || '',
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
    category: filters.category || '',
    branch_id: filters.branch_id || ''
  });
  const { data, setData, post, put, processing, reset, errors } = useForm({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'transport',
    payment_method: 'Mobile money',
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
      minimumFractionDigits: 0,
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
    window.open(`/expenses-crud?action=print&${params}`, '_blank');
  };

  const resetFilters = () => {
    setCurrentFilters({
      search: '',
      date_from: '',
      date_to: '',
      category: '',
      branch_id: ''
    });
    router.get('/expenses-crud', {}, {
      preserveState: true,
      replace: true,
    });
  };

  const defaultCategories = [
    { label: 'Transport', value: 'transport' },
    { label: 'Raw Materials', value: 'raw_materials' },
    { label: 'Salary', value: 'salary' },
    { label: 'Utilities', value: 'utilities' },
    { label: 'Office Supplies', value: 'office_supplies' },
    { label: 'Rent', value: 'rent' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Other', value: 'other' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Expense Tracking" />
      
      <div className="max-w-[1600px] mx-auto space-y-6 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight">Expense Tracking</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative w-48 md:w-64 max-md:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                className="pl-9 h-9 border-slate-200"
                placeholder="Search description..." 
                value={currentFilters.search}
                onChange={e => setCurrentFilters({...currentFilters, search: e.target.value})}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>

            <Button 
                variant="outline" 
                size="sm" 
                className="h-9 gap-2 bg-[#1e293b] text-white hover:bg-slate-800"
                onClick={handlePrint}
            >
              <Printer className="w-4 h-4" /> Print
            </Button>
            
            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 text-rose-600 border-rose-100 hover:bg-rose-50">
                  <Filter className="w-4 h-4" /> Filter
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Filter Expenses</DialogTitle>

                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>From Date</Label>
                      <Input 
                        type="date" 
                        value={currentFilters.date_from}
                        onChange={e => setCurrentFilters({...currentFilters, date_from: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>To Date</Label>
                      <Input 
                        type="date" 
                        value={currentFilters.date_to}
                        onChange={e => setCurrentFilters({...currentFilters, date_to: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={currentFilters.category} onValueChange={(val) => setCurrentFilters({...currentFilters, category: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {allCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {branches && branches.length > 0 && (
                    <div className="space-y-2">
                      <Label>Branch</Label>
                      <Select value={currentFilters.branch_id} onValueChange={(val) => setCurrentFilters({...currentFilters, branch_id: val})}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Branches" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map(branch => (
                            <SelectItem key={branch.id} value={branch.id.toString()}>{branch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="ghost" className="text-slate-500" onClick={resetFilters}>Reset</Button>
                  <Button className="bg-[#be123c] hover:bg-[#9f1239] text-white" onClick={applyFilters}>Apply Filter</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isRecordOpen} onOpenChange={(open) => {
              setIsRecordOpen(open);
              if (!open) {
                setEditingExpense(null);
                reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="h-9 gap-2 bg-[#be123c] hover:bg-[#9f1239] text-white transition-all duration-200">
                  <Plus className="w-4 h-4" /> Record
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingExpense ? 'Edit Expense' : 'Record New Expense'}</DialogTitle>
                 
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input 
                          type="date" 
                          value={data.date}
                          onChange={e => setData('date', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount (TZS)</Label>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          value={data.amount}
                          onChange={e => setData('amount', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={data.category} onValueChange={(val) => setData('category', val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {defaultCategories.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select value={data.payment_method} onValueChange={(val) => setData('payment_method', val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mobile money">Mobile money</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Bank transfer">Bank transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Notes / Description</Label>
                      <Input 
                        placeholder="Additional details..." 
                        value={data.description}
                        onChange={e => setData('description', e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsRecordOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={processing} className="bg-rose-600 hover:bg-rose-700 text-white">Save Expense</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Expense Ledger Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-border">
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">DATE</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">CATEGORY</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">AMOUNT</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">PAYMENT METHOD</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">APPROVED BY</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">NOTES</th>
                  <th className="text-right px-6 py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {expenses.data.map((item, i) => {
                  const dateObj = new Date(item.date);
                  const formattedDate = dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
                  
                  return (
                    <tr key={i} className={`hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                      <td className="px-6 py-4 text-slate-600">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {item.category}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-rose-600">
                          TZS {formatCurrency(item.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {item.payment_method}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {item.user?.name || 'System'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 uppercase text-[11px]">
                        {item.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-lg">
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 rounded-lg" onClick={() => handleEdit(item)}>
                          <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-rose-50 rounded-lg">
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this expense record.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-rose-600 text-white hover:bg-rose-700">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-white">
            <div className="text-xs text-muted-foreground">
              Showing page {expenses.current_page} of {expenses.last_page} ({expenses.total} total records)
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                disabled={expenses.current_page === 1}
                onClick={() => router.get('/expenses-crud', { ...filters, page: expenses.current_page - 1 })}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                disabled={expenses.current_page === expenses.last_page}
                onClick={() => router.get('/expenses-crud', { ...filters, page: expenses.current_page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
