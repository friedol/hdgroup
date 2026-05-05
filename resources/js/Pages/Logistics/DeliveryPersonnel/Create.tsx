import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
    post('/delivery-personnel', {
      onSuccess: () => {},
      onError: () => {},
    });
  };

  return (
    <>
      <Head title="Register Delivery Personnel" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/delivery-personnel">
              <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Register Delivery Personnel</h1>
              <p className="text-sm text-slate-600 mt-1">Add a new delivery driver or staff member</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name *</label>
                    <Input
                      placeholder="Enter full name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number *</label>
                    <Input
                      placeholder="Enter phone number"
                      value={data.phone}
                      onChange={(e) => setData('phone', e.target.value)}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">ID Number *</label>
                    <Input
                      placeholder="Enter National ID"
                      value={data.id_number}
                      onChange={(e) => setData('id_number', e.target.value)}
                      className={errors.id_number ? 'border-red-500' : ''}
                    />
                    {errors.id_number && <p className="text-red-500 text-xs mt-1">{errors.id_number}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Home Address</label>
                  <textarea
                    placeholder="Enter residential address"
                    value={data.address}
                    onChange={(e) => setData('address', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Vehicle Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Vehicle Type *</label>
                    <select
                      value={data.vehicle_type}
                      onChange={(e) => setData('vehicle_type', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="motorcycle">Motorcycle</option>
                      <option value="car">Car</option>
                      <option value="van">Van</option>
                      <option value="truck">Truck</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Vehicle Registration</label>
                    <Input
                      placeholder="Enter registration plate"
                      value={data.vehicle_registration}
                      onChange={(e) => setData('vehicle_registration', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Zone *</label>
                    <select
                      value={data.delivery_zone}
                      onChange={(e) => setData('delivery_zone', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="city">City Center</option>
                      <option value="suburb">Suburbs</option>
                      <option value="rural">Rural Areas</option>
                      <option value="industrial">Industrial Zone</option>
                      <option value="airport">Airport</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Base Delivery Rate (TZS)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={data.base_delivery_rate}
                      onChange={(e) => setData('base_delivery_rate', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Personnel Status *</label>
                  <select
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on-leave">On Leave</option>
                  </select>
                  <p className="text-sm text-slate-500 mt-2">
                    Set the current status. Active personnel will appear in driver assignment lists.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={processing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {processing ? 'Creating...' : 'Register Personnel'}
              </Button>
              <Link href="/delivery-personnel">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </AppLayout>
    </>
  );
}
