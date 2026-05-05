import React, { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Package, Clock, Truck, CheckCircle } from 'lucide-react';

interface OrderItem {
    id: number;
    product_name: string;
    product_variation?: string;
    display_name?: string;
    price: number;
    quantity: number;
    discount: number;
    needs_vat: string;
    subtotal: number;
}

interface OnlineOrderDetailProps {
    unique_id: string;
    order_number: string;
    name: string;
    email: string;
    phone_number: string;
    status: string;
    is_checked: boolean;
    payment_method: string;
    payment_status: string;
    items: OrderItem[];
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    payable_amount: number;
    amount_paid: number;
    balance: number;
    created_at: string;
    notes?: string;
}

export default function OnlineOrderDetail({
    unique_id,
    order_number,
    name,
    email,
    phone_number,
    status,
    is_checked,
    payment_method,
    payment_status,
    items,
    subtotal,
    discount_amount,
    tax_amount,
    payable_amount,
    amount_paid: initialAmountPaid,
    balance: initialBalance,
    created_at,
    notes,
}: OnlineOrderDetailProps) {
    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [amountPaid, setAmountPaid] = useState(initialAmountPaid);
    const [editingPayment, setEditingPayment] = useState(false);
    const [tempAmountPaid, setTempAmountPaid] = useState(initialAmountPaid.toString());
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethodInput, setPaymentMethodInput] = useState(payment_method || 'Cash');
    const [savingPayment, setSavingPayment] = useState(false);
    const normalizedInitialDeliveryStatus = (() => {
        const raw = status?.toLowerCase() ?? 'pending';
        if (raw === 'approved') return 'confirmed';
        if (raw === 'complete' || raw === 'completed') return 'delivered';
        if (['pending', 'confirmed', 'processing', 'in_transit', 'delivered', 'rejected', 'cancelled'].includes(raw)) {
            return raw;
        }
        return 'pending';
    })();
    const [deliveryStatus, setDeliveryStatus] = useState(normalizedInitialDeliveryStatus);
    const [updatingDelivery, setUpdatingDelivery] = useState(false);
    const invoiceRef = useRef<HTMLDivElement>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    const balance = Math.max(0, payable_amount - amountPaid);
    const isPaid = amountPaid >= payable_amount - 1;

    const handleApprove = () => {
        setConfirmAction('approve');
        setShowConfirmDialog(true);
    };

    const handleRejectClick = () => {
        setShowRejectForm(true);
        setRejectReason('');
    };

    const handleReject = () => {
        if (!rejectReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }
        setConfirmAction('reject');
        setShowConfirmDialog(true);
    };

    const handleConfirmAction = async () => {
        if (confirmAction === 'approve') {
            setApproving(true);
            router.post(
                `/online-orders/${unique_id}/approve`,
                { 
                    amount_paid: amountPaid,
                    payment_date: paymentDate
                },
                {
                    onSuccess: () => {
                        setApproving(false);
                        setShowConfirmDialog(false);
                    },
                    onError: () => {
                        setApproving(false);
                        alert('Failed to approve order');
                    },
                }
            );
        } else if (confirmAction === 'reject') {
            setRejecting(true);
            router.post(
                `/online-orders/${unique_id}/reject`,
                { reason: rejectReason },
                {
                    onSuccess: () => {
                        setRejecting(false);
                        setShowConfirmDialog(false);
                        setShowRejectForm(false);
                    },
                    onError: () => {
                        setRejecting(false);
                        alert('Failed to reject order');
                    },
                }
            );
        }
    };

    const handleSavePayment = () => {
        const newAmount = parseFloat(tempAmountPaid);
        if (isNaN(newAmount) || newAmount < 0) {
            alert('Please enter a valid amount');
            return;
        }
        setSavingPayment(true);
        router.post(
            `/online-orders/${unique_id}/pay`,
            {
                amount_paid: newAmount,
                payment_method: paymentMethodInput,
                payment_date: paymentDate,
            },
            {
                onSuccess: () => {
                    setAmountPaid(newAmount);
                    setEditingPayment(false);
                    setSavingPayment(false);
                },
                onError: (errors) => {
                    setSavingPayment(false);
                    alert('Failed to save payment: ' + Object.values(errors).join(', '));
                },
            }
        );
    };

    const handleUpdateDelivery = (newStatus: string) => {
        if (newStatus === deliveryStatus) return;
        setUpdatingDelivery(true);
        router.post(
            `/online-orders/${unique_id}/delivery-status`,
            { status: newStatus },
            {
                onSuccess: () => {
                    setDeliveryStatus(newStatus);
                    setUpdatingDelivery(false);
                },
                onError: () => {
                    setUpdatingDelivery(false);
                    alert('Failed to update delivery status');
                },
            }
        );
    };

    const handlePrintInvoice = () => {
        const printWindow = window.open('', '', 'height=600,width=900');
        if (printWindow) {
            const printContent = invoiceRef.current?.innerHTML || '';
            printWindow.document.write(`
                <html>
                <head>
                    <title>Invoice - ${order_number}</title>
                    <style>
                        ${getInvoiceStyles()}
                    </style>
                </head>
                <body onload="window.print(); window.close();">
                    ${printContent}
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const handlePrintReceipt = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow) {
            const printContent = receiptRef.current?.innerHTML || '';
            printWindow.document.write(`
                <html>
                <head>
                    <title>Receipt - ${order_number}</title>
                    <style>
                        ${getReceiptStyles()}
                    </style>
                </head>
                <body onload="window.print(); window.close();">
                    ${printContent}
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const getInvoiceStyles = () => {
        return `
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .invoice { max-width: 900px; margin: 0 auto; background-color: white; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .invoice-header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 28px; font-weight: bold; color: #333; }
            .invoice-title { font-size: 20px; color: #666; margin-top: 10px; }
            .invoice-meta { display: flex; justify-content: space-between; margin: 30px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 15px 0; }
            .meta-item { flex: 1; }
            .meta-label { font-weight: bold; color: #666; font-size: 12px; }
            .meta-value { font-size: 14px; color: #333; margin-top: 5px; }
            .section-label { font-weight: bold; font-size: 14px; color: #333; margin-top: 20px; margin-bottom: 10px; }
            .section-content { font-size: 13px; color: #555; line-height: 1.8; }
            table { width: 100%; margin: 20px 0; border-collapse: collapse; }
            th { background-color: #f0f0f0; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #333; font-size: 13px; }
            td { padding: 12px; border-bottom: 1px solid #eee; font-size: 13px; }
            .text-right { text-align: right; }
            .totals-section { margin-top: 20px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .total-row-label { font-size: 13px; color: #555; }
            .total-row-value { font-size: 13px; color: #333; }
            .total-final { display: flex; justify-content: space-between; padding: 15px 0; border-top: 2px solid #333; border-bottom: 2px solid #333; font-weight: bold; font-size: 16px; }
            .notes { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 3px solid #007bff; font-size: 12px; color: #555; }
            @media print { body { background-color: white; } .invoice { box-shadow: none; } }
        `;
    };

    const getReceiptStyles = () => {
        return `
            body { font-family: 'Courier New', monospace; margin: 0; padding: 10px; }
            .receipt { width: 80mm; margin: 0 auto; }
            .receipt-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .receipt-title { font-size: 16px; font-weight: bold; }
            .receipt-subtitle { font-size: 12px; color: #666; }
            .receipt-section { margin: 15px 0; }
            .receipt-label { font-weight: bold; font-size: 11px; }
            .receipt-value { font-size: 11px; margin-left: 10px; }
            .receipt-items { margin: 15px 0; border-top: 1px solid #000; border-bottom: 2px solid #000; padding: 10px 0; }
            .receipt-item { display: flex; justify-content: space-between; font-size: 11px; margin: 5px 0; }
            .receipt-item-desc { flex: 1; }
            .receipt-item-price { text-align: right; }
            .receipt-total { display: flex; justify-content: space-between; font-weight: bold; margin: 10px 0; font-size: 12px; }
            .receipt-divider { border-bottom: 1px dashed #000; margin: 10px 0; }
            @media print { body { margin: 0; padding: 0; } .receipt { width: 80mm; } }
        `;
    };

    const isPending = status?.toLowerCase() === 'pending' || status?.toLowerCase() === 'rejected';
    const isApproved = is_checked || status?.toLowerCase() === 'confirmed' || status?.toLowerCase() === 'approved';
    const canTrackDelivery = !['rejected', 'cancelled'].includes(deliveryStatus);

    return (
        <AppLayout>
            <Head title={`Order ${order_number}`} />

            <div className="min-h-screen bg-slate-50 py-4 px-3 sm:px-4">
                <div className="max-w-full mx-auto">
                    {/* Header with Action Buttons */}
                    <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-medium text-slate-900">Order Details</h1>
                            <p className="text-sm text-slate-500 mt-1">Order #{order_number}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            {/* Approval Buttons - Only show when pending */}
                            {isPending && (
                                <>
                                    {!showRejectForm ? (
                                        <>
                                            <button
                                                onClick={handleApprove}
                                                disabled={approving}
                                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
                                            >
                                                {approving ? (
                                                    <>
                                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                        Approving...
                                                    </>
                                                ) : (
                                                    <>✓ Approve</>
                                                )}
                                            </button>
                                            <button
                                                onClick={handleRejectClick}
                                                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm hover:shadow-md"
                                            >
                                                ✗ Reject
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setShowRejectForm(false)}
                                                className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-900 font-semibold text-sm rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                            <button
                                onClick={() => window.history.back()}
                                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-sm rounded-lg transition-colors"
                            >
                                ← Back
                            </button>
                        </div>
                    </div>

                    {/* Reject Form - Show as modal-like section when active */}
                    {showRejectForm && isPending && (
                        <div className="bg-white border-2 border-rose-200 rounded-lg p-4 mb-6 space-y-3">
                            <p className="text-sm font-semibold text-slate-900">Why are you rejecting this order?</p>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Provide a reason for rejection..."
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                                rows={3}
                            />
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={handleReject}
                                    disabled={rejecting}
                                    className="px-6 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-semibold text-sm rounded-lg transition-colors"
                                >
                                    {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Status Banners */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                        <div className={`p-4 rounded-lg border transition-all ${status?.toLowerCase() === 'pending' ? 'bg-amber-50 border-amber-200' : status?.toLowerCase() === 'confirmed' ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200'}`}>
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Order Status</p>
                            <p className={`text-lg font-medium capitalize mt-1 ${status?.toLowerCase() === 'pending' ? 'text-amber-700' : status?.toLowerCase() === 'confirmed' ? 'text-blue-700' : 'text-emerald-700'}`}>
                                {status}
                            </p>
                        </div>
                        <div className={`p-4 rounded-lg border transition-all ${payment_status === 'Paid' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Payment Status</p>
                            <p className={`text-lg font-medium capitalize mt-1 ${payment_status === 'Paid' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {payment_status}
                            </p>
                        </div>
                        <div className={`p-4 rounded-lg border transition-all ${isApproved ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Verification</p>
                            <p className={`text-lg font-medium mt-1 ${isApproved ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {isApproved ? '✓ Verified' : 'Pending'}
                            </p>
                        </div>
                    </div>

                    {/* APPROVAL SECTION REMOVED - Now in header */}

                    {/* Delivery Pipeline */}
                    {canTrackDelivery && (() => {
                        const deliverySteps = [
                            { key: 'pending', label: 'Pending', icon: Package, desc: 'Order received' },
                            { key: 'confirmed', label: 'Confirmed', icon: Package, desc: 'Order verified' },
                            { key: 'processing', label: 'Processing', icon: Clock, desc: 'Being prepared' },
                            { key: 'in_transit', label: 'In Transit', icon: Truck, desc: 'On the way' },
                            { key: 'delivered', label: 'Delivered', icon: CheckCircle, desc: 'Completed' },
                        ];
                        const statusOrder = ['pending', 'confirmed', 'processing', 'in_transit', 'delivered'];
                        const currentIdx = Math.max(0, statusOrder.indexOf(deliveryStatus));

                        return (
                            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm mb-6">
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-900">Delivery Pipeline</h2>
                                        <p className="text-xs text-slate-500 mt-0.5">Click a stage to advance the order</p>
                                    </div>
                                    {updatingDelivery && (
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <div className="animate-spin h-3.5 w-3.5 border-2 border-slate-400 border-t-transparent rounded-full" />
                                            Updating…
                                        </div>
                                    )}
                                </div>
                                <div className="relative flex justify-between items-start">
                                    {/* Progress bar */}
                                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-100 -z-0">
                                        <div
                                            className="h-full bg-amber-400 transition-all duration-500"
                                            style={{ width: `${(currentIdx / (deliverySteps.length - 1)) * 100}%` }}
                                        />
                                    </div>
                                    {deliverySteps.map((step, idx) => {
                                        const Icon = step.icon;
                                        const isCompleted = idx < currentIdx;
                                        const isCurrent = idx === currentIdx;
                                        const isClickable = idx > currentIdx && idx === currentIdx + 1;

                                        return (
                                            <div
                                                key={step.key}
                                                className={`relative z-10 flex flex-col items-center gap-2 text-center w-[20%] ${isClickable && !updatingDelivery ? 'cursor-pointer group' : 'cursor-default'}`}
                                                onClick={() => isClickable && !updatingDelivery && handleUpdateDelivery(step.key)}
                                                title={isClickable ? `Advance to ${step.label}` : undefined}
                                            >
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all
                                                    ${isCompleted ? 'bg-emerald-400 text-white' : isCurrent ? 'bg-amber-400 text-slate-900' : isClickable ? 'bg-white border-2 border-dashed border-amber-300 text-amber-400 group-hover:bg-amber-50' : 'bg-white border-2 border-slate-200 text-slate-300'}`}
                                                >
                                                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-bold tracking-tight ${isCompleted ? 'text-emerald-700' : isCurrent ? 'text-slate-900' : isClickable ? 'text-amber-600' : 'text-slate-400'}`}>
                                                        {step.label}
                                                    </p>
                                                    <p className={`text-[10px] ${isCompleted ? 'text-emerald-400' : isCurrent ? 'text-slate-500' : 'text-slate-300'}`}>
                                                        {step.desc}
                                                    </p>
                                                    {isClickable && (
                                                        <p className="text-[9px] text-amber-500 font-bold uppercase tracking-wide mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            Click to advance
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Customer Information */}
                            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                                <h2 className="text-lg font-medium text-slate-900 mb-4">Customer Information</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Name</p>
                                        <p className="font-semibold text-sm text-slate-900 mt-1">{name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Email</p>
                                        <p className="font-semibold text-sm text-slate-900 mt-1 break-all">{email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Phone</p>
                                        <p className="font-semibold text-sm text-slate-900 mt-1">{phone_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Payment Method</p>
                                        <p className="font-semibold text-sm text-slate-900 mt-1 capitalize">{paymentMethodInput}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Order Date</p>
                                        <p className="font-semibold text-sm text-slate-900 mt-1">
                                            {new Date(created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-5 py-4 border-b border-blue-200">
                                    <h2 className="text-lg font-medium text-slate-900">Order Items</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-100 border-b border-slate-200">
                                                <th className="px-5 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wide">
                                                    Product
                                                </th>
                                                <th className="px-5 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wide">
                                                    Price
                                                </th>
                                                <th className="px-5 py-3 text-center text-xs font-medium text-slate-700 uppercase tracking-wide">
                                                    Qty
                                                </th>
                                                <th className="px-5 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wide">
                                                    Discount
                                                </th>
                                                <th className="px-5 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wide">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {items.map((item, index) => (
                                                <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-5 py-3 text-sm text-slate-900">
                                                        <div className="font-semibold">{item.display_name || item.product_name}</div>
                                                        {item.product_variation && (
                                                            <div className="text-xs text-blue-600 mt-1">
                                                                Variation: {item.product_variation}
                                                            </div>
                                                        )}
                                                        {item.needs_vat === 'Yes' && (
                                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mt-1 inline-block font-semibold">
                                                                Taxable
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-sm text-right text-slate-900 font-medium">
                                                        {parseFloat(item.price.toString()).toLocaleString('en-US', {
                                                            style: 'currency',
                                                            currency: 'TZS',
                                                        })}
                                                    </td>
                                                    <td className="px-5 py-3 text-sm text-center text-slate-900 font-medium">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-5 py-3 text-sm text-right text-slate-900 font-medium">
                                                        {item.discount > 0 ? (
                                                            <span className="text-emerald-600">{parseFloat(item.discount.toString()).toLocaleString('en-US', {
                                                                style: 'currency',
                                                                currency: 'TZS',
                                                            })}</span>
                                                        ) : (
                                                            <span className="text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-sm text-right font-medium text-slate-900">
                                                        {parseFloat(item.subtotal.toString()).toLocaleString('en-US', {
                                                            style: 'currency',
                                                            currency: 'TZS',
                                                        })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Notes */}
                            {notes && (
                                <div className="bg-white rounded shadow-sm p-3">
                                    <h2 className="text-lg font-medium text-gray-900 mb-2">Notes</h2>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-4">
                            {/* Financial Summary */}
                            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                                <h2 className="text-lg font-medium text-slate-900 mb-4">Financial Summary</h2>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 font-medium">Subtotal:</span>
                                        <span className="font-semibold text-slate-900">
                                            {parseFloat(subtotal.toString()).toLocaleString('en-US', {
                                                style: 'currency',
                                                currency: 'TZS',
                                            })}
                                        </span>
                                    </div>
                                    {discount_amount > 0 && (
                                        <div className="flex justify-between text-emerald-600">
                                            <span className="font-medium">Discount:</span>
                                            <span className="font-semibold">
                                                -{parseFloat(discount_amount.toString()).toLocaleString('en-US', {
                                                    style: 'currency',
                                                    currency: 'TZS',
                                                })}
                                            </span>
                                        </div>
                                    )}
                                    {tax_amount > 0 && (
                                        <div className="flex justify-between text-blue-600">
                                            <span className="font-medium">Tax (18%):</span>
                                            <span className="font-semibold">
                                                {parseFloat(tax_amount.toString()).toLocaleString('en-US', {
                                                    style: 'currency',
                                                    currency: 'TZS',
                                                })}
                                            </span>
                                        </div>
                                    )}
                                    <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-medium text-blue-600">
                                        <span>Total Payable:</span>
                                        <span>
                                            {parseFloat(payable_amount.toString()).toLocaleString('en-US', {
                                                style: 'currency',
                                                currency: 'TZS',
                                            })}
                                        </span>
                                    </div>

                                    {/* Payment Editing */}
                                    {!editingPayment ? (
                                        <div className="border-t border-slate-200 pt-3">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-slate-600 font-medium text-sm">Payment Method:</span>
                                                <span className="font-semibold text-slate-800 text-sm capitalize">{payment_method}</span>
                                            </div>
                                            <div className="flex justify-between mb-3">
                                                <span className="text-slate-600 font-medium text-sm">Amount Paid:</span>
                                                <span className="font-semibold text-emerald-600 text-sm">
                                                    {parseFloat(amountPaid.toString()).toLocaleString('en-US', {
                                                        style: 'currency',
                                                        currency: 'TZS',
                                                    })}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setEditingPayment(true);
                                                    setTempAmountPaid(amountPaid.toString());
                                                }}
                                                className="w-full text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg transition font-semibold"
                                            >
                                                Record / Edit Payment
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="border-t border-slate-200 pt-3 space-y-3">
                                            {/* Context: what's owed and what's already paid */}
                                            <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600">Total Payable</span>
                                                    <span className="font-medium text-slate-900">
                                                        {parseFloat(payable_amount.toString()).toLocaleString('en-US', { style: 'currency', currency: 'TZS' })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600">Previously Paid</span>
                                                    <span className="font-medium text-emerald-700">
                                                        {parseFloat(amountPaid.toString()).toLocaleString('en-US', { style: 'currency', currency: 'TZS' })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between border-t border-slate-200 pt-1">
                                                    <span className="text-slate-600">Remaining Balance</span>
                                                    <span className="font-medium text-rose-700">
                                                        {parseFloat(balance.toString()).toLocaleString('en-US', { style: 'currency', currency: 'TZS' })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Payment method */}
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                                                <select
                                                    value={paymentMethodInput}
                                                    onChange={(e) => setPaymentMethodInput(e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                                >
                                                    <option value="Cash">Cash</option>
                                                    <option value="Bank Transfer">Bank Transfer</option>
                                                    <option value="Mobile Money">Mobile Money</option>
                                                    <option value="Credit Card">Credit Card</option>
                                                    <option value="Online">Online</option>
                                                </select>
                                            </div>

                                            {/* Amount being paid */}
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Paid (TZS)</label>
                                                <input
                                                    type="number"
                                                    value={tempAmountPaid}
                                                    onChange={(e) => setTempAmountPaid(e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Enter amount paid"
                                                    min="0"
                                                />
                                                {/* Live new balance preview */}
                                                {tempAmountPaid && !isNaN(parseFloat(tempAmountPaid)) && (
                                                    <p className="text-xs mt-1 text-slate-500">
                                                        New balance: <span className={parseFloat(tempAmountPaid) >= payable_amount ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                                                            {Math.max(0, payable_amount - parseFloat(tempAmountPaid)).toLocaleString('en-US', { style: 'currency', currency: 'TZS' })}
                                                        </span>
                                                    </p>
                                                )}
                                            </div>

                                            {/* Payment date */}
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date</label>
                                                <input
                                                    type="date"
                                                    value={paymentDate}
                                                    onChange={(e) => setPaymentDate(e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingPayment(false)}
                                                    className="flex-1 text-sm bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-2 rounded-lg transition font-semibold"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSavePayment}
                                                    disabled={savingPayment}
                                                    className="flex-1 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-3 py-2 rounded-lg transition font-semibold flex items-center justify-center gap-1"
                                                >
                                                    {savingPayment ? (
                                                        <>
                                                            <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></div>
                                                            Saving...
                                                        </>
                                                    ) : 'Save Payment'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Balance */}
                                    <div className={`rounded-lg p-4 text-center border-2 transition-all ${isPaid ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300'}`}>
                                        <p className={`text-xs font-medium uppercase tracking-wide ${isPaid ? 'text-emerald-700' : 'text-rose-700'}`}>
                                            {isPaid ? '✓ Fully Paid' : 'Balance Due'}
                                        </p>
                                        <p className={`text-2xl font-medium mt-2 ${isPaid ? 'text-emerald-800' : 'text-rose-800'}`}>
                                            {parseFloat(balance.toString()).toLocaleString('en-US', {
                                                style: 'currency',
                                                currency: 'TZS',
                                            })}
                                        </p>
                                        {!isPaid && (
                                            <p className="text-xs text-slate-600 mt-2">
                                                <span className="font-semibold">Payment Date:</span> {paymentDate}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Print Options - Always visible for approved orders */}
                            {isApproved && (
                                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <h2 className="text-lg font-medium text-slate-900 mb-4">Print Documents</h2>
                                    <div className="space-y-3">
                                        <button
                                            onClick={handlePrintInvoice}
                                            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm hover:shadow-md"
                                        >
                                            📄 Print Invoice
                                        </button>
                                        <button
                                            onClick={handlePrintReceipt}
                                            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm hover:shadow-md"
                                        >
                                            🖨 Print Receipt
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Invoice for Printing */}
            <div ref={invoiceRef} style={{ display: 'none' }}>
                <div className="invoice">
                    <div className="invoice-header">
                        <div className="company-name">HD GLOBAL GROUP LTD.</div>
                        <div className="invoice-title">INVOICE</div>
                    </div>

                    <div className="invoice-meta">
                        <div className="meta-item">
                            <div className="meta-label">INVOICE NO.</div>
                            <div className="meta-value">{order_number}</div>
                        </div>
                        <div className="meta-item">
                            <div className="meta-label">INVOICE DATE</div>
                            <div className="meta-value">{new Date(created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="meta-item">
                            <div className="meta-label">PAYMENT DATE</div>
                            <div className="meta-value">{paymentDate}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '40px', margin: '30px 0' }}>
                        <div>
                            <div className="section-label">BILL TO:</div>
                            <div className="section-content">
                                <strong>{name}</strong><br />
                                Email: {email}<br />
                                Phone: {phone_number}<br />
                                Payment Method: {payment_method}
                            </div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th className="text-right">Unit Price</th>
                                <th className="text-right">Qty</th>
                                <th className="text-right">Discount</th>
                                <th className="text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        <strong>{item.display_name || item.product_name}</strong>
                                        {item.product_variation && <div style={{ fontSize: '11px', color: '#666' }}>Var: {item.product_variation}</div>}
                                    </td>
                                    <td className="text-right">
                                        {parseFloat(item.price.toString()).toLocaleString('en-US', {
                                            style: 'currency',
                                            currency: 'TZS',
                                        })}
                                    </td>
                                    <td className="text-right">{item.quantity}</td>
                                    <td className="text-right">
                                        {item.discount > 0 ? (
                                            parseFloat(item.discount.toString()).toLocaleString('en-US', {
                                                style: 'currency',
                                                currency: 'TZS',
                                            })
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="text-right" style={{ fontWeight: 'bold' }}>
                                        {parseFloat(item.subtotal.toString()).toLocaleString('en-US', {
                                            style: 'currency',
                                            currency: 'TZS',
                                        })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="totals-section">
                        <div className="total-row">
                            <span className="total-row-label">Subtotal:</span>
                            <span className="total-row-value">
                                {parseFloat(subtotal.toString()).toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'TZS',
                                })}
                            </span>
                        </div>
                        {discount_amount > 0 && (
                            <div className="total-row">
                                <span className="total-row-label">Discount:</span>
                                <span className="total-row-value">
                                    -{parseFloat(discount_amount.toString()).toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: 'TZS',
                                    })}
                                </span>
                            </div>
                        )}
                        {tax_amount > 0 && (
                            <div className="total-row">
                                <span className="total-row-label">Tax (18%):</span>
                                <span className="total-row-value">
                                    {parseFloat(tax_amount.toString()).toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: 'TZS',
                                    })}
                                </span>
                            </div>
                        )}
                        <div className="total-final">
                            <span>TOTAL DUE:</span>
                            <span>
                                {parseFloat(payable_amount.toString()).toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'TZS',
                                })}
                            </span>
                        </div>
                        <div className="total-row">
                            <span className="total-row-label" style={{ fontWeight: 'bold' }}>Amount Paid:</span>
                            <span className="total-row-value" style={{ fontWeight: 'bold', color: '#28a745' }}>
                                {parseFloat(amountPaid.toString()).toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'TZS',
                                })}
                            </span>
                        </div>
                        {balance > 0 && (
                            <div className="total-row" style={{ borderTop: '2px solid #dc3545', paddingTop: '10px' }}>
                                <span className="total-row-label" style={{ fontWeight: 'bold', color: '#dc3545' }}>Outstanding Balance:</span>
                                <span className="total-row-value" style={{ fontWeight: 'bold', color: '#dc3545' }}>
                                    {parseFloat(balance.toString()).toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: 'TZS',
                                    })}
                                </span>
                            </div>
                        )}
                    </div>

                    {notes && (
                        <div className="notes">
                            <strong>Notes:</strong> {notes}
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden Receipt for Printing */}
            <div ref={receiptRef} style={{ display: 'none' }}>
                <div className="receipt">
                    <div className="receipt-header">
                        <div className="receipt-title">HD GLOBAL GROUP LTD.</div>
                        <div className="receipt-subtitle">RECEIPT</div>
                    </div>

                    <div className="receipt-section">
                        <div className="receipt-label">Receipt #: {order_number}</div>
                        <div className="receipt-value">Date: {new Date(created_at).toLocaleDateString()}</div>
                        <div className="receipt-value">Payment Date: {paymentDate}</div>
                    </div>

                    <div className="receipt-divider"></div>

                    <div className="receipt-section">
                        <div className="receipt-label">CUSTOMER</div>
                        <div className="receipt-value">Name: {name}</div>
                        <div className="receipt-value">Phone: {phone_number}</div>
                        <div className="receipt-value">Email: {email}</div>
                    </div>

                    <div className="receipt-divider"></div>

                    <div className="receipt-items">
                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>═══════════════════════════</div>
                        {items.map((item, index) => (
                            <div key={index}>
                                <div className="receipt-item">
                                    <div className="receipt-item-desc">
                                        <div>{item.display_name || item.product_name}</div>
                                        {item.product_variation && (
                                            <div style={{ fontSize: '9px' }}>Var: {item.product_variation}</div>
                                        )}
                                    </div>
                                    <div className="receipt-item-price">
                                        {item.quantity} x {parseFloat(item.price.toString()).toLocaleString('en-US', {
                                            style: 'currency',
                                            currency: 'TZS',
                                        })}
                                    </div>
                                </div>
                                {item.discount > 0 && (
                                    <div className="receipt-item" style={{ marginLeft: '10px' }}>
                                        <div className="receipt-item-desc">Discount:</div>
                                        <div className="receipt-item-price">
                                            -{parseFloat(item.discount.toString()).toLocaleString('en-US', {
                                                style: 'currency',
                                                currency: 'TZS',
                                            })}
                                        </div>
                                    </div>
                                )}
                                <div className="receipt-item">
                                    <div className="receipt-item-desc"></div>
                                    <div className="receipt-item-price">
                                        {parseFloat(item.subtotal.toString()).toLocaleString('en-US', {
                                            style: 'currency',
                                            currency: 'TZS',
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div style={{ fontWeight: 'bold', marginTop: '8px' }}>═══════════════════════════</div>
                    </div>

                    <div className="receipt-total">
                        <span>Subtotal:</span>
                        <span>
                            {parseFloat(subtotal.toString()).toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'TZS',
                            })}
                        </span>
                    </div>

                    {discount_amount > 0 && (
                        <div className="receipt-total">
                            <span>Discount:</span>
                            <span>
                                -{parseFloat(discount_amount.toString()).toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'TZS',
                                })}
                            </span>
                        </div>
                    )}

                    {tax_amount > 0 && (
                        <div className="receipt-total">
                            <span>Tax (18%):</span>
                            <span>
                                {parseFloat(tax_amount.toString()).toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'TZS',
                                })}
                            </span>
                        </div>
                    )}

                    <div style={{ fontWeight: 'bold', fontSize: '14px', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '10px 0', textAlign: 'center', margin: '10px 0' }}>
                        TOTAL: {parseFloat(payable_amount.toString()).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'TZS',
                        })}
                    </div>

                    <div className="receipt-total">
                        <span>Amount Paid:</span>
                        <span>
                            {parseFloat(amountPaid.toString()).toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'TZS',
                            })}
                        </span>
                    </div>

                    {balance > 0 && (
                        <div className="receipt-total">
                            <span>Balance Due:</span>
                            <span>
                                {parseFloat(balance.toString()).toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'TZS',
                                })}
                            </span>
                        </div>
                    )}

                    <div className="receipt-divider"></div>
                    <div style={{ textAlign: 'center', fontSize: '12px', marginTop: '10px' }}>
                        <div>Thank you for your business!</div>
                        <div style={{ marginTop: '5px' }}>Date Paid: {paymentDate}</div>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showConfirmDialog}
                title={confirmAction === 'approve' ? 'Approve Order?' : 'Reject Order?'}
                message={
                    confirmAction === 'approve'
                        ? `Approve order #${order_number}? Amount: ${parseFloat(amountPaid.toString()).toLocaleString('en-US', { style: 'currency', currency: 'TZS' })}`
                        : `Reject order #${order_number}?`
                }
                confirmText={confirmAction === 'approve' ? 'Approve' : 'Reject'}
                confirmColor={confirmAction === 'approve' ? 'green' : 'red'}
                onConfirm={handleConfirmAction}
                onCancel={() => setShowConfirmDialog(false)}
                isLoading={approving || rejecting}
            />
        </AppLayout>
    );
}
