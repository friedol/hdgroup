import { Head, Link, router } from '@inertiajs/react';
import { Plus, Receipt, Search, CreditCard, Banknote, Smartphone, Clock, ChevronLeft, ChevronRight, Wallet, PlusCircle, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from '@/layouts/app-layout';
import { toast } from 'sonner';

interface Loan {
  id: number;
  unique_id: string;
  customer_name: string;
  total_amount: number;
  total_paid: number;
  balance: number;
  payment_date: string;
  created_at: string;
  status?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

interface LoansIndexProps {
  loans: PaginatedResponse<Loan>;
  summary: {
    total_debt: number;
    overdue_debt: number;
    active_loans: number;
    overdue_count: number;
  };
  filters: {
    search?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  };
}

export default function LoansIndex({ loans, summary, filters }: LoansIndexProps) {
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [additionalCost, setAdditionalCost] = useState('0');
  const [additionalCostReason, setAdditionalCostReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters?.search || '');

  const handleSearch = () => {
    router.get(window.location.pathname, { ...filters, search: searchTerm, page: 1 }, { preserveState: true });
  };

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '#' },
    { title: 'Pending Payments', href: '#' }
  ];

  const handleOpenPayment = (loan: Loan) => {
    setSelectedLoan(loan);
    setPaymentAmount(loan.balance.toString());
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedLoan || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(paymentAmount) > selectedLoan.balance) {
      toast.error(`Amount exceeds balance (Max: TZS ${selectedLoan.balance.toLocaleString()})`);
      return;
    }

    setProcessing(true);
    router.post('/pos/sale/payment', {
      invoice_number: selectedLoan.unique_id,
      amount_paid: parseFloat(paymentAmount),
      payment_method: paymentMethod,
      payment_date: paymentDate,
      note,
      additional_cost: parseFloat(additionalCost) || 0,
      additional_cost_reason: additionalCostReason
    }, {
      onSuccess: () => {
        toast.success("Payment recorded successfully");
        setIsPaymentModalOpen(false);
        setPaymentAmount('');
        setNote('');
        setAdditionalCost('0');
        setAdditionalCostReason('');
        setSelectedLoan(null);
      },
      onError: (errors: any) => {
        toast.error(errors?.message || "Failed to record payment");
      },
      onFinish: () => setProcessing(false)
    });
  };

  return (
    <>
      <Head title="Pending Payments" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight">Pending Order Payments</h1>
              <p className="text-xs text-slate-500">Track and manage outstanding balances from POS orders</p>
            </div>
            <div className="flex gap-2">
                <Link href="/sales-history">
                    <Button variant="outline" size="sm">
                        <Receipt className="h-4 w-4 mr-2" />
                        Sales History
                    </Button>
                </Link>
                <Link href="/pos">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        New Order
                    </Button>
                </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <Wallet className="w-3 h-3 text-emerald-500" />
                  TOTAL OUTSTANDING
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg font-bold text-foreground">TZS {summary.total_debt.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{summary.active_loans} Active orders</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-rose-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-rose-500" />
                  OVERDUE AMOUNT
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg font-bold text-rose-600">TZS {summary.overdue_debt.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{summary.overdue_count} Overdue accounts</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-blue-500" />
                  ACTIVE ACCOUNTS
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg font-bold text-foreground">{summary.active_loans}</div>
                <p className="text-xs text-muted-foreground mt-0.5">Orders in progress</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium flex items-center gap-1">
                  <Check className="w-3 h-3 text-purple-500" />
                  PAYMENT EFFICIENCY
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-lg font-bold text-foreground">84%</div>
                <p className="text-xs text-muted-foreground mt-0.5">Collection rate</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-none border-slate-200 overflow-hidden">
            {/* Table Search bar */}
            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/10">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input 
                        placeholder="Search by customer or invoice..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onBlur={handleSearch}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className="pl-9 h-8 text-xs border-slate-200 rounded-md focus:ring-1 focus:ring-blue-100 placeholder:text-slate-400"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-wider h-10 px-6">Order ID</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-wider h-10 px-6">Customer</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-wider h-10 px-6">Total Amount</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-wider h-10 px-6">Paid</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-wider h-10 px-6">Balance</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-wider h-10 px-6">Due date</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 tracking-wider h-10 px-6 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loans.data.map((loan) => (
                        <TableRow key={loan.id} className="hover:bg-slate-50/50 transition-colors group">
                            <TableCell className="px-6 py-4">
                                <span className="font-bold text-slate-900">#{loan.unique_id}</span>
                                <p className="text-[10px] text-slate-400 font-medium">Recorded {new Date(loan.created_at).toLocaleDateString()}</p>
                            </TableCell>
                            <TableCell className="px-6 py-4 font-bold text-slate-700 uppercase">{loan.customer_name}</TableCell>
                            <TableCell className="px-6 py-4 text-slate-600 font-medium tabular-nums">TZS {loan.total_amount.toLocaleString()}</TableCell>
                            <TableCell className="px-6 py-4 text-emerald-600 font-bold tabular-nums">TZS {loan.total_paid.toLocaleString()}</TableCell>
                            <TableCell className="px-6 py-4">
                                <span className={`font-bold tabular-nums ${loan.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    TZS {loan.balance.toLocaleString()}
                                </span>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                                <span className={`text-xs font-bold ${new Date(loan.payment_date) < new Date() && loan.balance > 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                                    {loan.payment_date}
                                </span>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 text-xs font-bold border-slate-200"
                                    onClick={() => handleOpenPayment(loan)}
                                    disabled={loan.balance <= 0}
                                >
                                    Record payment
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                  onClick={() => router.get(`/loans/${loan.id}`)}
                                >
                                    <Clock className="w-4 h-4 text-slate-400" />
                                </Button>
                            </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {loans.data.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center text-slate-400 italic font-medium">No pending payments found</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">
                    Showing page {loans.current_page} of {loans.last_page} • {loans.total} Results
                </p>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-4 rounded-lg font-bold"
                        disabled={loans.current_page <= 1}
                        onClick={() => router.get(window.location.pathname, { ...filters, page: loans.current_page - 1 }, { preserveState: true })}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Prev
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 px-4 rounded-lg font-bold"
                        disabled={loans.current_page >= loans.last_page}
                        onClick={() => router.get(window.location.pathname, { ...filters, page: loans.current_page + 1 }, { preserveState: true })}
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
          </Card>
        </div>

        {/* Record Payment Modal */}
        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
            <DialogContent className="sm:max-w-[500px] bg-white pt-6 pb-6 shadow-2xl p-0 gap-0">
                <DialogHeader className="px-6 border-b border-slate-100 pb-4">
                    <DialogTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Banknote className="w-5 h-5" />
                        Payment
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-5 px-6 py-4 max-h-[70vh] overflow-y-auto">
                    {/* Balance */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-800">Balance</Label>
                        <div className="relative">
                            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                            <Input 
                                readOnly
                                value={selectedLoan?.balance.toLocaleString() || ''}
                                className="pl-9 bg-slate-50 border-slate-200 text-slate-900"
                            />
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-800">
                            Amount <span className="text-rose-500">*</span>
                        </Label>
                        <div className="relative">
                            <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                            <Input 
                                type="number" 
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="pl-9 border-slate-200"
                            />
                        </div>
                        <p className="text-xs text-slate-500">Max: {selectedLoan?.balance.toLocaleString()}</p>
                    </div>

                    {/* Method */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-800">
                            Method <span className="text-rose-500">*</span>
                        </Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger className="border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Bank">Bank Transfer</SelectItem>
                                <SelectItem value="Card">Credit/Debit Card</SelectItem>
                                <SelectItem value="Mobile">Mobile Money</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-800">Note (Optional)</Label>
                        <Textarea 
                            placeholder="Notes..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="resize-none min-h-[80px]"
                        />
                    </div>

                    {/* Additional Cost */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-800">Additional Cost (TZS) (optional)</Label>
                        <div className="relative">
                            <PlusCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                            <Input 
                                type="number" 
                                value={additionalCost}
                                onChange={(e) => setAdditionalCost(e.target.value)}
                                className="pl-9 border-slate-200"
                            />
                        </div>
                        <p className="text-xs text-slate-500">If you enter a value &gt; 0, you must provide a reason.</p>
                    </div>

                    {/* Additional Cost Reason */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-800">Additional Cost Reason</Label>
                        <Textarea 
                            placeholder="Delivery or other items..."
                            value={additionalCostReason}
                            onChange={(e) => setAdditionalCostReason(e.target.value)}
                            className="resize-none min-h-[80px]"
                        />
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 sm:justify-end">
                    <Button 
                        variant="ghost" 
                        onClick={() => setIsPaymentModalOpen(false)}
                        className="text-slate-600 hover:text-slate-900"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleRecordPayment}
                        disabled={processing || (parseFloat(additionalCost) > 0 && !additionalCostReason.trim())}
                        className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center gap-1.5"
                    >
                        {processing ? "Processing..." : (
                            <>
                                <Check className="w-4 h-4" />
                                Confirm
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </AppLayout>
    </>
  );
}
