import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, X } from 'lucide-react';
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

interface DeliveryCreateProps {
  drivers: Driver[];
  orderType: string;
  order: any;
}

export default function DeliveryCreate({ drivers, orderType, order }: DeliveryCreateProps) {
  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Logistics', href: '/logistics' },
    { title: 'Deliveries', href: '/deliveries' },
    { title: 'Create', href: '#' }
  ];

  const [items, setItems] = useState<any[]>(order ? [{
    item_id: order.id || order.unique_id,
    product_name: order.product_name || order.product || 'Order Item',
    quantity: 1,
    unit_price: order.total_price || order.total_amount || 0,
  }] : []);

  const { data, setData, post, processing, errors } = useForm({
    delivery_type: orderType || 'export',
    customer_name: order?.customer_name || '',
    phone: order?.phone || '',
    email: order?.email || '',
    delivery_address: order?.delivery_address || '',
    delivery_zone: '',
    delivery_cost: '',
    delivery_discount: '',
    payment_method: 'cash',
    delivery_person_id: '',
    priority: 'normal',
    scheduled_date: '',
    notes: '',
    items: items,
  });

  const handleAddItem = () => {
    setItems([...items, {
      item_id: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
    }]);
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
    post('/deliveries', {
      onSuccess: () => {},
      onError: () => {},
    });
  };

  const totalItemsValue = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const deliveryCost = parseFloat(data.delivery_cost) || 0;
  const deliveryDiscount = parseFloat(data.delivery_discount) || 0;
  const deliveryTotal = deliveryCost - deliveryDiscount;
  const grandTotal = totalItemsValue + deliveryTotal;

  return (
    <>
      <Head title="Create Delivery" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/deliveries">
              <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Create Delivery</h1>
              <p className="text-sm text-slate-600 mt-1">Register a new delivery order</p>
            </div>
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
                    <label className="block text-sm font-medium mb-2">Delivery Zone</label>
                    <select
                      value={data.delivery_zone}
                      onChange={(e) => setData('delivery_zone', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
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
                    className={`w-full px-3 py-2 border rounded-md ${errors.delivery_address ? 'border-red-500' : ''}`}
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
                    <CardDescription>Add items for this delivery</CardDescription>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddItem} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">Item {index + 1}</h3>
                      {items.length > 1 && (
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
                    <Button type="button" size="sm" variant="ghost" onClick={handleAddItem} className="mt-2">
                      Add First Item
                    </Button>
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
                      onChange={(e) => setData('delivery_cost', e.target.value)}
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
                      onChange={(e) => setData('delivery_discount', e.target.value)}
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
                      className="w-full px-3 py-2 border rounded-md"
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
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Unassigned (assign later)</option>
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
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>
                  {data.priority === 'scheduled' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Scheduled Date</label>
                      <Input
                        type="datetime-local"
                        value={data.scheduled_date}
                        onChange={(e) => setData('scheduled_date', e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    placeholder="Add any special instructions or notes"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button type="submit" disabled={processing} className="flex-1">
                {processing ? 'Creating...' : 'Create Delivery'}
              </Button>
              <Link href="/deliveries">
                <Button type="button" variant="outline" className="flex-1">
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
