import { Head, Link, router } from "@inertiajs/react";
import { 
  ArrowLeft, 
  Package, 
  ClipboardCheck, 
  User, 
  Store as StoreIcon, 
  Calendar,
  Layers,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  Loader2,
  Activity,
  Maximize,
  Coins,
  TrendingUp,
  Percent
} from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface ProductionOrder {
  id: number;
  order_number?: string;
  quantity_to_produce: number;
  bags_produced?: number;
  fabric_cost_used?: number;
  accessory_cost_used?: number;
  revenue?: number;
  gross_profit?: number;
  total_cost?: number;
  bag_width?: number;
  bag_length?: number;
  actual_used_length?: number;
  selling_price?: number;
  status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  store?: {
    store_name: string;
  };
  createdBy?: {
    staff_name: string;
  };
  roll?: {
    name: string;
    color?: string;
    width: number;
    gsm: number;
    total_length: number;
    remaining_length: number;
    cost_per_kg?: number;
    weight_kg?: number;
    cost_per_unit?: number;
  };
  product?: {
    product_name: string;
    product_id: string;
  };
  bom?: {
    bom_name: string;
    finishedProduct?: {
      product_name: string;
      product_id: string;
    };
    items?: Array<{
      id: number;
      quantity_required: number;
      wastage_percent: number;
      rawMaterial?: {
        name: string;
        color?: string;
        unit_name?: string;
      };
    }>;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: FileText },
  approved: { label: 'Approved', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: ShieldCheck },
  in_progress: { label: 'In Progress', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
  completed: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-100', icon: AlertCircle },
};

export default function Show({ order }: { order: ProductionOrder }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const status = statusConfig[order.status] || statusConfig.draft;
  const StatusIcon = status.icon;

  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Productions", href: "/productions" },
    { title: order.order_number || `Order #${order.id}`, href: "#" },
  ];

  const handleUpdateStatus = (newStatus: string) => {
    setIsUpdating(true);
    router.post(`/production-orders/${order.id}/status`, {
      status: newStatus
    }, {
      onSuccess: () => {
        toast.success(`Order marked as ${newStatus}`);
        setIsUpdating(false);
      },
      onError: (errors) => {
        toast.error(Object.values(errors)[0] as string || "Failed to update status");
        setIsUpdating(false);
      }
    });
  };

  const isRollBased = !!order.roll;
  const productName = order.product?.product_name || order.bom?.finishedProduct?.product_name || (isRollBased ? `${order.roll?.name} Bag` : 'Generic Product');
  const productSKU = order.product?.product_id || order.bom?.finishedProduct?.product_id || 'NO-SKU';
  const bags = order.bags_produced || order.quantity_to_produce || 0;

  // Efficiency calculation for roll based
  const fabricEfficiency = order.roll && order.bag_width ? Math.round((Number(order.bag_width) / Number(order.roll.width)) * 100) : null;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Production Order ${order.order_number || `#${order.id}`}`} />
      
      <div className="max-w-[1400px] mx-auto space-y-8 pb-20 p-4 md:p-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-up">
          <div className="flex items-center gap-4">
            <Link 
              href="/productions"
              className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  Order {order.order_number || `#${order.id}`}
                </h1>
                <Badge className={`rounded-sm font-medium uppercase text-[10px] px-2 py-0.5 border ${status.color}`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 font-medium">
                {isRollBased ? 'Roll-to-Bag Dynamic Production' : 'Fixed Recipe (BOM) Production'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                className="rounded-sm font-medium h-11 px-6 border-slate-200"
                onClick={() => window.print()}
            >
              Print Blueprint
            </Button>
            {order.status !== 'completed' && order.status !== 'cancelled' && (
                <Button 
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('completed')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm h-11 px-8 font-medium shadow-lg shadow-emerald-100 transition-all border-none"
                >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Mark as Completed
                </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Produced Output Card */}
            <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden animate-fade-up">
              <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-slate-900 uppercase text-xs tracking-widest">Finished Good Architecture</h3>
                </div>
                {isRollBased && (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 font-medium text-[10px]">
                        ROLL-BASED
                    </Badge>
                )}
              </div>
              <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-3xl font-semibold text-slate-900 tracking-tight">
                        {productName}
                      </h2>
                      <p className="text-sm font-mono text-slate-400 mt-1 uppercase">
                        {productSKU}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-8 pt-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Yield Produced</p>
                        <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                            {Number(bags).toLocaleString()} <span className="text-xs font-medium text-slate-400">PCS</span>
                        </p>
                      </div>
                      {isRollBased && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Cut Dimensions</p>
                            <p className="text-lg font-medium text-slate-700 tabular-nums">
                                {order.bag_width} &times; {order.bag_length} <span className="text-[10px] uppercase opacity-50">cm</span>
                            </p>
                          </div>
                      )}
                      {!isRollBased && (
                         <div className="space-y-1">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Production BPM</p>
                            <p className="text-lg font-medium text-slate-700 italic">
                                {order.bom?.bom_name || 'Standard Setup'}
                            </p>
                          </div>
                      )}
                    </div>
                  </div>
                  <div className="h-24 w-24 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0">
                    <Layers className="h-10 w-10 text-slate-200" />
                  </div>
                </div>
              </div>

              {/* Enhanced Financial Metrics for Completed Orders */}
                {order.status === 'completed' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 border-t border-slate-100 bg-slate-50/30">
                        <div className="p-6 border-r border-slate-100">
                            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Total Fabric Cost</p>
                            <p className="text-sm font-medium text-slate-900 tabular-nums">{Number(order.fabric_cost_used || 0).toLocaleString()} <span className="text-[10px] opacity-40">TZS</span></p>
                        </div>
                        <div className="p-6 border-r border-slate-100">
                            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Accessory Cost</p>
                            <p className="text-sm font-medium text-slate-900 tabular-nums">{Number(order.accessory_cost_used || 0).toLocaleString()} <span className="text-[10px] opacity-40">TZS</span></p>
                        </div>
                        <div className="p-6 border-r border-slate-100">
                            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Unit Buying Price</p>
                            <p className="text-sm font-semibold text-rose-600 tabular-nums">
                                {bags > 0 ? ((order.total_cost || 0) / bags).toLocaleString(undefined, {maximumFractionDigits: 2}) : 0} <span className="text-[10px] opacity-40">TZS</span>
                            </p>
                        </div>
                        <div className="p-6">
                            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Unit Selling Price</p>
                            <p className="text-sm font-medium text-emerald-600 tabular-nums">{Number(order.selling_price || 0).toLocaleString()} <span className="text-[10px] opacity-40">TZS</span></p>
                        </div>
                    </div>
                )}
            </div>

            {/* Input / Sources Card */}
            {isRollBased ? (
                 <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden animate-fade-up">
                    <div className="bg-slate-50 border-b border-slate-100 p-6">
                        <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-amber-600" />
                        <h3 className="font-semibold text-slate-900 uppercase text-xs tracking-widest">Sourced Material (Raw Roll)</h3>
                        </div>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-lg border border-slate-200 bg-white flex items-center justify-center p-2 shadow-sm">
                                        <div className="w-full h-full rounded-sm" style={{ backgroundColor: order.roll?.color || '#ccc' }} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 uppercase">{order.roll?.name}</h4>
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-tight">{order.roll?.color || 'Original'} Color Variant</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1 p-4 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Maximize className="w-3 h-3 text-slate-400" />
                                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Roll Width</span>
                                        </div>
                                        <p className="text-lg font-semibold text-slate-800 tabular-nums">{order.roll?.width} <small className="text-[10px] font-medium">CM</small></p>
                                    </div>
                                    <div className="space-y-1 p-4 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Activity className="w-3 h-3 text-slate-400" />
                                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Metre Consumption</span>
                                        </div>
                                        <p className="text-lg font-semibold text-slate-800 tabular-nums">{order.actual_used_length?.toLocaleString()} <small className="text-[10px] font-medium">M</small></p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 border-l border-slate-100 pl-8">
                                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Material Efficiency & Costing</h4>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                        <span className="text-xs font-medium text-slate-500">Buying Price (Material)</span>
                                        <span className="text-sm font-semibold text-slate-900">{order.roll?.cost_per_kg ? `${order.roll.cost_per_kg.toLocaleString()} / KG` : `${order.roll?.cost_per_unit?.toLocaleString()} / UNIT`}</span>
                                    </div>
                                    {order.roll?.weight_kg && (
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                            <span className="text-xs font-medium text-slate-500">Roll Weight (Full)</span>
                                            <span className="text-sm font-semibold text-slate-900">{order.roll.weight_kg} KG</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50 text-emerald-600">
                                        <span className="text-xs font-medium">Width Utilization</span>
                                        <span className="text-sm font-semibold">{fabricEfficiency}%</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 italic text-[10px] text-amber-700 leading-relaxed">
                                    Buying price per bag is derived by multiplying the roll weight cost by the used length segment ({order.actual_used_length}m / {order.roll?.total_length}m) and dividing by produced units.
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
            ) : (
                <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden animate-fade-up">
              <div className="bg-slate-50 border-b border-slate-100 p-6">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-slate-900 uppercase text-xs tracking-widest">Recipe Requirements (BOM)</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase text-slate-400 tracking-widest">
                      <th className="text-left px-8 py-4">Ingredient</th>
                      <th className="text-right px-8 py-4">Base Qty</th>
                      <th className="text-right px-8 py-4">Waste Allowance</th>
                      <th className="text-right px-8 py-4">Required Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.bom?.items?.map((item) => {
                      const baseQty = order.quantity_to_produce * item.quantity_required;
                      const waste = baseQty * (item.wastage_percent / 100);
                      const total = baseQty + waste;

                      return (
                        <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-2.5 h-2.5 rounded-full shadow-sm border border-black/5" 
                                style={{ backgroundColor: item.rawMaterial?.color || '#cbd5e1' }} 
                              />
                              <span className="font-medium text-slate-900 uppercase tracking-tight">
                                {item.rawMaterial?.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-4 text-right font-medium text-slate-500 tabular-nums italic">
                            {item.quantity_required.toLocaleString()} / unit
                          </td>
                          <td className="px-8 py-4 text-right text-rose-500 font-medium tabular-nums">
                            +{item.wastage_percent}%
                          </td>
                          <td className="px-8 py-4 text-right">
                            <span className="text-lg font-semibold text-slate-900 tabular-nums">
                                {total.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 uppercase ml-1">
                                {item.rawMaterial?.unit_name || 'Units'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            )}
            
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 rounded-sm p-8 text-white space-y-8 shadow-xl">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest opacity-80">Logistical Blueprint</p>
                <h3 className="text-lg font-medium">Execution Details</h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-sm bg-white/10 text-white">
                    <StoreIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Target Store</p>
                    <p className="text-sm font-medium text-white uppercase">{order.store?.store_name || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-sm bg-white/10 text-white">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Execution Author</p>
                    <p className="text-sm font-medium text-white uppercase">{order.createdBy?.staff_name || 'System Operator'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-sm bg-white/10 text-white">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Initialized On</p>
                    <p className="text-xs font-medium text-white tabular-nums opacity-90">
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> Produced Revenue</span>
                  <span className="text-sm font-medium tabular-nums">{(order.revenue || 0).toLocaleString()} <small className="text-[9px] opacity-40">TZS</small></span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Coins className="w-3 h-3" /> Total Mfg Cost</span>
                    <span className="text-sm font-medium tabular-nums">{(order.total_cost || 0).toLocaleString()} <small className="text-[9px] opacity-40">TZS</small></span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <span className="text-[10px] font-medium text-amber-400 uppercase tracking-widest flex items-center gap-1.5"><Percent className="w-3 h-3" /> Batch Profit</span>
                    <span className="text-2xl font-semibold text-emerald-400 tabular-nums">{(order.gross_profit || 0).toLocaleString()} <small className="text-[10px] font-medium">TZS</small></span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-sm p-6 flex items-start gap-3 shadow-sm italic text-slate-500 text-xs">
                <AlertCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <p>
                    {isRollBased 
                        ? "Calculated buying price is derived from the roll weight distribution. This ensures accurate cost-of-goods-sold (COGS) reporting." 
                        : "Raw material deduction occurs automatically upon marking the order as completed based on BOM requirements."
                    }
                </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
