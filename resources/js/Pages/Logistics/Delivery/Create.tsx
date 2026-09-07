import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    post('/deliveries');
  };

  const totalItemsValue = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const deliveryCost = parseFloat(data.delivery_cost) || 0;
  const deliveryDiscount = parseFloat(data.delivery_discount) || 0;
  const deliveryTotal = deliveryCost - deliveryDiscount;
  const grandTotal = totalItemsValue + deliveryTotal;

  const labelClass = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block";
  const inputClass = "w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50/50 focus:bg-white transition-all h-10 shadow-none";
  const selectClass = "w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50/50 focus:bg-white transition-all h-10 shadow-none cursor-pointer";

  return (
    <>
      <Head title="Create Delivery" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="max-w-[1700px] mx-auto space-y-6 pb-20">
          
          {/* Header */}
          <div className="flex items-center gap-3">
            <Link href="/deliveries" className="h-9 w-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 shadow-sm transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Create Delivery</h1>
              <p className="text-xs font-medium text-slate-500 mt-1.5">Register a new delivery order</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Order Type */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-bold text-slate-800">Order Type</CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <select
                  value={data.delivery_type}
                  onChange={(e) => setData('delivery_type', e.target.value)}
                  className={selectClass}
                >
                  <option value="export">Export / Sales</option>
                  <option value="loan">Loan / Credit</option>
                  <option value="online_order">Online Order</option>
                </select>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-bold text-slate-800">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Customer Name *</label>
                    <Input
                      placeholder="Enter customer name"
                      value={data.customer_name}
                      onChange={(e) => setData('customer_name', e.target.value)}
                      className={`${inputClass} ${errors.customer_name ? 'border-red-500' : ''}`}
                    />
                    {errors.customer_name && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.customer_name}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Phone *</label>
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
                    <label className={labelClass}>Delivery Zone</label>
                    <select
                      value={data.delivery_zone}
                      onChange={(e) => setData('delivery_zone', e.target.value)}
                      className={selectClass}
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
                  <label className={labelClass}>Delivery Address *</label>
                  <textarea
                    placeholder="Enter full delivery address"
                    value={data.delivery_address}
                    onChange={(e) => setData('delivery_address', e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50/50 focus:bg-white transition-all min-h-[80px] ${errors.delivery_address ? 'border-red-500' : ''}`}
                    rows={3}
                  />
                  {errors.delivery_address && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.delivery_address}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Items */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800">Items to Deliver</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Add items for this delivery</CardDescription>
                </div>
                <button 
                  type="button" 
                  onClick={handleAddItem}
                  className="rounded-xl gap-2 text-xs font-semibold h-9 px-4 bg-white border border-slate-200 text-slate-700 shadow-sm flex items-center hover:bg-slate-50 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border border-slate-150 rounded-xl p-4 space-y-4 bg-slate-50/20">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <h3 className="text-xs font-bold text-slate-800">Item {index + 1}</h3>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>Product Name *</label>
                        <Input
                          placeholder="Product name"
                          value={item.product_name}
                          onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Quantity *</label>
                        <Input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Unit Price *</label>
                        <Input
                          type="number"
                          placeholder="Price"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-100/50 border border-slate-100 p-2.5 rounded-lg text-xs font-bold text-slate-700 text-right">
                      Item Total: TZS {(item.quantity * item.unit_price).toLocaleString()}
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-xs font-bold text-slate-400">No items added yet</p>
                    <button 
                      type="button" 
                      onClick={handleAddItem}
                      className="rounded-xl gap-2 text-xs font-semibold h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center transition-all mt-3 mx-auto"
                    >
                      Add First Item
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Costs */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-bold text-slate-800">Delivery Costs</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Delivery Cost *</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={data.delivery_cost}
                      onChange={(e) => setData('delivery_cost', e.target.value)}
                      className={`${inputClass} ${errors.delivery_cost ? 'border-red-500' : ''}`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Delivery Discount</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={data.delivery_discount}
                      onChange={(e) => setData('delivery_discount', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Delivery Total</label>
                    <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-150 rounded-xl font-bold text-sm h-10 flex items-center text-slate-800">
                      TZS {deliveryTotal.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl text-xs font-semibold text-slate-600 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span>Items Total:</span>
                    <span className="font-bold text-slate-800">TZS {totalItemsValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Delivery Charge:</span>
                    <span className="font-bold text-slate-800">TZS {deliveryTotal.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-blue-100 pt-3 flex justify-between items-center font-extrabold text-base text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-blue-700">TZS {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment & Assignment */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-sm font-bold text-slate-800">Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Payment Method *</label>
                    <select
                      value={data.payment_method}
                      onChange={(e) => setData('payment_method', e.target.value)}
                      className={selectClass}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="mpesa">Mpesa</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Assign Driver</label>
                    <select
                      value={data.delivery_person_id}
                      onChange={(e) => setData('delivery_person_id', e.target.value)}
                      className={selectClass}
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
                    <label className={labelClass}>Priority</label>
                    <select
                      value={data.priority}
                      onChange={(e) => setData('priority', e.target.value)}
                      className={selectClass}
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>
                  {data.priority === 'scheduled' && (
                    <div>
                      <label className={labelClass}>Scheduled Date</label>
                      <Input
                        type="datetime-local"
                        value={data.scheduled_date}
                        onChange={(e) => setData('scheduled_date', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Notes</label>
                  <textarea
                    placeholder="Add any special instructions or notes"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50/50 focus:bg-white transition-all min-h-[80px]"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Link href="/deliveries">
                <button type="button" className="h-9 px-4 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-650 transition-all">
                  Cancel
                </button>
              </Link>
              <button 
                type="submit" 
                disabled={processing}
                className="rounded-xl h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Creating...' : 'Create Delivery'}
              </button>
            </div>
          </form>
        </div>
      </AppLayout>
    </>
  );
}
