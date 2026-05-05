import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, Truck, MapPin, Zap, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

interface Delivery {
  id: number;
  delivery_number: string;
  customer_name: string;
  delivery_address: string;
  status: string;
  delivery_total: number;
  delivery_time: string;
  rating: number;
}

interface DeliveryPerson {
  id: number;
  name: string;
  phone: string;
  email: string;
  id_number: string;
  vehicle_registration: string;
  vehicle_type: string;
  status: string;
  base_delivery_rate: number;
  address: string;
  delivery_zone: string;
  created_at: string;
}

interface DeliveryPersonnelShowProps {
  person: DeliveryPerson;
  active_deliveries: Delivery[];
  recent_deliveries: Delivery[];
  total_deliveries: number;
  completed_deliveries: number;
  failed_deliveries: number;
  average_rating: number;
  total_earnings: number;
}

export default function DeliveryPersonnelShow({ 
  person, 
  active_deliveries, 
  recent_deliveries,
  total_deliveries,
  completed_deliveries,
  failed_deliveries,
  average_rating,
  total_earnings
}: DeliveryPersonnelShowProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Logistics', href: '/logistics' },
    { title: 'Delivery Personnel', href: '/delivery-personnel' },
    { title: person.name, href: '#' }
  ];

  const statusColor = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    'on-leave': 'bg-yellow-100 text-yellow-800'
  };

  const vehicleEmoji = {
    motorcycle: '🏍️',
    car: '🚗',
    van: '🚐',
    truck: '🚚'
  };

  const completionRate = total_deliveries > 0 
    ? Math.round((completed_deliveries / total_deliveries) * 100)
    : 0;

  const failureRate = total_deliveries > 0 
    ? Math.round((failed_deliveries / total_deliveries) * 100)
    : 0;

  return (
    <>
      <Head title={`${person.name} - Delivery Personnel`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/delivery-personnel">
                <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </Link>
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-sm text-slate-600">
                    {vehicleEmoji[person.vehicle_type as keyof typeof vehicleEmoji] || '🚗'} {person.vehicle_type}
                  </div>
                  <h1 className="text-xl font-medium">{person.name}</h1>
                  <p className="text-sm text-slate-600 mt-1">{person.phone}</p>
                </div>
              </div>
            </div>
            <Link href={`/delivery-personnel/${person.id}/edit`}>
              <Button className="gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </Link>
          </div>

          {/* Status Badge */}
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor[person.status as keyof typeof statusColor]}`}>
              {person.status}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {person.delivery_zone}
            </span>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Total Deliveries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-medium">{total_deliveries}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-medium text-green-600">{completed_deliveries}</div>
                <p className="text-xs text-slate-600">{completionRate}% completion rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Average Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-medium">{average_rating?.toFixed(1) || 'N/A'}</div>
                <p className="text-xs text-slate-600">Out of 5.0</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-medium">TZS {total_earnings.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600">Full Name</p>
                    <p className="font-medium">{person.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Phone Number</p>
                    <a href={`tel:${person.phone}`} className="font-medium text-blue-600 hover:underline">
                      {person.phone}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Email Address</p>
                    <p className="font-medium">{person.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600">National ID</p>
                    <p className="font-medium">{person.id_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Home Address</p>
                    <p className="font-medium">{person.address || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Member Since</p>
                    <p className="font-medium">{new Date(person.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600">Vehicle Type</p>
                    <p className="font-medium">
                      {vehicleEmoji[person.vehicle_type as keyof typeof vehicleEmoji] || '🚗'} {person.vehicle_type}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600">Registration Plate</p>
                    <p className="font-medium">{person.vehicle_registration || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Delivery Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Completion Rate</span>
                  <span className="font-medium">{completionRate}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Failure Rate</span>
                  <span className="font-medium text-red-600">{failureRate}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${failureRate}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-medium text-green-600">{completed_deliveries}</p>
                  <p className="text-xs text-slate-600">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-medium text-blue-600">{total_deliveries - completed_deliveries - failed_deliveries}</p>
                  <p className="text-xs text-slate-600">In Progress</p>
                </div>
                <div>
                  <p className="text-2xl font-medium text-red-600">{failed_deliveries}</p>
                  <p className="text-xs text-slate-600">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Deliveries */}
          {active_deliveries && active_deliveries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Deliveries ({active_deliveries.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {active_deliveries.map((delivery) => (
                    <Link key={delivery.id} href={`/deliveries/${delivery.id}`}>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                        <div>
                          <p className="font-medium">{delivery.delivery_number}</p>
                          <p className="text-sm text-slate-600">{delivery.customer_name}</p>
                        </div>
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {delivery.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Deliveries */}
          {recent_deliveries && recent_deliveries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recent_deliveries.slice(0, 5).map((delivery) => (
                    <Link key={delivery.id} href={`/deliveries/${delivery.id}`}>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                        <div className="flex-1">
                          <p className="font-medium">{delivery.delivery_number}</p>
                          <p className="text-sm text-slate-600">{delivery.customer_name}</p>
                        </div>
                        {delivery.rating && (
                          <div className="flex items-center gap-2 mr-4">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{delivery.rating}/5</span>
                          </div>
                        )}
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          {delivery.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Base Rate Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Delivery Zone & Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">Assigned Delivery Zone</p>
                <p className="font-medium text-lg">{person.delivery_zone}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Base Delivery Rate</p>
                <p className="font-medium text-lg">TZS {person.base_delivery_rate?.toLocaleString() || '0.00'}/delivery</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}
