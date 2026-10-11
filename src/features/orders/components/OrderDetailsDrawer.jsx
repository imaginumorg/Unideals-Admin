import { memo, useEffect, useState } from 'react'
import { ordersApi } from '../api/ordersApi'
import { useToast } from '../../../shared/components/ToastContext'
import Avatar from '../../../shared/components/Avatar'

const statusStyles = {
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  shipped: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  processing: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  refunded: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400',
}

const paymentStyles = {
  Paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  COD: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400',
  Failed: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  Refunded: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400',
}

const formatPrice = (p) =>
  p != null ? `₹${Number(p).toLocaleString('en-IN')}` : '₹0'

const formatDate = (d) => {
  if (!d) return '—'
  try {
    const parsed = new Date(d)
    if (isNaN(parsed.getTime())) return String(d)
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed)
  } catch {
    return '—'
  }
}

const OrderDetailsDrawer = ({ orderId, onClose, onStatusChange }) => {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [selectedNextStatus, setSelectedNextStatus] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    if (!orderId) {
      setOrder(null)
      return
    }

    let active = true
    setLoading(true)

    ordersApi
      .getOrderDetails(orderId)
      .then((res) => {
        if (!active) return
        if (res?.success && res.data) {
          setOrder(res.data)
          setSelectedNextStatus(res.data.status || 'pending')
        } else {
          setOrder(null)
        }
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setOrder(null)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [orderId])

  if (!orderId) return null

  const handleStatusUpdate = async () => {
    if (!order || !selectedNextStatus || selectedNextStatus === order.status) return
    setUpdating(true)
    try {
      const res = await onStatusChange(order.id, selectedNextStatus)
      if (res?.success) {
        showToast({ type: 'success', message: `Order status updated to ${selectedNextStatus}` })
        setOrder((prev) => ({
          ...prev,
          status: selectedNextStatus,
          rawStatus: selectedNextStatus === 'delivered' ? 'completed' : selectedNextStatus,
        }))
      } else {
        showToast({ type: 'error', message: res?.message || 'Failed to update order status' })
      }
    } catch {
      showToast({ type: 'error', message: 'Failed to update status' })
    } finally {
      setUpdating(false)
    }
  }

  const handleDownloadInvoice = () => {
    if (!order) return
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${order.orderId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .order-id { font-size: 20px; font-weight: bold; }
          .section { margin-top: 25px; }
          .section-title { font-weight: bold; font-size: 14px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background: #f8fafc; font-size: 13px; }
          .total-row { font-size: 16px; font-weight: bold; }
          .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">UniDeals • Campus Mart</div>
            <div>Official Campus Peer-to-Peer Order Receipt</div>
          </div>
          <div style="text-align: right;">
            <div class="order-id">${order.orderId}</div>
            <div>Date: ${formatDate(order.orderDate)}</div>
            <div>Status: ${order.status.toUpperCase()}</div>
          </div>
        </div>
        <div class="section" style="display: flex; gap: 40px;">
          <div>
            <div class="section-title">Buyer Information</div>
            <div><strong>${order.buyer?.name}</strong></div>
            <div>${order.buyer?.email}</div>
            <div>${order.buyer?.phone}</div>
            <div>Campus: ${order.campus}</div>
          </div>
          <div>
            <div class="section-title">Pickup / Meetup Spot</div>
            <div>${order.deliveryAddress}</div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Item Details</div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Qty</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${order.product?.title || 'Campus Item'}</strong></td>
                <td>${order.product?.category || 'General'}</td>
                <td>1</td>
                <td style="text-align: right;">${formatPrice(order.amount)}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right;">Subtotal:</td>
                <td style="text-align: right;">${formatPrice(order.amount)}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align: right;">Campus Delivery / Platform:</td>
                <td style="text-align: right;">FREE</td>
              </tr>
              <tr class="total-row">
                <td colspan="3" style="text-align: right;">Total Amount:</td>
                <td style="text-align: right;">${formatPrice(order.amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="section">
          <div class="section-title">Payment Info</div>
          <div>Method: ${order.payment?.method || 'Cash / UPI'} (${order.payment?.status || 'Paid'})</div>
          ${order.payment?.txnId ? `<div>Txn Ref: ${order.payment.txnId}</div>` : ''}
        </div>
        <div class="footer">
          Generated automatically by UniDeals Admin Portal • Safe Campus Marketplace
        </div>
      </body>
      </html>
    `
    const blob = new Blob([invoiceHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (win) {
      win.focus()
    } else {
      const a = document.createElement('a')
      a.href = url
      a.download = `Invoice-${order.orderId}.html`
      a.click()
    }
  }

  const handleContactCustomer = () => {
    if (!order?.buyer) return
    window.location.href = `mailto:${order.buyer.email}?subject=UniDeals Order ${order.orderId} Support`
  }

  const productImage =
    order?.product?.images?.[0] ||
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80'

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over panel */}
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#111827] shadow-2xl border-l border-[#E2E8F0] dark:border-[#2D3748] flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#2D3748] px-6 py-4">
            <h2 className="text-lg font-bold text-[#0B1220] dark:text-white">Order Details</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {loading && !order ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : order ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Order ID banner */}
              <div className="flex items-start justify-between pb-4 border-b border-[#E2E8F0] dark:border-[#2D3748]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-[#0B1220] dark:text-white">
                      {order.orderId}
                    </span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        statusStyles[order.status] || statusStyles.pending
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                    Placed on {formatDate(order.orderDate)}
                  </p>
                </div>
              </div>

              {/* Customer */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                    Customer
                  </span>
                  <button
                    onClick={handleContactCustomer}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View Profile
                  </button>
                </div>
                <div className="p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-slate-50/50 dark:bg-[#1E293B]/40 flex items-start gap-3">
                  <Avatar
                    src={order.buyer?.avatar}
                    name={order.buyer?.name}
                    className="h-11 w-11 shrink-0 rounded-full text-sm font-bold"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#0B1220] dark:text-white truncate">
                        {order.buyer?.name || 'Student Buyer'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                      <span>#{order.buyer?.id?.slice(-6) || 'USR001'}</span>
                      <span>•</span>
                      <span className="text-[#3B82F6] font-medium">{order.campus}</span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-[#475569] dark:text-[#CBD5E1]">
                      <div className="flex items-center gap-1.5 truncate">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#94A3B8] shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        <span className="truncate">{order.buyer?.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#94A3B8] shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span>{order.buyer?.phone || '+91 98765 43210'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery / Meetup Address */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                    Delivery Address / Meetup Spot
                  </span>
                  <span className="text-xs text-primary font-medium">Campus Spot</span>
                </div>
                <div className="p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-slate-50/50 dark:bg-[#1E293B]/40 flex items-start gap-2.5">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div className="text-xs text-[#0B1220] dark:text-white leading-relaxed">
                    <div className="font-semibold">{order.deliveryAddress}</div>
                    <div className="text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                      Peer-to-peer verified campus trade point
                    </div>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] block mb-2.5">
                  Products (1)
                </span>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-slate-50/50 dark:bg-[#1E293B]/40 flex items-center gap-3">
                    <img
                      src={productImage}
                      alt={order.product?.title}
                      className="h-14 w-14 rounded-lg object-cover border border-[#E2E8F0] dark:border-[#2D3748] bg-white shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-[#0B1220] dark:text-white truncate">
                        {order.product?.title || 'Campus Item'}
                      </div>
                      <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                        {order.product?.category || 'General'} • Qty: 1
                      </div>
                    </div>
                    <div className="text-sm font-bold text-[#0B1220] dark:text-white shrink-0">
                      {formatPrice(order.amount)}
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] space-y-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-[#0B1220] dark:text-white">{formatPrice(order.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Campus Delivery Fee</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">FREE</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">-₹0</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#E2E8F0] dark:border-[#2D3748] text-sm font-bold text-[#0B1220] dark:text-white">
                      <span>Total</span>
                      <span>{formatPrice(order.amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] block mb-2.5">
                  Payment Information
                </span>
                <div className="p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-slate-50/50 dark:bg-[#1E293B]/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold text-xs">
                      UPI
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0B1220] dark:text-white">
                          {order.payment?.method || 'Razorpay (UPI)'}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.2 rounded-sm text-[10px] font-semibold ${
                            paymentStyles[order.payment?.status] || paymentStyles.Paid
                          }`}
                        >
                          {order.payment?.status || 'Paid'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        Txn ID: {order.payment?.txnId || `pay_${String(order.id).slice(-8)}`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Timeline */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] block mb-3">
                  Order Timeline
                </span>
                <div className="space-y-4 pl-1">
                  {(order.timeline || [
                    { title: 'Order Placed', time: formatDate(order.orderDate), done: true },
                    {
                      title: 'Deal / Offer Confirmed',
                      time: formatDate(order.orderDate),
                      done: ['processing', 'scheduled', 'delivered'].includes(order.status),
                    },
                    {
                      title: 'Pickup / Meetup Scheduled',
                      time: ['scheduled', 'delivered'].includes(order.status)
                        ? formatDate(order.orderDate)
                        : 'Pending',
                      done: ['scheduled', 'delivered'].includes(order.status),
                    },
                    {
                      title: 'Delivered / Completed',
                      time: order.status === 'delivered' ? formatDate(order.orderDate) : 'Pending',
                      done: order.status === 'delivered',
                    },
                  ]).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 relative">
                      {idx < 3 && (
                        <div
                          className={`absolute left-2.5 top-6 bottom-0 w-0.5 ${
                            step.done ? 'bg-emerald-500' : 'bg-[#E2E8F0] dark:bg-[#334155]'
                          }`}
                        />
                      )}
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 z-10 ${
                          step.done
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                        }`}
                      >
                        {step.done ? '✓' : idx + 1}
                      </div>
                      <div className="text-xs">
                        <div
                          className={`font-semibold ${
                            step.done ? 'text-[#0B1220] dark:text-white' : 'text-[#94A3B8]'
                          }`}
                        >
                          {step.title}
                        </div>
                        <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                          {step.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Update Control */}
              <div className="pt-4 border-t border-[#E2E8F0] dark:border-[#2D3748]">
                <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] block mb-2">
                  Update Order Stage
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedNextStatus}
                    onChange={(e) => setSelectedNextStatus(e.target.value)}
                    className="flex-1 rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1E293B] px-3 py-2 text-xs text-[#0B1220] dark:text-white outline-none focus:border-primary"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing / Confirmed</option>
                    <option value="scheduled">Scheduled / In-Transit</option>
                    <option value="delivered">Delivered / Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updating || selectedNextStatus === order.status}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold disabled:opacity-50 transition"
                  >
                    {updating ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-[#64748B]">
              Order details not found.
            </div>
          )}

          {/* Action Footer */}
          {order && (
            <div className="p-4 border-t border-[#E2E8F0] dark:border-[#2D3748] bg-slate-50/50 dark:bg-[#111827] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1E293B] hover:bg-slate-50 text-xs font-semibold text-[#0B1220] dark:text-white transition"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Invoice
                </button>
                <button
                  type="button"
                  onClick={handleContactCustomer}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1E293B] hover:bg-slate-50 text-xs font-semibold text-[#0B1220] dark:text-white transition"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Contact Customer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(OrderDetailsDrawer)
