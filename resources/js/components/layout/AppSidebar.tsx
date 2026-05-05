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
} from "lucide-react";
import { useState, useEffect } from "react";

interface NavSubItem {
  title: string;
  url: string;
  color?: string;
  permission?: string;
}

interface NavItem {
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

const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, color: "blue" },
      { title: "POS Terminal", url: "/pos", icon: ShoppingCart, color: "rose", permission: "pos.access" },

    ],
  },
  {
    label: "",
    items: [
      {
        title: "Inventory",
        url: "#",
        icon: Package,
        color: "emerald",
        permission: "inventory.view",
        subItems: [
          { title: "Products", url: "/products-new", color: "emerald", permission: "inventory.view" },
          { title: "In Stock Assets", url: "/instock-products", color: "emerald", permission: "inventory.view" },
          { title: "Out of Stock", url: "/outstock-product", color: "emerald", permission: "inventory.view" },
          { title: "Low Stock Alert", url: "/less-product", color: "emerald", permission: "inventory.view" },
          { title: "Categories", url: "/categories-crud", color: "emerald", permission: "inventory.manage" },
          { title: "Units", url: "/units", color: "emerald", permission: "inventory.manage" },
          { title: "Stock Adjustments", url: "/all-products?tab=adjustments", color: "emerald", permission: "inventory.adjust" },
          { title: "Transfers", url: "/all-products?tab=transfers", color: "emerald", permission: "inventory.transfer" },
          { title: "Upcoming", url: "/upcoming-products", color: "emerald", permission: "inventory.manage" },
        ]
      },
      {
        title: "Manufacturing",
        url: "#",
        icon: Factory,
        color: "orange",
        permission: "production.view",
        subItems: [
          { title: "Overview", url: "/manufacturing/dashboard", permission: "production.view" },
          { title: "Production History", url: "/production-orders-new", permission: "production.view" },
          { title: "Raw Material History", url: "/raw-material-history", permission: "production.view" },
          { title: "Raw Materials", url: "/raw-materials", permission: "production.manage_bom" },
          { title: "Roll Production", url: "/production/roll-based", permission: "production.view" },
          { title: "Benchmarks", url: "/production/benchmarks", permission: "production.manage_bom" }
        ]
      },
      {
        title: "Sales & Orders",
        url: "#",
        icon: ShoppingCart,
        color: "rose",
        permission: "finance.loans",
        subItems: [
          { title: "Sales History", url: "/sales-history", permission: "pos.access" },
          { title: "Sales Orders", url: "/orders-crud", permission: "finance.loans" },
          { title: "Online Orders", url: "/online-orders", permission: "finance.loans" },
          { title: "Returns", url: "/returns", permission: "pos.returns" },
        ]
      },
      {
        title: "CRM",
        url: "#",
        icon: Target,
        color: "pink",
        permission: "customers.view",
        subItems: [
          { title: "CRM Directory", url: "/customers", color: "pink", permission: "customers.view" },
          { title: "Follow-up Center", url: "/customer-data-center", color: "pink", permission: "customers.view" },
          { title: "Engagement Logs", url: "/customer-data-center?status=all", color: "pink", permission: "customers.view" },
          { title: "Priority Hub", url: "/customer-data-center?status=due", color: "pink", permission: "customers.view" },
        ]
      }
    ],
  },
  {
    label: "",
    items: [
      { 
        title: "Finance", 
        url: "#", 
        icon: DollarSign,
        color: "yellow",
        permission: "finance.reports",
        subItems: [

          { title: "Sales Targets", url: "/sales-targets", color: "yellow", permission: "finance.reports" },
          { title: "Payment Requests", url: "/payment-requests", color: "yellow", permission: "finance.reports" },
          { title: "Pending Payments", url: "/loans", color: "yellow", permission: "finance.loans" },
          { title: "Payments", url: "/payments", color: "yellow", permission: "finance.loans" },
          { title: "Expenses", url: "/expenses-crud", color: "yellow", permission: "finance.expenses" },
        ]
      },
      { 
        title: "Logistics", 
        url: "#", 
        icon: Truck,
        color: "cyan",
        permission: "logistics.deliveries",
        subItems: [
          { title: "Deliveries", url: "/deliveries", color: "cyan", permission: "logistics.deliveries" },

          // { title: "Containers", url: "/containers-crud", color: "cyan" },
          { title: "Suppliers", url: "/suppliers", color: "cyan", permission: "inventory.view" },
          // { title: "Parking Orders", url: "/parking_orders", color: "cyan" },
          { title: "Exported Products", url: "/exported-products", color: "cyan", permission: "pos.access" },
        ]
      },
      { 
        title: "Gatekeeper", 
        url: "#", 
        icon: Building2,
        color: "teal",
        permission: "gatekeeper.access",
        subItems: [
          { title: "View Logs", url: "/gatekeeper", color: "teal", permission: "gatekeeper.access" },
          { title: "Record IN", url: "/gatekeeper/record-in", color: "teal", permission: "gatekeeper.record-in" },
          { title: "Record OUT", url: "/gatekeeper/record-out", color: "teal", permission: "gatekeeper.record-out" },
        ]
      },
    ],
  },
  {
    label: "",
    items: [
      { 
        title: "Reports", 
        url: "#", 
        icon: BarChart3,
        color: "indigo",
        permission: "finance.reports",
        subItems: [
          { title: "Sales", url: "/report_sales", permission: "finance.reports" },
          { title: "Profit & Loss", url: "/report_profit", permission: "finance.reports" },
          { title: "Expenses", url: "/report_expenses", permission: "finance.expenses" },
                { title: "Daily Report", url: "/finance/daily-report", color: "yellow", permission: "finance.reports" },
          { title: "Cash Flow", url: "/finance/cash-flow", color: "yellow", permission: "finance.reports" },
          { title: "Balance Sheet", url: "/finance/balance-sheet", color: "yellow", permission: "finance.reports" },
        ]
      },
      { 
        title: "Manage Users", 
        url: "#", 
        icon: Users,
        color: "violet",
        permission: "users.view",
        subItems: [
          { title: "Users", url: "/users-crud", permission: "users.view" },
          { title: "Staff Performance", url: "/staff-performance", permission: "users.view" },
          { title: "Roles & Permissions", url: "/roles-permissions", permission: "settings.access" },
        ]
      },
      { title: "Promo Codes", url: "/promo-codes", icon: Target, color: "slate", permission: "settings.access" },
      { title: "System Settings", url: "/settings", icon: Settings, color: "slate", permission: "settings.access" },
      { title: "My Profile", url: "/profile", icon: User, color: "slate" },
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
    blue: { icon: "text-blue-600", bgHover: "hover:bg-blue-50 group-hover:text-blue-700", bgActive: "bg-blue-600", textHover: "group-hover:text-blue-700", text: "text-slate-900", textActive: "text-white", shadow: "shadow-sm shadow-blue-500/10", subBgActive: "bg-blue-50 text-blue-600 font-bold" },
    emerald: { icon: "text-emerald-600", bgHover: "hover:bg-emerald-50 group-hover:text-emerald-700", bgActive: "bg-emerald-600", textHover: "group-hover:text-emerald-700", text: "text-slate-900", textActive: "text-white", shadow: "shadow-sm shadow-emerald-500/10", subBgActive: "bg-emerald-50 text-emerald-600 font-bold" },
    orange: { icon: "text-amber-600", bgHover: "hover:bg-amber-50 group-hover:text-amber-700", bgActive: "bg-amber-600", textHover: "group-hover:text-amber-700", text: "text-slate-900", textActive: "text-white", shadow: "shadow-sm shadow-amber-500/10", subBgActive: "bg-amber-50 text-amber-600 font-bold" },
    rose: { icon: "text-rose-600", bgHover: "hover:bg-rose-50 group-hover:text-rose-700", bgActive: "bg-rose-600", textHover: "group-hover:text-rose-700", text: "text-slate-900", textActive: "text-white", shadow: "shadow-sm shadow-rose-500/10", subBgActive: "bg-rose-50 text-rose-600 font-bold" },
    pink: { icon: "text-pink-600", bgHover: "hover:bg-pink-50 group-hover:text-pink-700", bgActive: "bg-pink-600", textHover: "group-hover:text-pink-700", text: "text-slate-900", textActive: "text-white", shadow: "shadow-sm shadow-pink-500/10", subBgActive: "bg-pink-50 text-pink-600 font-bold" },
    yellow: { icon: "text-yellow-600", bgHover: "hover:bg-yellow-50 group-hover:text-yellow-700", bgActive: "bg-yellow-600", textHover: "group-hover:text-yellow-700", text: "text-slate-900", textActive: "text-white", shadow: "shadow-sm shadow-yellow-500/10", subBgActive: "bg-yellow-50 text-yellow-600 font-bold" },
    cyan: { icon: "text-cyan-600", bgHover: "hover:bg-cyan-50 group-hover:text-cyan-700", bgActive: "bg-cyan-600", textHover: "group-hover:text-cyan-700", text: "text-slate-900", textActive: "text-white", shadow: "shadow-sm shadow-cyan-500/10", subBgActive: "bg-cyan-50 text-cyan-600 font-bold" },
    teal: { icon: "text-teal-600", bgHover: "hover:bg-teal-50 group-hover:text-teal-700", bgActive: "bg-teal-600", textHover: "group-hover:text-teal-700", text: "text-slate-900", textActive: "text-white", shadow: "shadow-sm shadow-teal-500/10", subBgActive: "bg-teal-50 text-teal-600 font-bold" },
    indigo: { icon: "text-indigo-600", bgHover: "hover:bg-indigo-50 group-hover:text-indigo-700", bgActive: "bg-indigo-600", textHover: "group-hover:text-indigo-700", text: "text-slate-900", textActive: "text-white", shadow: "shadow-sm shadow-indigo-500/10", subBgActive: "bg-indigo-50 text-indigo-600 font-bold" },
    violet: { icon: "text-violet-600", bgHover: "hover:bg-violet-50 group-hover:text-violet-700", bgActive: "bg-violet-600", textHover: "group-hover:text-violet-700", text: "text-slate-900", textActive: "text-white", shadow: "shadow-sm shadow-violet-500/10", subBgActive: "bg-violet-50 text-violet-600 font-bold" },
    slate: { icon: "text-slate-500", bgHover: "hover:bg-slate-100 group-hover:text-slate-900", bgActive: "bg-slate-900", textHover: "group-hover:text-slate-900", text: "text-slate-900", textActive: "text-white", shadow: "shadow-sm shadow-slate-500/10", subBgActive: "bg-slate-100 text-slate-800 font-bold" },
  };

  return base[colorName || "blue"] || base.blue;
};

export function AppSidebar({ collapsed = false, onToggle, width = 220, mobileOpen = false, onCloseMobile }: AppSidebarProps) {
  const { url, props } = usePage();
  const { auth } = props as any;
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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
  const processedNavGroups = navGroups.map(group => ({
    ...group,
    items: group.items.flatMap((item: any) => {
      // For Gatekeepers, flatten the Gatekeeper menu
      if (item.title === "Gatekeeper" && isGatekeeper) {
        return [
          { title: "Movements", url: "/gatekeeper", icon: Activity, color: "teal", permission: "gatekeeper.access" },
          { title: "Record IN", url: "/gatekeeper/record-in", icon: ArrowLeftToLine, color: "emerald", permission: "gatekeeper.record-in" },
          { title: "Record OUT", url: "/gatekeeper/record-out", icon: ArrowRightFromLine, color: "orange", permission: "gatekeeper.record-out" },
        ];
      }

      // For Delivery role, flatten Logistics menu and remove Personnel Management
      if (item.title === "Logistics" && isDelivery) {
        const subItems = item.subItems || [];
        return subItems
          .filter((sub: any) => sub.title !== "Delivery Personnel")
          .map((sub: any) => {
            let icon = item.icon;
            if (sub.title === "Deliveries") icon = Truck;
            if (sub.title === "Suppliers") icon = Building2;
            if (sub.title === "Exported Products") icon = Package;
            
            return {
              ...sub,
              icon: icon,
            };
          });
      }

      return item;
    })
  }));
  useEffect(() => {
    processedNavGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.subItems?.some((sub: any) => url === sub.url || url.startsWith(sub.url + "/"))) {
          setExpandedItems(prev => prev.includes(item.title) ? prev : [...prev, item.title]);
        }
      });
    });
  }, [url]);

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
        className={`fixed top-0 left-0 bottom-0 bg-white flex flex-col z-50 transition-all duration-300 ease-in-out border-r border-slate-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ width: mobileOpen ? 260 : width }}
      >
        <div className="h-20 flex items-center justify-between px-5 border-b border-slate-100 shrink-0 gap-3">
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
                <span className="text-sm font-black tracking-tight text-slate-900 whitespace-nowrap">
                   {(props as any).activeBranch?.system_name || (props as any).activeBranch?.name || "HD Group"}
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
          {processedNavGroups.map((group, index) => {
            // Filter items in the group
            const visibleItems = (group.items as any[]).filter(item => {
              if (item.subItems) {
                // If item has subitems, only show if user can see at least one subitem
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
                      ? item.subItems!.some((sub: any) => url === sub.url || url.startsWith(sub.url + "/"))
                      : (url === item.url || (item.url !== "/dashboard" && url.startsWith(item.url + "/")));
                    
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
                            ${isParentActive && !hasSubmenu ? `${theme.bgActive} ${theme.textActive} ${theme.shadow}` : `${theme.text} ${theme.bgHover}`}
                            ${collapsed && !mobileOpen ? "justify-center" : ""}
                          `}
                        >
                          <div className="flex items-center gap-3 w-full">
                             <Icon size={18} className={`shrink-0 transition-colors ${isParentActive && !hasSubmenu ? theme.textActive : theme.icon} ${(!isParentActive || hasSubmenu) && theme.textHover}`} />
                             {(!collapsed || mobileOpen) && <span className={`text-[13px] font-bold truncate transition-colors ${(!isParentActive || hasSubmenu) && theme.textHover}`}>{item.title}</span>}
                          </div>
                          {hasSubmenu && (!collapsed || mobileOpen) && (
                            <ChevronDown size={14} className={`transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                          )}
                        </Link>

                        {/* Submenu rendering */}
                        {hasSubmenu && isExpanded && (!collapsed || mobileOpen) && (
                          <div className="mt-1 ml-3 pl-3 space-y-0.5 border-l border-slate-100">
                            {item.subItems!.filter((sub: any) => canSee(sub.permission)).map((sub: any) => {
                              const subActive = url === sub.url || url.startsWith(sub.url + "/");
                              const subTheme = getItemColors(sub.color || item.color);

                              return (
                                <Link
                                  key={sub.title}
                                  href={sub.url}
                                  onClick={mobileOpen && onCloseMobile ? onCloseMobile : undefined}
                                  className={`flex items-center h-9 px-3 rounded-lg text-xs transition-colors ${subActive ? subTheme.subBgActive : `text-slate-900 ${subTheme.textHover} hover:bg-slate-50`}`}
                                >
                                  {sub.title}
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
        <div className="p-3 border-t border-slate-100 shrink-0 hidden lg:block">
          <button
            onClick={onToggle}
            className="flex h-9 w-full items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>
    </>
  );
}
