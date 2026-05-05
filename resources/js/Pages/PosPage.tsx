import { Head, router } from "@inertiajs/react";
import axios from "axios";
import {
  Search, Plus, Minus, X, CreditCard, Banknote, Smartphone, User,
  ShoppingCart, ReceiptText, UserPlus, Building2, Phone, Mail,
  MessageCircle, MapPin, Users, CheckCircle, Clock, AlertTriangle,
  ChevronDown, ArrowRight, Loader2, Tag, Package
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
          <Search className="h-3.5 w-3.5" /> Search customer
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
  const [activeTab, setActiveTab] = useState<"terminal" | "history">("terminal");
  
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
        setTradingUnit(product.sale_units?.[0] ?? { name: "Unit", factor: 1, price: product.price });
        setTradingQty(1);
        setTradingDialogOpen(true);
        return;
    }

    const startQty = isManufactured ? 100 : 1;
    const colorLabel = variant?.color || variant?.name || null;
    const resolvedPrice = resolveCartPrice(product, unit, variant, printType);
    
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
      }];
    });
    
    if (isManufactured) {
        toast.info(`Ordering manufactured product. Minimum quantity set to 100.`);
    }
  };

  const addSimple = (product: any) => {
    const defaultUnit = product.sale_units?.[0] ?? { name: "Unit", factor: 1, price: product.price };
    addToCart(product, defaultUnit);
  };

  const updateQty = (id: number, unit: string, color: string | undefined, printType: "plain" | "printed" | undefined, delta: number) =>
    setCart(prev => prev.map(i => {
      if (i.id === id && i.unit === unit && i.color === color && i.print_type === printType) {
        const newQty = Math.max(1, i.qty + delta);
        if (newQty > i.stock && delta > 0) {
          toast.error(`Only ${i.stock} units available in stock`);
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
        if (n > i.stock) {
          toast.error(`Only ${i.stock} units available in stock`);
          return { ...i, qty: i.stock };
        }
        return { ...i, qty: Math.max(0, n) };
      }
      return i;
    }));
  };

  const removeItem = (id: number, unit: string, color: string | undefined, printType: "plain" | "printed" | undefined) =>
    setCart(prev => prev.filter(i => !(i.id === id && i.unit === unit && i.color === color && i.print_type === printType)));

  const clearCart = () => {
 setCart([]); setDiscount(0); setAmountReceived(""); setNotes(""); setDeliveryCost(0); setDeliveryDiscount(0); setDeliveryAddress(""); setEnableDelivery(false); setPaymentTiming("now"); setSelectedPaymentMethods(["Cash"]); setPaymentSplits({ Cash: "", Mobile: "", Bank: "" });
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
        })),
        payment_method: isPayLater ? null : paymentMethodLabel,
        payment_breakdown: paymentBreakdown,
        payment_timing: paymentTiming,
        customer_id: selectedCustomer && selectedCustomer.id > 0 ? selectedCustomer.id : null,
        discount: discountAmt,
        tax_amount: vatAmount,
        amount_received: isPayLater ? 0 : received,
        notes: notes || `POS Sale — ${isPayLater ? "Pay Later" : paymentMethodLabel}`,
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

        {/* Trading Product Unit/Qty Modal */}
        <Dialog open={tradingDialogOpen} onOpenChange={setTradingDialogOpen}>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Add {pendingProduct?.name} to Cart</DialogTitle>
                </DialogHeader>
                <div className="py-6 space-y-6">
                    {/* Unit Selector */}
                    {pendingProduct?.sale_units?.length > 1 && (
                        <div>
                            <label className="text-xs font-black text-slate-500 mb-2 block uppercase tracking-wider">Select Sales Unit</label>
                            <div className="grid grid-cols-2 gap-2">
                                {pendingProduct.sale_units.map((u: any) => (
                                    <button
                                        key={u.name}
                                        onClick={() => setTradingUnit(u)}
                                        className={`p-3 rounded-xl border-2 text-sm font-black transition-all ${tradingUnit?.name === u.name ? "border-red-600 bg-red-50 text-red-700" : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"}`}
                                    >
                                        {u.name}
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">TZS {u.price?.toLocaleString()}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity Input */}
                    <div>
                        <label className="text-xs font-black text-slate-500 mb-2 block uppercase tracking-wider">Quantity</label>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setTradingQty(Math.max(1, tradingQty - 1))}
                                className="h-12 w-12 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                                <Minus className="h-5 w-5 text-slate-600" />
                            </button>
                            <input 
                                type="number" 
                                value={tradingQty}
                                onChange={(e) => setTradingQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="flex-1 h-12 text-center text-xl font-black border-2 border-slate-100 rounded-2xl focus:border-red-400 outline-none transition-all"
                            />
                            <button 
                                onClick={() => setTradingQty(tradingQty + 1)}
                                className="h-12 w-12 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                                <Plus className="h-5 w-5 text-slate-600" />
                            </button>
                        </div>
                    </div>

                    <Button 
                        onClick={() => {
                            // Direct injection to cart
                            setCart(prev => {
                                const colorLabel = null;
                                const existing = prev.find(i => i.id === pendingProduct.id && i.unit === tradingUnit.name);
                                if (existing) {
                                    return prev.map(i => i.id === pendingProduct.id && i.unit === tradingUnit.name ? { ...i, qty: i.qty + tradingQty } : i);
                                }
                                return [...prev, {
                                    id: pendingProduct.id,
                                    name: pendingProduct.name + (tradingUnit.factor > 1 ? ` (${tradingUnit.name})` : ""),
                                    price: tradingUnit.price ?? pendingProduct.price,
                                    qty: tradingQty,
                                    unit: tradingUnit.name,
                                    factor: tradingUnit.factor ?? 1,
                                    sku: pendingProduct.sku,
                                    stock: pendingProduct.stock,
                                    color: undefined,
                                    variant_id: undefined
                                }];
                            });
                            setTradingDialogOpen(false);
                            toast.success(`Added ${tradingQty} ${tradingUnit.name}(s) to cart`);
                        }}
                        className="w-full h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg shadow-red-500/20"
                    >
                        Confirm Selection
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-slate-900 tracking-tight leading-none">Point of sale</h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Process sales and manage transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveTab("terminal")}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${activeTab === "terminal" ? "bg-red-600 text-white shadow-sm shadow-red-500/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              Terminal
            </button>
            <button onClick={() => setActiveTab("history")}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${activeTab === "history" ? "bg-red-600 text-white shadow-sm shadow-red-500/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              Sales history
            </button>
          </div>
        </div>

        {/* ── Terminal ── */}
        {activeTab === "terminal" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px] gap-6">

            {/* LEFT — Product grid */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    {loadingProducts && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500 animate-spin" />}
                    <input
                      value={search}
                      onChange={e => handleSearchChange(e.target.value)}
                      placeholder="Search products by name or SKU..."
                      className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                    />
                  </div>
                  {/* Category filters */}
                  {!search.trim() && (
                    <div className="flex gap-2 flex-wrap">
                      {displayCategories.map(c => (
                        <button key={c as string} onClick={() => setCatFilter(c as string)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${catFilter === c ? "bg-red-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                          {c as string}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product grid */}
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-3 max-h-[calc(100vh-320px)] overflow-y-auto">
                  {displayProducts.length === 0 ? (
                    <div className="col-span-4 py-16 text-center">
                      <Package className="h-10 w-10 mx-auto text-slate-200 mb-3" />
                      <p className="text-sm font-bold text-slate-400">No products found</p>
                      <p className="text-[11px] text-slate-300 mt-1">Try a different search term</p>
                    </div>
                  ) : displayProducts.map((p: any) => {
                    const inCart = cart.some(i => i.id === p.id);
                    const saleUnits: any[] = p.sale_units ?? [{ name: "Unit", factor: 1, price: p.price }];

                    return (
                      <div key={p.id}
                        className={`relative rounded-xl border transition-all overflow-hidden group ${inCart ? "border-red-300 bg-red-50/50" : "border-slate-200 bg-white hover:border-red-200 hover:shadow-md"}`}>
                        <div className="h-24 bg-slate-50 overflow-hidden flex items-center justify-center border-b border-slate-100 group-hover:bg-slate-100 transition-colors relative">
                          {p.image ? (
                            <img 
                              src={p.image} 
                              alt={p.name} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement?.querySelector('.placeholder-icon')?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`placeholder-icon ${p.image ? 'hidden' : ''} flex flex-col items-center justify-center gap-1`}>
                            <Package className="w-8 h-8 text-slate-200" />
                            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">No Image</span>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-[11px] font-black text-slate-800 leading-tight line-clamp-2">{p.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{p.sku}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-sm font-black text-red-600">TZS {p.price?.toLocaleString()}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.stock > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                              {p.stock > 0 ? `${p.stock} pcs` : "OOS"}
                            </span>
                          </div>
                          {/* Color Variants for Manufactured Products */}
                          {p.variants && p.variants.length > 0 && (
                            <div className="mt-2 space-y-1">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Color Options:</p>
                                <div className="flex flex-wrap gap-1">
                                    {p.variants.map((v: any) => (
                                        <button 
                                            key={v.id} 
                                            onClick={() => addToCart(p, saleUnits[0], v)}
                                            className="px-2 py-0.5 rounded text-[9px] font-bold border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all active:scale-95"
                                        >
                                            {v.color}
                                        </button>
                                    ))}
                                </div>
                            </div>
                          )}

                          {/* Unit buttons */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {saleUnits.length === 1 ? (
                              <button onClick={() => addSimple(p)} disabled={p.product_type !== 'trading' && p.stock <= 0}
                                className="w-full py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-300 text-white text-[10px] font-black rounded-lg transition-colors active:scale-[0.97]">
                                <Plus className="h-3 w-3 inline mr-0.5" /> {(p.variants?.length > 0 && p.product_type === 'manufactured') ? 'Select Color Above' : (p.variants?.length > 0 && p.product_type !== 'trading') ? 'Select Color' : (p.product_type === 'trading' ? 'Select Unit & Qty' : 'Add to Cart')}
                              </button>
                            ) : (
                              saleUnits.map((u: any) => (
                                <button key={u.name} onClick={() => addToCart(p, u)} disabled={p.product_type !== 'trading' && p.stock <= 0}
                                  className="flex-1 py-1 bg-red-50 hover:bg-red-600 hover:text-white disabled:bg-slate-50 disabled:text-slate-300 text-red-700 text-[9px] font-black rounded-lg transition-all border border-red-100 active:scale-[0.97]">
                                  {u.name}
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

            {/* RIGHT — Cart & Payment */}
            <div className="flex flex-col gap-4">
              {/* Customer panel */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
                <p className="text-[11px] font-black text-slate-500 tracking-tight mb-3">Customer details</p>
                <CustomerPanel
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={setSelectedCustomer}
                  branchStaff={branchStaff}
                />
              </div>

              {/* Cart */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col flex-1">
                <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-slate-100">
                  <p className="text-[11px] font-black text-slate-500 tracking-tight">Active cart ({cart.length} items)</p>
                  {cart.length > 0 && (
                    <button onClick={clearCart} className="text-[11px] text-rose-500 hover:text-rose-600 font-bold transition-colors">Clear all</button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[150px] max-h-[300px]">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-slate-300">
                      <ReceiptText className="h-10 w-10 mb-2" />
                      <p className="text-sm font-black">Cart is empty</p>
                      <p className="text-[11px] mt-1">Tap products to add them</p>
                    </div>
                  ) : cart.map(item => (
                    <div key={`${item.id}-${item.unit}-${item.color || 'default'}-${item.print_type || 'none'}`} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-slate-800 leading-tight truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400">TZS {item.price.toLocaleString()} each</p>
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
                          className="text-xs font-black w-16 text-center bg-white border border-slate-200 rounded-lg py-1 focus:ring-1 focus:ring-red-100 outline-none h-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button onClick={() => updateQty(item.id, item.unit, item.color, item.print_type, 1)}
                          className="h-6 w-6 rounded-lg bg-slate-200 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-sm font-black text-slate-900 w-20 text-right shrink-0">
                        TZS {(item.price * item.qty).toLocaleString()}
                      </p>
                      <button onClick={() => removeItem(item.id, item.unit, item.color, item.print_type)}
                        className="h-6 w-6 rounded-lg hover:bg-rose-100 flex items-center justify-center transition-colors shrink-0">
                        <X className="h-3 w-3 text-rose-500" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Totals & Payment */}
                <div className="border-t border-slate-100 p-4 space-y-3">
                  {/* Discount */}
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <label className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Discount (TZS)</label>
                    <input type="number" min={0} max={subtotal} value={discount || ""}
                      onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0"
                      className="flex-1 text-right py-1.5 px-2 text-sm font-black border border-slate-200 rounded-lg outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100" />
                  </div>

                  {/* Summary */}
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between text-xs"><span className="text-slate-500 font-bold">Subtotal</span><span className="font-black">TZS {subtotal.toLocaleString()}</span></div>
                    
                    <div className="flex items-center justify-between py-1 border-t border-slate-100 mt-1">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="include_vat" 
                          checked={includeVat} 
                          onChange={e => setIncludeVat(e.target.checked)} 
                          className="w-3.5 h-3.5 rounded text-red-600 focus:ring-red-500"
                        />
                        <label htmlFor="include_vat" className="text-[11px] font-black text-slate-600 cursor-pointer">Include VAT (18%)</label>
                      </div>
                      <span className={`text-xs font-black ${includeVat ? 'text-slate-900' : 'text-slate-300'}`}>
                        TZS {vatAmount.toLocaleString()}
                      </span>
                    </div>

                    {discountAmt > 0 && <div className="flex justify-between text-xs"><span className="text-rose-500 font-bold">Discount</span><span className="font-black text-rose-600">-TZS {discountAmt.toLocaleString()}</span></div>}
                    
                    {enableDelivery && (
                       <div className="flex justify-between text-xs"><span className="text-red-500 font-bold">Delivery</span><span className="font-black text-red-600">+TZS {deliveryNet.toLocaleString()}</span></div>
                    )}

                    <div className="flex justify-between text-base font-black pt-1.5 border-t border-slate-200">
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
                      <label htmlFor="enableDelivery" className="text-sm font-bold text-slate-700">
                        Include delivery for this order
                      </label>
                    </div>
                    
                    {enableDelivery && (
                      <>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-600">Delivery Cost (TZS)</label>
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
                          <label className="text-[11px] font-bold text-slate-600">Delivery Discount (TZS)</label>
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
                          <label className="text-[11px] font-bold text-slate-600">Delivery Address</label>
                          <textarea
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Street address, area, zone..."
                            rows={2}
                            className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-red-400 bg-white resize-none"
                          />
                        </div>
                        
                        <div className="bg-white rounded-lg p-2 text-xs font-bold text-slate-700">
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
                      className={`py-2 rounded-xl text-xs font-black border transition-all ${paymentTiming === "now" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300"}`}
                    >
                      Pay Now
                    </button>
                    <button
                      onClick={() => {
                        setPaymentTiming("later");
                        setAmountReceived("");
                      }}
                      className={`py-2 rounded-xl text-xs font-black border transition-all ${paymentTiming === "later" ? "bg-amber-500 border-amber-500 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-amber-300"}`}
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
                        className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-[10px] font-black transition-all border ${selectedPaymentMethods.includes(m.key) && paymentTiming === "now" ? "bg-red-600 border-red-600 text-white shadow-sm shadow-red-500/30" : "bg-white border-slate-200 text-slate-600 hover:border-red-200"} ${paymentTiming === "later" ? "opacity-40 cursor-not-allowed" : ""}`}>
                        {m.icon}
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {paymentTiming !== "later" && selectedPaymentMethods.length > 0 && (
                    <div className="space-y-2">
                      {selectedPaymentMethods.map((method) => (
                        <div key={method} className="flex items-center gap-2">
                          <label className="text-[11px] font-bold text-slate-500 w-16">{method}</label>
                          <input
                            type="number"
                            min={0}
                            value={paymentSplits[method]}
                            onChange={(e) => setPaymentSplits((prev) => ({ ...prev, [method]: e.target.value }))}
                            placeholder="0"
                            className="flex-1 py-2 px-3 text-sm font-black border border-slate-200 rounded-xl outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 bg-white text-right"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Amount received */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 mb-1 block">Amount received (TZS)</label>
                    <input type="number" min={0} value={paymentTiming === "later" ? "" : (received || "")}
                      onChange={() => {}}
                      disabled
                      placeholder={`${payable.toLocaleString()} (exact)`}
                      className="w-full py-2.5 px-3 text-sm font-black border border-slate-200 rounded-xl outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 bg-white text-right disabled:bg-slate-100 disabled:text-slate-400" />
                    {paymentTiming === "later" && (
                      <div className="mt-2 px-3 py-2 rounded-lg text-xs font-black bg-amber-50 text-amber-700 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> This order will be saved as unpaid and can be settled later.
                      </div>
                    )}
                    {paymentTiming !== "later" && received > 0 && (
                      <div className={`mt-2 flex items-center justify-between px-3 py-2 rounded-lg text-xs font-black ${change > 0 ? "bg-emerald-50 text-emerald-700" : balance > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {change > 0 ? <><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Change: TZS {change.toLocaleString()}</> :
                          balance > 0 ? <><AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Balance due: TZS {balance.toLocaleString()}</> :
                          <><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Exact payment</>}
                        <Badge variant="outline" className={`text-[10px] font-black border-none ${payStatus === "Paid" ? "bg-emerald-100 text-emerald-700" : payStatus === "Partially Paid" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                          {payStatus}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <input value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Sale notes (optional)..."
                    className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 bg-white" />

                  {/* Complete sale */}
                  <button
                    onClick={handleCompleteSale}
                    disabled={cart.length === 0 || processing}
                    className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-black text-sm shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    {processing
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                      : <><ArrowRight className="h-4 w-4" /> Complete sale — TZS {payable.toLocaleString()}</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Sales History ── */}
        {activeTab === "history" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <Clock className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-black text-slate-800">Recent sales</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Invoice", "Customer", "Items", "Total", "Payment", "Status", "Time"].map(h => (
                      <th key={h} className={`px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-wide whitespace-nowrap ${["Items", "Total"].includes(h) ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {initialSalesHistory.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-sm font-bold text-slate-400">No sales recorded yet</td></tr>
                  ) : initialSalesHistory.map((s: any) => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-red-600 font-black">{s.id}</td>
                      <td className="px-5 py-3 font-black text-slate-800">{s.customer}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-bold text-slate-600">{s.items}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-black text-slate-900">{s.total}</td>
                      <td className="px-5 py-3"><span className="text-[11px] font-black px-2 py-1 rounded-lg bg-slate-100 text-slate-600">{s.method}</span></td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={`text-[10px] font-black border-none ${s.status === "Paid" ? "bg-emerald-50 text-emerald-700" : s.status === "Partially Paid" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                          {s.status ?? "—"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-[11px] font-bold">{s.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
