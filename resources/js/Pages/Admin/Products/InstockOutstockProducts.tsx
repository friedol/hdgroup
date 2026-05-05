import { Head, Link } from "@inertiajs/react";
import AppSidebarLayout from "@/layouts/app/app-sidebar-layout";
import { 
  Package, 
  Search, 
  ArrowLeft,
  AlertCircle,
  PackageCheck,
  PackageX,
  Eye,
  ArrowUpRight
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Product {
  id: number;
  product_id: string; // SKU
  product_name: string;
  product_type: string;
  total_qty: number;
  level: number; // Low stock threshold
  buying_price: number;
}

interface Props {
  products: Product[];
  title: string;
  addTrue: boolean;
}

export default function InstockOutstockProducts({ products, title, addTrue }: Props) {
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter(p => 
    p.product_name.toLowerCase().includes(search.toLowerCase()) ||
    p.product_id.toLowerCase().includes(search.toLowerCase())
  );

  const isOutofStock = title.toLowerCase().includes('outstock');

  return (
    <AppSidebarLayout>
      <Head title={title} />
      
      <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
          
            <div>
              <h1 className="text-[14px] sm:text-[16px] md:text-[18px] font-medium text-slate-900 tracking-tight leading-none flex items-center gap-2">
              
                {title}
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                {filteredProducts.length} Items Found 
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-[320px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Search by name or SKU..."
              className="pl-11 h-11 border-slate-200 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop View Table */}
        <div className="hidden md:block">
          <Card className="border-emerald-100 shadow-xl shadow-emerald-900/5 overflow-hidden rounded-2xl">
            <Table>
              <TableHeader className="bg-emerald-50/50">
                <TableRow className="hover:bg-transparent border-emerald-100">
                  <TableHead className="w-[120px] text-[10px] font-black uppercase text-emerald-700 tracking-widest pl-8">SKU/ID</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-emerald-700 tracking-widest">Product Information</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-emerald-700 tracking-widest">Type</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-emerald-700 tracking-widest text-center">Current Stock</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-emerald-700 tracking-widest text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => (
                    <TableRow key={p.id} className="group border-emerald-50 hover:bg-emerald-50/20 transition-colors">
                      <TableCell className="pl-8">
                        <span className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-600 transition-colors">#{p.product_id}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 py-1">
                          <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center shrink-0 border ${isOutofStock ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                            <Package className={`h-5 w-5 ${isOutofStock ? 'text-rose-500' : 'text-emerald-500'}`} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{p.product_name}</span>
                            <span className="text-[10px] text-slate-400 capitalize">{p.product_type.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                         <Badge variant="outline" className="rounded-md border-emerald-100 bg-emerald-50/50 text-emerald-700 text-[10px] font-bold px-2 py-0">
                            {p.product_type}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`text-lg font-black tracking-tight ${isOutofStock ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {p.total_qty ?? 0}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Units Available</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Link href={`/products-new/${p.id}`}>
                           <Button size="sm" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-emerald-100 hover:text-emerald-700 text-slate-400 transition-all">
                             <Eye size={18} />
                           </Button>
                        </Link>
                        <Link href={`/products-new/${p.id}/edit`}>
                           <Button size="sm" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-emerald-100 hover:text-emerald-700 text-slate-400 transition-all ml-1">
                             <ArrowUpRight size={18} />
                           </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center bg-slate-50/50">
                       <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                          <AlertCircle size={40} className="text-slate-400" />
                          <p className="font-bold text-slate-900">No products found matching your search</p>
                       </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Mobile View Cards */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredProducts.map((p) => (
              <Card key={p.id} className="border-emerald-100 shadow-sm overflow-hidden">
                <CardContent className="p-4">
                   <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${isOutofStock ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                           <Package className={isOutofStock ? 'text-rose-500' : 'text-emerald-500'} size={24} />
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{p.product_id}</p>
                           <h3 className="font-black text-slate-900 leading-tight">{p.product_name}</h3>
                        </div>
                      </div>
                      <Badge className={isOutofStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}>
                         {p.total_qty} units
                      </Badge>
                   </div>
                   
                   <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.product_type}</span>
                      <div className="flex gap-2">
                        <Link href={`/products-new/${p.id}`}>
                           <Button size="sm" variant="secondary" className="h-8 rounded-lg bg-emerald-50 text-emerald-700 border-none">
                              Details
                           </Button>
                        </Link>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </AppSidebarLayout>
  );
}
