import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

export default function DeliveryPersonnelCreate() {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Logistics', href: '/logistics' },
    { title: 'Delivery Personnel', href: '/delivery-personnel' },
    { title: 'Create', href: '#' }
  ];

  const { data, setData, post, processing, errors } = useForm({
    name: '',
    phone: '',
    email: '',
    id_number: '',
    vehicle_registration: '',
    vehicle_type: 'car',
    status: 'active',
    base_delivery_rate: '',
    address: '',
    delivery_zone: 'city',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/delivery-personnel');
  };

  const labelClass = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block";
  const inputClass = "w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50/50 focus:bg-white transition-all h-10 shadow-none";
  const selectClass = "w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50/50 focus:bg-white transition-all h-10 shadow-none cursor-pointer";

  return (
    <>
      <Head title="Register Delivery Personnel" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
          
          {/* Header */}
          <div className="flex items-center gap-3">
            <Link href="/delivery-personnel" className="h-9 w-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 shadow-sm transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Register Delivery Personnel</h1>
              <p className="text-xs font-medium text-slate-500 mt-1.5">Add a new delivery driver or staff member</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Personal Information */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-bold text-slate-800">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <Input
                      placeholder="Enter full name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      className={`${inputClass} ${errors.name ? 'border-red-500' : ''}`}
                    />
                    {errors.name && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Phone Number *</label>
                    <Input
                      placeholder="Enter phone number"
                      value={data.phone}
                      onChange={(e) => setData('phone', e.target.value)}
                      className={`${inputClass} ${errors.phone ? 'border-red-500' : ''}`}
                    />
                    {errors.phone && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>ID Number *</label>
                    <Input
                      placeholder="Enter National ID"
                      value={data.id_number}
                      onChange={(e) => setData('id_number', e.target.value)}
                      className={`${inputClass} ${errors.id_number ? 'border-red-500' : ''}`}
                    />
                    {errors.id_number && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.id_number}</p>}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Home Address</label>
                  <textarea
                    placeholder="Enter residential address"
                    value={data.address}
                    onChange={(e) => setData('address', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50/50 focus:bg-white transition-all min-h-[80px]"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Information */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-bold text-slate-800">Vehicle Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Vehicle Type *</label>
                    <select
                      value={data.vehicle_type}
                      onChange={(e) => setData('vehicle_type', e.target.value)}
                      className={selectClass}
                    >
                      <option value="motorcycle">Motorcycle</option>
                      <option value="car">Car</option>
                      <option value="van">Van</option>
                      <option value="truck">Truck</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Vehicle Registration</label>
                    <Input
                      placeholder="Enter registration plate"
                      value={data.vehicle_registration}
                      onChange={(e) => setData('vehicle_registration', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Details */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-bold text-slate-800">Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Delivery Zone *</label>
                    <select
                      value={data.delivery_zone}
                      onChange={(e) => setData('delivery_zone', e.target.value)}
                      className={selectClass}
                    >
                      <option value="city">City Center</option>
                      <option value="suburb">Suburbs</option>
                      <option value="rural">Rural Areas</option>
                      <option value="industrial">Industrial Zone</option>
                      <option value="airport">Airport</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Base Delivery Rate (TZS)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={data.base_delivery_rate}
                      onChange={(e) => setData('base_delivery_rate', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-bold text-slate-800">Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div>
                  <label className={labelClass}>Personnel Status *</label>
                  <select
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    className={selectClass}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on-leave">On Leave</option>
                  </select>
                  <p className="text-[11px] font-medium text-slate-400 mt-2">
                    Set the current status. Active personnel will appear in driver assignment lists.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Link href="/delivery-personnel">
                <button type="button" className="h-9 px-4 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-655 transition-all">
                  Cancel
                </button>
              </Link>
              <button 
                type="submit" 
                disabled={processing}
                className="rounded-xl h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Creating...' : 'Register Personnel'}
              </button>
            </div>
          </form>
        </div>
      </AppLayout>
    </>
  );
}
