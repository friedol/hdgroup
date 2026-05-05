import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, X, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

interface Driver {
  id: number;
  name: string;
  phone: string;
}

interface DeliveryItem {
  id?: number;
  item_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface DeliveryEditProps {
  delivery: {
    id: number;
    delivery_number: string;
    delivery_type: string;
    customer_name: string;
    phone: string;
    email: string;
    delivery_address: string;
    delivery_zone: string;
    delivery_cost: number;
    delivery_discount: number;
    payment_method: string;
    delivery_person_id: number;
    priority: string;
    scheduled_date: string;
    status: string;
    notes: string;
    items: DeliveryItem[];
  };
  drivers: Driver[];
}

export default function DeliveryEdit({ delivery, drivers }: DeliveryEditProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Logistics', href: '/logistics' },
    { title: 'Deliveries', href: '/deliveries' },
    { title: delivery.delivery_number, href: `/deliveries/${delivery.id}` },
    { title: 'Edit', href: '#' }
  ];

  const isPending = delivery.status === 'pending';

  const [items, setItems] = useState<DeliveryItem[]>(delivery.items || []);

  const { data, setData, put, delete: deleteDelivery, processing, errors } = useForm({
    delivery_type: delivery.delivery_type,
    customer_name: delivery.customer_name,
    phone: delivery.phone,
    email: delivery.email || '',
    delivery_address: delivery.delivery_address,
    delivery_zone: delivery.delivery_zone || '',
    delivery_cost: delivery.delivery_cost || 0,
    delivery_discount: delivery.delivery_discount || 0,
    payment_method: delivery.payment_method || 'cash',
    delivery_person_id: delivery.delivery_person_id || '',
    priority: delivery.priority || 'normal',
    scheduled_date: delivery.scheduled_date || '',
    notes: delivery.notes || '',
    items: items,
  });

  const handleAddItem = () => {
    const newItems = [...items, {
      item_id: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
    }];
    setItems(newItems);
    setData('items', newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    setData('items', newItems);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
    setData('items', newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/deliveries/${delivery.id}`, {
      onSuccess: () => {},
      onError: () => {},
    });
  };

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirm('Are you sure you want to delete this delivery?')) {
      deleteDelivery(`/deliveries/${delivery.id}`, {
        onSuccess: () => {},
        onError: () => {},
      });
    }
  };

  const totalItemsValue = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const deliveryCost = parseFloat(String(data.delivery_cost)) || 0;
  const deliveryDiscount = parseFloat(String(data.delivery_discount)) || 0;
  const deliveryTotal = deliveryCost - deliveryDiscount;
  const grandTotal = totalItemsValue + deliveryTotal;

  if (!isPending) {
    return (
      <>
        <Head title="Edit Delivery" />
        <AppLayout breadcrumbs={breadcrumbs}>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Link href="/deliveries">
                <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Edit Delivery</h1>
                <p className="text-sm text-slate-600 mt-1">Delivery #{delivery.delivery_number}</p>
              </div>
            </div>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-900">Cannot Edit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-800">
                  This delivery cannot be edited because it has already been assigned or is in transit. 
                  Current status: <span className="font-bold">{delivery.status}</span>
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  Only pending deliveries can be edited.
                </p>
              </CardContent>
            </Card>

            <Link href="/deliveries">
              <Button variant="outline">Back to Deliveries</Button>
            </Link>
          </div>
        </AppLayout>
      </>
    );
  }

  return (
    <>
      <Head title={`Edit Delivery - ${delivery.delivery_number}`} />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/deliveries">
                <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Edit Delivery</h1>
                <p className="text-sm text-slate-600 mt-1">Delivery #{delivery.delivery_number}</p>
              </div>
            </div>
            {isPending && (
              <button
                onClick={handleDelete}
                disabled={processing}
                className="flex items-center gap-2 px-3 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Order Type</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={data.delivery_type}
                  onChange={(e) => setData('delivery_type', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={!isPending}
                >
                  <option value="export">Export/Sales</option>
                  <option value="loan">Loan/Credit</option>
                  <option value="online_order">Online Order</option>
                </select>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Customer Name *</label>
                    <Input
                      placeholder="Enter customer name"
                      value={data.customer_name}
                      onChange={(e) => setData('customer_name', e.target.value)}
                      disabled={!isPending}
                      className={errors.customer_name ? 'border-red-500' : ''}
                    />
                    {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone *</label>
                    <Input
                      placeholder="Enter phone number"
                      value={data.phone}
                      onChange={(e) => setData('phone', e.target.value)}
                      disabled={!isPending}
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
                      disabled={!isPending}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Zone</label>
                    <select
                      value={data.delivery_zone}
                      onChange={(e) => setData('delivery_zone', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md disabled:opacity-50"
                      disabled={!isPending}
                    >
                      <option value="">Select zone</option>
                      <option value="city">City Center</option>
                      <option value="suburb">Suburbs</option>
                      <option value="rural">Rural Areas</option>
                      <option value="industrial">Industrial Zone</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Delivery Address *</label>
                  <textarea
                    placeholder="Enter full delivery address"
                    value={data.delivery_address}
                    onChange={(e) => setData('delivery_address', e.target.value)}
                    disabled={!isPending}
                    className={`w-full px-3 py-2 border rounded-md disabled:opacity-50 ${errors.delivery_address ? 'border-red-500' : ''}`}
                    rows={3}
                  />
                  {errors.delivery_address && <p className="text-red-500 text-xs mt-1">{errors.delivery_address}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Items to Deliver</CardTitle>
                    <CardDescription>Add or remove items for this delivery</CardDescription>
                  </div>
                  {isPending && (
                    <Button type="button" size="sm" variant="outline" onClick={handleAddItem} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Item
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">Item {index + 1}</h3>
                      {items.length > 1 && isPending && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Product Name *</label>
                        <Input
                          placeholder="Product name"
                          value={item.product_name}
                          onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                          disabled={!isPending}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Quantity *</label>
                        <Input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                          disabled={!isPending}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Unit Price *</label>
                        <Input
                          type="number"
                          placeholder="Price"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                          disabled={!isPending}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded text-sm text-right">
                      Item Total: TZS {(item.quantity * item.unit_price).toLocaleString()}
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No items added yet</p>
                    {isPending && (
                      <Button type="button" size="sm" variant="ghost" onClick={handleAddItem} className="mt-2">
                        Add First Item
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Costs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Delivery Costs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Cost *</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={data.delivery_cost}
                      onChange={(e) => setData('delivery_cost', parseFloat(e.target.value) || 0)}
                      disabled={!isPending}
                      className={errors.delivery_cost ? 'border-red-500' : ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Discount</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={data.delivery_discount}
                      onChange={(e) => setData('delivery_discount', parseFloat(e.target.value) || 0)}
                      disabled={!isPending}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Total</label>
                    <div className="px-3 py-2 bg-slate-100 rounded-md font-bold">
                      TZS {deliveryTotal.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span>Items Total:</span>
                    <span>TZS {totalItemsValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Delivery:</span>
                    <span>TZS {deliveryTotal.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Grand Total:</span>
                    <span>TZS {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment & Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Payment Method *</label>
                    <select
                      value={data.payment_method}
                      onChange={(e) => setData('payment_method', e.target.value)}
                      disabled={!isPending}
                      className="w-full px-3 py-2 border rounded-md disabled:opacity-50"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="mpesa">Mpesa</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Assign Driver</label>
                    <select
                      value={data.delivery_person_id}
                      onChange={(e) => setData('delivery_person_id', e.target.value)}
                      disabled={!isPending}
                      className="w-full px-3 py-2 border rounded-md disabled:opacity-50"
                    >
                      <option value="">Select driver</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} ({driver.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Priority</label>
                    <select
                      value={data.priority}
                      onChange={(e) => setData('priority', e.target.value)}
                      disabled={!isPending}
                      className="w-full px-3 py-2 border rounded-md disabled:opacity-50"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Scheduled Date</label>
                    <Input
                      type="datetime-local"
                      value={data.scheduled_date}
                      onChange={(e) => setData('scheduled_date', e.target.value)}
                      disabled={!isPending}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    placeholder="Add any special instructions or notes"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    disabled={!isPending}
                    className="w-full px-3 py-2 border rounded-md disabled:opacity-50"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            {isPending && (
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={processing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {processing ? 'Saving...' : 'Save Changes'}
                </Button>
                <Link href="/deliveries">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            )}
          </form>
        </div>
      </AppLayout>
    </>
  );
}
