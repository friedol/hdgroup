<x-mail::message>
# Order Confirmation

Thank you for your order!

**Order Number:** {{ $order['order_number'] }}  
**Order Date:** {{ date('Y-m-d H:i', strtotime($order['created_at'])) }}  
**Status:** {{ $order['status'] }}

## Order Items
<x-mail::table>
| Product | Qty | Unit | Price | Subtotal |
| :--- | :---: | :---: | :--- | :--- |
@foreach($order['items'] as $item)
| {{ $item['product_name'] }} | {{ $item['quantity'] }} | {{ $item['unit'] }} | {{ number_format($item['price']) }} TSH | {{ number_format($item['subtotal']) }} TSH |
@endforeach
</x-mail::table>

**Subtotal:** {{ number_format($order['subtotal']) }} TSH  
@if(!empty($order['promo_discount']) && $order['promo_discount'] > 0)
**Promo Discount:** -{{ number_format($order['promo_discount']) }} TSH  
@endif
**Tax (18%):** {{ number_format($order['tax']) }} TSH  
**Shipping:** {{ number_format($order['shipping_cost']) }} TSH  
**Total Amount:** **{{ number_format($order['total_amount']) }} TSH**

Thanks,  
HD GLOBAL GROUP LTD.
</x-mail::message>
