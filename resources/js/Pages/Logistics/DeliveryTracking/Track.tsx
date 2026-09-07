import { Head, useForm } from '@inertiajs/react';
import { MapPin, Phone, User, Clock, Star, CheckCircle, Package, Truck, Navigation, ChevronRight, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface TrackingDelivery {
  id: number;
  delivery_number: string;
  customer_name: string;
  phone: string;
  delivery_address: string;
  status: string;
  delivery_cost: number;
  delivery_total: number;
  rating: number;
  feedback: string;
  delivery_person?: { name: string; phone: string };
  items: any[];
  created_at: string;
  delivery_time: string;
}

interface TrackingProps {
  delivery: TrackingDelivery;
  trackingHistory: any[];
  latestTracking: any;
}

const STEPS = [
  { key: 'pending',    label: 'Order Placed',   icon: Package,       pct: 10  },
  { key: 'assigned',   label: 'Driver Assigned', icon: User,          pct: 30  },
  { key: 'picked-up',  label: 'Picked Up',       icon: Truck,         pct: 55  },
  { key: 'in-transit', label: 'In Transit',      icon: Navigation,    pct: 75  },
  { key: 'delivered',  label: 'Delivered',        icon: CheckCircle,   pct: 100 },
];

const STATUS_CFG: Record<string, { cls: string; label: string }> = {
  pending:     { cls: 'bg-slate-100 text-slate-700 ring-slate-200',      label: 'Pending'     },
  assigned:    { cls: 'bg-blue-100 text-blue-700 ring-blue-200',          label: 'Assigned'    },
  'picked-up': { cls: 'bg-cyan-100 text-cyan-700 ring-cyan-200',          label: 'Picked Up'   },
  'in-transit':{ cls: 'bg-amber-100 text-amber-700 ring-amber-200',       label: 'In Transit'  },
  delivered:   { cls: 'bg-emerald-100 text-emerald-700 ring-emerald-200', label: 'Delivered'   },
  failed:      { cls: 'bg-red-100 text-red-700 ring-red-200',             label: 'Failed'      },
  cancelled:   { cls: 'bg-slate-100 text-slate-500 ring-slate-200',       label: 'Cancelled'   },
};

const TIMELINE_DOT: Record<string, string> = {
  delivered:   'bg-emerald-500',
  failed:      'bg-red-500',
  'in-transit':'bg-amber-500',
  'picked-up': 'bg-cyan-500',
  assigned:    'bg-blue-500',
  default:     'bg-slate-400',
};

export default function Track({ delivery, trackingHistory = [], latestTracking }: TrackingProps) {
  const [tab, setTab] = useState<'status' | 'history' | 'rate'>('status');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const { post } = useForm({ rating: 0, feedback: '' });

  const statusCfg = STATUS_CFG[delivery.status] ?? STATUS_CFG['pending'];
  const isFailed  = ['failed', 'cancelled'].includes(delivery.status);
  const pct       = STEPS.find((s) => s.key === delivery.status)?.pct ?? 0;
  const discount  = delivery.delivery_cost - delivery.delivery_total;

  const handleRateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(`/deliveries/${delivery.id}/rate`, {
      onSuccess: () => { setRating(0); setFeedback(''); },
    });
  };

  return (
    <>
      <Head title={`Track ${delivery.delivery_number}`} />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">

        {/* ── Branded Top Bar ── */}
        <div className="border-b border-white/10 backdrop-blur-sm bg-white/5 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-sm">HD Group Logistics</span>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs">Tracking Number</p>
              <p className="text-white font-mono font-bold text-sm">{delivery.delivery_number}</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

          {/* ── Status Hero ── */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ring-1 ${statusCfg.cls}`}>
                  {statusCfg.label}
                </span>
                <p className="text-white/70 text-sm mt-2">
                  Last update: {latestTracking ? new Date(latestTracking.created_at).toLocaleString() : 'No updates yet'}
                </p>
              </div>
              {delivery.status === 'delivered' && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">Successfully Delivered!</span>
                </div>
              )}
              {isFailed && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  <span className="text-red-300 font-semibold">Delivery Issue Encountered</span>
                </div>
              )}
            </div>

            {/* Step Tracker */}
            {!isFailed && (
              <div>
                <div className="relative mb-4">
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-indigo-400 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {STEPS.map((step) => {
                    const StepIcon = step.icon;
                    const done = pct >= step.pct;
                    return (
                      <div key={step.key} className="flex flex-col items-center text-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${done ? 'bg-indigo-500 shadow-lg shadow-indigo-900' : 'bg-white/10'}`}>
                          <StepIcon className={`w-4 h-4 ${done ? 'text-white' : 'text-white/40'}`} />
                        </div>
                        <span className={`text-[10px] font-medium leading-tight ${done ? 'text-white' : 'text-white/40'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-1 bg-white/10 backdrop-blur-sm rounded-xl p-1">
            {[
              { key: 'status',  label: 'Current Status' },
              { key: 'history', label: 'Tracking History' },
              ...(delivery.status === 'delivered' && !delivery.rating ? [{ key: 'rate', label: '⭐ Rate Delivery' }] : []),
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key as any)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  tab === key
                    ? 'bg-white text-indigo-900 shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Status Tab ── */}
          {tab === 'status' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Customer Info */}
              <div className="rounded-2xl bg-white shadow-sm p-6 space-y-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />Your Information
                </h3>
                {[
                  { label: 'Name',     value: delivery.customer_name },
                  { label: 'Phone',    value: delivery.phone, href: `tel:${delivery.phone}` },
                  { label: 'Address',  value: delivery.delivery_address, icon: MapPin },
                ].map(({ label, value, href, icon: Icon }) => (
                  <div key={label}>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                    <div className="flex items-start gap-1.5 mt-0.5">
                      {Icon && <Icon className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
                      {href ? (
                        <a href={href} className="text-sm font-medium text-indigo-600 hover:underline">{value}</a>
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Driver Info */}
              {delivery.delivery_person ? (
                <div className="rounded-2xl bg-white shadow-sm p-6 space-y-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5" />Your Driver
                  </h3>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Name</p>
                    <p className="text-lg font-bold text-slate-800">{delivery.delivery_person.name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contact</p>
                    <a href={`tel:${delivery.delivery_person.phone}`} className="inline-flex items-center gap-2 mt-0.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
                      <Phone className="w-4 h-4" />
                      <span className="font-semibold">{delivery.delivery_person.phone}</span>
                    </a>
                  </div>
                  <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                    💬 For any issues, contact your driver directly via the number above.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl bg-white shadow-sm p-6 flex flex-col items-center justify-center text-center gap-2">
                  <Truck className="w-8 h-8 text-slate-200" />
                  <p className="text-slate-500 text-sm font-medium">No driver assigned yet</p>
                  <p className="text-slate-400 text-xs">You'll be notified when a driver is assigned</p>
                </div>
              )}

              {/* Current Location */}
              {latestTracking && (
                <div className="rounded-2xl bg-white shadow-sm p-6 space-y-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />Current Location
                  </h3>
                  {latestTracking.location && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Location</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                        {latestTracking.location}
                      </p>
                    </div>
                  )}
                  {latestTracking.latitude && latestTracking.longitude && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Coordinates</p>
                      <p className="font-mono text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 mt-0.5">
                        {latestTracking.latitude}, {latestTracking.longitude}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Last Update</p>
                    <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {new Date(latestTracking.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Cost Summary */}
              <div className="rounded-2xl bg-white shadow-sm p-6 space-y-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Delivery Cost</span>
                    <span className="font-medium text-slate-800">TZS {delivery.delivery_cost.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Discount</span>
                      <span className="font-medium text-emerald-600">-TZS {discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-100 pt-3 flex justify-between">
                    <span className="font-semibold text-slate-700">Total Payable</span>
                    <span className="text-xl font-bold text-indigo-700">TZS {delivery.delivery_total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── History Tab ── */}
          {tab === 'history' && (
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />Full Tracking History
                </h3>
              </div>
              <div className="p-6">
                {trackingHistory.length > 0 ? (
                  <div className="space-y-0">
                    {trackingHistory.map((record, index) => {
                      const dot = TIMELINE_DOT[record.status] ?? TIMELINE_DOT['default'];
                      return (
                        <div key={record.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ${dot}`} />
                            {index < trackingHistory.length - 1 && (
                              <div className="w-0.5 flex-1 bg-slate-200 my-2" />
                            )}
                          </div>
                          <div className={`flex-1 pb-6 ${index === trackingHistory.length - 1 ? '' : ''}`}>
                            <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                              <h4 className="font-semibold text-slate-800 capitalize">
                                {record.status.replace(/-/g, ' ')}
                              </h4>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(record.created_at).toLocaleString()}
                              </span>
                            </div>
                            {record.notes && (
                              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{record.notes}</p>
                            )}
                            {record.location && (
                              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-red-400" />
                                {record.location}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No tracking events yet</p>
                    <p className="text-slate-400 text-sm mt-1">Updates will appear here once your delivery is picked up</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Rate Tab ── */}
          {tab === 'rate' && delivery.status === 'delivered' && (
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-500" />Rate Your Delivery Experience
                </h3>
              </div>
              <div className="p-6">
                {delivery.rating ? (
                  <div className="text-center py-8">
                    <div className="flex justify-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className={`w-8 h-8 ${i <= delivery.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    <p className="text-slate-700 font-medium">You rated this delivery {delivery.rating}/5</p>
                    {delivery.feedback && <p className="text-slate-500 text-sm mt-2 italic">"{delivery.feedback}"</p>}
                  </div>
                ) : (
                  <form onSubmit={handleRateSubmit} className="space-y-6 max-w-md mx-auto">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-3">How was your delivery experience?</p>
                      <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setRating(i)}
                            className="transition-transform hover:scale-110 active:scale-95"
                          >
                            <Star
                              className={`w-10 h-10 transition-colors ${rating >= i ? 'fill-amber-400 text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}
                            />
                          </button>
                        ))}
                      </div>
                      {rating > 0 && (
                        <p className="text-center text-sm text-slate-500 mt-2">
                          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]} — {rating} out of 5 stars
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Additional Feedback <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        placeholder="Tell us about your experience…"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={4}
                        maxLength={500}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white resize-none transition-all"
                      />
                      <p className="text-xs text-slate-400 mt-1 text-right">{feedback.length}/500</p>
                    </div>

                    <button
                      type="submit"
                      disabled={rating === 0}
                      className="w-full px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Submit Rating
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="text-center text-sm text-white/40 pb-4 space-y-1">
            <p>Tracking #{delivery.delivery_number} · HD Group Logistics</p>
            <p>
              Questions?{' '}
              <a href="mailto:support@hdgroup.com" className="text-indigo-400 hover:text-indigo-300 underline">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
