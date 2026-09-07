import { Head, router } from "@inertiajs/react";
import axios from "axios";
import {
  Search, Plus, Minus, X, CreditCard, Banknote, Smartphone, User,
  ShoppingCart, ReceiptText, UserPlus, Building2, Phone, Mail,
  MessageCircle, MapPin, Users, CheckCircle, Clock, AlertTriangle,
  ChevronDown, ArrowRight, Loader2, Tag, Package, Scan, Camera,
  ArrowLeft, Trash2, Zap, ZapOff
} from "lucide-react";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/layouts/app-layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ─── Types ─────────────────────────────────────────────── */
interface CartItem {
  id: number; name: string; price: number; qty: number;
  unit: string; factor: number; sku: string; stock: number;
  color?: string; variant_id?: number;
  print_type?: "plain" | "printed";
  source_store_id?: number;
  source_store_name?: string;
  stores?: Array<{ id: number; name: string; qty: number }>;
}

type PrintType = "plain" | "printed";

interface Customer {
  id: number; customer_name: string; customer_phone: string;
  customer_email?: string; company_name?: string;
  whatsapp_no?: string; is_walking_customer?: boolean;
}

interface StaffMember { id: number; staff_name: string; staff_phone?: string; }

interface PosPageProps {
  initialProducts?: any[];
  initialCategories?: string[];
  initialSalesHistory?: any[];
  branchStaff?: StaffMember[];
  currentUser?: { id: number; name: string; branch_id: number };
}

const fmt = (n: number) =>
  "TZS " + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const DEFAULT_COUNTRY_ISO = "TZ";
const DEFAULT_COUNTRY_CODE = "255";
type CountryOption = { iso2: string; dialCode: string; name: string };
const IntlAny = Intl as any;
const regionNames =
  typeof Intl !== "undefined" && IntlAny.DisplayNames
    ? new IntlAny.DisplayNames(["en"], { type: "region" })
    : null;

const COUNTRY_CODE_OPTIONS = getCountries()
  .map((iso2) => {
    try {
      return {
        iso2,
        dialCode: getCountryCallingCode(iso2),
        name: regionNames?.of(iso2) || iso2,
      };
    } catch {
      return null;
    }
  })
  .filter(Boolean) as CountryOption[];

COUNTRY_CODE_OPTIONS.sort((a, b) => {
  if (a.iso2 === DEFAULT_COUNTRY_ISO) return -1;
  if (b.iso2 === DEFAULT_COUNTRY_ISO) return 1;
  return a.name.localeCompare(b.name);
});

function isoToFlag(iso2: string): string {
  return iso2.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

/* ─── Customer Panel ─────────────────────────────────────── */
function CustomerPanel({
  selectedCustomer, onSelectCustomer, branchStaff = []
}: {
  selectedCustomer: Customer | null;
  onSelectCustomer: (c: Customer | null) => void;
  branchStaff: StaffMember[];
}) {
  const [mode, setMode] = useState<"search" | "create">("search");
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    customer_name: "", customer_phone: "", customer_email: "",
    whatsapp_no: "", company_name: "", business_address: "",
    brought_by: "", is_walking_customer: false,
    country_code: DEFAULT_COUNTRY_CODE,
    phone_local: "",
    whatsapp_country_code: DEFAULT_COUNTRY_CODE,
    whatsapp_local: "",
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(setTimeout(() => {}, 100));

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doSearch = useCallback((q: string) => {
    clearTimeout(debounceRef.current);

    if (!q.trim()) {
 setSearchResults([]); setShowDropdown(false);

 return; 
}

    debounceRef.current = setTimeout(async () => {
      setSearching(true);

      try {
        const { data } = await axios.get("/pos/search-customers", { params: { q } });
        setSearchResults(data);
        setShowDropdown(true);
      } catch { /* silent */ } finally {
 setSearching(false); 
}
    }, 300);
  }, []);

  const handleSearchChange = (v: string) => {
 setSearchQ(v); doSearch(v); 
};

  const handleCreate = async () => {
    if (!form.is_walking_customer && !form.customer_name.trim()) {
      toast.error("Full name is required");

 return;
    }

    if (!form.phone_local.trim()) {
      toast.error("Phone number is required");

 return;
    }

    if (form.phone_local.startsWith("0")) {
      toast.error("Enter phone number without leading 0. Example: 784419707");

 return;
    }

    const customerPhone = `+${form.country_code}${form.phone_local.replace(/^0+/, "")}`;
    const whatsappPhone = form.whatsapp_local.trim()
      ? `+${form.whatsapp_country_code}${form.whatsapp_local.replace(/^0+/, "")}`
      : null;

    setCreating(true);

    try {
      const { data } = await axios.post("/pos/quick-customer", {
        customer_name: form.is_walking_customer ? "Walking Customer" : form.customer_name,
        country_code: form.country_code,
        phone_local: form.phone_local,
        customer_phone: customerPhone,
        customer_email: form.customer_email || null,
        whatsapp_country_code: form.whatsapp_country_code,
        whatsapp_local: form.whatsapp_local || null,
        whatsapp_no: whatsappPhone,
        company_name: form.company_name || null,
        business_address: form.business_address || null,
        brought_by: form.brought_by ? parseInt(form.brought_by) : null,
        is_walking_customer: form.is_walking_customer,
      });

      if (data.success) {
        onSelectCustomer(data);
        toast.success(`Customer "${data.customer_name}" saved`);
        setMode("search");
        setForm({ customer_name: "", customer_phone: "", customer_email: "",
          whatsapp_no: "", company_name: "", business_address: "", brought_by: "", is_walking_customer: false,
          country_code: DEFAULT_COUNTRY_CODE, phone_local: "", whatsapp_country_code: DEFAULT_COUNTRY_CODE, whatsapp_local: "" });
      }
    } catch (err: any) {
      const errors = err?.response?.data?.errors;

      if (errors) {
        Object.values(errors).flat().forEach((e: any) => toast.error(e));
      } else {
        toast.error("Failed to create customer");
      }
    } finally {
 setCreating(false); 
}
  };

  const pickWalking = () => {
    onSelectCustomer({ id: 0, customer_name: "Walking Customer", customer_phone: "", is_walking_customer: true });
  };

  if (selectedCustomer) {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          {selectedCustomer.is_walking_customer
            ? <Users className="h-4 w-4 text-emerald-600" />
            : <User className="h-4 w-4 text-emerald-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-800 leading-tight truncate">{selectedCustomer.customer_name}</p>
          {selectedCustomer.customer_phone && (
            <p className="text-[11px] text-slate-500 font-medium">{selectedCustomer.customer_phone}
              {selectedCustomer.company_name && <span className="ml-2 text-slate-400">· {selectedCustomer.company_name}</span>}
            </p>
          )}
        </div>
        <button onClick={() => onSelectCustomer(null)} className="shrink-0 p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2">
        <button onClick={() => setMode("search")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${mode === "search" ? "bg-red-600 text-white shadow-sm shadow-red-500/30" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
          <Search className="h-3.5 w-3.5" /> Search
        </button>
        <button onClick={() => setMode("create")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${mode === "create" ? "bg-violet-600 text-white shadow-sm shadow-violet-500/30" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
          <UserPlus className="h-3.5 w-3.5" /> New customer
        </button>
        <button onClick={pickWalking}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-all">
          <Users className="h-3.5 w-3.5" /> Walk-in
        </button>
      </div>

      {mode === "search" ? (
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500 animate-spin" />}
            <input
              value={searchQ}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              placeholder="Search by name, phone, email..."
              className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
              {searchResults.map(c => (
                <button key={c.id} onClick={() => {
 onSelectCustomer(c); setShowDropdown(false); setSearchQ(""); 
}}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left border-b border-slate-50 last:border-none">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    {c.is_walking_customer ? <Users className="h-4 w-4 text-amber-600" /> : <User className="h-4 w-4 text-slate-500" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-800 leading-tight">{c.customer_name}</p>
                    <p className="text-[11px] text-slate-500">{c.customer_phone}
                      {c.company_name && <span className="ml-2 text-slate-400">· {c.company_name}</span>}
                    </p>
                  </div>
                  {c.is_walking_customer && <Badge variant="outline" className="ml-auto text-[10px] bg-amber-50 border-amber-200 text-amber-700">Walk-in</Badge>}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          {/* Walking customer toggle */}
          <button onClick={() => setForm(p => ({ ...p, is_walking_customer: !p.is_walking_customer }))}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${form.is_walking_customer ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${form.is_walking_customer ? "bg-amber-100" : "bg-slate-100"}`}>
              <Users className={`h-4 w-4 ${form.is_walking_customer ? "text-amber-600" : "text-slate-400"}`} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-black text-slate-700">Walking customer</p>
              <p className="text-[11px] text-slate-500">{form.is_walking_customer ? "Enabled — no name required" : "Tap to enable"}</p>
            </div>
            <div className={`h-5 w-9 rounded-full transition-colors ${form.is_walking_customer ? "bg-amber-400" : "bg-slate-200"} relative`}>
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${form.is_walking_customer ? "left-4" : "left-0.5"}`} />
            </div>
          </button>

          {!form.is_walking_customer && (
            <div className="grid grid-cols-1 gap-2.5">
              {/* Full name - required */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block">Full name <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
                    placeholder="Full name of customer"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100" />
                </div>
              </div>
              {/* Email - optional */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block">Email <span className="text-slate-400 font-normal">(optional)</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input type="email" value={form.customer_email} onChange={e => setForm(p => ({ ...p, customer_email: e.target.value }))}
                    placeholder="customer@email.com"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100" />
                </div>
              </div>
            </div>
          )}

          {/* Phone - required */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 mb-1 block">Phone number <span className="text-rose-500">*</span></label>
            <div className="h-10 rounded-lg border border-slate-200 bg-white flex items-stretch overflow-hidden focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-100">
              <select
                value={form.country_code}
                onChange={(e) => setForm(p => ({ ...p, country_code: e.target.value }))}
                className="h-full min-w-[92px] bg-transparent px-2 text-xs font-bold text-slate-700 border-r border-slate-200 focus:outline-none"
              >
                {COUNTRY_CODE_OPTIONS.map((opt) => (
                  <option key={opt.iso2} value={opt.dialCode}>
                    {isoToFlag(opt.iso2)} +{opt.dialCode}
                  </option>
                ))}
              </select>
              <input
                value={form.phone_local}
                onChange={e => setForm(p => ({ ...p, phone_local: e.target.value.replace(/\D/g, "").replace(/^0+/, "") }))}
                placeholder="784419707"
                className="w-full px-3 py-2 text-sm bg-transparent outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">No leading 0. Example: +{form.country_code} 784419707</p>
          </div>

          {/* Whatsapp - optional */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 mb-1 block">WhatsApp <span className="text-slate-400 font-normal">(optional)</span></label>
            <div className="h-10 rounded-lg border border-slate-200 bg-white flex items-stretch overflow-hidden focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-100">
              <select
                value={form.whatsapp_country_code}
                onChange={(e) => setForm(p => ({ ...p, whatsapp_country_code: e.target.value }))}
                className="h-full min-w-[92px] bg-transparent px-2 text-xs font-bold text-slate-700 border-r border-slate-200 focus:outline-none"
              >
                {COUNTRY_CODE_OPTIONS.map((opt) => (
                  <option key={opt.iso2} value={opt.dialCode}>
                    {isoToFlag(opt.iso2)} +{opt.dialCode}
                  </option>
                ))}
              </select>
              <input
                value={form.whatsapp_local}
                onChange={e => setForm(p => ({ ...p, whatsapp_local: e.target.value.replace(/\D/g, "").replace(/^0+/, "") }))}
                placeholder="WhatsApp number"
                className="w-full px-3 py-2 text-sm bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Company - optional */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 mb-1 block">Company name <span className="text-slate-400 font-normal">(optional)</span></label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                placeholder="Business / company name"
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100" />
            </div>
          </div>

          {/* Business address - optional */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 mb-1 block">Business address <span className="text-slate-400 font-normal">(optional)</span></label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <textarea value={form.business_address} onChange={e => setForm(p => ({ ...p, business_address: e.target.value }))}
                placeholder="Street, city, area..."
                rows={2}
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 resize-none" />
            </div>
          </div>

          {/* Brought by - optional */}
          {branchStaff.length > 0 && (
            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1 block">Brought by (salesperson) <span className="text-slate-400 font-normal">(optional)</span></label>
              <div className="relative">
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select value={form.brought_by} onChange={e => setForm(p => ({ ...p, brought_by: e.target.value }))}
                  className="w-full pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 appearance-none">
                  <option value="">— Select salesperson —</option>
                  {branchStaff.map(s => (
                    <option key={s.id} value={s.id}>{s.staff_name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <Button onClick={handleCreate} disabled={creating} className="w-full h-9 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs shadow-sm">
            {creating ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Saving...</> : <><UserPlus className="h-3.5 w-3.5 mr-2" /> Save customer</>}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Main POS Page ──────────────────────────────────────── */
export default function PosPage({
  initialProducts = [],
  initialCategories = [],
  initialSalesHistory = [],
  branchStaff = [],
  currentUser,
}: PosPageProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentTiming, setPaymentTiming] = useState<"now" | "later">("now");
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<Array<"Cash" | "Mobile" | "Bank">>(["Cash"]);
  const [paymentSplits, setPaymentSplits] = useState<Record<"Cash" | "Mobile" | "Bank", string>>({
    Cash: "",
    Mobile: "",
    Bank: "",
  });
  const [discount, setDiscount] = useState(0);
  const [amountReceived, setAmountReceived] = useState("");
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  
  /* Delivery fields */
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [deliveryDiscount, setDeliveryDiscount] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [enableDelivery, setEnableDelivery] = useState(false);
  const [includeVat, setIncludeVat] = useState(false);

  /* Product search state */
  const [liveProducts, setLiveProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>(setTimeout(() => {}, 100));

  /* Color selection state */
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [pendingUnit, setPendingUnit] = useState<any>(null);
  const [pendingVariant, setPendingVariant] = useState<any>(null);
  const [pendingPrintType, setPendingPrintType] = useState<"plain" | "printed">("plain");

  /* Trading product selection state */
  const [tradingDialogOpen, setTradingDialogOpen] = useState(false);
  const [tradingQty, setTradingQty] = useState(1);
  const [tradingUnit, setTradingUnit] = useState<any>(null);
  const [tradingVariant, setTradingVariant] = useState<any>(null);
  const [tradingStore, setTradingStore] = useState<any>(null);

  /* Fulfillment assignee */
  const [fulfillmentAssignee, setFulfillmentAssignee] = useState<number | string>("");

  /* Store selection modal */
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [storeModalProduct, setStoreModalProduct] = useState<any>(null);
  const [storeModalOnConfirm, setStoreModalOnConfirm] = useState<{ fn: (storeId?: number, storeName?: string) => void } | null>(null);

  /* Barcode scanner */
  const [barcodeValue, setBarcodeValue] = useState("");
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const [barcodeScanSuccess, setBarcodeScanSuccess] = useState(false);
  const [barcodeNotFoundOpen, setBarcodeNotFoundOpen] = useState(false);
  const [barcodeNotFoundValue, setBarcodeNotFoundValue] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);

  /* Camera barcode scanner */
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [lastScannedFlash, setLastScannedFlash] = useState(false);
  const posVideoRef = useRef<HTMLVideoElement>(null);
  const posStreamRef = useRef<MediaStream | null>(null);
  const posDetectorRef = useRef<any>(null);
  const posScanIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const scanLockRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const STANDARD_COLORS = []; // Remove static colors as they must come from DB

  const doProductSearch = useCallback((q: string) => {
    clearTimeout(searchDebounce.current);

    if (!q.trim()) {
 setLiveProducts([]);

 return; 
}

    searchDebounce.current = setTimeout(async () => {
      setLoadingProducts(true);

      try {
        const { data } = await axios.get("/pos/search", { params: { q } });
        setLiveProducts(data);
      } catch { /* silent */ } finally {
 setLoadingProducts(false); 
}
    }, 350);
  }, []);

  const handleSearchChange = (v: string) => {
    setSearch(v);

    if (v.trim()) {
      doProductSearch(v);
    } else {
      setLiveProducts([]);
    }
  };

  const primeAudio = () => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    } catch { }
  };

  const playCartSound = () => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const doPlay = () => {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(1100, t + 0.07);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
      };
      if (ctx.state === 'suspended') {
        ctx.resume().then(doPlay);
      } else {
        doPlay();
      }
    } catch { }
  };

  /* Auto-focus barcode input on mount */
  useEffect(() => {
    setTimeout(() => barcodeInputRef.current?.focus(), 300);
  }, []);

  /* Products to display */
  const displayProducts = search.trim() ? liveProducts : initialProducts.filter(p =>
    catFilter === "All" || p.category === catFilter
  );

  const displayCategories = ["All", ...new Set(initialProducts.map((p: any) => p.category))];

  /* Cart logic */
  const resolveLineName = (
    product: any,
    unit: any,
    colorLabel?: string | null,
    printType?: PrintType,
  ) => product.name
    + (unit.factor > 1 ? ` (${unit.name})` : "")
    + (colorLabel ? ` - ${colorLabel}` : "")
    + (printType ? ` [${printType === "printed" ? "Printed" : "Plain"}]` : "");

  const resolveManufacturedPrice = (
    product: any,
    unit: any,
    variant: any,
    printType: PrintType,
  ) => {
    const plainPrice = Number(
      variant?.plain_price
      ?? product?.plain_price
      ?? unit?.plain_price
      ?? unit?.market_price
      ?? unit?.unit_price
      ?? variant?.price
      ?? unit?.price
      ?? product?.price
      ?? 0,
    );

    const printedPrice = Number(
      variant?.printed_price
      ?? product?.printed_price
      ?? unit?.printed_price
      ?? unit?.market_price
      ?? unit?.unit_price
      ?? variant?.price
      ?? unit?.price
      ?? plainPrice,
    );

    if (printType === "printed") {
      return printedPrice > 0 ? printedPrice : plainPrice;
    }

    return plainPrice;
  };

  const resolveCartPrice = (
    product: any,
    unit: any,
    variant?: any,
    printType?: PrintType,
  ) => {
    if (!product) {
      return 0;
    }

    const isManufactured = product.product_type === 'manufactured' || product.category === 'Wooven Fabric' || product.category === 'Manufactured';

    if (isManufactured) {
      return resolveManufacturedPrice(product, unit, variant, printType ?? "plain");
    }

    return Number(
      variant?.price
      ?? unit?.price
      ?? unit?.market_price
      ?? unit?.unit_price
      ?? product?.price
      ?? 0,
    );
  };

  const withStoreSelection = (product: any, onConfirm: (storeId?: number, storeName?: string) => void) => {
    const storesWithStock = (product.stores ?? []).filter((s: any) => s.qty > 0);
    if (storesWithStock.length > 1) {
      setStoreModalProduct(product);
      setStoreModalOnConfirm({ fn: onConfirm });
      setStoreModalOpen(true);
    } else {
      const def = storesWithStock[0];
      onConfirm(def?.id, def?.name);
    }
  };

  const addToCart = (product: any, unit: any, variant?: any, printType?: PrintType) => {
    const isManufactured = product.product_type === 'manufactured' || product.category === 'Wooven Fabric' || product.category === 'Manufactured';

    if (isManufactured && !printType) {
      setPendingProduct(product);
      setPendingUnit(unit);
      setPendingVariant(variant ?? null);
      setPrintDialogOpen(true);
      return;
    }
    
    // If manufactured, check for variations from DB
    if (isManufactured && !variant) {
        if (product.variants && product.variants.length > 0) {
            setPendingProduct(product);
            setPendingUnit(unit);
        setPendingVariant(null);
        setPendingPrintType(printType ?? "plain");
            setColorDialogOpen(true);
            return;
        } else {
            // Fallback for cases with no variations yet — just add to cart with startQty
            // This ensures products without variations can still be sold
            variant = null; 
        }
    }

    // For any non-manufactured product with color variants, show color picker first
    if (!isManufactured && !variant && product.variants && product.variants.length > 0 && product.product_type !== 'trading') {
        setPendingProduct(product);
        setPendingUnit(unit);
        setPendingVariant(null);
        setColorDialogOpen(true);
        return;
    }

    // New: Handle Trading products with a modal for unit/qty if called from card
    if (product.product_type === 'trading' && !variant && !tradingDialogOpen) {
        setPendingProduct(product);
        setTradingUnit(unit ?? product.sale_units?.[0] ?? { name: "Unit", factor: 1, price: product.price });
        setTradingQty(1);
        setTradingVariant(null);
        // Auto-select the first store with stock as a default; user can change inside modal
        const storesWithStock = (product.stores ?? []).filter((s: any) => s.qty > 0);
        setTradingStore(storesWithStock[0] ?? null);
        setTradingDialogOpen(true);
        return;
    }

    const startQty = isManufactured ? 100 : 1;
    const colorLabel = variant?.color || variant?.name || null;
    const resolvedPrice = resolveCartPrice(product, unit, variant, printType);

    withStoreSelection(product, (sourceStoreId, sourceStoreName) => {
      setCart(prev => {
        const existing = prev.find(i => i.id === product.id && i.unit === unit.name && i.color === colorLabel && i.print_type === (printType ?? "plain"));

        if (existing) {
          return prev.map(i => i.id === product.id && i.unit === unit.name && i.color === colorLabel && i.print_type === (printType ?? "plain")
            ? { ...i, qty: i.qty + 1, price: resolvedPrice } : i);
        }

        return [...prev, {
          id: product.id,
          name: resolveLineName(product, unit, colorLabel, isManufactured ? (printType ?? "plain") : undefined),
          price: resolvedPrice,
          qty: startQty,
          unit: unit.name,
          factor: unit.factor ?? 1,
          sku: product.sku,
          stock: variant?.qty ?? product.stock,
          color: colorLabel,
          variant_id: variant?.id,
          print_type: isManufactured ? (printType ?? "plain") : undefined,
          stores: product.stores ?? [],
          source_store_id: sourceStoreId,
          source_store_name: sourceStoreName,
        }];
      });

      playCartSound();
      if (isManufactured) {
        toast.info(`Ordering manufactured product. Minimum quantity set to 100.`);
      }
    });
  };

  const addSimple = (product: any) => {
    const defaultUnit = product.sale_units?.[0] ?? { name: "Unit", factor: 1, price: product.price };
    addToCart(product, defaultUnit);
  };

  const addByBarcode = (product: any) => {
    const defaultUnit = product.sale_units?.[0] ?? { name: product.unit ?? "Unit", factor: 1, price: product.price };
    const resolvedPrice = resolveCartPrice(product, defaultUnit);
    withStoreSelection(product, (sourceStoreId, sourceStoreName) => {
      setCart(prev => {
        const existing = prev.find(i => i.id === product.id && i.unit === defaultUnit.name && !i.color);
        if (existing) {
          return prev.map(i => i.id === product.id && i.unit === defaultUnit.name && !i.color
            ? { ...i, qty: i.qty + 1 } : i);
        }
        return [...prev, {
          id: product.id,
          name: product.name,
          price: resolvedPrice,
          qty: 1,
          unit: defaultUnit.name,
          factor: defaultUnit.factor ?? 1,
          sku: product.sku,
          stock: product.stock,
          color: undefined,
          variant_id: undefined,
          print_type: undefined,
          stores: product.stores ?? [],
          source_store_id: sourceStoreId,
          source_store_name: sourceStoreName,
        }];
      });
      playCartSound();
      toast.success(`${product.name} added to cart`);
    });
  };

  const handleBarcodeScan = async (code: string) => {
    if (!code.trim()) return;
    setBarcodeScanning(true);
    setBarcodeScanSuccess(false);
    try {
      const { data } = await axios.get("/pos/scan-barcode", { params: { barcode: code } });
      if (data.found && data.product) {
        setBarcodeValue("");
        setBarcodeScanSuccess(true);
        setTimeout(() => setBarcodeScanSuccess(false), 2000);
        addByBarcode(data.product);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setBarcodeNotFoundValue(code);
        setBarcodeNotFoundOpen(true);
        setBarcodeValue("");
      } else {
        toast.error("Scan failed. Please try again.");
      }
    } finally {
      setBarcodeScanning(false);
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    }
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      primeAudio();
      handleBarcodeScan(barcodeValue.trim());
    }
  };

  const stopPosCamera = useCallback(() => {
    if (posScanIntervalRef.current) clearInterval(posScanIntervalRef.current);
    if (posStreamRef.current) {
      posStreamRef.current.getTracks().forEach(t => t.stop());
      posStreamRef.current = null;
    }
    posDetectorRef.current = null;
    scanLockRef.current = false;
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  const toggleTorch = useCallback(async () => {
    const track = posStreamRef.current?.getVideoTracks?.()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
      setTorchOn(v => !v);
    } catch { /* torch not supported on this device */ }
  }, [torchOn]);

  const startPosCamera = useCallback(async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      posStreamRef.current = stream;
      if (posVideoRef.current) {
        posVideoRef.current.srcObject = stream;
        posVideoRef.current.play();
      }
      const track = stream.getVideoTracks?.()[0];
      const caps: any = track?.getCapabilities?.();
      setTorchSupported(!!caps?.torch);
      if (!("BarcodeDetector" in window)) {
        setCameraError("Camera barcode detection is not supported in this browser. Use Chrome or Edge, or use the scan input above.");
        return;
      }
      const detector = new (window as any).BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "code_93", "qr_code", "data_matrix"],
      });
      posDetectorRef.current = detector;
      posScanIntervalRef.current = setInterval(async () => {
        if (!posVideoRef.current || !posDetectorRef.current || scanLockRef.current) return;
        try {
          const barcodes = await posDetectorRef.current.detect(posVideoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            scanLockRef.current = true;
            setLastScannedFlash(true);
            setTimeout(() => setLastScannedFlash(false), 400);
            handleBarcodeScan(code);
            // Keep the camera running so the cashier can scan the next item
            // straight away — cooldown just avoids re-adding the same item
            // multiple times while it's still in frame.
            setTimeout(() => { scanLockRef.current = false; }, 1500);
          }
        } catch { /* ignore detection errors */ }
      }, 300);
    } catch {
      setCameraError("Camera access denied. Please allow camera permission in your browser and try again.");
    }
  }, [stopPosCamera]);

  useEffect(() => () => stopPosCamera(), [stopPosCamera]);

  /* Pause the scan loop while a scan-triggered prompt (store/print/color pick) is open */
  useEffect(() => {
    if (!cameraModalOpen) return;
    scanLockRef.current = storeModalOpen || printDialogOpen || colorDialogOpen || tradingDialogOpen || barcodeNotFoundOpen;
  }, [cameraModalOpen, storeModalOpen, printDialogOpen, colorDialogOpen, tradingDialogOpen, barcodeNotFoundOpen]);

  const updateQty = (id: number, unit: string, color: string | undefined, printType: "plain" | "printed" | undefined, delta: number) =>
    setCart(prev => prev.map(i => {
      if (i.id === id && i.unit === unit && i.color === color && i.print_type === printType) {
        const newQty = Math.max(1, i.qty + delta);
        const factor = i.factor ?? 1;
        const effectiveStock = Math.floor(i.stock / factor);
        if (newQty > effectiveStock && delta > 0) {
          toast.error(`Only ${effectiveStock} ${i.unit}(s) available in stock`);
          return i;
        }
        return { ...i, qty: newQty };
      }
      return i;
    }));

  const manualUpdateQty = (id: number, unit: string, color: string | undefined, printType: "plain" | "printed" | undefined, val: string) => {
    const n = parseInt(val) || 0;
    setCart(prev => prev.map(i => {
      if (i.id === id && i.unit === unit && i.color === color && i.print_type === printType) {
        const factor = i.factor ?? 1;
        const effectiveStock = Math.floor(i.stock / factor);
        if (n > effectiveStock) {
          toast.error(`Only ${effectiveStock} ${i.unit}(s) available in stock`);
          return { ...i, qty: effectiveStock };
        }
        return { ...i, qty: Math.max(0, n) };
      }
      return i;
    }));
  };

  const removeItem = (id: number, unit: string, color: string | undefined, printType: "plain" | "printed" | undefined) =>
    setCart(prev => prev.filter(i => !(i.id === id && i.unit === unit && i.color === color && i.print_type === printType)));

  const clearCart = () => {
    setCart([]); setDiscount(0); setAmountReceived(""); setNotes(""); setDeliveryCost(0); setDeliveryDiscount(0); setDeliveryAddress(""); setEnableDelivery(false); setPaymentTiming("now"); setSelectedPaymentMethods(["Cash"]); setPaymentSplits({ Cash: "", Mobile: "", Bank: "" }); setFulfillmentAssignee("");
  };

  /* Totals */
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const vatAmount = includeVat ? Math.round(subtotal * 0.18) : 0;
  const discountAmt = Math.min(discount, subtotal);
  const deliveryNet = enableDelivery ? (deliveryCost - deliveryDiscount) : 0;
  const payable = Math.max(0, subtotal + vatAmount - discountAmt + deliveryNet);
  const splitPaidTotal = (Object.entries(paymentSplits) as Array<["Cash" | "Mobile" | "Bank", string]>)
    .filter(([method]) => selectedPaymentMethods.includes(method))
    .reduce((sum, [, amount]) => sum + (parseFloat(amount) || 0), 0);
  const received = paymentTiming === "later" ? 0 : splitPaidTotal;
  const change = Math.max(0, received - payable);
  const balance = Math.max(0, payable - received);
  const payStatus = paymentTiming === "later"
    ? "Unpaid"
    : (received >= payable ? "Paid" : received > 0 ? "Partially Paid" : "Unpaid");

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
 toast.error("Cart is empty");

 return; 
}

    setProcessing(true);

    try {
      const isPayLater = paymentTiming === "later";

      if (!isPayLater && selectedPaymentMethods.length === 0) {
        toast.error("Select at least one payment method or choose pay later");
        setProcessing(false);
        return;
      }

      const paymentBreakdown = isPayLater
        ? []
        : selectedPaymentMethods
            .map((method) => ({ method, amount: parseFloat(paymentSplits[method]) || 0 }))
            .filter((entry) => entry.amount > 0);

      if (!isPayLater && paymentBreakdown.length === 0) {
        toast.error("Enter amount for selected payment method(s)");
        setProcessing(false);
        return;
      }

      const paymentMethodLabel = paymentBreakdown.map((entry) => entry.method).join(" + ");

      const res = await axios.post("/pos/store", {
        cart: cart.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          qty: i.qty,
          factor: i.factor,
          variant_id: i.variant_id ?? null,
          print_type: i.print_type ?? null,
          source_store_id: i.source_store_id ?? null,
        })),
        payment_method: isPayLater ? null : paymentMethodLabel,
        payment_breakdown: paymentBreakdown,
        payment_timing: paymentTiming,
        customer_id: selectedCustomer && selectedCustomer.id > 0 ? selectedCustomer.id : null,
        discount: discountAmt,
        tax_amount: vatAmount,
        amount_received: isPayLater ? 0 : received,
        notes: notes || `POS Sale — ${isPayLater ? "Pay Later" : paymentMethodLabel}`,
        assigned_to: fulfillmentAssignee || null,
        // Delivery fields
        delivery_cost: enableDelivery ? deliveryCost : 0,
        delivery_discount: enableDelivery ? deliveryDiscount : 0,
        delivery_address: enableDelivery ? deliveryAddress : '',
      });

      if (res.data.success) {
        toast.success(`Sale complete! Invoice: ${res.data.invoice}`);
        
        // Open receipt in new window for printing
        window.open(`/pos/print/${res.data.invoice}`, '_blank', 'width=450,height=700');
        
        clearCart();
        setSelectedCustomer(null);
        // Refresh history
        router.reload({ only: ["initialSalesHistory"] });
      } else {
        toast.error(res.data.message ?? "Sale failed");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "An error occurred";
      toast.error(msg);
    } finally {
 setProcessing(false); 
}
  };

  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "POS terminal", href: "/pos" },
  ];

  const PAYMENT_METHODS = [
    { key: "Cash", label: "Cash", icon: <Banknote className="h-4 w-4" /> },
    { key: "Bank", label: "Bank", icon: <CreditCard className="h-4 w-4" /> },
    { key: "Mobile", label: "Mobile", icon: <Smartphone className="h-4 w-4" /> },

  ] as const;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="POS terminal" />
      <div className="max-w-[1700px] mx-auto space-y-6 pb-20">

        <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Select Color for {pendingProduct?.name}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 py-6">
                    {pendingProduct?.variants?.map((v: any) => (
                        <button
                            key={v.id}
                            onClick={() => {
                    addToCart(pendingProduct, pendingUnit, v, pendingPrintType);
                                setColorDialogOpen(false);
                    setPendingVariant(null);
                            }}
                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 group transition-all"
                        >
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                <Plus className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black text-slate-800">{v.color}</p>
                                <p className="text-[10px] text-slate-500 font-bold">{v.qty} in stock</p>
                            </div>
                        </button>
                    ))}
                    {(!pendingProduct?.variants || pendingProduct.variants.length === 0) && (
                        <div className="col-span-2 py-8 text-center bg-slate-50 rounded-xl">
                            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                            <p className="text-sm border-slate-600 font-bold opacity-75 italic text-slate-500">No color variations defined for this product.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
            <DialogContent className="sm:max-w-lg bg-white">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Select Bag Type &amp; Color — {pendingProduct?.name}</DialogTitle>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Choose a bag type then tap a color to add to cart</p>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Plain Bag section */}
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                            <div>
                                <p className="text-sm font-black text-slate-800">Plain Bag</p>
                                <p className="text-[11px] font-medium text-slate-500">
                            TZS {resolveCartPrice(pendingProduct, pendingUnit, pendingVariant, "plain").toLocaleString()}
                                </p>
                            </div>
                            {/* No variants: single add button */}
                            {(!pendingProduct?.variants || pendingProduct.variants.length === 0) && (
                                <button
                                    onClick={() => {
                                        setPrintDialogOpen(false);
                                        addToCart(pendingProduct, pendingUnit, undefined, "plain");
                                    }}
                                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-lg transition-colors"
                                >
                                    Add Plain
                                </button>
                            )}
                        </div>
                        {pendingProduct?.variants && pendingProduct.variants.length > 0 && (
                            <div className="p-3 flex flex-wrap gap-2">
                                {pendingProduct.variants.map((v: any) => (
                                    <button
                                        key={v.id}
                                        onClick={() => {
                                            setPrintDialogOpen(false);
                                            addToCart(pendingProduct, pendingUnit, v, "plain");
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-300 transition-all text-left"
                                    >
                                        <span className="text-xs font-black text-slate-800">{v.color}</span>
                                        <span className="text-[10px] text-slate-400 font-semibold">{v.qty} pcs</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Printed Bag section */}
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                            <div>
                                <p className="text-sm font-black text-slate-800">Printed Bag</p>
                                <p className="text-[11px] font-medium text-slate-500">
                            TZS {resolveCartPrice(pendingProduct, pendingUnit, pendingVariant, "printed").toLocaleString()}
                                </p>
                            </div>
                            {/* No variants: single add button */}
                            {(!pendingProduct?.variants || pendingProduct.variants.length === 0) && (
                                <button
                                    onClick={() => {
                                        setPrintDialogOpen(false);
                                        addToCart(pendingProduct, pendingUnit, undefined, "printed");
                                    }}
                                    className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black rounded-lg transition-colors"
                                >
                                    Add Printed
                                </button>
                            )}
                        </div>
                        {pendingProduct?.variants && pendingProduct.variants.length > 0 && (
                            <div className="p-3 flex flex-wrap gap-2">
                                {pendingProduct.variants.map((v: any) => (
                                    <button
                                        key={v.id}
                                        onClick={() => {
                                            setPrintDialogOpen(false);
                                            addToCart(pendingProduct, pendingUnit, v, "printed");
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-violet-50 hover:border-violet-300 transition-all text-left"
                                    >
                                        <span className="text-xs font-black text-slate-800">{v.color}</span>
                                        <span className="text-[10px] text-slate-400 font-semibold">{v.qty} pcs</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* Store Selection Modal */}
        <Dialog open={storeModalOpen} onOpenChange={setStoreModalOpen}>
          <DialogContent className="sm:max-w-sm bg-white">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Select Fulfillment Store</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <p className="text-xs text-slate-500 mb-3">Choose which store to fulfill this item from:</p>
              {(storeModalProduct?.stores ?? []).filter((s: any) => s.qty > 0).map((store: any) => (
                <button
                  key={store.id}
                  onClick={() => {
                    storeModalOnConfirm?.fn(store.id, store.name);
                    setStoreModalOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-slate-100 hover:border-red-400 hover:bg-red-50 transition-all text-left"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-800">{store.name}</p>
                    <p className="text-xs text-emerald-600 font-semibold mt-0.5">{store.qty} base units in stock</p>
                  </div>
                  <Package className="h-4 w-4 text-slate-300" />
                </button>
              ))}
              <button
                onClick={() => {
                  storeModalOnConfirm?.fn(undefined, undefined);
                  setStoreModalOpen(false);
                }}
                className="w-full p-3 mt-1 rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all"
              >
                Auto-select store
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Barcode Not Found Dialog */}
        <Dialog open={barcodeNotFoundOpen} onOpenChange={setBarcodeNotFoundOpen}>
          <DialogContent className="sm:max-w-sm bg-white" onOpenAutoFocus={e => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Barcode Not Registered
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wide mb-1">Scanned barcode</p>
                <p className="text-lg font-mono font-black text-amber-900">{barcodeNotFoundValue}</p>
              </div>
              <p className="text-sm text-slate-600">This barcode is not linked to any product. Register a new product with this barcode, or cancel to continue.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setBarcodeNotFoundOpen(false);
                    router.visit('/products-new');
                  }}
                  className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-black transition-colors"
                >
                  Register Product
                </button>
                <button
                  onClick={() => {
                    setBarcodeNotFoundOpen(false);
                    setTimeout(() => barcodeInputRef.current?.focus(), 100);
                  }}
                  className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-700 text-sm font-black hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Camera Barcode Scanner — full-screen smart scan UI (mobile-style) */}
        {cameraModalOpen && (
          <div className="fixed inset-0 z-40 bg-black flex flex-col">
            {/* Camera area */}
            <div className="relative flex-1 min-h-0">
              {cameraError ? (
                <div className="h-full flex items-center justify-center p-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 max-w-sm">{cameraError}</div>
                </div>
              ) : (
                <>
                  <video ref={posVideoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
                  {/* Viewfinder frame with corner brackets */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-60 h-60 sm:w-72 sm:h-72">
                      <span className={`absolute top-0 left-0 w-9 h-9 border-t-[5px] border-l-[5px] rounded-tl-2xl transition-colors ${lastScannedFlash ? "border-emerald-400" : "border-orange-400"}`} />
                      <span className={`absolute top-0 right-0 w-9 h-9 border-t-[5px] border-r-[5px] rounded-tr-2xl transition-colors ${lastScannedFlash ? "border-emerald-400" : "border-orange-400"}`} />
                      <span className={`absolute bottom-0 left-0 w-9 h-9 border-b-[5px] border-l-[5px] rounded-bl-2xl transition-colors ${lastScannedFlash ? "border-emerald-400" : "border-orange-400"}`} />
                      <span className={`absolute bottom-0 right-0 w-9 h-9 border-b-[5px] border-r-[5px] rounded-br-2xl transition-colors ${lastScannedFlash ? "border-emerald-400" : "border-orange-400"}`} />
                      {lastScannedFlash ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckCircle className="h-12 w-12 text-emerald-400 drop-shadow" />
                        </div>
                      ) : (
                        <div className="absolute inset-x-3 top-1/2 h-0.5 bg-orange-400/70 shadow-[0_0_8px_2px_rgba(251,146,60,0.6)] animate-pulse" />
                      )}
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-6 text-center pointer-events-none px-6">
                    <span className="inline-flex items-center gap-1.5 bg-black/60 text-white text-xs font-medium px-3.5 py-2 rounded-full">
                      {lastScannedFlash ? "Added to cart" : "Aim at the product barcode"}
                    </span>
                  </div>
                </>
              )}

              {/* Top bar */}
              <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 bg-gradient-to-b from-black/70 to-transparent">
                <button
                  type="button"
                  onClick={() => { stopPosCamera(); setCameraModalOpen(false); }}
                  className="h-10 w-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white active:scale-95 transition-all"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <span className="text-white text-sm font-medium">Scan Product</span>
                <button
                  type="button"
                  onClick={toggleTorch}
                  disabled={!torchSupported}
                  className={`h-10 w-10 rounded-full backdrop-blur flex items-center justify-center transition-all active:scale-95 ${torchOn ? "bg-orange-500 text-white" : "bg-black/40 text-white"} ${!torchSupported ? "opacity-30" : ""}`}
                >
                  {torchOn ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Bottom sheet — live scanned cart */}
            <div className="bg-white rounded-t-3xl shadow-2xl flex flex-col shrink-0" style={{ maxHeight: "42vh" }}>
              <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Scanned items ({cart.length})</span>
                <span className="text-base font-semibold text-slate-900">TZS {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-2 space-y-1.5">
                {cart.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 font-medium">No items scanned yet</div>
                ) : cart.map(item => (
                  <div key={`scan-${item.id}-${item.unit}-${item.color || "default"}-${item.print_type || "none"}`} className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal">TZS {item.price.toLocaleString()} · {item.unit}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => updateQty(item.id, item.unit, item.color, item.print_type, -1)} className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center transition-colors"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-5 text-center text-xs font-medium">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.unit, item.color, item.print_type, 1)} className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-orange-100 hover:text-orange-600 flex items-center justify-center transition-colors"><Plus className="h-3.5 w-3.5" /></button>
                      <button onClick={() => removeItem(item.id, item.unit, item.color, item.print_type)} className="h-7 w-7 rounded-lg hover:bg-rose-100 flex items-center justify-center transition-colors text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 pt-2 pb-[max(env(safe-area-inset-bottom),16px)] border-t border-slate-100">
                {cameraError && (
                  <button type="button" onClick={startPosCamera}
                    className="w-full h-10 mb-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition-colors">
                    Retry Camera
                  </button>
                )}
                <button type="button" onClick={() => { stopPosCamera(); setCameraModalOpen(false); }}
                  className="w-full h-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-medium text-sm transition-colors active:scale-[0.98]">
                  Done Scanning
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trading Product Unit/Qty Modal */}
        <Dialog open={tradingDialogOpen} onOpenChange={setTradingDialogOpen}>
            <DialogContent className="sm:max-w-sm bg-white p-0 overflow-hidden">
                {/* Header */}
                <div className="px-4 pt-4 pb-3 border-b border-slate-100">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">Add to Cart</p>
                    <DialogTitle className="text-sm font-bold text-slate-800 leading-tight">{pendingProduct?.name}</DialogTitle>
                </div>

                <div className="px-4 pb-4 pt-3 space-y-4">

                    {/* ── Store ── */}
                    {(() => {
                        const allStores = pendingProduct?.stores ?? [];
                        if (allStores.length <= 1) return null;
                        return (
                            <div>
                                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Store</p>
                                <div className="flex gap-1.5 flex-wrap">
                                    {allStores.map((store: any) => {
                                        const hasStock = store.qty > 0;
                                        const storeAvail = Math.floor(store.qty / (tradingUnit?.factor ?? 1));
                                        const isSelected = tradingStore?.id === store.id;
                                        return (
                                            <button
                                                key={store.id}
                                                disabled={!hasStock}
                                                onClick={() => { setTradingStore(store); setTradingQty(1); }}
                                                className={`flex-1 min-w-[5rem] px-3 py-2 rounded-lg border text-left transition-all
                                                    ${isSelected
                                                        ? "border-red-500 bg-red-50"
                                                        : hasStock
                                                            ? "border-slate-200 bg-white hover:border-slate-300"
                                                            : "border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed"}`}
                                            >
                                                <p className={`text-xs font-semibold leading-none ${isSelected ? "text-red-600" : "text-slate-600"}`}>{store.name}</p>
                                                <p className={`text-[9px] mt-1 ${storeAvail > 0 ? "text-emerald-500" : "text-rose-400"}`}>
                                                    {storeAvail > 0 ? `${storeAvail} avail.` : "Out of stock"}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    {/* ── Unit ── */}
                    {pendingProduct?.sale_units?.length >= 1 && (
                        <div>
                            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Unit & Price</p>
                            <div className="flex gap-1.5 flex-wrap">
                                {pendingProduct.sale_units.map((u: any) => {
                                    const storeQty = tradingStore?.qty ?? pendingProduct.stock;
                                    const availForUnit = Math.floor(storeQty / (u.factor ?? 1));
                                    const isSelected = tradingUnit?.name === u.name;
                                    return (
                                        <button
                                            key={u.name}
                                            onClick={() => { setTradingUnit(u); setTradingQty(1); }}
                                            className={`flex-1 min-w-[5rem] px-3 py-2 rounded-lg border text-left transition-all
                                                ${isSelected ? "border-red-500 bg-red-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                                        >
                                            <p className={`text-xs font-semibold leading-none ${isSelected ? "text-red-600" : "text-slate-600"}`}>
                                                {u.name}
                                                {u.factor > 1 && <span className="text-[9px] font-normal opacity-40 ml-1">×{u.factor}</span>}
                                            </p>
                                            <p className="text-[9px] text-slate-400 mt-1">TZS {(u.market_price ?? u.price)?.toLocaleString()}</p>
                                            <p className={`text-[9px] mt-0.5 ${availForUnit > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                {availForUnit > 0 ? `${availForUnit} avail.` : "Out of stock"}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Color / Variant ── */}
                    {pendingProduct?.variants && pendingProduct.variants.length > 0 && (
                        <div>
                            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Color</p>
                            <div className="flex gap-1.5 flex-wrap">
                                <button
                                    onClick={() => setTradingVariant(null)}
                                    className={`flex-1 min-w-[5rem] px-3 py-2 rounded-lg border text-left transition-all
                                        ${!tradingVariant ? "border-red-500 bg-red-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                                >
                                    <p className={`text-xs font-semibold leading-none ${!tradingVariant ? "text-red-600" : "text-slate-600"}`}>Any</p>
                                    <p className="text-[9px] text-emerald-500 mt-1">
                                        {Math.floor((tradingStore?.qty ?? pendingProduct.stock) / (tradingUnit?.factor ?? 1))} avail.
                                    </p>
                                </button>
                                {pendingProduct.variants.map((v: any) => {
                                    const variantAvail = Math.floor(v.qty / (tradingUnit?.factor ?? 1));
                                    const isSelected = tradingVariant?.id === v.id;
                                    return (
                                        <button
                                            key={v.id}
                                            onClick={() => setTradingVariant(v)}
                                            className={`flex-1 min-w-[5rem] px-3 py-2 rounded-lg border text-left transition-all
                                                ${isSelected ? "border-red-500 bg-red-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                                        >
                                            <p className={`text-xs font-semibold leading-none ${isSelected ? "text-red-600" : "text-slate-600"}`}>{v.color}</p>
                                            {Number(v.price) > 0 && <p className="text-[9px] text-slate-400 mt-1">TZS {Number(v.price).toLocaleString()}</p>}
                                            <p className={`text-[9px] mt-0.5 ${variantAvail > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                {variantAvail > 0 ? `${variantAvail} avail.` : "Out of stock"}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Quantity ── */}
                    {(() => {
                        const availRaw = tradingVariant ? tradingVariant.qty : (tradingStore?.qty ?? pendingProduct?.stock ?? 0);
                        const maxQty = Math.floor(availRaw / (tradingUnit?.factor ?? 1));
                        return (
                            <div>
                                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                                    Quantity <span className="normal-case font-normal text-slate-300">— max {maxQty} {tradingUnit?.name ?? 'units'}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setTradingQty(Math.max(1, tradingQty - 1))}
                                        className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
                                    >
                                        <Minus className="h-3.5 w-3.5 text-slate-600" />
                                    </button>
                                    <input
                                        type="number"
                                        min={1}
                                        max={maxQty}
                                        value={tradingQty}
                                        onChange={(e) => setTradingQty(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))}
                                        className="flex-1 h-9 text-center text-base font-bold border border-slate-200 rounded-lg focus:border-red-400 outline-none transition-all"
                                    />
                                    <button
                                        onClick={() => setTradingQty(Math.min(maxQty, tradingQty + 1))}
                                        className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
                                    >
                                        <Plus className="h-3.5 w-3.5 text-slate-600" />
                                    </button>
                                </div>
                                {maxQty === 0 && (
                                    <p className="text-[10px] text-rose-500 mt-1.5 text-center">
                                        No stock{(tradingUnit?.factor ?? 1) > 1 ? ` — need ${tradingUnit.factor} pcs, have ${availRaw}` : ''}
                                    </p>
                                )}
                            </div>
                        );
                    })()}

                    {/* ── Summary + Confirm ── */}
                    {tradingUnit && (
                        <div className="border-t border-slate-100 pt-3 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Unit price</span>
                                <span className="font-semibold text-slate-600">TZS {resolveCartPrice(pendingProduct, tradingUnit, tradingVariant).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">Total ({tradingQty} {tradingUnit.name})</span>
                                <span className="text-sm font-bold text-red-600">TZS {(resolveCartPrice(pendingProduct, tradingUnit, tradingVariant) * tradingQty).toLocaleString()}</span>
                            </div>
                            <Button
                                onClick={() => {
                                    const storesWithStock = (pendingProduct?.stores ?? []).filter((s: any) => s.qty > 0);
                                    if (storesWithStock.length > 1 && !tradingStore) {
                                        toast.error('Please select a store first');
                                        return;
                                    }
                                    const availRaw = tradingVariant ? tradingVariant.qty : (tradingStore?.qty ?? pendingProduct.stock);
                                    const maxQty = Math.floor(availRaw / (tradingUnit?.factor ?? 1));
                                    if (tradingQty > maxQty) {
                                        toast.error(`Only ${maxQty} ${tradingUnit.name}(s) available in stock`);
                                        return;
                                    }
                                    const colorLabel = tradingVariant?.color ?? null;
                                    const resolvedPrice = resolveCartPrice(pendingProduct, tradingUnit, tradingVariant);
                                    const sourceStoreId = tradingStore?.id;
                                    const sourceStoreName = tradingStore?.name;
                                    setTradingDialogOpen(false);
                                    setCart(prev => {
                                        const existing = prev.find(i => i.id === pendingProduct.id && i.unit === tradingUnit.name && i.color === colorLabel);
                                        if (existing) {
                                            const newQty = existing.qty + tradingQty;
                                            if (newQty * (tradingUnit.factor ?? 1) > availRaw) {
                                                toast.error(`Cannot add more — only ${maxQty} ${tradingUnit.name}(s) total available`);
                                                return prev;
                                            }
                                            return prev.map(i => i.id === pendingProduct.id && i.unit === tradingUnit.name && i.color === colorLabel
                                                ? { ...i, qty: newQty } : i);
                                        }
                                        return [...prev, {
                                            id: pendingProduct.id,
                                            name: pendingProduct.name + (tradingUnit.factor > 1 ? ` (${tradingUnit.name})` : "") + (colorLabel ? ` - ${colorLabel}` : ""),
                                            price: resolvedPrice,
                                            qty: tradingQty,
                                            unit: tradingUnit.name,
                                            factor: tradingUnit.factor ?? 1,
                                            sku: pendingProduct.sku,
                                            stock: availRaw,
                                            color: colorLabel,
                                            variant_id: tradingVariant?.id ?? undefined,
                                            stores: pendingProduct.stores ?? [],
                                            source_store_id: sourceStoreId,
                                            source_store_name: sourceStoreName,
                                        }];
                                    });
                                    playCartSound();
                                    toast.success(`Added ${tradingQty} ${tradingUnit.name}(s)${colorLabel ? ' (' + colorLabel + ')' : ''} to cart`);
                                }}
                                className="w-full h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold mt-1"
                            >
                                Add to Cart
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3">
          <div>
            <h1 className="text-[16px] sm:text-[18px] lg:text-[20px] font-bold text-slate-900 tracking-tight leading-none">Point of sale</h1>

          </div>
          <button
            onClick={() => { if (window.innerWidth < 1024) { setCartSheetOpen(true); } else { document.getElementById('pos-cart')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }}
            title={`Cart — ${cart.length} item${cart.length !== 1 ? 's' : ''}`}
            className="relative h-10 w-10 active:scale-95 flex items-center justify-center transition-all"
          >
            <ShoppingCart className="h-6 w-6 text-slate-700" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-orange-600 text-white text-[9px] font-medium rounded-full flex items-center justify-center px-1 border-2 border-white leading-none">
                {cart.length > 9 ? '9+' : cart.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Terminal ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px] gap-6">

            {/* LEFT — Product grid */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-3 sm:p-4 border-b border-slate-100 space-y-2 sm:space-y-3">
                  {/* Barcode scanner row: keyboard/USB/BT input + camera button */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Scan className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                      {barcodeScanning && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500 animate-spin" />}
                      {!barcodeScanning && barcodeScanSuccess && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />}
                      <input
                        ref={barcodeInputRef}
                        value={barcodeValue}
                        onChange={e => setBarcodeValue(e.target.value)}
                        onKeyDown={handleBarcodeKeyDown}
                        placeholder="Type, USB or Bluetooth scan + Enter..."
                        autoComplete="off"
                        className={`w-full pl-10 pr-9 py-2.5 text-sm border rounded-xl outline-none transition-all ${barcodeScanSuccess ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100" : "border-orange-200 bg-orange-50/40 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100"}`}
                      />
                    </div>
                    <button
                      type="button"
                      title="Scan with camera"
                      onClick={() => { primeAudio(); setCameraModalOpen(true); setCameraError(""); startPosCamera(); }}
                      className="h-10 w-10 shrink-0 rounded-xl border border-orange-200 bg-orange-50 flex items-center justify-center text-orange-600 hover:bg-orange-100 active:scale-95 transition-all"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    {loadingProducts && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500 animate-spin" />}
                    <input
                      value={search}
                      onChange={e => handleSearchChange(e.target.value)}
                      placeholder="Search products by name or SKU..."
                      className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                  </div>
                  {/* Category filters — horizontal scroll on mobile */}
                  {!search.trim() && (
                    <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                      {displayCategories.map(c => (
                        <button key={c as string} onClick={() => setCatFilter(c as string)}
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${catFilter === c ? "bg-orange-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                          {c as string}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product grid */}
                <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-3 max-h-[calc(100dvh-210px)] sm:max-h-[calc(100dvh-210px)] lg:max-h-[calc(100vh-300px)] overflow-y-auto">
                  {displayProducts.length === 0 ? (
                    <div className="col-span-4 py-16 text-center">
                      <Package className="h-10 w-10 mx-auto text-slate-200 mb-3" />
                      <p className="text-sm font-bold text-slate-400">No products found</p>
                      <p className="text-[11px] text-slate-300 mt-1">Try a different search term</p>
                    </div>
                  ) : displayProducts.map((p: any) => {
                    const inCart = cart.some(i => i.id === p.id);
                    const saleUnits: any[] = p.sale_units ?? [{ name: "Unit", factor: 1, price: p.price }];
                    const displayPrice = p.product_type === 'trading'
                      ? (saleUnits[0]?.market_price ?? saleUnits[0]?.price ?? p.price)
                      : p.price;

                    return (
                      <div key={p.id}
                        className={`relative rounded-2xl border transition-all overflow-hidden flex flex-col ${inCart ? "border-orange-300 ring-1 ring-orange-200 bg-orange-50/30" : "border-slate-200 bg-white hover:border-orange-200 hover:shadow-lg"}`}>
                        {/* Image area */}
                        <div className="h-32 bg-white flex items-center justify-center border-b border-slate-100 relative">
                          <img
                            src={p.image || '/placeholder.png'}
                            alt={p.name}
                            className="h-full w-full object-contain p-2"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.png';
                            }}
                          />
                          {/* Stock badge on image */}
                          <span className={`absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm ${p.stock > 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
                            {p.stock > 0 ? `${Math.floor(p.stock / (p.base_factor ?? 1))} ${p.base_unit ?? ''}`.trim() : "OOS"}
                          </span>
                        </div>
                        {/* Info area */}
                        <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                          <p className="text-[11px] font-black text-slate-800 leading-tight line-clamp-2">{p.name}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-black text-red-600">TZS {displayPrice?.toLocaleString()}</p>
                            <span className="text-[9px] font-mono text-slate-400">{p.sku}</span>
                          </div>
                          {/* Color Variants */}
                          {p.variants && p.variants.length > 0 && (
                            <div className="mt-2 space-y-1">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Color Options:</p>
                                <div className="flex flex-wrap gap-1">
                                    {p.variants.map((v: any) => (
                                        <button
                                            key={v.id}
                                            onClick={() => {
                                                if (p.product_type === 'trading') {
                                                    setPendingProduct(p);
                                                    setTradingUnit(saleUnits[0] ?? { name: "Unit", factor: 1, price: p.price });
                                                    setTradingQty(1);
                                                    setTradingVariant(v);
                                                    setTradingDialogOpen(true);
                                                } else {
                                                    addToCart(p, saleUnits[0], v);
                                                }
                                            }}
                                            className="px-2 py-0.5 rounded text-[9px] font-bold border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all active:scale-95"
                                        >
                                            {v.color}
                                            {p.product_type === 'trading' && Number(v.price) > 0 && (
                                                <span className="block text-[8px] font-medium text-slate-400 mt-0.5">{Number(v.price).toLocaleString()}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                          )}

                          {/* Unit buttons */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {saleUnits.length === 1 ? (
                              <button onClick={() => addSimple(p)} disabled={p.product_type !== 'trading' && p.stock <= 0}
                                className="w-full py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-300 text-white text-[10px] font-black rounded-lg transition-colors active:scale-[0.97] leading-tight">
                                <Plus className="h-3 w-3 inline mr-0.5" />
                                {(p.variants?.length > 0 && p.product_type === 'manufactured') ? 'Select Color Above'
                                  : (p.variants?.length > 0 && p.product_type !== 'trading') ? 'Select Color'
                                  : p.product_type === 'trading'
                                    ? `${saleUnits[0]?.name || 'Unit'} · TZS ${(saleUnits[0]?.market_price ?? saleUnits[0]?.price ?? 0).toLocaleString()}`
                                    : 'Add to Cart'}
                              </button>
                            ) : (
                              saleUnits.map((u: any) => (
                                <button key={u.name} onClick={() => addToCart(p, u)} disabled={p.product_type !== 'trading' && p.stock <= 0}
                                  className="flex-1 py-1 bg-red-50 hover:bg-red-600 hover:text-white disabled:bg-slate-50 disabled:text-slate-300 text-red-700 text-[9px] font-black rounded-lg transition-all border border-red-100 active:scale-[0.97] leading-tight">
                                  {u.name}
                                  {p.product_type === 'trading' && (u.market_price ?? u.price) > 0 && (
                                    <span className="block text-[8px] font-medium opacity-70">{(u.market_price ?? u.price).toLocaleString()}</span>
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                        {inCart && (
                          <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-red-600 flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT — Cart & Payment (desktop only; mobile uses bottom sheet) */}
            <div id="pos-cart" className="hidden lg:flex flex-col gap-4">
              {/* Customer panel */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
                <p className="text-[11px] font-semibold text-slate-500 tracking-tight mb-3">Customer details</p>
                <CustomerPanel
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={setSelectedCustomer}
                  branchStaff={branchStaff}
                />
              </div>

              {/* Cart */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col flex-1">
                <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-500 tracking-tight">Active cart ({cart.length} items)</p>
                  {cart.length > 0 && (
                    <button onClick={clearCart} className="text-[11px] text-rose-500 hover:text-rose-600 font-medium transition-colors">Clear all</button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[150px] max-h-[300px]">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-slate-300">
                      <ReceiptText className="h-10 w-10 mb-2" />
                      <p className="text-sm font-semibold">Cart is empty</p>
                      <p className="text-[11px] mt-1">Tap products to add them</p>
                    </div>
                  ) : cart.map(item => (
                    <div key={`${item.id}-${item.unit}-${item.color || 'default'}-${item.print_type || 'none'}`} className="bg-slate-50 rounded-xl px-3 py-2 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[11px] font-semibold text-slate-800 leading-tight truncate">{item.name}</p>
                            {item.color && <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-500 shrink-0">{item.color}</span>}
                          </div>
                          <p className="text-[10px] text-slate-400">TZS {item.price.toLocaleString()} / <span className="text-slate-500 font-semibold">{item.unit}</span></p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => updateQty(item.id, item.unit, item.color, item.print_type, -1)}
                            className="h-6 w-6 rounded-lg bg-slate-200 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center transition-colors">
                            <Minus className="h-3 w-3" />
                          </button>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => manualUpdateQty(item.id, item.unit, item.color, item.print_type, e.target.value)}
                            className="text-xs font-semibold w-16 text-center bg-white border border-slate-200 rounded-lg py-1 focus:ring-1 focus:ring-red-100 outline-none h-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button onClick={() => updateQty(item.id, item.unit, item.color, item.print_type, 1)}
                            className="h-6 w-6 rounded-lg bg-slate-200 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 w-20 text-right shrink-0">
                          TZS {(item.price * item.qty).toLocaleString()}
                        </p>
                        <button onClick={() => removeItem(item.id, item.unit, item.color, item.print_type)}
                          className="h-6 w-6 rounded-lg hover:bg-rose-100 flex items-center justify-center transition-colors shrink-0">
                          <X className="h-3 w-3 text-rose-500" />
                        </button>
                      </div>
                      {/* Per-item source store selector */}
                      {item.stores && item.stores.filter(s => s.qty > 0).length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3 w-3 text-slate-400 shrink-0" />
                          <select
                            value={item.source_store_id ?? ""}
                            onChange={e => {
                              const storeId = e.target.value ? Number(e.target.value) : undefined;
                              const store = item.stores?.find(s => s.id === storeId);
                              setCart(prev => prev.map(i =>
                                i.id === item.id && i.unit === item.unit && i.color === item.color && i.print_type === item.print_type
                                  ? { ...i, source_store_id: storeId, source_store_name: store?.name }
                                  : i
                              ));
                            }}
                            className="flex-1 text-[10px] font-medium border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none focus:border-red-400 appearance-none"
                          >
                            <option value="">Auto-select store</option>
                            {item.stores.filter(s => s.qty > 0).map(s => {
                              const avail = Math.floor(s.qty / (item.factor ?? 1));
                              return (
                                <option key={s.id} value={s.id}>
                                  {s.name} — {avail} {item.unit} avail.
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totals & Payment */}
                <div className="border-t border-slate-100 p-4 space-y-3">
                  {/* Discount */}
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <label className="text-[11px] font-medium text-slate-500 whitespace-nowrap">Discount (TZS)</label>
                    <input type="number" min={0} max={subtotal} value={discount || ""}
                      onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0"
                      className="flex-1 text-right py-1.5 px-2 text-sm font-semibold border border-slate-200 rounded-lg outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100" />
                  </div>

                  {/* Summary */}
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between text-xs"><span className="text-slate-500 font-medium">Subtotal</span><span className="font-semibold">TZS {subtotal.toLocaleString()}</span></div>
                    
                    <div className="flex items-center justify-between py-1 border-t border-slate-100 mt-1">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="include_vat" 
                          checked={includeVat} 
                          onChange={e => setIncludeVat(e.target.checked)} 
                          className="w-3.5 h-3.5 rounded text-red-600 focus:ring-red-500"
                        />
                        <label htmlFor="include_vat" className="text-[11px] font-semibold text-slate-600 cursor-pointer">Include VAT (18%)</label>
                      </div>
                      <span className={`text-xs font-semibold ${includeVat ? 'text-slate-900' : 'text-slate-300'}`}>
                        TZS {vatAmount.toLocaleString()}
                      </span>
                    </div>

                    {discountAmt > 0 && <div className="flex justify-between text-xs"><span className="text-rose-500 font-medium">Discount</span><span className="font-semibold text-rose-600">-TZS {discountAmt.toLocaleString()}</span></div>}
                    
                    {enableDelivery && (
                       <div className="flex justify-between text-xs"><span className="text-red-500 font-medium">Delivery</span><span className="font-semibold text-red-600">+TZS {deliveryNet.toLocaleString()}</span></div>
                    )}

                    <div className="flex justify-between text-base font-semibold pt-1.5 border-t border-slate-200">
                      <span>Total payable</span>
                      <span className="text-red-700">TZS {payable.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Delivery Section */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-red-50 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="enableDelivery"
                        checked={enableDelivery}
                        onChange={(e) => setEnableDelivery(e.target.checked)}
                        className="w-4 h-4 text-red-600 rounded"
                      />
                      <label htmlFor="enableDelivery" className="text-sm font-medium text-slate-700">
                        Include delivery for this order
                      </label>
                    </div>
                    
                    {enableDelivery && (
                      <>
                        <div className="space-y-2">
                          <label className="text-[11px] font-medium text-slate-600">Delivery Cost (TZS)</label>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={deliveryCost || ""}
                            onChange={(e) => setDeliveryCost(parseFloat(e.target.value) || 0)}
                            placeholder="e.g., 5000"
                            className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-red-400 bg-white"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[11px] font-medium text-slate-600">Delivery Discount (TZS)</label>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={deliveryDiscount || ""}
                            onChange={(e) => setDeliveryDiscount(parseFloat(e.target.value) || 0)}
                            placeholder="e.g., 0"
                            className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-red-400 bg-white"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[11px] font-medium text-slate-600">Delivery Address</label>
                          <textarea
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Street address, area, zone..."
                            rows={2}
                            className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-red-400 bg-white resize-none"
                          />
                        </div>
                        
                        <div className="bg-white rounded-lg p-2 text-xs font-medium text-slate-700">
                          Delivery Total: TZS {(deliveryCost - deliveryDiscount).toLocaleString()}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Payment method */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setPaymentTiming("now");
                        if (selectedPaymentMethods.length === 0) setSelectedPaymentMethods(["Cash"]);
                      }}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${paymentTiming === "now" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300"}`}
                    >
                      Pay Now
                    </button>
                    <button
                      onClick={() => {
                        setPaymentTiming("later");
                        setAmountReceived("");
                      }}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${paymentTiming === "later" ? "bg-amber-500 border-amber-500 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-amber-300"}`}
                    >
                      Pay Later
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_METHODS.map(m => (
                      <button
                        key={m.key}
                        onClick={() => {
                          if (paymentTiming === "later") return;
                          setSelectedPaymentMethods((prev) => {
                            const exists = prev.includes(m.key);
                            if (exists) {
                              return prev.filter((k) => k !== m.key);
                            }
                            return [...prev, m.key];
                          });
                        }}
                        disabled={paymentTiming === "later"}
                        className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-[10px] font-semibold transition-all border ${selectedPaymentMethods.includes(m.key) && paymentTiming === "now" ? "bg-red-600 border-red-600 text-white " : "bg-white border-slate-200 text-slate-600 hover:border-red-200"} ${paymentTiming === "later" ? "opacity-40 cursor-not-allowed" : ""}`}>
                        {m.icon}
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {paymentTiming !== "later" && selectedPaymentMethods.length > 0 && (
                    <div className="space-y-2">
                      {selectedPaymentMethods.map((method) => (
                        <div key={method} className="flex items-center gap-2">
                          <label className="text-[11px] font-medium text-slate-500 w-16">{method}</label>
                          <input
                            type="number"
                            min={0}
                            value={paymentSplits[method]}
                            onChange={(e) => setPaymentSplits((prev) => ({ ...prev, [method]: e.target.value }))}
                            placeholder="0"
                            className="flex-1 py-2 px-3 text-sm font-semibold border border-slate-200 rounded-xl outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 bg-white text-right"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Amount received */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 mb-1 block">Amount received (TZS)</label>
                    <input type="number" min={0} value={paymentTiming === "later" ? "" : (received || "")}
                      onChange={() => {}}
                      disabled
                      placeholder={`${payable.toLocaleString()} (exact)`}
                      className="w-full py-2.5 px-3 text-sm font-semibold border border-slate-200 rounded-xl outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 bg-white text-right disabled:bg-slate-100 disabled:text-slate-400" />
                    {paymentTiming === "later" && (
                      <div className="mt-2 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> This order will be saved as unpaid and can be settled later.
                      </div>
                    )}
                    {paymentTiming !== "later" && received > 0 && (
                      <div className={`mt-2 flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${change > 0 ? "bg-emerald-50 text-emerald-700" : balance > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {change > 0 ? <><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Change: TZS {change.toLocaleString()}</> :
                          balance > 0 ? <><AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Balance due: TZS {balance.toLocaleString()}</> :
                          <><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Exact payment</>}
                        <Badge variant="outline" className={`text-[10px] font-semibold border-none ${payStatus === "Paid" ? "bg-emerald-100 text-emerald-700" : payStatus === "Partially Paid" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                          {payStatus}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <input value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Sale notes (optional)..."
                    className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 bg-white" />

                  {/* Fulfillment Assignment */}
                  {branchStaff.length > 0 && (
                    <div className="border border-blue-100 bg-blue-50/60 rounded-xl p-3 space-y-1.5">
                      <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                        <Users className="h-3 w-3" /> Assign order fulfillment
                      </p>
                      <select
                        value={fulfillmentAssignee}
                        onChange={e => setFulfillmentAssignee(e.target.value)}
                        className="w-full text-xs font-medium border border-blue-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-400 appearance-none"
                      >
                        <option value="">— No assignment (optional) —</option>
                        {branchStaff.map(s => (
                          <option key={s.id} value={s.id}>{s.staff_name}</option>
                        ))}
                      </select>
                      {fulfillmentAssignee && (
                        <p className="text-[10px] text-blue-600 font-medium">
                          This order will appear in the assignee's fulfillment queue.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Complete sale */}
                  <button
                    onClick={handleCompleteSale}
                    disabled={cart.length === 0 || processing}
                    className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-sm shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    {processing
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                      : <><ArrowRight className="h-4 w-4" /> Complete sale — TZS {payable.toLocaleString()}</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* ── Mobile Cart Bottom Sheet ── */}
      {cartSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartSheetOpen(false)} />
          <div className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '97dvh' }}>
            {/* Handle + header */}
            <div className="flex items-center justify-between px-3 pt-4 pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-red-600" />
                <p className="text-sm font-semibold text-slate-900">Cart ({cart.length} item{cart.length !== 1 ? 's' : ''})</p>
              </div>
              <button onClick={() => setCartSheetOpen(false)} className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            {/* Scrollable body — single flowing sheet, no nested cards (mobile/Flutter-style) */}
            <div className="overflow-y-auto flex-1">

              {/* Customer section */}
              <div className="px-3 pt-4 pb-4 border-b border-slate-100">
                <p className="text-[11px] font-medium text-slate-500 tracking-tight mb-3">Customer details</p>
                <CustomerPanel selectedCustomer={selectedCustomer} onSelectCustomer={setSelectedCustomer} branchStaff={branchStaff} />
              </div>

              {/* Cart items section */}
              <div className="px-3 pt-4 pb-2 flex items-center justify-between">
                <p className="text-[11px] font-medium text-slate-500 tracking-tight">Active cart ({cart.length} items)</p>
                {cart.length > 0 && <button onClick={clearCart} className="text-[11px] text-rose-500 hover:text-rose-600 font-medium transition-colors">Clear all</button>}
              </div>
              <div className="px-3 pb-4 space-y-1.5 min-h-[160px] border-b border-slate-100">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                    <ReceiptText className="h-10 w-10 mb-2" />
                    <p className="text-sm font-medium">Cart is empty</p>
                    <p className="text-[11px] mt-1">Tap products to add them</p>
                  </div>
                ) : cart.map(item => (
                  <div key={`sheet-${item.id}-${item.unit}-${item.color || 'default'}-${item.print_type || 'none'}`} className="bg-slate-50 rounded-xl px-3 py-2 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-medium text-slate-800 leading-tight truncate">{item.name}</p>
                          {item.color && <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-500 shrink-0">{item.color}</span>}
                        </div>
                        <p className="text-[10px] text-slate-400">TZS {item.price.toLocaleString()} / <span className="text-slate-500 font-medium">{item.unit}</span></p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => updateQty(item.id, item.unit, item.color, item.print_type, -1)} className="h-6 w-6 rounded-lg bg-slate-200 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center transition-colors"><Minus className="h-3 w-3" /></button>
                        <input type="number" value={item.qty} onChange={(e) => manualUpdateQty(item.id, item.unit, item.color, item.print_type, e.target.value)} className="text-xs font-medium w-16 text-center bg-white border border-slate-200 rounded-lg py-1 outline-none h-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        <button onClick={() => updateQty(item.id, item.unit, item.color, item.print_type, 1)} className="h-6 w-6 rounded-lg bg-slate-200 hover:bg-orange-100 hover:text-orange-600 flex items-center justify-center transition-colors"><Plus className="h-3 w-3" /></button>
                      </div>
                      <p className="text-sm font-medium text-slate-900 w-20 text-right shrink-0">TZS {(item.price * item.qty).toLocaleString()}</p>
                      <button onClick={() => removeItem(item.id, item.unit, item.color, item.print_type)} className="h-6 w-6 rounded-lg hover:bg-rose-100 flex items-center justify-center transition-colors shrink-0"><X className="h-3 w-3 text-rose-500" /></button>
                    </div>
                    {item.stores && item.stores.filter(s => s.qty > 0).length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Package className="h-3 w-3 text-slate-400 shrink-0" />
                        <select value={item.source_store_id ?? ""} onChange={e => { const storeId = e.target.value ? Number(e.target.value) : undefined; const store = item.stores?.find(s => s.id === storeId); setCart(prev => prev.map(i => i.id === item.id && i.unit === item.unit && i.color === item.color && i.print_type === item.print_type ? { ...i, source_store_id: storeId, source_store_name: store?.name } : i)); }} className="flex-1 text-[10px] font-medium border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none focus:border-orange-400 appearance-none">
                          <option value="">Auto-select store</option>
                          {item.stores.filter(s => s.qty > 0).map(s => {
                            const avail = Math.floor(s.qty / (item.factor ?? 1));
                            return <option key={s.id} value={s.id}>{s.name} — {avail} {item.unit} avail.</option>;
                          })}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals & Payment section */}
              <div className="px-3 py-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <label className="text-[11px] font-medium text-slate-500 whitespace-nowrap">Discount (TZS)</label>
                  <input type="number" min={0} max={subtotal} value={discount || ""} onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))} placeholder="0" className="flex-1 text-right py-1.5 px-2 text-sm font-medium border border-slate-200 rounded-lg outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100" />
                </div>
                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-xs"><span className="text-slate-500 font-medium">Subtotal</span><span className="font-medium">TZS {subtotal.toLocaleString()}</span></div>
                  <div className="flex items-center justify-between py-1 border-t border-slate-100 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-slate-600">
                      <input type="checkbox" checked={includeVat} onChange={e => setIncludeVat(e.target.checked)} className="w-3.5 h-3.5 rounded text-orange-600 focus:ring-orange-500" />
                      Include VAT (18%)
                    </label>
                    <span className={`text-xs font-medium ${includeVat ? 'text-slate-900' : 'text-slate-300'}`}>TZS {vatAmount.toLocaleString()}</span>
                  </div>
                  {discountAmt > 0 && <div className="flex justify-between text-xs"><span className="text-rose-500 font-medium">Discount</span><span className="font-medium text-rose-600">-TZS {discountAmt.toLocaleString()}</span></div>}
                  {enableDelivery && <div className="flex justify-between text-xs"><span className="text-red-500 font-medium">Delivery</span><span className="font-medium text-red-600">+TZS {deliveryNet.toLocaleString()}</span></div>}
                  <div className="flex justify-between text-base font-semibold pt-1.5 border-t border-slate-200">
                    <span>Total payable</span>
                    <span className="text-red-700">TZS {payable.toLocaleString()}</span>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-xl p-3 bg-orange-50/60 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={enableDelivery} onChange={(e) => setEnableDelivery(e.target.checked)} className="w-4 h-4 text-orange-600 rounded" />
                    <span className="text-sm font-medium text-slate-700">Include delivery for this order</span>
                  </label>
                  {enableDelivery && (
                    <>
                      <div className="space-y-1.5"><label className="text-[11px] font-medium text-slate-600">Delivery Cost (TZS)</label><input type="number" min="0" step="100" value={deliveryCost || ""} onChange={(e) => setDeliveryCost(parseFloat(e.target.value) || 0)} placeholder="e.g., 5000" className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-orange-400 bg-white" /></div>
                      <div className="space-y-1.5"><label className="text-[11px] font-medium text-slate-600">Delivery Discount (TZS)</label><input type="number" min="0" step="100" value={deliveryDiscount || ""} onChange={(e) => setDeliveryDiscount(parseFloat(e.target.value) || 0)} placeholder="e.g., 0" className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-orange-400 bg-white" /></div>
                      <div className="space-y-1.5"><label className="text-[11px] font-medium text-slate-600">Delivery Address</label><textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Street address, area, zone..." rows={2} className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-orange-400 bg-white resize-none" /></div>
                      <div className="bg-white rounded-lg p-2 text-xs font-medium text-slate-700">Delivery Total: TZS {(deliveryCost - deliveryDiscount).toLocaleString()}</div>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setPaymentTiming("now"); if (selectedPaymentMethods.length === 0) setSelectedPaymentMethods(["Cash"]); }} className={`py-2 rounded-xl text-xs font-medium border transition-all ${paymentTiming === "now" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300"}`}>Pay Now</button>
                  <button onClick={() => { setPaymentTiming("later"); setAmountReceived(""); }} className={`py-2 rounded-xl text-xs font-medium border transition-all ${paymentTiming === "later" ? "bg-amber-500 border-amber-500 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-amber-300"}`}>Pay Later</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.key} onClick={() => { if (paymentTiming === "later") return; setSelectedPaymentMethods((prev) => { const exists = prev.includes(m.key); return exists ? prev.filter((k) => k !== m.key) : [...prev, m.key]; }); }} disabled={paymentTiming === "later"} className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-[10px] font-medium transition-all border ${selectedPaymentMethods.includes(m.key) && paymentTiming === "now" ? "bg-orange-600 border-orange-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-orange-200"} ${paymentTiming === "later" ? "opacity-40 cursor-not-allowed" : ""}`}>{m.icon}{m.label}</button>
                  ))}
                </div>
                {paymentTiming !== "later" && selectedPaymentMethods.length > 0 && (
                  <div className="space-y-2">
                    {selectedPaymentMethods.map((method) => (
                      <div key={method} className="flex items-center gap-2">
                        <label className="text-[11px] font-medium text-slate-500 w-16">{method}</label>
                        <input type="number" min={0} value={paymentSplits[method]} onChange={(e) => setPaymentSplits((prev) => ({ ...prev, [method]: e.target.value }))} placeholder="0" className="flex-1 py-2 px-3 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 bg-white text-right" />
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">Amount received (TZS)</label>
                  <input type="number" min={0} value={paymentTiming === "later" ? "" : (received || "")} onChange={() => {}} disabled placeholder={`${payable.toLocaleString()} (exact)`} className="w-full py-2.5 px-3 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white text-right disabled:bg-slate-100 disabled:text-slate-400" />
                  {paymentTiming === "later" && <div className="mt-2 px-3 py-2 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> This order will be saved as unpaid and can be settled later.</div>}
                  {paymentTiming !== "later" && received > 0 && (
                    <div className={`mt-2 flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${change > 0 ? "bg-emerald-50 text-emerald-700" : balance > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {change > 0 ? <><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Change: TZS {change.toLocaleString()}</> : balance > 0 ? <><AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Balance due: TZS {balance.toLocaleString()}</> : <><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Exact payment</>}
                      <Badge variant="outline" className={`text-[10px] font-medium border-none ${payStatus === "Paid" ? "bg-emerald-100 text-emerald-700" : payStatus === "Partially Paid" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>{payStatus}</Badge>
                    </div>
                  )}
                </div>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Sale notes (optional)..." className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 bg-white" />
                {branchStaff.length > 0 && (
                  <div className="border border-blue-100 bg-blue-50/60 rounded-xl p-3 space-y-1.5">
                    <p className="text-[10px] font-medium text-blue-700 uppercase tracking-wide flex items-center gap-1.5"><Users className="h-3 w-3" /> Assign order fulfillment</p>
                    <select value={fulfillmentAssignee} onChange={e => setFulfillmentAssignee(e.target.value)} className="w-full text-xs font-medium border border-blue-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-400 appearance-none">
                      <option value="">— No assignment (optional) —</option>
                      {branchStaff.map(s => <option key={s.id} value={s.id}>{s.staff_name}</option>)}
                    </select>
                    {fulfillmentAssignee && <p className="text-[10px] text-blue-600 font-medium">This order will appear in the assignee's fulfillment queue.</p>}
                  </div>
                )}
                <button onClick={() => { handleCompleteSale(); setCartSheetOpen(false); }} disabled={cart.length === 0 || processing} className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-medium text-sm shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : <><ArrowRight className="h-4 w-4" /> Complete sale — TZS {payable.toLocaleString()}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
