import { Head, router } from '@inertiajs/react';
import { RotateCcw, TrendingDown, Calendar, Hash, User, Clock, ChevronLeft, ChevronRight, Search, Loader2, ArrowRight, Trash2, Plus, Minus, AlertTriangle, CheckCircle, ShoppingBag, X } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import axios from 'axios';

/* ─── Types ─────────────────────────────── */
interface ReturnSale {
  id: number;
  invoice: string;
  customer: string;
  cashier: string;
  items_count: number;
  payable: number;
  method: string;
  status: string;
  date: string;
  time: string;
}

interface Paginated {
  data: ReturnSale[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

interface Props {
  sales: Paginated;
  totalReturnAmount: number;
  todayReturnAmount: number;
  totalReturnCount: number;
}

interface InvoiceItem {
  id: number;
  product_id: number;
  variant_id: number | null;
  variant_color: string | null;
  print_type: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  already_returned: number;
  available_to_return: number;
  // User input states
  selected?: boolean;
  return_qty?: number;
  reason?: string;
}

interface ExchangeItem {
  product_id: number;
  variant_id: number | null;
  color: string | null;
  print_type: string | null;
  name: string;
  qty: number;
  price: number;
  unit_name: string;
  factor: number;
}

/* ─── Helpers ─────────────────────────────── */
const fmt = (n: number) =>
  'TZS ' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const methodStyle = (m: string) => {
  if (m === 'Cash')   { return 'bg-blue-50 text-blue-700'; }
  if (m === 'Card')   { return 'bg-purple-50 text-purple-700'; }
  if (m === 'Mobile') { return 'bg-teal-50 text-teal-700'; }
  return 'bg-slate-100 text-slate-600';
};

/* ─── Component ──────────────────────────── */
export default function Returns({ sales, totalReturnAmount, todayReturnAmount, totalReturnCount }: Props) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sales & POS', href: '#' },
    { title: 'Returns', href: '#' },
  ];

  const handlePage = (page: number) =>
    router.get('/returns', { page }, { preserveState: true });

  const kpiCards = [
    { title: "Total Returned", value: fmt(totalReturnAmount), change: 0, icon: TrendingDown, href: "#", bgClass: "bg-rose-50/50", iconBgClass: "bg-rose-100 text-rose-600" },
    { title: "Today's Returns", value: fmt(todayReturnAmount), change: 0, icon: Calendar, href: "#", bgClass: "bg-amber-50/50", iconBgClass: "bg-amber-100 text-amber-600" },
    { title: "Total Return Count", value: totalReturnCount.toString(), change: 0, icon: Hash, href: "#", bgClass: "bg-slate-50/50", iconBgClass: "bg-slate-100 text-slate-600" },
  ];

  /* ─── Return & Exchange Modal State ──────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [searchingInvoice, setSearchingInvoice] = useState(false);
  
  // Invoice details from API
  const [originalSale, setOriginalSale] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  
  // Return choices
  const [actionType, setActionType] = useState<'refund' | 'exchange'>('refund');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [processing, setProcessing] = useState(false);

  // Exchange items cart
  const [exchangeCart, setExchangeCart] = useState<ExchangeItem[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  // Add Product flow states
  const [selectedSearchProduct, setSelectedSearchProduct] = useState<any>(null);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedPrintType, setSelectedPrintType] = useState<string>('plain');
  const [exchangeQty, setExchangeQty] = useState(1);

  // Search invoice
  const handleSearchInvoice = async () => {
    if (!invoiceNumber.trim()) {
      toast.error('Please enter an invoice number');
      return;
    }

    setSearchingInvoice(true);
    try {
      const response = await axios.get(`/pos/invoice/${invoiceNumber.trim()}`);
      if (response.data.success) {
        setOriginalSale(response.data.sale);
        setInvoiceItems(response.data.sale.items.map((item: any) => ({
          ...item,
          selected: false,
          return_qty: item.available_to_return > 0 ? 1 : 0,
          reason: 'Defective'
        })));
        setModalStep(2);
      } else {
        toast.error(response.data.message || 'Invoice not found');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invoice search failed');
    } finally {
      setSearchingInvoice(false);
    }
  };

  // Product search for Exchange
  useEffect(() => {
    if (!productSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearchingProducts(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`/pos/search?q=${encodeURIComponent(productSearchQuery)}`);
        setSearchResults(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingProducts(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [productSearchQuery]);

  // Open Product configurations
  const handleSelectSearchProduct = (p: any) => {
    setSelectedSearchProduct(p);
    const firstUnit = p.sale_units?.[0] || { name: 'Piece', factor: 1, price: p.price };
    setSelectedUnit(firstUnit);
    setSelectedVariant(p.variants?.[0] || null);
    setSelectedPrintType('plain');
    setExchangeQty(1);
  };

  // Resolve exchange item price
  const getExchangePrice = (p: any, unit: any, variant: any, print: string) => {
    if (!p) return 0;
    if (p.product_type === 'manufactured') {
      const plainPrice = variant?.plain_price ?? p.plain_price ?? p.price;
      const printedPrice = variant?.printed_price ?? p.printed_price ?? p.price;
      return print === 'printed' ? printedPrice : plainPrice;
    }
    return Number(unit?.market_price ?? unit?.price ?? p.price);
  };

  // Add search product to exchange cart
  const handleAddExchangeToCart = () => {
    if (!selectedSearchProduct) return;

    const price = getExchangePrice(selectedSearchProduct, selectedUnit, selectedVariant, selectedPrintType);
    const colorLabel = selectedVariant?.color ?? null;
    const nameSuffix = (selectedUnit?.factor > 1 ? ` (${selectedUnit.name})` : '') + (colorLabel ? ` - ${colorLabel}` : '');

    const newItem: ExchangeItem = {
      product_id: selectedSearchProduct.id,
      variant_id: selectedVariant?.id ?? null,
      color: colorLabel,
      print_type: selectedSearchProduct.product_type === 'manufactured' ? selectedPrintType : null,
      name: selectedSearchProduct.name + nameSuffix,
      qty: exchangeQty,
      price: price,
      unit_name: selectedUnit?.name ?? 'Piece',
      factor: selectedUnit?.factor ?? 1
    };

    setExchangeCart(prev => {
      // Check if exact item exists
      const idx = prev.findIndex(i => 
        i.product_id === newItem.product_id && 
        i.variant_id === newItem.variant_id && 
        i.unit_name === newItem.unit_name &&
        i.print_type === newItem.print_type
      );

      if (idx > -1) {
        const next = [...prev];
        next[idx].qty += newItem.qty;
        return next;
      }
      return [...prev, newItem];
    });

    setSelectedSearchProduct(null);
    setProductSearchQuery('');
    setSearchResults([]);
    toast.success('Added replacement to exchange list');
  };

  // Remove exchange item
  const handleRemoveExchangeItem = (index: number) => {
    setExchangeCart(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const returnRefundTotal = invoiceItems
    .filter(i => i.selected && (i.return_qty ?? 0) > 0)
    .reduce((sum, item) => sum + (item.unit_price * (item.return_qty ?? 0)), 0);

  const exchangePurchaseTotal = exchangeCart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const differenceAmount = exchangePurchaseTotal - returnRefundTotal;

  // Submit process
  const handleSubmitReturnExchange = async () => {
    const selectedReturnedItems = invoiceItems.filter(i => i.selected && (i.return_qty ?? 0) > 0);
    
    if (selectedReturnedItems.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        sale_id: originalSale.id,
        action_type: actionType,
        returned_items: selectedReturnedItems.map(item => ({
          id: item.id,
          qty: item.return_qty,
          reason: item.reason
        })),
        exchange_items: actionType === 'exchange' ? exchangeCart : [],
        payment_method: paymentMethod,
        difference_amount: differenceAmount
      };

      const res = await axios.post('/pos/return-exchange', payload);
      if (res.data.success) {
        toast.success(res.data.message || 'Processed successfully');
        setModalOpen(false);
        router.reload();
      } else {
        toast.error(res.data.message || 'Operation failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Server error occurred');
    } finally {
      setProcessing(false);
    }
  };

  // Reset modal states
  const handleCloseModal = () => {
    setModalOpen(false);
    setModalStep(1);
    setInvoiceNumber('');
    setOriginalSale(null);
    setInvoiceItems([]);
    setExchangeCart([]);
    setProductSearchQuery('');
    setSearchResults([]);
    setSelectedSearchProduct(null);
  };

  return (
    <>
      <Head title="Returns" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="w-full space-y-6 pb-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Commercial returns</h1>
            <Button 
              onClick={() => setModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-lg shadow-red-500/20 px-5 py-2.5 active:scale-95 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-2" /> Process Return / Exchange
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {kpiCards.map((kpi, i) => (
              <div key={kpi.title} className={`animate-fade-up stagger-${i + 1}`}>
                <KpiCard {...kpi} className="shadow-sm hover:shadow-md transition-shadow" />
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <RotateCcw className="h-4 w-4 text-slate-400" />
              <h3 className="text-base font-bold text-slate-800">All return records</h3>
              <span className="ml-auto text-xs font-bold text-slate-400">{sales.total} total</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Invoice', 'Customer', 'Cashier', 'Items', 'Refunded', 'Method', 'Status', 'Date & time'].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sales.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <RotateCcw className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                        <p className="text-base font-bold text-slate-400">No returns recorded</p>
                        <p className="text-[11px] text-slate-300 mt-1">Return transactions will appear here</p>
                      </td>
                    </tr>
                  ) : sales.data.map(row => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-rose-50/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-sm text-rose-600 font-bold whitespace-nowrap">{row.invoice}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <User className="h-3 w-3 text-slate-400" />
                          </div>
                          <span className="text-sm font-bold text-slate-800">{row.customer}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-600 font-bold">{row.cashier}</td>
                      <td className="px-5 py-3 text-center text-sm font-bold text-slate-700">{row.items_count}</td>
                      <td className="px-5 py-3 text-right text-base font-bold text-rose-600 tabular-nums whitespace-nowrap">
                        TZS {row.payable.toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${methodStyle(row.method)}`}>{row.method}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">{row.status}</span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <p className="text-sm font-bold text-slate-700">{row.date}</p>
                        <p className="text-xs text-slate-400 font-bold flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{row.time}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {sales.total > sales.per_page && (
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500">
                  Showing <span className="text-slate-800">{sales.data.length}</span> of <span className="text-slate-800">{sales.total}</span> returns
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => handlePage(sales.current_page - 1)} disabled={sales.current_page === 1}
                    className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:border-rose-200 hover:text-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 px-2">{sales.current_page} / {sales.last_page}</span>
                  <button onClick={() => handlePage(sales.current_page + 1)} disabled={sales.current_page >= sales.last_page}
                    className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:border-rose-200 hover:text-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Return / Exchange Wizard Modal ── */}
          <Dialog open={modalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
            <DialogContent className="sm:max-w-2xl bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-bold text-slate-800">
                    Process Return &amp; Exchange
                  </DialogTitle>
                  <p className="text-xs text-slate-400 mt-1">Step {modalStep} of 5</p>
                </div>
                <button 
                  onClick={handleCloseModal}
                  className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </DialogHeader>

              {/* STEP 1: Find Invoice */}
              {modalStep === 1 && (
                <div className="py-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_input" className="text-xs font-black text-slate-600 uppercase tracking-wider">Invoice Number</Label>
                    <div className="relative">
                      <Input
                        id="invoice_input"
                        placeholder="e.g. INV-3A8D2F1C"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="h-12 pl-4 pr-12 rounded-xl border-slate-200 focus:border-red-400 font-bold focus:ring-red-100"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchInvoice()}
                      />
                      <button
                        onClick={handleSearchInvoice}
                        disabled={searchingInvoice}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors disabled:opacity-50"
                      >
                        {searchingInvoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Search for invoices generated via the POS terminal to process refunds or exchanges.</p>
                  </div>
                </div>
              )}

              {/* STEP 2: Select Items to Return */}
              {modalStep === 2 && originalSale && (
                <div className="py-4 space-y-4">
                  <div className="bg-slate-50 rounded-xl p-3 flex justify-between text-xs border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-700">Invoice: <span className="font-mono text-red-600">{originalSale.invoice}</span></p>
                      <p className="text-slate-500 mt-0.5">Date: {originalSale.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-700">Customer: {originalSale.customer}</p>
                      <p className="text-slate-500 mt-0.5">Total Payable: {fmt(originalSale.payable)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-black text-slate-600 uppercase tracking-wider block">Select Items to Return</Label>
                    <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200">
                            <th className="py-2.5 px-3 w-10"></th>
                            <th className="py-2.5 px-2 font-bold text-slate-500">Item</th>
                            <th className="py-2.5 px-2 font-bold text-slate-500 text-right">Price</th>
                            <th className="py-2.5 px-2 font-bold text-slate-500 text-center">Avail. Qty</th>
                            <th className="py-2.5 px-2 font-bold text-slate-500 text-center w-28">Return Qty</th>
                            <th className="py-2.5 px-2 font-bold text-slate-500">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {invoiceItems.map((item, index) => (
                            <tr key={item.id} className={`hover:bg-slate-50/50 ${item.selected ? 'bg-red-50/20' : ''}`}>
                              <td className="py-3 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={item.selected || false}
                                  disabled={item.available_to_return <= 0}
                                  onChange={(e) => {
                                    setInvoiceItems(prev => prev.map((it, idx) => 
                                      idx === index ? { ...it, selected: e.target.checked } : it
                                    ));
                                  }}
                                  className="w-4 h-4 rounded text-red-600 border-slate-300 focus:ring-red-500 disabled:opacity-30"
                                />
                              </td>
                              <td className="py-3 px-2 font-black text-slate-800">
                                {item.name}
                                {item.variant_color && <span className="block text-[9px] text-slate-400 font-medium">{item.variant_color} {item.print_type ? `[${item.print_type}]` : ''}</span>}
                              </td>
                              <td className="py-3 px-2 text-right font-bold text-slate-700">{fmt(item.unit_price)}</td>
                              <td className="py-3 px-2 text-center font-bold text-slate-600">{item.available_to_return} / {item.quantity}</td>
                              <td className="py-3 px-2">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => setInvoiceItems(prev => prev.map((it, idx) => 
                                      idx === index ? { ...it, return_qty: Math.max(1, (it.return_qty ?? 1) - 1) } : it
                                    ))}
                                    disabled={!item.selected || (item.return_qty ?? 1) <= 1}
                                    className="h-6 w-6 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center disabled:opacity-30 transition-colors"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="text-xs font-black w-8 text-center">{item.return_qty}</span>
                                  <button
                                    onClick={() => setInvoiceItems(prev => prev.map((it, idx) => 
                                      idx === index ? { ...it, return_qty: Math.min(it.available_to_return, (it.return_qty ?? 1) + 1) } : it
                                    ))}
                                    disabled={!item.selected || (item.return_qty ?? 1) >= item.available_to_return}
                                    className="h-6 w-6 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center disabled:opacity-30 transition-colors"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <select
                                  disabled={!item.selected}
                                  value={item.reason}
                                  onChange={(e) => {
                                    setInvoiceItems(prev => prev.map((it, idx) => 
                                      idx === index ? { ...it, reason: e.target.value } : it
                                    ));
                                  }}
                                  className="h-8 border border-slate-200 rounded-lg text-[10px] font-bold px-1.5 bg-white w-full focus:ring-1 focus:ring-red-100 outline-none disabled:opacity-30"
                                >
                                  <option value="Defective">Defective</option>
                                  <option value="Wrong Item">Wrong Item</option>
                                  <option value="Customer Dissatisfied">Customer Dissatisfied</option>
                                  <option value="Size Exchange">Size Exchange</option>
                                  <option value="Other">Other Reason</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <DialogFooter className="pt-3 border-t border-slate-100">
                    <Button variant="outline" onClick={() => setModalStep(1)} className="rounded-xl h-10 border-slate-200">
                      Back
                    </Button>
                    <Button
                      onClick={() => setModalStep(3)}
                      disabled={invoiceItems.filter(i => i.selected && (i.return_qty ?? 0) > 0).length === 0}
                      className="bg-red-600 hover:bg-red-700 text-white font-black rounded-xl h-10 px-5 gap-2"
                    >
                      Next <ArrowRight className="h-4 w-4" />
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {/* STEP 3: Choose Refund vs Exchange */}
              {modalStep === 3 && (
                <div className="py-6 space-y-6">
                  <Label className="text-xs font-black text-slate-600 uppercase tracking-wider block text-center">Choose Return Settlement Type</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setActionType('refund')}
                      className={`p-6 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-3 ${actionType === 'refund' ? 'border-red-600 bg-red-50/40 text-red-700' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'}`}
                    >
                      <RotateCcw className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="text-sm font-black">Refund Only</p>
                        <p className="text-[10px] text-slate-400 mt-1">Return items back to stock and refund original payment amount to the customer.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActionType('exchange')}
                      className={`p-6 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-3 ${actionType === 'exchange' ? 'border-red-600 bg-red-50/40 text-red-700' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'}`}
                    >
                      <ShoppingBag className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="text-sm font-black">Product Exchange</p>
                        <p className="text-[10px] text-slate-400 mt-1">Return items back to stock and select replacement items. Settle the difference.</p>
                      </div>
                    </button>
                  </div>

                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-xs font-bold text-rose-700 flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Return Value to Credit: {fmt(returnRefundTotal)}</span>
                  </div>

                  <DialogFooter className="pt-3 border-t border-slate-100">
                    <Button variant="outline" onClick={() => setModalStep(2)} className="rounded-xl h-10 border-slate-200">
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        if (actionType === 'exchange') {
                          setModalStep(4);
                        } else {
                          setModalStep(5);
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-black rounded-xl h-10 px-5 gap-2"
                    >
                      Next <ArrowRight className="h-4 w-4" />
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {/* STEP 4: Exchange Products Cart */}
              {modalStep === 4 && (
                <div className="py-4 space-y-4">
                  {/* Exchange product search */}
                  <div className="space-y-2 relative">
                    <Label className="text-xs font-black text-slate-600 uppercase tracking-wider">Search Replacement Products</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      {searchingProducts && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500 animate-spin" />}
                      <Input
                        placeholder="Search by name or SKU..."
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        className="h-10 pl-9 rounded-xl border-slate-200 focus:border-red-400 focus:ring-red-100"
                      />
                    </div>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                      <div className="absolute top-[68px] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
                        {searchResults.map((p: any) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectSearchProduct(p)}
                            className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-black text-slate-800">{p.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{p.sku}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-red-600">TZS {p.price.toLocaleString()}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">{p.stock} in stock</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add configuration for selected search product */}
                  {selectedSearchProduct && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-black text-slate-800">{selectedSearchProduct.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedSearchProduct.sku}</p>
                        </div>
                        <button 
                          onClick={() => setSelectedSearchProduct(null)}
                          className="text-xs font-bold text-rose-500 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Units */}
                        {selectedSearchProduct.sale_units?.length > 1 && (
                          <div>
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Unit</Label>
                            <select
                              value={selectedUnit?.name || ''}
                              onChange={(e) => {
                                const unit = selectedSearchProduct.sale_units.find((u: any) => u.name === e.target.value);
                                if (unit) setSelectedUnit(unit);
                              }}
                              className="w-full mt-1.5 h-9 border border-slate-200 rounded-lg text-xs px-2 bg-white"
                            >
                              {selectedSearchProduct.sale_units.map((u: any) => (
                                <option key={u.name} value={u.name}>{u.name} (factor: {u.factor})</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Variants */}
                        {selectedSearchProduct.variants?.length > 0 && (
                          <div>
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Color / Variant</Label>
                            <select
                              value={selectedVariant?.id || ''}
                              onChange={(e) => {
                                const variant = selectedSearchProduct.variants.find((v: any) => v.id === parseInt(e.target.value));
                                if (variant) setSelectedVariant(variant);
                              }}
                              className="w-full mt-1.5 h-9 border border-slate-200 rounded-lg text-xs px-2 bg-white"
                            >
                              {selectedSearchProduct.variants.map((v: any) => (
                                <option key={v.id} value={v.id}>{v.color} ({v.qty} in stock)</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Print Type (Manufactured Only) */}
                        {selectedSearchProduct.product_type === 'manufactured' && (
                          <div>
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Print Type</Label>
                            <select
                              value={selectedPrintType}
                              onChange={(e) => setSelectedPrintType(e.target.value)}
                              className="w-full mt-1.5 h-9 border border-slate-200 rounded-lg text-xs px-2 bg-white"
                            >
                              <option value="plain">Plain Bag</option>
                              <option value="printed">Printed Bag</option>
                            </select>
                          </div>
                        )}

                        {/* Quantity */}
                        <div>
                          <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Quantity</Label>
                          <div className="flex items-center gap-2 mt-1.5">
                            <button
                              onClick={() => setExchangeQty(Math.max(1, exchangeQty - 1))}
                              className="h-9 w-9 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 flex items-center justify-center font-bold"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="text-sm font-black w-8 text-center">{exchangeQty}</span>
                            <button
                              onClick={() => setExchangeQty(exchangeQty + 1)}
                              className="h-9 w-9 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 flex items-center justify-center font-bold"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold">Replacement Cost</span>
                          <p className="text-sm font-black text-red-600">
                            {fmt(getExchangePrice(selectedSearchProduct, selectedUnit, selectedVariant, selectedPrintType) * exchangeQty)}
                          </p>
                        </div>
                        <Button 
                          onClick={handleAddExchangeToCart}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg h-9 px-4"
                        >
                          Confirm &amp; Add
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Active exchange cart */}
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-600 uppercase tracking-wider">Exchange Items List ({exchangeCart.length})</Label>
                    <div className="border border-slate-100 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="py-2 px-3 font-bold text-slate-500">Replacement Product</th>
                            <th className="py-2 px-2 font-bold text-slate-500 text-center">Unit</th>
                            <th className="py-2 px-2 font-bold text-slate-500 text-center">Qty</th>
                            <th className="py-2 px-2 font-bold text-slate-500 text-right">Price</th>
                            <th className="py-2 px-2 font-bold text-slate-500 text-right">Total</th>
                            <th className="py-2 px-3 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {exchangeCart.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center italic text-slate-400 bg-slate-50/10">
                                No replacement products added. Use the search bar above.
                              </td>
                            </tr>
                          ) : exchangeCart.map((item, index) => (
                            <tr key={index}>
                              <td className="py-2.5 px-3 font-black text-slate-800">
                                {item.name}
                                {item.print_type && <span className="block text-[9px] text-slate-400 font-medium">Type: {item.print_type}</span>}
                              </td>
                              <td className="py-2.5 px-2 text-center text-slate-600 font-bold">{item.unit_name}</td>
                              <td className="py-2.5 px-2 text-center text-slate-800 font-black">{item.qty}</td>
                              <td className="py-2.5 px-2 text-right font-bold text-slate-700">{fmt(item.price)}</td>
                              <td className="py-2.5 px-2 text-right font-black text-slate-900">{fmt(item.price * item.qty)}</td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => handleRemoveExchangeItem(index)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <DialogFooter className="pt-3 border-t border-slate-100">
                    <Button variant="outline" onClick={() => setModalStep(3)} className="rounded-xl h-10 border-slate-200">
                      Back
                    </Button>
                    <Button
                      onClick={() => setModalStep(5)}
                      disabled={exchangeCart.length === 0}
                      className="bg-red-600 hover:bg-red-700 text-white font-black rounded-xl h-10 px-5 gap-2"
                    >
                      Next <ArrowRight className="h-4 w-4" />
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {/* STEP 5: Settlement Summary */}
              {modalStep === 5 && (
                <div className="py-4 space-y-6">
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                    <h4 className="text-sm font-black text-slate-800 border-b border-slate-200 pb-2">Settlement Summary</h4>
                    
                    <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                      <span>Total Returned Value (Credit)</span>
                      <span className="text-rose-600">-{fmt(returnRefundTotal)}</span>
                    </div>

                    {actionType === 'exchange' && (
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                        <span>Total Exchange Value (Debit)</span>
                        <span className="text-slate-800">+{fmt(exchangePurchaseTotal)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center border-t border-slate-200 pt-3 text-base font-black text-slate-900">
                      <span>Net Difference</span>
                      <span className={differenceAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {differenceAmount >= 0 ? '+' : ''}{fmt(differenceAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Payment/Refund details */}
                  <div className="space-y-4">
                    {differenceAmount > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 font-bold">
                        Customer owes a payment difference of <span className="underline">{fmt(differenceAmount)}</span>.
                      </div>
                    )}
                    {differenceAmount < 0 && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 font-bold">
                        Store owes a refund difference of <span className="underline">{fmt(Math.abs(differenceAmount))}</span>.
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">
                          {differenceAmount >= 0 ? 'Payment Method' : 'Refund Method'}
                        </Label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full mt-1.5 h-10 border border-slate-200 rounded-xl text-xs font-bold px-3 bg-white"
                        >
                          <option value="Cash">Cash</option>
                          <option value="Mobile">Mobile money (M-Pesa/Tigo Pesa)</option>
                          <option value="Bank">Bank transfer</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="pt-3 border-t border-slate-100">
                    <Button variant="outline" onClick={() => {
                      if (actionType === 'exchange') {
                        setModalStep(4);
                      } else {
                        setModalStep(3);
                      }
                    }} className="rounded-xl h-10 border-slate-200">
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmitReturnExchange}
                      disabled={processing}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl h-10 px-6 gap-2"
                    >
                      {processing ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                      ) : (
                        <>Complete Return &amp; Exchange <CheckCircle className="h-4 w-4" /></>
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </AppLayout>
    </>
  );
}
