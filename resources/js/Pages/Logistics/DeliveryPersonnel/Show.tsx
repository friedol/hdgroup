import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, Truck, MapPin, Zap, Star, TrendingUp, Phone, Mail, CreditCard, User, Award, BarChart2, CheckCircle, XCircle, Clock, Navigation } from 'lucide-react';
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

const statusConfig: Record<string, { label: string; cls: string; dot: string }> = {
  active:     { label: 'Active',    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',  dot: 'bg-emerald-500' },
  inactive:   { label: 'Inactive',  cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',       dot: 'bg-slate-400'  },
  'on-leave': { label: 'On Leave',  cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',        dot: 'bg-amber-500'  },
};

const deliveryStatusConfig: Record<string, { cls: string }> = {
  pending:    { cls: 'bg-slate-100 text-slate-600' },
  assigned:   { cls: 'bg-blue-100 text-blue-700' },
  'picked-up': { cls: 'bg-cyan-100 text-cyan-700' },
  'in-transit': { cls: 'bg-amber-100 text-amber-700' },
  delivered:  { cls: 'bg-emerald-100 text-emerald-700' },
  failed:     { cls: 'bg-red-100 text-red-700' },
  cancelled:  { cls: 'bg-slate-100 text-slate-500' },
};

const vehicleIcon: Record<string, string> = {
  motorcycle: '🏍️',
  car: '🚗',
  van: '🚐',
  truck: '🚚',
};

export default function DeliveryPersonnelShow({
  person,
  active_deliveries = [],
  recent_deliveries = [],
  total_deliveries,
  completed_deliveries,
  failed_deliveries,
  average_rating,
  total_earnings,
}: DeliveryPersonnelShowProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Logistics', href: '/logistics' },
    { title: 'Delivery Personnel', href: '/delivery-personnel' },
    { title: person.name, href: '#' },
  ];

  const completionRate = total_deliveries > 0 ? Math.round((completed_deliveries / total_deliveries) * 100) : 0;
  const failureRate    = total_deliveries > 0 ? Math.round((failed_deliveries / total_deliveries) * 100) : 0;
  const inProgress     = total_deliveries - completed_deliveries - failed_deliveries;

  const sc = statusConfig[person.status] ?? statusConfig['inactive'];

  const initials = person.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <Head title={`${person.name} — Delivery Personnel`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">

          {/* ── Top bar ── */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/delivery-personnel" className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                <ArrowLeft className="w-4 h-4 text-slate-500" />
              </Link>

              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 flex-shrink-0">
                <span className="text-lg font-bold text-white">{initials}</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-semibold text-slate-800">{person.name}</h1>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${sc.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span>{vehicleIcon[person.vehicle_type] || '🚗'} {person.vehicle_type}</span>
                  <span className="text-slate-300">·</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium ring-1 ring-indigo-200">
                    <Navigation className="w-3 h-3" />{person.delivery_zone}
                  </span>
                </div>
              </div>
            </div>

            <Link href={`/delivery-personnel/${person.id}/edit`}>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors">
                <Edit className="w-4 h-4" />
                Edit Personnel
              </button>
            </Link>
          </div>

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Truck,       color: 'blue',    bg: 'bg-blue-50',    iconCls: 'text-blue-600',    label: 'Total Deliveries', value: total_deliveries,                              sub: 'All time' },
              { icon: CheckCircle, color: 'emerald', bg: 'bg-emerald-50', iconCls: 'text-emerald-600', label: 'Completed',         value: completed_deliveries,                          sub: `${completionRate}% rate` },
              { icon: Star,        color: 'amber',   bg: 'bg-amber-50',   iconCls: 'text-amber-500',   label: 'Avg. Rating',       value: average_rating ? average_rating.toFixed(1) : '—', sub: 'Out of 5.0' },
              { icon: Zap,         color: 'violet',  bg: 'bg-violet-50',  iconCls: 'text-violet-600',  label: 'Total Earnings',    value: `TZS ${total_earnings.toLocaleString()}`,       sub: 'Cumulative' },
            ].map(({ icon: Icon, bg, iconCls, label, value, sub }) => (
              <div key={label} className="rounded-xl bg-white border border-slate-200 shadow-sm px-3 py-2.5 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${iconCls}`} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="text-base font-bold text-slate-800 mt-0">{value}</p>
                  <p className="text-[9px] text-slate-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left column: Personal + Vehicle + Zone */}
            <div className="space-y-6">

              {/* Personal Info */}
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />Personal Information
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { icon: User,       label: 'Full Name',    value: person.name },
                    { icon: Phone,      label: 'Phone',        value: person.phone, href: `tel:${person.phone}` },
                    { icon: Mail,       label: 'Email',        value: person.email || 'Not provided', href: person.email ? `mailto:${person.email}` : undefined },
                    { icon: CreditCard, label: 'National ID',  value: person.id_number },
                    { icon: MapPin,     label: 'Home Address', value: person.address || 'Not provided' },
                  ].map(({ icon: Icon, label, value, href }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                        {href ? (
                          <a href={href} className="text-sm font-medium text-indigo-600 hover:underline">{value}</a>
                        ) : (
                          <p className="text-sm font-medium text-slate-800">{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Member Since</p>
                      <p className="text-sm font-medium text-slate-800">{new Date(person.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5" />Vehicle Details
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex items-center gap-4">
                    <span className="text-4xl">{vehicleIcon[person.vehicle_type] || '🚗'}</span>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Vehicle Type</p>
                      <p className="text-base font-semibold text-slate-800 capitalize">{person.vehicle_type}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Registration Plate</p>
                    <p className="text-sm font-mono font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
                      {person.vehicle_registration || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Zone & Rate */}
              <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 shadow-lg shadow-indigo-200 p-6 text-white">
                <div className="flex items-center gap-2 mb-4 opacity-80">
                  <Navigation className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Zone & Rate</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-indigo-200 text-xs">Delivery Zone</p>
                    <p className="text-xl font-bold">{person.delivery_zone}</p>
                  </div>
                  <div className="border-t border-white/20 pt-3">
                    <p className="text-indigo-200 text-xs">Base Rate per Delivery</p>
                    <p className="text-xl font-bold">TZS {person.base_delivery_rate?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Performance + Deliveries */}
            <div className="lg:col-span-2 space-y-6">

              {/* Performance */}
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <BarChart2 className="w-3.5 h-3.5" />Delivery Performance
                  </h2>
                </div>
                <div className="p-6 space-y-5">
                  {/* Counters */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { icon: CheckCircle, label: 'Completed',  value: completed_deliveries, cls: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { icon: Clock,       label: 'In Progress', value: inProgress,           cls: 'text-blue-600',    bg: 'bg-blue-50' },
                      { icon: XCircle,     label: 'Failed',      value: failed_deliveries,    cls: 'text-red-500',     bg: 'bg-red-50' },
                    ].map(({ icon: Icon, label, value, cls, bg }) => (
                      <div key={label} className={`rounded-xl ${bg} p-4 text-center`}>
                        <Icon className={`w-5 h-5 ${cls} mx-auto mb-1`} />
                        <p className={`text-2xl font-bold ${cls}`}>{value}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Progress bars */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-slate-700">Completion Rate</span>
                        <span className="font-semibold text-emerald-600">{completionRate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2.5 rounded-full transition-all duration-700"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-slate-700">Failure Rate</span>
                        <span className="font-semibold text-red-500">{failureRate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-red-500 h-2.5 rounded-full transition-all duration-700"
                          style={{ width: `${failureRate}%` }}
                        />
                      </div>
                    </div>
                    {average_rating > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-slate-700">Rating Score</span>
                          <span className="font-semibold text-amber-500">{average_rating.toFixed(1)} / 5.0</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-amber-400 h-2.5 rounded-full transition-all duration-700"
                            style={{ width: `${(average_rating / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Deliveries */}
              {active_deliveries.length > 0 && (
                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5" />Active Deliveries
                    </h2>
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">{active_deliveries.length}</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {active_deliveries.map((delivery) => {
                      const dc = deliveryStatusConfig[delivery.status] ?? { cls: 'bg-slate-100 text-slate-600' };
                      return (
                        <Link key={delivery.id} href={`/deliveries/${delivery.id}`}>
                          <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/80 transition-colors group">
                            <div>
                              <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{delivery.delivery_number}</p>
                              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />{delivery.customer_name}
                              </p>
                            </div>
                            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${dc.cls}`}>{delivery.status.replace('-', ' ')}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Deliveries */}
              {recent_deliveries.length > 0 && (
                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-3.5 h-3.5" />Recent Deliveries
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {['Order #', 'Customer', 'Address', 'Rating', 'Status'].map((h) => (
                            <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 tracking-wider bg-slate-50">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recent_deliveries.slice(0, 8).map((delivery) => {
                          const dc = deliveryStatusConfig[delivery.status] ?? { cls: 'bg-slate-100 text-slate-600' };
                          return (
                            <tr key={delivery.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-6 py-4">
                                <Link href={`/deliveries/${delivery.id}`} className="font-semibold text-indigo-600 hover:underline">
                                  {delivery.delivery_number}
                                </Link>
                              </td>
                              <td className="px-6 py-4 text-slate-700">{delivery.customer_name}</td>
                              <td className="px-6 py-4 text-slate-500 max-w-[160px] truncate">{delivery.delivery_address}</td>
                              <td className="px-6 py-4">
                                {delivery.rating ? (
                                  <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    {delivery.rating}/5
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${dc.cls}`}>
                                  {delivery.status.replace('-', ' ')}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
