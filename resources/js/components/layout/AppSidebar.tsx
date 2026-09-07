import { Link, usePage } from "@inertiajs/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Factory,
  DollarSign,
  Truck,
  Users,
  User,
  BarChart3,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  ArrowLeftToLine,
  ArrowRightFromLine,
  Target,
  Activity,
  Box,
  FileText,
  AlertTriangle,
  PackageCheck,
  Boxes,
  List,
  Layers,
  Scale,
  PackageX,
  PackagePlus,
  SlidersHorizontal,
  PackageMinus,
  ArrowLeftRight,
  BarChart2,
  History,
  ShoppingBag,
  Globe,
  RotateCcw,
  MessageSquare,
  CreditCard,
  Clock,
  Banknote,
  Receipt,
  TrendingUp,
  Calendar,
  BookOpen,
  Star,
  Shield,
  MapPin,
  Store,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

interface NavSubItem {
  id?: string;
  title: string;
  url: string;
  icon?: any;
  color?: string;
  permission?: string;
}

interface NavItem {
  id?: string;
  title: string;
  url: string;
  icon?: any;
  color?: string;
  permission?: string;
  subItems?: NavSubItem[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const buildNavGroups = (t: (key: string) => string): NavGroup[] => [
  {
    label: "",
    items: [
      { title: t("nav.dashboard"), url: "/dashboard", icon: LayoutDashboard, color: "blue" },
      { title: t("nav.posTerminal"), url: "/pos", icon: ShoppingCart, color: "rose", permission: "pos.access" },
    ],
  },
  {
    label: "",
    items: [
      {
        title: t("nav.products"),
        url: "#",
        icon: Boxes,
        color: "blue",
        permission: "inventory.view",
        subItems: [
          { title: t("nav.allList"), url: "/products-new", icon: List, color: "emerald", permission: "inventory.view" },
          { title: t("nav.categories"), url: "/categories-crud", icon: Layers, color: "emerald", permission: "inventory.manage" },
          { title: t("nav.units"), url: "/units", icon: Scale, color: "emerald", permission: "inventory.manage" },
        ],
      },
      {
        title: t("nav.inventory"),
        url: "#",
        icon: Package,
        color: "emerald",
        permission: "inventory.view",
        subItems: [
          { title: t("nav.inStock"), url: "/instock-products", icon: PackageCheck, color: "emerald", permission: "inventory.view" },
          { title: t("nav.outOfStock"), url: "/outstock-product", icon: PackageX, color: "emerald", permission: "inventory.view" },
          { title: t("nav.lowStock"), url: "/less-product", icon: AlertTriangle, color: "emerald", permission: "inventory.view" },
          { title: t("nav.stockAdjustments"), url: "/stock-adjustments", icon: SlidersHorizontal, color: "emerald", permission: "inventory.adjust" },
          { title: t("nav.damagedProducts"), url: "/damaged-products", icon: PackageMinus, color: "emerald", permission: "inventory.adjust" },
          { title: t("nav.transfers"), url: "/transfers", icon: ArrowLeftRight, color: "emerald", permission: "inventory.transfer" },
          { title: t("nav.inventoryReport"), url: "/report_inventory", icon: BarChart2, color: "emerald", permission: "inventory.view" },
        ],
      },
      {
        title: t("nav.purchases") || "Purchases",
        url: "#",
        icon: PackagePlus,
        color: "blue",
        permission: "purchases.view",
        subItems: [
          { title: t("nav.newPurchase") || "New Purchase", url: "/purchases/create", icon: PackagePlus, color: "blue", permission: "purchases.create" },
          { title: t("nav.purchaseHistory") || "Purchase History", url: "/purchases", icon: History, color: "blue", permission: "purchases.view" },
          { title: t("nav.purchaseReturns") || "Purchase Returns", url: "/purchases/returns", icon: RotateCcw, color: "blue", permission: "purchases.return" },
          { title: t("nav.priceHistory") || "Price History", url: "/purchases/price-history", icon: TrendingUp, color: "blue", permission: "purchases.view" },
          { title: t("nav.suppliers") || "Suppliers", url: "/suppliers", icon: Building2, color: "blue", permission: "inventory.manage" },
        ],
      },
      {
        title: t("nav.salesOrders"),
        url: "#",
        icon: ShoppingCart,
        color: "rose",
        permission: "finance.loans",
        subItems: [
          { title: t("nav.salesHistory"), url: "/sales-history", icon: History, permission: "pos.access" },
          { title: t("nav.allSales"), url: "/orders-crud", icon: ShoppingBag, permission: "finance.loans" },
          { title: t("nav.onlineOrders"), url: "/online-orders", icon: Globe, permission: "finance.loans" },
          { title: t("nav.returns"), url: "/returns", icon: RotateCcw, permission: "pos.returns" },
          { title: t("nav.fulfillment"), url: "/fulfillment", icon: PackageCheck, permission: "pos.access" },
        ],
      },
      {
        title: t("nav.customers"),
        url: "#",
        icon: Target,
        color: "pink",
        permission: "customers.view",
        subItems: [
          { title: t("nav.allList"), url: "/customers", icon: Users, color: "pink", permission: "customers.view" },
          { title: t("nav.followUp"), url: "/customer-data-center", icon: MessageSquare, color: "pink", permission: "customers.view" },
        ],
      },
    ],
  },
  {
    label: "",
    items: [
      {
        title: t("nav.accountant"),
        url: "#",
        icon: DollarSign,
        color: "yellow",
        permission: "finance.reports",
        subItems: [
          { title: t("nav.salesTargets"), url: "/sales-targets", icon: Target, color: "yellow", permission: "finance.reports" },
          { title: t("nav.paymentRequests"), url: "/payment-requests", icon: CreditCard, color: "yellow", permission: "finance.reports" },
          { title: t("nav.pendingPayments"), url: "/loans", icon: Clock, color: "yellow", permission: "finance.loans" },
          { title: t("nav.payments"), url: "/payments", icon: Banknote, color: "yellow", permission: "finance.loans" },
          { title: t("nav.expenses"), url: "/expenses-crud", icon: Receipt, color: "yellow", permission: "finance.expenses" },
        ],
      },
      {
        id: "logistics",
        title: t("nav.logistics"),
        url: "#",
        icon: Truck,
        color: "cyan",
        permission: "logistics.deliveries",
        subItems: [
          { title: t("nav.deliveries"), url: "/deliveries", icon: Truck, color: "cyan", permission: "logistics.deliveries" },
          { id: "deliveryPersonnel", title: t("nav.deliveryPersonnel"), url: "/delivery-personnel", icon: Users, color: "cyan", permission: "logistics.deliveries" },
          { title: t("nav.containers"), url: "/containers", icon: Box, color: "cyan", permission: "logistics.deliveries" },
          { title: t("nav.suppliers"), url: "/suppliers", icon: Building2, color: "cyan", permission: "inventory.view" },
          { title: t("nav.manifestControl"), url: "/parking_orders", icon: FileText, color: "cyan", permission: "logistics.deliveries" },
          { title: t("nav.exportedProducts"), url: "/exported-products", icon: PackageCheck, color: "cyan", permission: "pos.access" },
        ],
      },
      {
        id: "storekeeper",
        title: t("nav.storekeeper"),
        url: "#",
        icon: Building2,
        color: "teal",
        permission: "gatekeeper.access",
        subItems: [
          { title: t("nav.viewLogs"), url: "/gatekeeper", icon: Activity, color: "teal", permission: "gatekeeper.access" },
          { title: t("nav.recordIn"), url: "/gatekeeper/record-in", icon: ArrowLeftToLine, color: "teal", permission: "gatekeeper.record-in" },
          { title: t("nav.recordOut"), url: "/gatekeeper/record-out", icon: ArrowRightFromLine, color: "teal", permission: "gatekeeper.record-out" },
        ],
      },
    ],
  },
  {
    label: "",
    items: [
      {
        title: t("nav.reports"),
        url: "#",
        icon: BarChart3,
        color: "indigo",
        permission: "finance.reports",
        subItems: [
          { title: t("nav.sales"), url: "/report_sales", icon: BarChart3, permission: "finance.reports" },
          { title: t("nav.profitLoss"), url: "/report_profit", icon: TrendingUp, permission: "finance.reports" },
          { title: t("nav.productMovement"), url: "/report_product_movement", icon: Package, permission: "inventory.view" },
          { title: t("nav.expenses"), url: "/report_expenses", icon: Receipt, permission: "finance.expenses" },
          { title: t("nav.dailyReport"), url: "/finance/daily-report", icon: Calendar, color: "yellow", permission: "finance.reports" },
          { title: t("nav.cashFlow"), url: "/finance/cash-flow", icon: Activity, color: "yellow", permission: "finance.reports" },
          { title: t("nav.balanceSheet"), url: "/finance/balance-sheet", icon: BookOpen, color: "yellow", permission: "finance.reports" },
        ],
      },
      {
        title: t("nav.manageUsers"),
        url: "#",
        icon: Users,
        color: "violet",
        permission: "users.view",
        subItems: [
          { title: t("nav.users"), url: "/users-crud", icon: User, permission: "users.view" },
          { title: "Departments List", url: "/hr/departments", icon: Building2, permission: "users.view" },
          { title: t("nav.staffPerformance"), url: "/staff-performance", icon: Star, permission: "users.view" },
          { title: t("nav.rolesPermissions"), url: "/roles-permissions", icon: Shield, permission: "settings.access" },
        ],
      },
      {
        title: t("nav.location"),
        url: "#",
        icon: MapPin,
        color: "teal",
        permission: "settings.access",
        subItems: [
          { title: t("nav.branches"), url: "/branches", icon: Building2, color: "teal", permission: "settings.access" },
          { title: t("nav.stores"), url: "/all-stores", icon: Store, color: "teal", permission: "inventory.manage" },
        ],
      },
      { title: t("nav.promoCodes"), url: "/promo-codes", icon: Target, color: "slate", permission: "settings.access" },
      { title: t("nav.systemSettings"), url: "/settings", icon: Settings, color: "slate", permission: "settings.access" },
      { title: t("nav.myProfile"), url: "/profile", icon: User, color: "slate" },
    ],
  },
];

interface AppSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  width?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const getItemColors = (colorName?: string) => {
  const base: Record<string, { icon: string, bgHover: string, bgActive: string, textHover: string, text: string, textActive: string, shadow: string, subBgActive: string }> = {
    blue: { icon: "text-blue-600 dark:text-blue-400", bgHover: "hover:bg-blue-50 dark:hover:bg-blue-950/40 group-hover:text-blue-700 dark:group-hover:text-blue-300", bgActive: "bg-blue-600", textHover: "group-hover:text-blue-700 dark:group-hover:text-blue-300", text: "text-slate-900 dark:text-slate-100", textActive: "text-white", shadow: "shadow-sm shadow-blue-500/10", subBgActive: "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold" },
    emerald: { icon: "text-emerald-600 dark:text-emerald-400", bgHover: "hover:bg-emerald-50 dark:hover:bg-emerald-950/40 group-hover:text-emerald-700 dark:group-hover:text-emerald-300", bgActive: "bg-emerald-600", textHover: "group-hover:text-emerald-700 dark:group-hover:text-emerald-300", text: "text-slate-900 dark:text-slate-100", textActive: "text-white", shadow: "shadow-sm shadow-emerald-500/10", subBgActive: "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-bold" },
    orange: { icon: "text-amber-600 dark:text-amber-400", bgHover: "hover:bg-amber-50 dark:hover:bg-amber-950/40 group-hover:text-amber-700 dark:group-hover:text-amber-300", bgActive: "bg-amber-600", textHover: "group-hover:text-amber-700 dark:group-hover:text-amber-300", text: "text-slate-900 dark:text-slate-100", textActive: "text-white", shadow: "shadow-sm shadow-amber-500/10", subBgActive: "bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-bold" },
    rose: { icon: "text-rose-600 dark:text-rose-400", bgHover: "hover:bg-rose-50 dark:hover:bg-rose-950/40 group-hover:text-rose-700 dark:group-hover:text-rose-300", bgActive: "bg-rose-600", textHover: "group-hover:text-rose-700 dark:group-hover:text-rose-300", text: "text-slate-900 dark:text-slate-100", textActive: "text-white", shadow: "shadow-sm shadow-rose-500/10", subBgActive: "bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold" },
    pink: { icon: "text-pink-600 dark:text-pink-400", bgHover: "hover:bg-pink-50 dark:hover:bg-pink-950/40 group-hover:text-pink-700 dark:group-hover:text-pink-300", bgActive: "bg-pink-600", textHover: "group-hover:text-pink-700 dark:group-hover:text-pink-300", text: "text-slate-900 dark:text-slate-100", textActive: "text-white", shadow: "shadow-sm shadow-pink-500/10", subBgActive: "bg-pink-50 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 font-bold" },
    yellow: { icon: "text-yellow-600 dark:text-yellow-400", bgHover: "hover:bg-yellow-50 dark:hover:bg-yellow-950/40 group-hover:text-yellow-700 dark:group-hover:text-yellow-300", bgActive: "bg-yellow-600", textHover: "group-hover:text-yellow-700 dark:group-hover:text-yellow-300", text: "text-slate-900 dark:text-slate-100", textActive: "text-white", shadow: "shadow-sm shadow-yellow-500/10", subBgActive: "bg-yellow-50 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 font-bold" },
    cyan: { icon: "text-cyan-600 dark:text-cyan-400", bgHover: "hover:bg-cyan-50 dark:hover:bg-cyan-950/40 group-hover:text-cyan-700 dark:group-hover:text-cyan-300", bgActive: "bg-cyan-600", textHover: "group-hover:text-cyan-700 dark:group-hover:text-cyan-300", text: "text-slate-900 dark:text-slate-100", textActive: "text-white", shadow: "shadow-sm shadow-cyan-500/10", subBgActive: "bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 font-bold" },
    teal: { icon: "text-teal-600 dark:text-teal-400", bgHover: "hover:bg-teal-50 dark:hover:bg-teal-950/40 group-hover:text-teal-700 dark:group-hover:text-teal-300", bgActive: "bg-teal-600", textHover: "group-hover:text-teal-700 dark:group-hover:text-teal-300", text: "text-slate-900 dark:text-slate-100", textActive: "text-white", shadow: "shadow-sm shadow-teal-500/10", subBgActive: "bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 font-bold" },
    indigo: { icon: "text-indigo-600 dark:text-indigo-400", bgHover: "hover:bg-indigo-50 dark:hover:bg-indigo-950/40 group-hover:text-indigo-700 dark:group-hover:text-indigo-300", bgActive: "bg-indigo-600", textHover: "group-hover:text-indigo-700 dark:group-hover:text-indigo-300", text: "text-slate-900 dark:text-slate-100", textActive: "text-white", shadow: "shadow-sm shadow-indigo-500/10", subBgActive: "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold" },
    violet: { icon: "text-violet-600 dark:text-violet-400", bgHover: "hover:bg-violet-50 dark:hover:bg-violet-950/40 group-hover:text-violet-700 dark:group-hover:text-violet-300", bgActive: "bg-violet-600", textHover: "group-hover:text-violet-700 dark:group-hover:text-violet-300", text: "text-slate-900 dark:text-slate-100", textActive: "text-white", shadow: "shadow-sm shadow-violet-500/10", subBgActive: "bg-violet-50 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 font-bold" },
    slate: { icon: "text-slate-500 dark:text-slate-400", bgHover: "hover:bg-slate-100 dark:hover:bg-slate-800 group-hover:text-slate-900 dark:group-hover:text-slate-100", bgActive: "bg-slate-900 dark:bg-slate-100", textHover: "group-hover:text-slate-900 dark:group-hover:text-slate-100", text: "text-slate-900 dark:text-slate-100", textActive: "text-white dark:text-slate-900", shadow: "shadow-sm shadow-slate-500/10", subBgActive: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold" },
  };

  return base[colorName || "blue"] || base.blue;
};

export function AppSidebar({ collapsed = false, onToggle, width = 220, mobileOpen = false, onCloseMobile }: AppSidebarProps) {
  const { url, props } = usePage();
  const { auth } = props as any;
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { t } = useTranslation();

  const navGroups = useMemo(() => buildNavGroups(t), [t]);

  const userPermissions = auth?.permissions || [];
  const isSuper = userPermissions.includes('*');

  const canSee = (permission?: string) => {
    if (!permission) return true;
    if (isSuper) return true;
    return userPermissions.includes(permission);
  };

  const isGatekeeper = auth?.user?.role_id == 10;
  const isDelivery = auth?.user?.role_id == 8;

  // Transform navGroups based on user role
  const processedNavGroups = navGroups.map((group: NavGroup) => ({
    ...group,
    items: group.items.flatMap((item: any) => {
      // For Gatekeepers, flatten the Gatekeeper menu
      if (item.id === "storekeeper" && isGatekeeper) {
        return [
          { title: "Movements", url: "/gatekeeper", icon: Activity, color: "teal", permission: "gatekeeper.access" },
          { title: "Record In", url: "/gatekeeper/record-in", icon: ArrowLeftToLine, color: "emerald", permission: "gatekeeper.record-in" },
          { title: "Record Out", url: "/gatekeeper/record-out", icon: ArrowRightFromLine, color: "orange", permission: "gatekeeper.record-out" },
        ];
      }

      // For Delivery role, flatten Logistics menu and remove Personnel Management
      if (item.id === "logistics" && isDelivery) {
        const subItems = item.subItems || [];
        return subItems
          .filter((sub: any) => sub.id !== "deliveryPersonnel")
          .map((sub: any) => {
            let icon = item.icon;
            if (sub.title === "Deliveries") icon = Truck;
            if (sub.title === "Suppliers") icon = Building2;
            if (sub.title === "Exported Products") icon = Package;
            if (sub.title === "Containers") icon = Box;
            if (sub.title === "Manifest Control" || sub.title === "Parking Orders") icon = FileText;

            return {
              ...sub,
              icon: icon,
            };
          });
      }

      return item;
    })
  }));

  const basePath = url.split('?')[0];
  const bestMatchUrl = useMemo(() => {
    let best = "";
    processedNavGroups.forEach((group: NavGroup) => {
      group.items.forEach((item: any) => {
        if (item.url !== "#" && (basePath === item.url || basePath.startsWith(item.url + "/"))) {
          if (item.url.length > best.length) best = item.url;
        }
        item.subItems?.forEach((sub: any) => {
          if (sub.url !== "#" && (basePath === sub.url || basePath.startsWith(sub.url + "/"))) {
            if (sub.url.length > best.length) best = sub.url;
          }
        });
      });
    });
    return best;
  }, [basePath, processedNavGroups]);

  useEffect(() => {
    processedNavGroups.forEach((group: NavGroup) => {
      group.items.forEach((item: any) => {
        if (item.subItems?.some((sub: any) => sub.url === bestMatchUrl)) {
          setExpandedItems(prev => prev.includes(item.title) ? prev : [...prev, item.title]);
        }
      });
    });
  }, [bestMatchUrl]);

  const toggleItem = (title: string, e: React.MouseEvent) => {
    e.preventDefault();

    if (collapsed && !mobileOpen && onToggle) {
        onToggle();
    }

    setExpandedItems(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[45] lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed top-0 left-0 bottom-0 bg-white dark:bg-[#0b1329] text-slate-900 dark:text-slate-100 flex flex-col z-50 transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-[#1e2e4f]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ width: mobileOpen ? 260 : width }}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-[#1e2e4f] shrink-0 gap-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/10 overflow-hidden">
               {(props as any).activeBranch?.logo ? (
                  <img src={`/storage/${(props as any).activeBranch.logo}`} alt="Logo" className="w-full h-full object-cover" />
               ) : (props as any).systemLogo ? (
                  <img src={`/storage/${(props as any).systemLogo}`} alt="System Logo" className="w-full h-full object-cover" />
               ) : (
                  <Building2 size={20} />
               )}
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                   {(props as any).activeBranch?.system_name || (props as any).activeBranch?.name || "Jopo Juniours Co. Ltd"}
                </span>
                <span className="text-[10px] font-bold text-slate-400 truncate w-[140px]">
                   {(props as any).activeBranch ? ((props as any).activeBranch?.name || "Branch Office") : "Global Office"}
                </span>
              </div>
            )}
          </Link>
          {mobileOpen && (
            <button onClick={onCloseMobile} className="lg:hidden p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          {processedNavGroups.map((group: NavGroup, index: number) => {
            // Filter items in the group
            const visibleItems = (group.items as any[]).filter(item => {
              if (item.subItems) {
                return item.subItems.some((sub: any) => canSee(sub.permission));
              }
              return canSee(item.permission);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label || index}>
                {(!collapsed || mobileOpen) && group.label && (
                  <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 mb-2">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {visibleItems.map((item: any) => {
                    const hasSubmenu = !!item.subItems;
                    const isExpanded = expandedItems.includes(item.title);
                    const isParentActive = hasSubmenu
                      ? item.subItems!.some((sub: any) => sub.url === bestMatchUrl)
                      : (item.url === bestMatchUrl);

                    const Icon = item.icon;
                    const theme = getItemColors(item.color);

                    return (
                      <div key={item.title}>
                        <Link
                          href={hasSubmenu ? "#" : item.url}
                          onClick={(e) => {
                            if (hasSubmenu) {
                              toggleItem(item.title, e);
                            } else if (mobileOpen && onCloseMobile) {
                              onCloseMobile();
                            }
                          }}
                          className={`flex items-center justify-between h-10 px-3 rounded-lg transition-all duration-200 group relative
                            ${isParentActive && !hasSubmenu 
                              ? `${theme.bgActive} ${theme.textActive} ${theme.shadow}` 
                              : isParentActive && hasSubmenu
                              ? `bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-white font-bold border border-slate-200/60 dark:border-slate-700/60`
                              : `${theme.text} ${theme.bgHover}`
                            }
                            ${collapsed && !mobileOpen ? "justify-center" : ""}
                          `}
                        >
                          <div className="flex items-center gap-3 w-full">
                             <Icon size={18} className={`shrink-0 transition-colors ${isParentActive && !hasSubmenu ? theme.textActive : isParentActive && hasSubmenu ? "text-[#D4AF37]" : theme.icon} ${(!isParentActive || hasSubmenu) && theme.textHover}`} />
                             {(!collapsed || mobileOpen) && <span className={`text-[13px] font-bold truncate transition-colors ${(!isParentActive || hasSubmenu) && theme.textHover}`}>{item.title}</span>}
                          </div>
                          {hasSubmenu && (!collapsed || mobileOpen) && (
                            <ChevronDown size={14} className={`transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-180 text-[#D4AF37]" : "text-slate-400"}`} />
                          )}
                        </Link>

                        {/* Submenu rendering */}
                        {hasSubmenu && isExpanded && (!collapsed || mobileOpen) && (
                          <div className="mt-1 ml-3 pl-3 space-y-0.5 border-l border-amber-500/30 dark:border-[#D4AF37]/30">
                            {item.subItems!.filter((sub: any) => canSee(sub.permission)).map((sub: any) => {
                              const subActive = sub.url === bestMatchUrl;
                              const SubIcon = sub.icon;

                              return (
                                <Link
                                  key={sub.title}
                                  href={sub.url}
                                  onClick={mobileOpen && onCloseMobile ? onCloseMobile : undefined}
                                  className={`flex items-center gap-2.5 h-9 px-3 rounded-lg text-xs font-bold transition-all ${
                                    subActive
                                      ? 'bg-amber-500/15 text-[#b8860b] dark:bg-[#D4AF37]/20 dark:text-[#F4E4C1] border border-amber-500/30 dark:border-[#D4AF37]/40 shadow-sm'
                                      : 'text-slate-600 dark:text-slate-300 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] hover:bg-amber-500/10 dark:hover:bg-amber-500/10'
                                  }`}
                                >
                                  {SubIcon && (
                                    <SubIcon size={14} className={`shrink-0 transition-colors ${subActive ? "text-[#b8860b] dark:text-[#D4AF37]" : "text-slate-400 dark:text-slate-500"}`} />
                                  )}
                                  <span className="truncate">{sub.title}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Toggle (Desktop Only) */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0 hidden lg:block">
          <button
            onClick={onToggle}
            className="flex h-9 w-full items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>
    </>
  );
}
