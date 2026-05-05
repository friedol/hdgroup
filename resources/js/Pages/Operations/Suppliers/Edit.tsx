import { Head, router, Link } from '@inertiajs/react';
import { 
  ArrowLeft, 
  Save, 
  Undo2, 
  Info,
  Truck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Tag,
  ShieldCheck,
  History
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

interface Supplier {
  id: number;
  supplier_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  category: string | null;
  tax_id: string | null;
  status: boolean;
  branch_id: number | null;
}

interface SuppliersEditProps {
  supplier: Supplier;
  branches: { id: number; name: string }[];
  errors?: Record<string, string>;
}

export default function SuppliersEdit({ 
  supplier,
  branches = [],
  errors = {} 
}: SuppliersEditProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    supplier_name: supplier.supplier_name,
    email: supplier.email || '',
    phone: supplier.phone || '',
    address: supplier.address || '',
    city: supplier.city || '',
    country: supplier.country,
    category: supplier.category || '',
    tax_id: supplier.tax_id || '',
    branch_id: supplier.branch_id ? supplier.branch_id.toString() : 'all_branches',
    status: supplier.status
  });

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Operations', href: '#' },
    { title: 'Suppliers', href: '/suppliers' },
    { title: 'Update Vendor', href: '#' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    router.put(`/suppliers/${supplier.id}`, form as any, {
      onSuccess: () => {
        toast.success("Supplier details updated successfully");
      },
      onError: () => {
        toast.error("Please check the form for errors");
      },
      onFinish: () => setIsSubmitting(false)
    });
  };

  return (
    <>
      <Head title={`Edit ${supplier.supplier_name}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1400px] mx-auto py-2">
          
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                <Link href="/suppliers">
                   <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200">
                      <ArrowLeft className="h-4 w-4 text-slate-500" />
                   </Button>
                </Link>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 ">Modify Vendor</h1>
             </div>
             <Button variant="outline" className="border-slate-200 text-slate-500 text-xs font-bold px-4">
                <History className="h-3 w-3 mr-2" /> Purchase Logs
             </Button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Identity Card */}
              <Card className="p-6 border-slate-200">
                <div className="flex items-center gap-2 mb-6 text-amber-600">
                   <div className="bg-amber-100 p-1 rounded-full">
                     <Info className="h-4 w-4" />
                   </div>
                   <h2 className="font-bold text-sm uppercase tracking-wider">Identity Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Supplier Name *</Label>
                    <Input 
                      required
                      value={form.supplier_name} 
                      onChange={e => setForm({...form, supplier_name: e.target.value})}
                      className="bg-slate-50 border-slate-300 font-bold h-11"
                    />
                    {errors.supplier_name && <p className="text-[10px] text-red-500 font-bold">{errors.supplier_name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Contact Email</Label>
                    <Input 
                      type="email"
                      value={form.email} 
                      onChange={e => setForm({...form, email: e.target.value})}
                      className="bg-white border-slate-200 h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Phone Contact</Label>
                    <Input 
                      value={form.phone} 
                      onChange={e => setForm({...form, phone: e.target.value})}
                      className="bg-white border-slate-200 h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Category</Label>
                    <Input 
                      value={form.category} 
                      onChange={e => setForm({...form, category: e.target.value})}
                      className="bg-white border-slate-200 h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Tax ID / TIN</Label>
                    <Input 
                      value={form.tax_id} 
                      onChange={e => setForm({...form, tax_id: e.target.value})}
                      className="bg-white border-slate-200 h-10"
                    />
                  </div>
                </div>
              </Card>

              {/* Physical Registry Card */}
              <Card className="p-6 border-slate-200">
                <div className="flex items-center gap-2 mb-6 text-amber-800">
                   <div className="bg-amber-100 p-1 rounded-full">
                     <MapPin className="h-4 w-4" />
                   </div>
                   <h2 className="font-bold text-sm uppercase tracking-wider">Address & Location</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Office Address</Label>
                    <Input 
                      value={form.address} 
                      onChange={e => setForm({...form, address: e.target.value})}
                      className="bg-white border-slate-200 h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">City</Label>
                    <Input 
                      value={form.city} 
                      onChange={e => setForm({...form, city: e.target.value})}
                      className="bg-white border-slate-200 h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Country</Label>
                    <Input 
                      value={form.country} 
                      onChange={e => setForm({...form, country: e.target.value})}
                      className="bg-white border-slate-200 h-10"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              <Card className="p-6 border-slate-200">
                <div className="flex items-center gap-2 mb-6 text-emerald-700">
                   <div className="bg-emerald-100 p-1 rounded-full">
                     <Building2 className="h-4 w-4" />
                   </div>
                   <h2 className="font-bold text-sm uppercase tracking-wider">System Settings</h2>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Branch Territory *</Label>
                    <Select value={form.branch_id} onValueChange={val => setForm({...form, branch_id: val})}>
                      <SelectTrigger className="bg-white border-slate-300 h-10 font-bold text-xs">
                        <SelectValue placeholder="Select Territory" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_branches">All Branches (Global)</SelectItem>
                        {branches.map(b => (
                           <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox 
                      id="status" 
                      checked={form.status} 
                      onCheckedChange={(checked) => setForm({...form, status: !!checked})}
                      className="border-emerald-600 data-[state=checked]:bg-emerald-600"
                    />
                    <Label htmlFor="status" className="text-[11px] font-bold uppercase text-slate-700 cursor-pointer">
                      Active Network status
                    </Label>
                  </div>

                  <div className="pt-6 space-y-3">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11"
                    >
                      <Save className="h-4 w-4 mr-2" /> Sync Updates
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => router.visit('/suppliers')}
                      className="w-full border-slate-300 text-slate-500 font-bold text-xs h-11"
                    >
                      Discard & Exit
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                 <div className="flex gap-2">
                    <Info className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-slate-500 italic leading-snug">Updating this vendor profile will affect all linked modules and procurement logs currently in the system.</p>
                 </div>
              </div>
            </div>

          </form>
        </div>
      </AppLayout>
    </>
  );
}
