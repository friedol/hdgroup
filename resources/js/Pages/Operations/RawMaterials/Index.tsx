import { Head, Link, router } from '@inertiajs/react';
import { 
  Plus, 
  Search, 
  Package, 
  TrendingUp, 
  Layers, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

// ── Color resolver (hex → readable name, fallback = display hex) ──────────
const COLOR_MAP: Record<string, string> = {
  '#ffffff':'White','#f5f5f5':'Off-White','#fffdd0':'Cream',
  '#000000':'Black','#080808':'Black','#0a0a0a':'Black','#111111':'Black','#1a1a1a':'Black','#222222':'Black',
  '#808080':'Grey','#888888':'Grey','#a9a9a9':'Silver Grey','#d3d3d3':'Light Grey',
  '#ff0000':'Red','#cc0000':'Red','#8b0000':'Dark Red','#ff6666':'Light Red','#ff4500':'Orange Red','#800000':'Maroon',
  '#ffa500':'Orange','#ff8c00':'Dark Orange',
  '#ffff00':'Yellow','#ffd700':'Gold','#f0e68c':'Khaki',
  '#008000':'Green','#006400':'Dark Green','#90ee90':'Light Green','#00ff00':'Lime Green','#32cd32':'Lime','#228b22':'Forest Green',
  '#0000ff':'Blue','#00008b':'Dark Blue','#add8e6':'Light Blue','#87ceeb':'Sky Blue','#4169e1':'Royal Blue','#000080':'Navy Blue',
  '#00ffff':'Cyan','#00ced1':'Dark Cyan',
  '#ff00ff':'Magenta','#ee82ee':'Violet','#bf00ff':'Purple','#800080':'Purple','#dda0dd':'Plum','#9400d3':'Dark Violet',
  '#ffc0cb':'Pink','#ff69b4':'Hot Pink','#db7093':'Pale Pink',
  '#a52a2a':'Brown','#8b4513':'Saddle Brown','#d2691e':'Chocolate',
  '#ffe4c4':'Bisque','#f5deb3':'Wheat','#c8a96e':'Tan',
};
function hexToCss(hex: string): string {
  if (!hex) return '#ccc';
  if (hex.startsWith('#')) return hex;
  return hex.toLowerCase();
}
function resolveColorName(raw: string): string {
  if (!raw) return '';
  const key = raw.trim().toLowerCase();
  // Already a name (not a hex code)
  if (!key.startsWith('#')) return raw;
  return COLOR_MAP[key] || nearestColorName(key);
}
function nearestColorName(hex: string): string {
  const r1=parseInt(hex.slice(1,3),16),g1=parseInt(hex.slice(3,5),16),b1=parseInt(hex.slice(5,7),16);
  let best='',dist=Infinity;
  for(const[k,v] of Object.entries(COLOR_MAP)){
    const r2=parseInt(k.slice(1,3),16),g2=parseInt(k.slice(3,5),16),b2=parseInt(k.slice(5,7),16);
    const d=Math.sqrt((r1-r2)**2+(g1-g2)**2+(b1-b2)**2);
    if(d<dist){dist=d;best=v;}
  }
  return best||hex;
}
/** Convert a color (hex OR name) to a valid CSS color string */
function colorToCss(color: string): string {
  if (!color) return '#ccc';
  if (color.startsWith('#')) return color;
  // Reverse lookup: find hex for this name
  const lower = color.trim().toLowerCase();
  for (const [hex, name] of Object.entries(COLOR_MAP)) {
    if (name.toLowerCase() === lower) return hex;
  }
  return lower; // fallback to CSS keyword (works for basic names)
}
// ─────────────────────────────────────────────────────────────────────────
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppLayout from '@/layouts/app-layout';

interface RawMaterial {
  id: number;
  code: string;
  name: string;
  category: string;
  base_unit: string;
  current_stock: number;
  cost_per_unit: number;
  supplier: string;
  store_name?: string;
  color?: string;
  image_url?: string;
}

interface RawMaterialsIndexProps {
  materials: { 
    data: RawMaterial[]; 
    current_page: number; 
    per_page: number; 
    total: number;
    last_page: number;
  };
  metrics: {
    total_materials: number;
    total_value: number;
    low_stock_count: number;
  };
}

export default function RawMaterialsIndex({ materials, metrics }: RawMaterialsIndexProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = Number(materials?.per_page) || 10;
  const serverCurrentPage = Number(materials?.current_page) || 1;
  const serverTotalItems = Number(materials?.total) || 0;
  const derivedServerLastPage = Math.max(1, Math.ceil(serverTotalItems / pageSize));
  const serverLastPage = Number(materials?.last_page) || derivedServerLastPage;
  const hasActiveSearch = searchTerm.trim().length > 0;

  const filteredMaterials = useMemo(() => {
    const source = materials?.data || [];
    const keyword = searchTerm.trim().toLowerCase();

    const filtered = !keyword
      ? source
      : source.filter((material) => {
          const colorName = resolveColorName(material.color || '').toLowerCase();
          const terms = [
            material.code,
            material.name,
            material.category,
            material.base_unit,
            material.supplier,
            material.store_name,
            material.color,
            colorName,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return terms.includes(keyword);
        });

    return [...filtered].sort((a, b) => {
      const colorA = resolveColorName(a.color || '').toLowerCase();
      const colorB = resolveColorName(b.color || '').toLowerCase();

      // Keep items without color at the bottom.
      if (!colorA && colorB) return 1;
      if (colorA && !colorB) return -1;

      const byColor = colorA.localeCompare(colorB);
      if (byColor !== 0) return byColor;

      return (a.name || '').localeCompare(b.name || '');
    });
  }, [materials?.data, searchTerm]);

  const localTotalPages = Math.max(1, Math.ceil(filteredMaterials.length / pageSize));
  const locallyPaginatedMaterials = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMaterials.slice(start, start + pageSize);
  }, [filteredMaterials, page, pageSize]);

  const totalPages = hasActiveSearch ? localTotalPages : serverLastPage;
  const currentPage = hasActiveSearch ? page : serverCurrentPage;
  const paginatedMaterials = hasActiveSearch ? locallyPaginatedMaterials : filteredMaterials;

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const startItem = hasActiveSearch
    ? (filteredMaterials.length === 0 ? 0 : (page - 1) * pageSize + 1)
    : (serverTotalItems === 0 ? 0 : (serverCurrentPage - 1) * pageSize + 1);
  const endItem = hasActiveSearch
    ? Math.min(page * pageSize, filteredMaterials.length)
    : Math.min(serverCurrentPage * pageSize, serverTotalItems);

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Manufacturing', href: '#' },
    { title: 'Raw Materials', href: '#' }
  ];

  return (
    <>
      <Head title="Raw Materials" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-[18px] font-bold tracking-tight text-slate-900">Raw Materials</h1>
            </div>
            <Link href="/raw-materials/create">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg px-6 shadow-md">
                <Plus className="h-4 w-4 mr-2" /> New Material
              </Button>
            </Link>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-amber-200 bg-amber-50 rounded-lg shadow-sm flex items-center gap-5 p-6 transition-all hover:bg-amber-100/50">
              <div className="bg-white p-3 rounded-lg shadow-sm"><Package className="h-6 w-6 text-amber-600" /></div>
              <div>
                <p className="text-xs font-semibold text-amber-700 tracking-tight">Total Materials</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{metrics?.total_materials || 0}</p>
              </div>
            </Card>
            <Card className="border-amber-200 bg-white rounded-lg shadow-sm flex items-center gap-5 p-6">
              <div className="bg-amber-50 p-3 rounded-lg"><TrendingUp className="h-6 w-6 text-amber-600" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-500 tracking-tight">Inventory Value</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{(metrics?.total_value || 0).toLocaleString()} <span className="text-xs text-slate-400 font-medium">TZS</span></p>
              </div>
            </Card>
            <Card className="border-amber-200 bg-amber-50 rounded-lg shadow-sm flex items-center gap-5 p-6 transition-all hover:bg-amber-100/50">
              <div className="bg-white p-3 rounded-lg shadow-sm"><Layers className="h-6 w-6 text-amber-600" /></div>
              <div>
                <p className="text-xs font-semibold text-amber-700 tracking-tight">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-rose-600 tracking-tight">{metrics?.low_stock_count || 0}</p>
              </div>
            </Card>
          </div>

          {/* Table Area */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-4 border-b bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative w-full md:w-96">
                   <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                   <Input 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     placeholder="Search by code, name, category, color, store..." 
                     className="pl-10 h-10 border-slate-200 focus:ring-slate-400 rounded-lg text-xs"
                   />
                </div>
                <div className="flex items-center gap-2">
                   <Button variant="outline" size="sm" className="h-10 px-4 rounded-lg font-bold text-slate-600 border-slate-200">Filter</Button>
                   <Button variant="outline" size="sm" className="h-10 px-4 rounded-lg font-bold text-slate-600 border-slate-200">Export</Button>
                </div>
            </div>

            <div className="p-4 text-xs text-slate-500 font-medium border-b bg-white">
              Showing {startItem}-{endItem} of {filteredMaterials.length} materials
            </div>

            <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b-slate-200">
                  <TableHead className="w-24 font-bold text-slate-800">Code</TableHead>
                  <TableHead className="w-16 font-bold text-slate-800 text-center">Preview</TableHead>
                  <TableHead className="font-bold text-slate-800">Material Name</TableHead>
                  <TableHead className="font-bold text-slate-800">Category</TableHead>
                  <TableHead className="font-bold text-slate-800">Color</TableHead>
                   <TableHead className="font-bold text-slate-800">Unit</TableHead>
                   <TableHead className="font-bold text-slate-800">Store</TableHead>
                   <TableHead className="font-bold text-slate-800 text-right">Current Stock</TableHead>
                   <TableHead className="font-bold text-slate-800 text-right">Unit Cost</TableHead>
                  <TableHead className="font-bold text-slate-800 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMaterials.length > 0 ? (
                  paginatedMaterials.map((material) => (
                    <TableRow key={material.id} className="hover:bg-slate-50 border-b-slate-100 transition-colors">
                      <TableCell className="font-black text-amber-600 tracking-tighter text-xs">
                        <Link href={`/raw-materials/${material.id}`}>
                           {material.code || material.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center p-0.5 shadow-sm">
                          {material.image_url ? (
                            <img src={material.image_url} alt={material.name} className="w-full h-full object-cover rounded-md" />
                          ) : (
                            <div className="w-full h-full bg-slate-50 flex items-center justify-center rounded-md">
                               <Package className="h-4 w-4 text-slate-300" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-700">{material.name}</TableCell>
                      <TableCell>
                         <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none rounded-xs font-bold text-[9px] px-2">
                           {material.category || 'None'}
                         </Badge>
                      </TableCell>
                      <TableCell>
                        {material.color ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-md border border-slate-200 shadow-sm flex-shrink-0"
                              style={{ backgroundColor: colorToCss(material.color) }}
                            />
                            <span className="text-[11px] font-bold text-slate-700 capitalize">
                              {resolveColorName(material.color)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-semibold">N/A</span>
                        )}
                      </TableCell>
                       <TableCell className="text-slate-500 text-xs font-semibold">{material.base_unit}</TableCell>
                       <TableCell className="font-bold text-slate-800 text-xs">{material.store_name || 'N/A'}</TableCell>
                       <TableCell className="text-right font-bold text-slate-900">
                         {material.current_stock?.toLocaleString() || '0'}
                       </TableCell>
                      <TableCell className="text-right font-black text-slate-800">
                        {material.cost_per_unit?.toLocaleString()} <span className="text-[10px] text-slate-400">TZS</span>
                      </TableCell>
                      <TableCell className="text-right">
                         <div className="flex justify-end gap-1">
                             <Link href={`/raw-materials/${material.id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                                   <Eye className="h-4 w-4" />
                                </Button>
                             </Link>
                             <Link href={`/raw-materials/${material.id}/edit`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                                   <Edit2 className="h-4 w-4" />
                                </Button>
                             </Link>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                   <TableRow>
                      <TableCell colSpan={10} className="h-64 text-center">
                         <div className="flex flex-col items-center justify-center opacity-30 grayscale">
                            <Package className="h-10 w-10 mb-2" />
                            <p className="text-sm font-bold">No material data found</p>
                         </div>
                      </TableCell>
                   </TableRow>
                )}
              </TableBody>
            </Table>
            </div>

            <div className="md:hidden divide-y divide-slate-100">
              {paginatedMaterials.length > 0 ? (
                paginatedMaterials.map((material) => (
                  <div key={material.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/raw-materials/${material.id}`} className="text-amber-600 font-black text-xs tracking-tight">
                          {material.code || material.id}
                        </Link>
                        <p className="text-sm font-bold text-slate-900 leading-tight mt-1">{material.name}</p>
                        <p className="text-[11px] text-slate-500 font-semibold mt-1">{material.category || 'Uncategorized'}</p>
                      </div>
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center p-1 shadow-sm">
                        {material.image_url ? (
                          <img src={material.image_url} alt={material.name} className="w-full h-full object-cover rounded-md" />
                        ) : (
                          <Package className="h-4 w-4 text-slate-300" />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <p className="text-slate-400 font-semibold">Store</p>
                        <p className="text-slate-700 font-bold">{material.store_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-semibold">Stock</p>
                        <p className="text-slate-900 font-bold">{material.current_stock?.toLocaleString() || '0'} {material.base_unit}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-semibold">Unit Cost</p>
                        <p className="text-slate-900 font-black">{material.cost_per_unit?.toLocaleString() || 0} <span className="text-[10px] text-slate-400">TZS</span></p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-semibold">Color</p>
                        {material.color ? (
                          <div className="flex items-center gap-2 mt-0.5">
                            <div
                              className="w-4 h-4 rounded border border-slate-200"
                              style={{ backgroundColor: colorToCss(material.color) }}
                            />
                            <p className="text-slate-700 font-bold truncate">{resolveColorName(material.color)}</p>
                          </div>
                        ) : (
                          <p className="text-slate-400 italic font-semibold">N/A</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/raw-materials/${material.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/raw-materials/${material.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-48 flex flex-col items-center justify-center opacity-40">
                  <Package className="h-8 w-8 mb-2" />
                  <p className="text-sm font-bold">No material data found</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {(hasActiveSearch ? totalPages > 1 : serverTotalItems > pageSize) && (
              <div className="p-4 border-t bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                 <p className="text-[11px] font-medium text-slate-500">Page {currentPage} of {totalPages}</p>
                 <div className="flex gap-1 items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-slate-200"
                      disabled={currentPage === 1}
                      onClick={() => {
                        if (hasActiveSearch) {
                          setPage((prev) => Math.max(1, prev - 1));
                          return;
                        }

                        router.get('/raw-materials', { page: Math.max(1, serverCurrentPage - 1) }, {
                          preserveState: true,
                          preserveScroll: true,
                        });
                      }}
                    >
                       <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-slate-200"
                      disabled={currentPage === totalPages}
                      onClick={() => {
                        if (hasActiveSearch) {
                          setPage((prev) => Math.min(totalPages, prev + 1));
                          return;
                        }

                        router.get('/raw-materials', { page: Math.min(serverLastPage, serverCurrentPage + 1) }, {
                          preserveState: true,
                          preserveScroll: true,
                        });
                      }}
                    >
                       <ChevronRight className="h-4 w-4" />
                    </Button>
                 </div>
              </div>
            )}
          </div>

        </div>
      </AppLayout>
    </>
  );
}
