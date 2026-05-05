import { Head } from "@inertiajs/react";
import { 
  Search, Plus, Filter, Download, PackageOpen, MoreHorizontal, Edit, Trash2 
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import AppLayout from "@/layouts/app-layout";

export default function UpcomingModule({ products = [], categories = [], stores = [] }: any) {
  const [search, setSearch] = useState("");

  const filtered = products.filter((p: any) => {
    const name = p.product_name || "";
    const sku = p.sku || p.product_id || "";

    return name.toLowerCase().includes(search.toLowerCase()) || sku.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Upcoming Products", href: "/upcoming-products" }]}>
      <Head title="Upcoming Products" />
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-1xl font-bold text-foreground">Upcoming Products</h1>

          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
            <Button className="gap-2"><Plus className="w-4 h-4" /> New Draft</Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border border-border">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search drafts by SKU or name..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <Select defaultValue="all">
               <SelectTrigger className="w-32"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger>
               <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent>
             </Select>
          </div>
        </div>

        {/* Product List */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/40 uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">Product / SKU</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium text-right">Target QTY</th>
                  <th className="px-6 py-4 font-medium text-right">Expected Price</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                            <PackageOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No draft products found matching your search.</p>                            
                        </td>
                    </tr>
                ) : (
                    filtered.map((item: any) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                                {item.image_1 ? <img src={item.image_1} className="w-full h-full object-cover rounded-lg" /> : <PackageOpen className="w-5 h-5 text-muted-foreground" />}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">{item.sku || item.product_id || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{item.category_name || 'General'}</td>
                        <td className="px-6 py-4 text-right font-medium">{item.product_quantity || 0}</td>
                        <td className="px-6 py-4 text-right">TZS {Number(item.product_price || 0).toLocaleString()}</td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.is_published ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                {item.is_published ? 'Published' : 'Draft'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary"><Edit className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
