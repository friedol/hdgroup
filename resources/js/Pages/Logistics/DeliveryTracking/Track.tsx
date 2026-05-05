import { Head, useForm } from '@inertiajs/react';
import { MapPin, Phone, User, Clock, Star, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

export default function Track({ delivery, trackingHistory, latestTracking }: TrackingProps) {
  const [selectedTab, setSelectedTab] = useState('status');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const { post } = useForm({ rating: 0, feedback: '' });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-slate-100 text-slate-700',
      'assigned': 'bg-blue-100 text-blue-700',
      'picked-up': 'bg-cyan-100 text-cyan-700',
      'in-transit': 'bg-yellow-100 text-yellow-700',
      'delivered': 'bg-green-100 text-green-700',
      'failed': 'bg-red-100 text-red-700',
      'cancelled': 'bg-slate-400 text-slate-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getStatusPercentage = (status: string) => {
    const percentages: Record<string, number> = {
      'pending': 10,
      'assigned': 25,
      'picked-up': 40,
      'in-transit': 70,
      'delivered': 100,
      'failed': 0,
      'cancelled': 0,
    };
    return percentages[status] || 0;
  };

  const handleRateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(`/deliveries/${delivery.id}/rate`, {
      onSuccess: () => {
        setRating(0);
        setFeedback('');
      }
    });
  };

  return (
    <>
      <Head title={`Track ${delivery.delivery_number}`} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container max-w-4xl mx-auto p-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-gray-800">Track Your Delivery</h1>
            <p className="text-gray-600 mt-2">Delivery Number: <span className="font-mono font-bold">{delivery.delivery_number}</span></p>
          </div>

          {/* Status Progress */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className={`text-center px-3 py-2 rounded-full inline-block w-full ${getStatusColor(delivery.status)}`}>
                  <p className="font-bold text-lg capitalize">{delivery.status.replace('-', ' ')}</p>
                </div>

                <div className="mt-6">
                  <p className="text-sm text-muted-foreground text-center mb-4">DELIVERY PROGRESS</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-green-500 h-2 transition-all duration-500"
                      style={{ width: `${getStatusPercentage(delivery.status)}%` }}
                    />
                  </div>
                  <p className="text-center text-sm mt-2 text-muted-foreground">{getStatusPercentage(delivery.status)}% Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setSelectedTab('status')}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  selectedTab === 'status'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Current Status
              </button>
              <button
                onClick={() => setSelectedTab('history')}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  selectedTab === 'history'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Tracking History
              </button>
              {delivery.status === 'delivered' && (
                <button
                  onClick={() => setSelectedTab('rate')}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    selectedTab === 'rate'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Rate Delivery
                </button>
              )}
            </div>
          </div>

          {/* Status Tab */}
          {selectedTab === 'status' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Your Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium text-lg">{delivery.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{delivery.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Address</p>
                    <div className="flex items-start gap-2 mt-1">
                      <MapPin className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                      <p className="font-medium">{delivery.delivery_address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Driver Info */}
              {delivery.delivery_person && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Your Driver
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Driver Name</p>
                      <p className="font-medium text-lg">{delivery.delivery_person.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-blue-500" />
                        <a href={`tel:${delivery.delivery_person.phone}`} className="font-medium text-blue-600 hover:underline">
                          {delivery.delivery_person.phone}
                        </a>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-sm">
                      For any issues, contact your driver directly
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Current Location */}
              {latestTracking && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Current Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {latestTracking.location && (
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{latestTracking.location}</p>
                      </div>
                    )}
                    {latestTracking.latitude && latestTracking.longitude && (
                      <div>
                        <p className="text-sm text-muted-foreground">Coordinates</p>
                        <p className="font-mono text-sm">{latestTracking.latitude}, {latestTracking.longitude}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Last Update</p>
                      <p className="font-medium">{new Date(latestTracking.created_at).toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Costs */}
              <Card>
                <CardHeader>
                  <CardTitle>Cost Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Cost:</span>
                    <span className="font-medium">TZS {delivery.delivery_cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-medium">-TZS {(delivery.delivery_cost - delivery.delivery_total).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-lg">TZS {delivery.delivery_total.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* History Tab */}
          {selectedTab === 'history' && (
            <Card>
              <CardHeader>
                <CardTitle>Tracking History</CardTitle>
                <CardDescription>All updates for your delivery</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {trackingHistory && trackingHistory.length > 0 ? (
                    trackingHistory.map((record, index) => (
                      <div key={record.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            record.status === 'delivered' ? 'bg-green-500' :
                            record.status === 'failed' ? 'bg-red-500' :
                            record.status === 'in-transit' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`} />
                          {index < trackingHistory.length - 1 && <div className="w-1 h-20 bg-gray-200 my-2" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-lg capitalize">{record.status.replace('-', ' ')}</h4>
                            <span className="text-sm text-muted-foreground">
                              {new Date(record.created_at).toLocaleString()}
                            </span>
                          </div>
                          {record.notes && <p className="text-sm text-gray-700">{record.notes}</p>}
                          {record.location && <p className="text-sm text-muted-foreground mt-1">📍 {record.location}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No tracking history yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rate Tab */}
          {selectedTab === 'rate' && delivery.status === 'delivered' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Rate This Delivery
                </CardTitle>
                <CardDescription>Help us improve our service</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRateSubmit} className="space-y-6">
                  {/* Star Rating */}
                  <div>
                    <label className="block text-sm font-medium mb-4">How was your delivery experience?</label>
                    <div className="flex gap-3 text-4xl">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRating(i + 1)}
                          className={`transition-all ${rating > i ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-300 cursor-pointer`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    {rating > 0 && <p className="text-sm text-muted-foreground mt-2">You selected {rating} out of 5 stars</p>}
                  </div>

                  {/* Feedback */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Additional Feedback (Optional)</label>
                    <textarea
                      placeholder="Tell us about your delivery experience..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{feedback.length}/500 characters</p>
                  </div>

                  <Button disabled={rating === 0} className="w-full" type="submit">
                    Submit Rating
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground mt-8">
            <p>Delivery Number: {delivery.delivery_number}</p>
            <p className="mt-2">Questions? <a href="mailto:support@hdgroup.com" className="text-blue-600 hover:underline">Contact us</a></p>
          </div>
        </div>
      </div>
    </>
  );
}
