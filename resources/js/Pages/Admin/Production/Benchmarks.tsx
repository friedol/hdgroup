import { Head, router } from '@inertiajs/react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit, 
  ArrowLeft,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppLayout from '@/layouts/app-layout';

interface Benchmark {
  id: number;
  name: string;
  image_path?: string;
  type: string;
  description?: string;
  width: number;
  length: number;
  target: number;
  price: number;
  req_roller: number;
  is_active: boolean;
}

interface BenchmarksProps {
  benchmarks: Benchmark[];
}

export default function Benchmarks({ benchmarks }: BenchmarksProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBenchmark, setEditingBenchmark] = useState<Benchmark | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    name: '',
    type: 'D-Cut',
    description: '',
    width: '',
    length: '',
    target: '',
    price: '',
    req_roller: '',
    image: null as File | null
  });

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Manufacturing', href: '/production/roll-based' },
    { title: 'Benchmarks', href: '#' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Use FormData for file upload
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value as string | Blob);
      }
    });

    if (editingBenchmark) {
      // router.put doesn't support FormData in Inertia usually with files easily, use router.post with _method
      formData.append('_method', 'PUT');
      router.post(`/production/benchmarks/${editingBenchmark.id}`, formData as any, {
        onSuccess: () => {
          setIsDialogOpen(false);
          toast.success("Benchmark updated successfully");
        }
      });
    } else {
      router.post('/production/benchmarks', formData as any, {
        onSuccess: () => {
          setIsDialogOpen(false);
          toast.success("New benchmark standard defined");
        }
      });
    }
  };

  const handleToggle = (id: number) => {
    router.post(`/production/benchmarks/${id}/toggle`, {}, {
      onSuccess: () => toast.success("Status toggle updated")
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to permanently delete this benchmark standard? This action cannot be undone.")) {
      router.delete(`/production/benchmarks/${id}`, {
        onSuccess: () => toast.success("Benchmark standard removed")
      });
    }
  };


  return (
    <>
      <Head title="Production Standards" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-slate-100">
            <div className="flex items-center gap-4">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 shadow-sm">
                <Settings className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Production Standards</h1>
                <p className="text-xs font-medium text-slate-400">Configure global benchmarks for yield calculation and pricing.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => router.visit('/production/roll-based')}
                className="border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Engine
              </Button>
              <Button 
                onClick={() => {
                  setEditingBenchmark(null);
                  setForm({ 
                    name: '', 
                    type: 'D-Cut', 
                    description: '',
                    width: '', 
                    length: '', 
                    target: '', 
                    price: '', 
                    req_roller: '',
                    image: null
                  });
                  setImagePreview(null);
                  setIsDialogOpen(true);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg px-6 shadow-lg shadow-amber-200 transition-all active:scale-95"
              >
                <Plus className="h-4.5 w-4.5 mr-2" /> Define Standard
              </Button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-4 border-b bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex items-center gap-2">
                   <h3 className="font-bold text-slate-800 text-sm">Active Standards</h3>
                </div>
                <div className="flex items-center gap-2">
                   <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg font-bold text-slate-600 border-slate-200">Export PDF</Button>
                </div>
            </div>

            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b-slate-200">
                  <TableHead className="font-bold text-slate-800">Benchmark</TableHead>
                  <TableHead className="font-bold text-slate-800">Dimensions</TableHead>
                  <TableHead className="font-bold text-slate-800">Roller</TableHead>
                  <TableHead className="font-bold text-slate-800">Target Yield</TableHead>
                  <TableHead className="font-bold text-slate-800">Price</TableHead>
                  <TableHead className="font-bold text-slate-800">Status</TableHead>
                  <TableHead className="font-bold text-slate-800 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benchmarks.length > 0 ? (
                  benchmarks.map((row: Benchmark) => (
                    <TableRow key={row.id} className="hover:bg-slate-50 border-b-slate-100 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {row.image_path ? (
                            <img 
                              src={`/storage/${row.image_path}`} 
                              alt={row.name} 
                              className="h-10 w-10 rounded-lg object-cover border border-slate-100 shadow-sm"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                               <Settings className="h-5 w-5 text-slate-300" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 tracking-tight leading-none mb-1">{row.name}</span>
                            <span className="text-[10px] font-medium text-slate-400 capitalize">{row.type.replace('-', ' ')}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-600 font-medium">{row.width}cm &times; {row.length}cm</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-500 font-semibold">{row.req_roller}cm</span>
                      </TableCell>
                      <TableCell>
                         <span className="font-bold text-emerald-600">{row.target.toLocaleString()} Pcs</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-slate-900">{row.price?.toLocaleString() || '0'} <span className="text-[10px] text-slate-400">TZS</span></span>
                      </TableCell>
                      <TableCell>
                         <button 
                           onClick={() => handleToggle(row.id)}
                           className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm ${
                             row.is_active ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                           }`}
                         >
                           {row.is_active ? 'Active' : 'Inactive'}
                         </button>
                      </TableCell>
                      <TableCell className="text-right">
                         <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                              onClick={() => {
                                setEditingBenchmark(row);
                                setForm({
                                  name: row.name,
                                  type: row.type,
                                  description: row.description || '',
                                  width: row.width.toString(),
                                  length: row.length.toString(),
                                  target: row.target.toString(),
                                  price: row.price?.toString() || '',
                                  req_roller: row.req_roller.toString(),
                                  image: null
                                });
                                setImagePreview(row.image_path ? `/storage/${row.image_path}` : null);
                                setIsDialogOpen(true);
                              }}
                            >
                               <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => handleDelete(row.id)}
                            >
                               <Trash2 className="h-4 w-4" />
                            </Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                     <TableCell colSpan={7} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center opacity-30 grayscale">
                           <Settings className="h-10 w-10 mb-2" />
                           <p className="text-sm font-bold">No benchmark standards defined</p>
                        </div>
                     </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md rounded-xl border-slate-100 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {editingBenchmark ? 'Update Global Standard' : 'New Standard Definition'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 py-4">
               <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">Benchmark Name</Label>
                    <Input 
                      required
                      value={form.name} 
                      onChange={e => setForm({...form, name: e.target.value})} 
                      placeholder="e.g. A4 D-Cut"
                      className="h-11 bg-slate-50/50 border-slate-200 rounded-lg focus:ring-amber-500 font-medium"
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">Visual</Label>
                    <div 
                      className="h-11 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 overflow-hidden"
                      onClick={() => document.getElementById('benchmark-image')?.click()}
                    >
                       {imagePreview ? (
                         <img src={imagePreview} className="h-full w-full object-cover" />
                       ) : (
                         <Plus className="h-4 w-4 text-slate-400" />
                       )}
                    </div>
                    <input 
                      type="file" 
                      id="benchmark-image" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setForm({...form, image: file});
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
               </div>

               <div className="space-y-2">
                 <Label className="text-xs font-semibold text-slate-500">Description (Optional)</Label>
                 <Input 
                   value={form.description} 
                   onChange={e => setForm({...form, description: e.target.value})} 
                   placeholder="Brief description of bag purpose..."
                   className="h-11 bg-slate-50/50 border-slate-200 rounded-lg focus:ring-amber-500 font-medium"
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label className="text-xs font-semibold text-slate-500">Fabrication Type</Label>
                   <Select value={form.type} onValueChange={(val: 'D-Cut'|'Loop') => setForm({...form, type: val})}>
                      <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 rounded-lg font-medium"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="D-Cut">D-Cut Bag</SelectItem>
                        <SelectItem value="Loop">Loop Handle Bag</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label className="text-xs font-semibold text-slate-500">Target Price (TSH)</Label>
                   <Input 
                    type="number"
                    value={form.price} 
                    onChange={e => setForm({...form, price: e.target.value})} 
                    className="h-11 bg-slate-50/50 border-slate-200 rounded-lg focus:ring-amber-500 font-medium"
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                 <div className="space-y-2">
                   <Label className="text-xs font-semibold text-slate-500">Machine Width (cm)</Label>
                   <Input 
                    required
                    type="number"
                    value={form.width} 
                    onChange={e => setForm({...form, width: e.target.value})} 
                    className="h-11 bg-slate-50/50 border-slate-200 rounded-lg focus:ring-amber-500 font-medium"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-xs font-semibold text-slate-500">Cut Length (cm)</Label>
                   <Input 
                    required
                    type="number"
                    value={form.length} 
                    onChange={e => setForm({...form, length: e.target.value})} 
                    className="h-11 bg-slate-50/50 border-slate-200 rounded-lg focus:ring-amber-500 font-medium"
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label className="text-xs font-semibold text-slate-500">Target Yield (Qty)</Label>
                   <Input 
                    required
                    type="number"
                    value={form.target} 
                    onChange={e => setForm({...form, target: e.target.value})} 
                    className="h-11 bg-slate-50/50 border-slate-200 rounded-lg focus:ring-amber-500 font-medium"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-xs font-semibold text-slate-500">Optimal Roller (cm)</Label>
                   <Input 
                    required
                    type="number"
                    value={form.req_roller} 
                    onChange={e => setForm({...form, req_roller: e.target.value})} 
                    className="h-11 bg-slate-50/50 border-slate-200 rounded-lg focus:ring-amber-500 font-medium"
                   />
                 </div>
               </div>

               <DialogFooter className="pt-6">
                 <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-12 rounded-lg transition-all shadow-lg shadow-amber-100">
                    {editingBenchmark ? 'Save Global Changes' : 'Confirm Standard Definition'}
                 </Button>
               </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </>
  );
}
