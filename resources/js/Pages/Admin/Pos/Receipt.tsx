import { Head } from '@inertiajs/react';
import React, { useEffect } from 'react';

interface ReceiptProps {
  sale: {
    invoice: string;
    total: number;
    discount: number;
    tax: number;
    payable: number;
    paid: number;
    balance: number;
    status: string;
    method: string;
    date: string;
    time: string;
    customer: string;
    cashier: string;
    items: Array<{
      name: string;
      qty: number;
      price: number;
      subtotal: number;
      dimension?: string | null;
    }>;
  };
  company: {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  branch: {
    name?: string | null;
    label?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  };
}

export default function Receipt({ sale, company, branch }: ReceiptProps) {
  const printedAt = new Date().toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const trackingUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://hdgroup.co.tz'}/order/track`;

  useEffect(() => {
    window.print();
  }, []);

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <>
      <Head title={`Receipt - ${sale.invoice}`} />

      <div className="receipt">

        {/* Header */}
        <div className="header">
          <div className="shop-name">{company.name}</div>
          {branch.label && <div className="shop-address">{branch.label}</div>}
          {(branch.address || company.address) && (
            <div className="shop-address">{branch.address ?? company.address}</div>
          )}
          {(branch.phone || company.phone) && (
            <div className="shop-contact">Tel: {branch.phone ?? company.phone}</div>
          )}
          {(branch.email || company.email) && (
            <div className="shop-contact">{branch.email ?? company.email}</div>
          )}
        </div>

        {/* Receipt Title */}
        <div className="receipt-title">Sales Receipt</div>

        {/* Receipt Information */}
        <div className="receipt-info">
          <div className="info-row">
            <span className="info-label">Receipt No:</span>
            <span>{sale.invoice}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Date:</span>
            <span>{sale.date}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Time:</span>
            <span>{sale.time}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Cashier:</span>
            <span>{sale.cashier}</span>
          </div>
          {branch.name && (
            <div className="info-row">
              <span className="info-label">Store:</span>
              <span>{branch.name}</span>
            </div>
          )}
        </div>

        {/* Customer Information */}
        {sale.customer && (
          <div className="customer-info">
            <div className="customer-name">{sale.customer}</div>
          </div>
        )}

        {/* Items Header */}
        <div className="items-header">
          <div className="items-header-row">
            <div className="item-name-col">Item</div>
            <div className="item-qty-col">Qty</div>
            <div className="item-price-col">Amount</div>
          </div>
        </div>

        {/* Items */}
        {sale.items.map((item, idx) => (
          <div key={idx} className="item-row">
            <div className="item-name">
              {item.name}
              {item.dimension && (
                <div className="item-dimension">{item.dimension}</div>
              )}
            </div>
            <div className="item-qty">{fmt(item.qty)}</div>
            <div className="item-price">TSh {fmt(item.subtotal)}</div>
          </div>
        ))}

        {/* Totals */}
        <div className="totals">
          <div className="total-row">
            <span className="total-label">Subtotal:</span>
            <span className="total-value">TSh {fmt(sale.total)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="total-row">
              <span className="total-label">Discount:</span>
              <span className="total-value">-TSh {fmt(sale.discount)}</span>
            </div>
          )}
          {sale.tax > 0 && (
            <div className="total-row">
              <span className="total-label">Tax:</span>
              <span className="total-value">TSh {fmt(sale.tax)}</span>
            </div>
          )}
          <div className="grand-total">
            <div className="grand-total-row">
              <span>TOTAL:</span>
              <span>TSh {fmt(sale.payable)}</span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="payment-info">
          <div className="payment-row">
            <span className="info-label">Payment Method:</span>
            <span>{sale.method}</span>
          </div>
          <div className="payment-row">
            <span className="info-label">Status:</span>
            <span>{sale.status}</span>
          </div>
          <div className="payment-row">
            <span className="info-label">Amount Paid:</span>
            <span>TSh {fmt(sale.paid)}</span>
          </div>
          {sale.balance > 0 && (
            <div className="payment-row balance-due">
              <span className="info-label">Balance Due:</span>
              <span>TSh {fmt(sale.balance)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="footer">
          <div className="thank-you">Thank you for your business!</div>
          {/* {(branch.phone || company.phone) && (
            <div className="footer-text">
              For inquiries, contact us at {branch.phone ?? company.phone}
            </div>
          )} */}

          {/* QR Code - scan to track order */}
          <div className="qr-block">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(trackingUrl)}`}
              alt="Scan to track order"
              className="qr-image"
            />
            <div className="qr-label">Scan to track your order</div>
          </div>

          <div className="printed-time">Printed: {printedAt}</div>
          <div className="powered-by">Powered By FridolTech</div>
        </div>
      </div>

      {/* Screen only Controls */}
      <div className="screen-controls">
        <button onClick={() => window.print()} className="btn-print">
          Print Now
        </button>
        <button onClick={() => window.history.back()} className="btn-back">
          Go Back
        </button>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.2;
          color: #000;
          background: #fff;
          width: 58mm;
          margin: 0 auto;
          padding: 5mm;
        }

        .receipt {
          width: 100%;
          max-width: 48mm;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 8px;
          border-bottom: 1px dashed #000;
          padding-bottom: 8px;
        }

        .shop-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 2px;
          text-transform: uppercase;
        }

        .shop-address {
          font-size: 10px;
          margin-bottom: 1px;
        }

        .shop-contact {
          font-size: 9px;
          margin-bottom: 1px;
        }

        .receipt-title {
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          margin: 8px 0;
          text-transform: uppercase;
        }

        .receipt-info {
          margin-bottom: 8px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
          font-size: 10px;
        }

        .info-label {
          font-weight: bold;
        }

        .customer-info {
          margin-bottom: 8px;
          padding: 4px 0;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
        }

        .customer-name {
          font-weight: bold;
          margin-bottom: 2px;
          font-size: 10px;
        }

        .items-header {
          border-bottom: 1px solid #000;
          padding-bottom: 2px;
          margin-bottom: 4px;
        }

        .items-header-row {
          display: flex;
          font-size: 10px;
          font-weight: bold;
        }

        .item-name-col {
          width: 50%;
        }

        .item-qty-col {
          width: 15%;
          text-align: center;
        }

        .item-price-col {
          width: 35%;
          text-align: right;
        }

        .item-row {
          display: flex;
          margin-bottom: 3px;
          font-size: 10px;
          border-bottom: 1px dotted #ccc;
          padding-bottom: 2px;
        }

        .item-name {
          width: 50%;
          word-wrap: break-word;
        }

        .item-dimension {
          font-size: 9px;
          color: #555;
          margin-top: 1px;
        }

        .item-qty {
          width: 15%;
          text-align: center;
        }

        .item-price {
          width: 35%;
          text-align: right;
        }

        .totals {
          margin-top: 8px;
          border-top: 1px solid #000;
          padding-top: 4px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
          font-size: 10px;
        }

        .total-label {
          font-weight: bold;
        }

        .total-value {
          font-weight: bold;
        }

        .grand-total {
          border-top: 1px solid #000;
          padding-top: 4px;
          margin-top: 4px;
        }

        .grand-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: bold;
        }

        .payment-info {
          margin-top: 8px;
          padding: 4px 0;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
        }

        .payment-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
          font-size: 10px;
        }

        .balance-due {
          font-weight: bold;
          color: #b45309;
        }

        .footer {
          text-align: center;
          margin-top: 12px;
          font-size: 9px;
        }

        .thank-you {
          font-weight: bold;
          margin-bottom: 4px;
          font-size: 10px;
        }

        .footer-text {
          margin-bottom: 2px;
        }

        .printed-time {
          font-size: 8px;
          color: #666;
          margin-top: 4px;
        }

        .powered-by {
          font-size: 8px;
          color: #666;
          font-style: italic;
          margin-top: 2px;
        }

        .qr-block {
          margin-top: 10px;
          margin-bottom: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }

        .qr-image {
          width: 80px;
          height: 80px;
          border: 1px solid #ccc;
          padding: 2px;
        }

        .qr-label {
          font-size: 9px;
          font-weight: bold;
          margin-top: 2px;
        }

        .qr-url {
          font-size: 8px;
          color: #555;
        }

        .screen-controls {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 24px;
          padding: 16px;
        }

        .btn-print {
          padding: 8px 24px;
          background: #2563eb;
          color: #fff;
          font-family: inherit;
          font-size: 12px;
          font-weight: bold;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-back {
          padding: 8px 20px;
          background: #f1f5f9;
          color: #334155;
          font-family: inherit;
          font-size: 12px;
          font-weight: bold;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          cursor: pointer;
        }

        @media print {
          @page {
            margin: 0;
            size: 58mm auto;
          }
          body {
            margin: 0;
            padding: 2mm;
          }
          .receipt {
            max-width: none;
          }
          .screen-controls {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
