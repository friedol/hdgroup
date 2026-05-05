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
  Package
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

interface SuppliersCreateProps {
  branches: { id: number; name: string }[];
  errors?: Record<string, string>;
}

export default function SuppliersCreate({ 
  branches = [],
  errors = {} 
}: SuppliersCreateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    supplier_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Tanzania',
    category: '',
    tax_id: '',
    branch_id: 'all_branches',
    status: true
  });

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Operations', href: '#' },
    { title: 'Suppliers', href: '/suppliers' },
    { title: 'Register Vendor', href: '#' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    router.post('/suppliers', form as any, {
      onSuccess: () => {
        toast.success("Supplier registered successfully");
      },
      onError: () => {
        toast.error("Please check the form for errors");
      },
      onFinish: () => setIsSubmitting(false)
    });
  };

  return (
    <>
      <Head title="Register New Supplier" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1400px] mx-auto py-2">
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Columns - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Basic Information Card */}
              <Card className="p-6 border-slate-200">
                <div className="flex items-center gap-2 mb-6 text-amber-600">
                   <div className="bg-amber-100 p-1 rounded-full">
                     <Info className="h-4 w-4" />
                   </div>
                   <h2 className="font-bold text-sm uppercase tracking-wider">Basic Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Supplier Name *</Label>
                    <Input 
                      required
                      placeholder="Enter supplier name" 
                      value={form.supplier_name} 
                      onChange={e => setForm({...form, supplier_name: e.target.value})}
                      className="bg-slate-50/50 border-slate-300 h-10"
                    />
                    {errors.supplier_name && <p className="text-[10px] text-red-500 font-bold">{errors.supplier_name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Email Address</Label>
                    <Input 
                      type="email"
                      placeholder="vendor@company.com" 
                      value={form.email} 
                      onChange={e => setForm({...form, email: e.target.value})}
                      className="bg-slate-50/50 border-slate-300 h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Phone Number</Label>
                    <Input 
                      placeholder="+255 --- --- ---" 
                      value={form.phone} 
                      onChange={e => setForm({...form, phone: e.target.value})}
                      className="bg-slate-50/50 border-slate-300 h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Category</Label>
                    <Input 
                      placeholder="e.g. Textiles, Logistics" 
                      value={form.category} 
                      onChange={e => setForm({...form, category: e.target.value})}
                      className="bg-slate-50/50 border-slate-300 h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Tax ID / TIN</Label>
                    <Input 
                      placeholder="Enter TIN" 
                      value={form.tax_id} 
                      onChange={e => setForm({...form, tax_id: e.target.value})}
                      className="bg-slate-50/50 border-slate-300 h-10"
                    />
                  </div>
                </div>
              </Card>

              {/* Location Card */}
              <Card className="p-6 border-slate-200">
                <div className="flex items-center gap-2 mb-6 text-amber-800">
                   <div className="bg-amber-100 p-1 rounded-full">
                     <MapPin className="h-4 w-4" />
                   </div>
                   <h2 className="font-bold text-sm uppercase tracking-wider">Address & Location</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Physical Address</Label>
                    <Input 
                      placeholder="e.g. Plot 45, Nyerere Road" 
                      value={form.address} 
                      onChange={e => setForm({...form, address: e.target.value})}
                      className="bg-slate-50/50 border-slate-300 h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">City</Label>
                    <Input 
                      placeholder="e.g. Dar es Salaam" 
                      value={form.city} 
                      onChange={e => setForm({...form, city: e.target.value})}
                      className="bg-slate-50/50 border-slate-300 h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Country</Label>
                    <Input 
                      value={form.country} 
                      onChange={e => setForm({...form, country: e.target.value})}
                      className="bg-slate-50/50 border-slate-300 h-10"
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
                   <h2 className="font-bold text-sm uppercase tracking-wider">Operational Settings</h2>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Assign to Branch territory *</Label>
                    <Select value={form.branch_id} onValueChange={val => setForm({...form, branch_id: val})}>
                      <SelectTrigger className="bg-white border-slate-300 h-10">
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
                      Active for Procurement
                    </Label>
                  </div>

                  <div className="pt-6 space-y-3">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11"
                    >
                      <Save className="h-4 w-4 mr-2" /> Register Supplier
                    </Button>
                    <Link href="/suppliers">
                       <Button 
                         type="button" 
                         variant="outline" 
                         className="w-full border-slate-300 text-slate-600 h-11"
                       >
                         Cancel & Return
                       </Button>
                    </Link>
                  </div>
                </div>
              </Card>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                 <div className="flex gap-3 text-slate-600">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                       <p className="text-[11px] font-bold uppercase tracking-tight">System Notice</p>
                       <p className="text-[10px] leading-relaxed">Registering a vendor makes them available for selection in Bill of Materials and purchase workflows.</p>
                    </div>
                 </div>
              </div>
            </div>

          </form>
        </div>
      </AppLayout>
    </>
  );
}
