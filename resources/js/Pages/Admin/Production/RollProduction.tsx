import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
  Search,
  Settings, 
  History, 
  Plus, 
  Layers, 
  Target,
  Play,
  X,
  Calculator,
  Container,
  AlertCircle,
  Database,
  ArrowRight
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppLayout from '@/layouts/app-layout';

// ── Color resolver (hex → readable name) ────────────────────────────────
const _COLORS: Record<string, string> = {
  '#ffffff':'White',    '#f5f5f5':'Off-White', '#fffdd0':'Cream',
  '#000000':'Black',   '#080808':'Black',      '#0a0a0a':'Black',
  '#111111':'Black',   '#1a1a1a':'Black',       '#222222':'Black',
  '#808080':'Grey',    '#888888':'Grey',         '#a9a9a9':'Silver Grey', '#d3d3d3':'Light Grey',
  '#ff0000':'Red',     '#cc0000':'Red',           '#8b0000':'Dark Red',
  '#ff6666':'Light Red','#ff4500':'Orange Red',  '#800000':'Maroon',
  '#ffa500':'Orange',  '#ff8c00':'Dark Orange',
  '#ffff00':'Yellow',  '#ffd700':'Gold',          '#f0e68c':'Khaki',
  '#008000':'Green',   '#006400':'Dark Green',    '#90ee90':'Light Green',
  '#00ff00':'Lime Green','#32cd32':'Lime',        '#228b22':'Forest Green',
  '#0000ff':'Blue',    '#00008b':'Dark Blue',     '#add8e6':'Light Blue',
  '#87ceeb':'Sky Blue','#4169e1':'Royal Blue',   '#000080':'Navy Blue',
  '#00ffff':'Cyan',    '#00ced1':'Dark Cyan',
  '#ff00ff':'Magenta', '#ee82ee':'Violet',        '#bf00ff':'Purple',
  '#800080':'Purple',  '#dda0dd':'Plum',          '#9400d3':'Dark Violet',
  '#ffc0cb':'Pink',    '#ff69b4':'Hot Pink',      '#db7093':'Pale Pink',
  '#a52a2a':'Brown',   '#8b4513':'Saddle Brown',  '#d2691e':'Chocolate',
  '#ffe4c4':'Bisque',  '#f5deb3':'Wheat',         '#c8a96e':'Tan',
};
function resolveColorName(raw: string): string {
  if (!raw) return 'No Color';
  const key = raw.trim().toLowerCase();
  if (!key.startsWith('#')) return raw; // already a name
  if (_COLORS[key]) return _COLORS[key];
  // nearest
  const r1=parseInt(key.slice(1,3),16),g1=parseInt(key.slice(3,5),16),b1=parseInt(key.slice(5,7),16);
  let best='No Color',dist=Infinity;
  for(const[k,v] of Object.entries(_COLORS)){
    const r2=parseInt(k.slice(1,3),16),g2=parseInt(k.slice(3,5),16),b2=parseInt(k.slice(5,7),16);
    const d=Math.sqrt((r1-r2)**2+(g1-g2)**2+(b1-b2)**2);
    if(d<dist){dist=d;best=v;}
  }
  return best;
}
function colorToCss(color: string): string {
  if (!color) return '#ccc';
  if (color.startsWith('#')) return color;
  const lower = color.trim().toLowerCase();
  for (const [hex, name] of Object.entries(_COLORS)) {
    if (name.toLowerCase() === lower) return hex;
  }
  return lower;
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeBagName(value: string): string {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}
// ────────────────────────────────────────────────────────────────────

interface Roll {
  id: number;
  name: string;
  code: string;
  width: number;
  gsm: number;
  total_length: number;
  remaining_length: number;
  roll_status: string;
  total_group_units: number;
  total_group_metres: number;
  color?: string;
}

interface Benchmark {
  id: number;
  name: string;
  width: number;
  length: number;
  target?: number;
  price?: number;
  req_roller?: number;
}

interface Store {
  id: number;
  store_name: string;
}

interface ManufacturedProduct {
  id: number;
  product_name: string;
  sku: string;
  product_price: number;
  buying_price?: number;
}

interface SimulationParams {
  bag_width: string;
  bag_length: string;
  selling_price: string;
  handle_cost: string;
  thread_cost: string;
  benchmark_name?: string;
  product_id: string;
}

interface RollProductionProps {
  rolls: Record<string, Roll>;
  stores: Store[];
  standardSizes: Record<string, Benchmark>;
  manufacturedProducts: ManufacturedProduct[];
}

export default function RollProduction({ rolls, stores, standardSizes, manufacturedProducts }: RollProductionProps) {
  const [selectedRoll, setSelectedRoll] = useState<Roll | null>(null);
  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    bag_width: '35',
    bag_length: '45',
    selling_price: '1200',
    handle_cost: '0',
    thread_cost: '0',
    benchmark_name: undefined,
    product_id: ''
  });
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [selectedBenchmarkName, setSelectedBenchmarkName] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isProducing, setIsProducing] = useState(false);
  const [rollSearch, setRollSearch] = useState('');
  const [form, setForm] = useState({
    rolls_used: '1',
    expected_bags: 0,
    store_id: stores[0]?.id?.toString() || ""
  });

  const rollList = Object.values(rolls);
  const totalUnits = rollList.reduce((sum, r) => {
    const units = Math.max(0, Math.round(Number(r.total_group_units || 0)));
    return sum + units;
  }, 0);

  const totalMeters = rollList.reduce((sum, r) => {
    const units = Math.max(0, Math.round(Number(r.total_group_units || 0)));
    const perRollLength = Number(r.total_length || 0);
    return sum + (units * perRollLength);
  }, 0);
  const standardSizeList = Object.values(standardSizes);

  const isBenchmarkCompatible = (bench: Benchmark, rollWidth: number) => {
    const benchmarkRoller = Number(bench.req_roller);
    if (Math.abs(benchmarkRoller - rollWidth) <= 2) return true;
    // A6 special case: requires 50cm but can be cut from 72cm or 80cm
    if (benchmarkRoller === 50 && (Math.abs(rollWidth - 72) <= 2 || Math.abs(rollWidth - 80) <= 2)) return true;
    return false;
  };

  const filteredRollList = useMemo(() => {
    const query = normalizeSearchText(rollSearch);

    const filtered = rollList.filter((roll) => {
      if (!query) return true;

      const compatibleBenchmarks = standardSizeList
        .filter((bench) => isBenchmarkCompatible(bench, Number(roll.width)))
        .map((bench) => bench.name)
        .join(' ');

      const colorName = resolveColorName(roll.color || '');
      const rawHaystack = [
        roll.name,
        roll.code,
        String(roll.width),
        String(roll.gsm),
        roll.color || '',
        colorName,
        compatibleBenchmarks,
      ].join(' ');

      const haystack = normalizeSearchText(rawHaystack);
      const collapsedHaystack = haystack.replace(/\s+/g, '');

      const tokens = query.split(/\s+/).filter(Boolean);
      return tokens.every((token) => {
        const collapsedToken = token.replace(/\s+/g, '');
        return haystack.includes(token) || collapsedHaystack.includes(collapsedToken);
      });
    });

    return [...filtered].sort((a, b) => {
      const colorA = resolveColorName(a.color || '').toLowerCase();
      const colorB = resolveColorName(b.color || '').toLowerCase();

      if (!colorA && colorB) return 1;
      if (colorA && !colorB) return -1;

      const byColor = colorA.localeCompare(colorB);
      if (byColor !== 0) return byColor;

      return (a.name || '').localeCompare(b.name || '');
    });
  }, [rollList, rollSearch, standardSizeList]);

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Roll-Based Production Engine', href: '#' }
  ];

  // Automation: Update total bags based on rolls used
  useEffect(() => {
    if (simulationResult?.yield?.max_possible_bags) {
      const perRoll = simulationResult.yield.max_possible_bags;
      const count = parseInt(form.rolls_used) || 1;
      setForm(prev => ({ ...prev, expected_bags: perRoll * count }));
    }
  }, [form.rolls_used, simulationResult]);

  const handleSimulate = async (params = simulationParams) => {
    if (!selectedRoll) {
      toast.warning("please select a fabric roll first");

      return;
    }
    
    setIsSimulating(true);

    try {
      const resp = await axios.post('/production/roll-based/simulate', {
        roll_id: selectedRoll.id,
        ...params
      });
      setSimulationResult(resp.data);
      if (resp.data.benchmark_name) {
        setSelectedBenchmarkName(resp.data.benchmark_name);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "unknown error";
      toast.error(`simulation failed: ${msg}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const executeProduction = async () => {
    if (!selectedRoll || !simulationResult) {
return;
}

    setIsProducing(true);

    try {
      const computedUsedLength = Number(simulationResult?.yield?.used_length || 0) * Number(form.rolls_used || 1);
      const payload: any = {
        ...simulationParams,
        ...form,
        roll_id: selectedRoll.id,
        benchmark_name: selectedBenchmarkName,
        product_id: simulationParams.product_id
      };

      // Send only valid positive length; otherwise let backend derive from rolls_used.
      if (computedUsedLength > 0) {
        payload.actual_used_length = computedUsedLength;
      }

      const response = await axios.post('/production/roll-based/produce', payload);

      if (response.data.success) {
        toast.success("Batch Completed!", {
          description: `Successfully produced ${response.data.bags_produced} bags into ${response.data.store_name}.`,
          duration: 5000,
        });

        router.visit('/production/roll-based', {
          replace: true,
          preserveState: false,
          preserveScroll: false,
        });
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "Production failed";
      toast.error(errorMsg, {
        description: "Please review the batch details and try again."
      });
    } finally {
      setIsProducing(false);
    }
  };

  return (
    <>
      <Head title="Production Engine" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-140px)] gap-4 lg:gap-6 overflow-visible lg:overflow-hidden">
          
          {/* Left Sidebar: Roll List */}
          <div className="w-full lg:w-[380px] flex flex-col gap-4 overflow-visible lg:overflow-y-auto pr-0 lg:pr-2 custom-scrollbar">
            <div className="flex items-center justify-between sticky top-0 bg-slate-50 z-10 pb-2 gap-2">
               <div className="flex items-center gap-2">
                 <h2 className="font-bold text-slate-900 tracking-tight">Fabric Rollers</h2>
               </div>
               <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] tracking-tight bg-white border border-slate-200 rounded-lg" onClick={() => router.visit('/production/benchmarks')}>
                    <Settings className="h-3 w-3 mr-1 text-amber-600" /> Standards
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] tracking-tight bg-white border border-slate-200 rounded-lg" onClick={() => router.visit('/production-orders-new')}>
                    <History className="h-3 w-3 mr-1 text-slate-500" /> Records
                  </Button>
               </div>
            </div>

            <Card className="bg-amber-600 border-none p-5 text-white flex justify-between rounded-lg shadow-md">
               <div>
                 <p className="text-[10px] font-medium opacity-80">Fabric Rollers</p>
                 <p className="text-xl font-bold">{totalUnits} Units</p>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-medium opacity-80">Available Meters</p>
                 <p className="text-xl font-bold">{totalMeters.toLocaleString()}m</p>
               </div>
            </Card>

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                value={rollSearch}
                onChange={(e) => setRollSearch(e.target.value)}
                placeholder="Search bag type or color (A5 D-cut blue)"
                className="pl-10 h-10 border-slate-200 bg-white rounded-lg text-xs"
              />
            </div>

            <div className="space-y-3 pb-1">
               {filteredRollList.map(roll => (
                 <Card 
                   key={roll.id} 
                   onClick={() => {
                     setSelectedRoll(roll);
                     setSimulationResult(null);
                   }}
                   className={`p-4 cursor-pointer transition-all border rounded-lg ${
                    selectedRoll?.id === roll.id ? 'border-amber-600 bg-amber-50' : 'hover:border-slate-300 bg-white'
                   }`}
                 >
                   <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 leading-tight tracking-tight">{roll.name}</h3>
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                          <span>{roll.code}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <span
                              className="h-3 w-3 rounded-sm border border-slate-200 flex-shrink-0"
                              style={{ backgroundColor: colorToCss(roll.color || '') }}
                            />
                            <span className="capitalize">{resolveColorName(roll.color || '')}</span>
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-[9px] px-2 rounded-lg">
                        {roll.roll_status?.replace('_', ' ') || 'Available'}
                      </Badge>
                   </div>

                   <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 mb-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Width</p>
                        <p className="text-sm font-bold text-slate-700">{roll.width}cm</p>
                      </div>
                       <div className="col-span-1">
                         <p className="text-[10px] font-bold text-slate-400 uppercase">In Stock</p>
                         <p className="text-sm font-bold text-amber-700">{roll.total_group_units} Units</p>
                       </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">GSM</p>
                        <p className="text-sm font-bold text-slate-700">{roll.gsm}g</p>
                      </div>
                   </div>

                   {/* Standard Yields Table */}
                   <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Quick Yield Estimates</p>
                      <div className="divide-y divide-slate-100">
                        {standardSizeList
                          .filter((bench) => isBenchmarkCompatible(bench, Number(roll.width)))
                          .map(bench => (
                          <div 
                            key={bench.id} 
                            onClick={(e) => {
                               e.stopPropagation(); // Prevent Card's onClick from resetting state
                               setSelectedRoll(roll);
                               
                               // Find matching product by benchmark name (supports minor naming differences)
                               const normalizedBenchName = normalizeBagName(bench.name || '');
                               const matchingProduct = manufacturedProducts.find((p) => {
                                 const normalizedProductName = normalizeBagName(p.product_name || '');
                                 return normalizedProductName === normalizedBenchName ||
                                   normalizedProductName.includes(normalizedBenchName) ||
                                   normalizedBenchName.includes(normalizedProductName);
                               });
                               
                               const params = {
                                 bag_width: bench.width?.toString() || '35',
                                 bag_length: bench.length?.toString() || '45',
                                 selling_price: matchingProduct?.product_price?.toString() || bench.price?.toString() || simulationParams.selling_price,
                                 handle_cost: simulationParams.handle_cost,
                                 thread_cost: simulationParams.thread_cost,
                                 benchmark_target: bench.target?.toString() || '0',
                                 benchmark_name: bench.name,
                                 product_id: matchingProduct?.id?.toString() || ''
                               };
                               setSimulationParams(params);
                               setSelectedBenchmarkName(bench.name);
                               handleSimulate(params);
                            }}
                            className={`flex items-center justify-between py-2 cursor-pointer -mx-2 px-2 rounded-md transition-all group ${
                               selectedBenchmarkName === bench.name ? 'bg-amber-100/80 ring-1 ring-amber-300 shadow-sm' : 'hover:bg-slate-50/50'
                            }`}
                          >
                             <span className="text-xs font-semibold text-slate-600 group-hover:text-amber-700">{bench.name}</span>
                             <div className="flex items-center gap-3">
                               <span className="text-xs font-bold text-slate-400">{bench.target?.toLocaleString()} pcs</span>
                               <Play className="h-3.5 w-3.5 fill-current text-white bg-amber-500 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                             </div>
                          </div>
                        ))}
                      </div>
                   </div>
                 </Card>
               ))}
               {filteredRollList.length === 0 && (
                 <Card className="p-5 text-center border border-dashed border-slate-200 bg-slate-50/60">
                   <p className="text-xs font-semibold text-slate-500">No rollers match that search.</p>
                 </Card>
               )}
               <Button 
                onClick={() => router.visit('/raw-materials/create')}
                className="w-full h-10 border-dashed border-2 border-slate-200 bg-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-300 font-bold  text-xs rounded-lg"
               >
                 <Plus className="h-4 w-4 mr-2" /> add new roller
               </Button>
            </div>
          </div>

          {!selectedRoll && (
            <div className="lg:hidden px-1 text-[11px] text-slate-500 font-medium">
              Select a roller to open the simulator panel.
            </div>
          )}

          {/* Right Workspace */}
          <div className={`flex-1 min-w-0 bg-white border border-slate-200 rounded-lg shadow-sm flex-col overflow-hidden ${selectedRoll ? 'flex' : 'hidden lg:flex'}`}>
             {!selectedRoll ? (
               <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center opacity-60 grayscale scale-95 min-h-[320px]">
                  <Database className="h-16 w-16 text-slate-300 mb-6" />
                  <div className="max-w-xs space-y-2">
                    <h3 className="text-lg font-bold text-slate-800 ">awaiting input</h3>
                    <p className="text-slate-500 text-xs leading-relaxed ">
                      select a fabric roll to initialize the production simulator.
                    </p>
                  </div>
               </div>
             ) : (
                <div className="flex-1 flex flex-col">
                 <div className="p-4 md:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-3">
                   <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-1 bg-amber-600 rounded-full" />
                    <h2 className="font-bold text-slate-800 tracking-tight">Yield Intelligence & Production</h2>
                    {selectedRoll && <Badge className="bg-amber-100 text-amber-700 border-none font-bold ml-0 sm:ml-2 rounded-lg truncate max-w-[120px] sm:max-w-none">{selectedRoll.name}</Badge>}
                      </div>
                   <Button variant="ghost" size="icon" onClick={() => setSelectedRoll(null)} className="h-8 w-8 text-slate-400 self-end sm:self-auto">
                        <X className="h-4 w-4" />
                      </Button>
                   </div>

                 <div className="p-4 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
                   <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-12">
                         
                         {/* Controls */}
                     <div className="xl:col-span-8 space-y-8 md:space-y-12">
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-5">
                                <div className="space-y-2 lg:col-span-2">
                                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Active Product Size</Label>
                                  <div className="h-10 border border-slate-200 rounded-lg bg-slate-50/50 flex items-center px-4">
                                     {simulationParams.product_id || simulationParams.benchmark_name ? (
                                        <div className="flex items-center gap-2">
                                           <div className={`w-1.5 h-1.5 rounded-full ${simulationParams.product_id ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
                                           <span className="text-xs font-bold text-slate-700">
                                              {simulationParams.product_id 
                                                ? (manufacturedProducts.find(p => p.id.toString() === simulationParams.product_id)?.product_name || simulationParams.benchmark_name)
                                                : simulationParams.benchmark_name}
                                           </span>
                                           {!simulationParams.product_id && (
                                              <span className="text-[9px] text-amber-600 font-medium italic ml-auto">(product not in catalog)</span>
                                           )}
                                        </div>
                                     ) : (
                                        <span className="text-[10px] font-medium text-slate-400 italic">Select from quick list</span>
                                     )}
                                  </div>
                                </div>                               <div className="space-y-2 lg:col-span-2">
                                 <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Width (cm)</Label>
                                 <Input 
                                   type="number"
                                   className="h-10 border-slate-200 focus:ring-amber-500 font-black rounded-lg bg-slate-50/30 text-xs"
                                   value={simulationParams.bag_width}
                                   onChange={e => setSimulationParams({...simulationParams, bag_width: e.target.value})}
                                 />
                                 
                               </div>
                               <div className="space-y-2 lg:col-span-2">
                                 <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Length (cm)</Label>
                                 <Input 
                                   type="number"
                                   className="h-10 border-slate-200 focus:ring-amber-500 font-black rounded-lg bg-slate-50/30 text-xs"
                                   value={simulationParams.bag_length}
                                   onChange={e => setSimulationParams({...simulationParams, bag_length: e.target.value})}
                                 />
                               </div>
                               <div className="space-y-2 lg:col-span-2">
                                 <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Selling (TZS)</Label>
                                 <Input 
                                   type="number"
                                   className="h-10 border-slate-200 focus:ring-amber-500 font-black rounded-lg bg-slate-50/30 text-xs"
                                   value={simulationParams.selling_price}
                                   onChange={e => setSimulationParams({...simulationParams, selling_price: e.target.value})}
                                 />
                               </div>
                               <div className="space-y-2 lg:col-span-1">
                                 <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Handle</Label>
                                 <Input 
                                   type="number"
                                   className="h-10 border-slate-200 focus:ring-amber-500 font-black rounded-lg bg-slate-50/30 text-xs px-2"
                                   value={simulationParams.handle_cost}
                                   onChange={e => setSimulationParams({...simulationParams, handle_cost: e.target.value})}
                                 />
                               </div>
                               <div className="space-y-2 lg:col-span-1">
                                 <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Thread</Label>
                                 <Input 
                                   type="number"
                                   className="h-10 border-slate-200 focus:ring-amber-500 font-black rounded-lg bg-slate-50/30 text-xs px-2"
                                   value={simulationParams.thread_cost}
                                   onChange={e => setSimulationParams({...simulationParams, thread_cost: e.target.value})}
                                 />
                               </div>
                               <div className="flex items-end lg:col-span-2">
                                 <Button 
                                   disabled={isSimulating}
                                   onClick={() => handleSimulate()}
                                   className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg tracking-tight shadow-md transition-all active:scale-[0.98] text-xs"
                                 >
                                   {isSimulating ? '...' : 'Simulate'}
                                 </Button>
                               </div>
                            </div>
                             {simulationResult && (
                               <div className="p-4 md:p-6 border border-amber-200 bg-amber-50 rounded-lg space-y-6 md:space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                  <div className="flex items-center gap-2 mb-2">
                                     <Target className="h-4 w-4 text-amber-600" />
                                     <h3 className="font-bold text-amber-900 text-sm tracking-tight">Execute Production Batch</h3>
                                  </div>

                                 <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 items-end">
                                    <div className="md:col-span-3 space-y-2">
                                       <Label className="text-xs font-semibold text-slate-500">Rolls Used</Label>
                                       <Select value={form.rolls_used} onValueChange={val => setForm({...form, rolls_used: val})}>
                                          <SelectTrigger className="h-10 border-amber-200 focus:ring-amber-500 bg-white font-bold rounded-lg">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {Array.from({ length: Math.max(1, selectedRoll?.total_group_units || 1) }, (_, i) => i + 1).map(n => (
                                              <SelectItem key={n} value={n.toString()}>{n} Roll{n > 1 ? 's' : ''}</SelectItem>
                                            ))}
                                          </SelectContent>
                                       </Select>
                                    </div>
                                    <div className="md:col-span-3 space-y-2">
                                       <Label className="text-xs font-semibold text-slate-500">Destination Store</Label>
                                       <Select value={form.store_id} onValueChange={val => setForm({...form, store_id: val})}>
                                          <SelectTrigger className="h-10 border-amber-200 focus:ring-amber-500 bg-white font-bold rounded-lg text-xs">
                                            <SelectValue placeholder="Select Store" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {stores.map(s => (
                                              <SelectItem key={s.id} value={s.id.toString()}>{s.store_name}</SelectItem>
                                            ))}
                                          </SelectContent>
                                       </Select>
                                    </div>
                                    <div className="md:col-span-3 space-y-2">
                                       <Label className="text-xs font-semibold text-slate-500">Total Bags</Label>
                                       <Input 
                                         type="number"
                                         className="h-10 border-amber-200 focus:ring-amber-500 bg-white font-bold rounded-lg"
                                         value={form.expected_bags}
                                         onChange={e => setForm({...form, expected_bags: Number(e.target.value)})}
                                       />
                                      <p className="text-[9px] text-amber-500 font-semibold mt-1">Auto: {form.rolls_used} &times; {simulationResult.yield.max_possible_bags} Bags</p>
                                    </div>
                                    <div className="md:col-span-3">
                                       <Button 
                                         disabled={isProducing || !form.store_id}
                                         onClick={executeProduction}
                                         className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg tracking-tight flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                                       >
                                         {isProducing ? <Settings className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                                         {isProducing ? 'Processing...' : 'Produce'}
                                       </Button>
                                    </div>
                                 </div>
                               </div>
                             )}
                         </div>
                         {/* Sidebar Analysis */}
                         <div className="xl:col-span-4 lg:border-l lg:pl-10 space-y-8 md:space-y-10">
                            {simulationResult ? (
                               <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                                  <div className="space-y-1">
                                    <h3 className="font-bold text-slate-800  text-sm">Profit Analysis</h3>
                                    <p className="text-[10px] text-slate-400  leading-tight">financial projection per roll used.</p>
                                  </div>
                                  <div className="space-y-4">
                                     <div className="space-y-1">
                                        <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                                           <span className="text-xs font-semibold text-slate-500 ">Gross Revenue Projection</span>
                                           <span className="text-sm font-black text-slate-900 tabular-nums">{(simulationResult.financials.potential_revenue * Number(form.rolls_used)).toLocaleString()} TZS</span>
                                        </div>

                                        <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                                           <span className="text-xs font-semibold text-slate-500 ">Accessory & Extras</span>
                                           <span className="text-sm font-black text-amber-600 tabular-nums">{(simulationResult.financials.accessory_cost * Number(form.rolls_used)).toLocaleString()} TZS</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                                           <span className="text-xs font-semibold text-slate-500 ">Catalog Buying Price</span>
                                           <span className="text-sm font-black text-slate-400 tabular-nums">
                                              {manufacturedProducts.find(p => p.id.toString() === simulationParams.product_id)?.buying_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'} TZS
                                           </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                                           <span className="text-xs font-semibold text-slate-500 ">Simulated Unit Cost</span>
                                           <span className="text-sm font-black text-blue-600 tabular-nums">{(simulationResult.financials.cost_per_bag).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TZS/pc</span>
                                        </div>
                                     </div>

                                     <div className="bg-slate-900 text-white p-4 md:p-6 rounded-lg space-y-4">
                                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                          <span className="text-xs font-semibold text-slate-500 ">Total Projection</span>
                                          <Badge className="bg-amber-600 border-none font-bold text-[8px] rounded-xs">{simulationResult.metrics.profit_margin}% margin</Badge>
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-xs font-bold text-amber-400 uppercase">net profit estimate</p>
                                          <p className="text-3xl font-bold tracking-tight">
                                            {(simulationResult.financials.potential_profit * Number(form.rolls_used)).toLocaleString()} <span className="text-xs font-bold opacity-30">TZS</span>
                                          </p>
                                        </div>
                                     </div>

                                     <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex gap-3">
                                        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-amber-700 leading-snug  font-medium">
                                          yield is optimized for {selectedRoll.width}cm width. accuracy target is 98.2% across {form.rolls_used} roll(s).
                                        </p>
                                     </div>
                                  </div>
                               </div>
                            ) : (
                               <div className="h-full flex flex-col items-center justify-center text-center opacity-20 grayscale">
                                  <Layers className="h-12 w-12 text-slate-300 mb-4" />
                                  <p className="font-bold  text-[10px]">data unavailable</p>
                               </div>
                            )}
                         </div>

                      </div>
                   </div>
                </div>
             )}
          </div>
        </div>
      </AppLayout>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}} />
    </>
  );
}
