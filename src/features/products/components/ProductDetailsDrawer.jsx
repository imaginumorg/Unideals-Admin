import { memo, useEffect, useState } from 'react'
import { productsApi } from '../api/productsApi'
import { useToast } from '../../../shared/components/ToastContext'
import Avatar from '../../../shared/components/Avatar'
import { useAuth } from '../../auth/context/AuthContext'

const statusStyles = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  Approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  Blocked: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  Rejected: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  listed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  blocked: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  unlisted: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  sold: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

const formatDate = (d) => {
  if (!d) return '—'
  if (typeof d === 'string' && (d.includes('ago') || d.includes('Just now'))) return d
  try {
    const parsed = new Date(d)
    if (isNaN(parsed.getTime())) return String(d)
    return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(parsed)
  } catch {
    return '—'
  }
}

const ProductDetailsDrawer = ({ productId, onClose, onStatusChange }) => {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const { showToast } = useToast()
  const { canWrite } = useAuth()

  useEffect(() => {
    if (!productId) return

    let active = true
    const loadProduct = async () => {
      await Promise.resolve()
      if (!active) return
      setLoading(true)
      setLoadError('')
      setProduct(null)

      try {
        const res = await productsApi.getProductDetails(productId)
        if (!active) return
        if (res?.success && res.data) {
          setProduct(res.data)
          setActiveImageIndex(0)
        } else {
          setLoadError(res?.message || 'Unable to load product details.')
        }
      } catch (error) {
        if (active) setLoadError(error.message || 'Unable to load product details.')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadProduct()

    return () => {
      active = false
    }
  }, [productId])

  if (!productId) return null

  const handleAction = async (newStatus) => {
    if (!product) return
    const res = await onStatusChange(product.id || product._id, newStatus)
    if (res?.success) {
      setProduct((prev) => ({ ...prev, status: newStatus }))
    } else {
      showToast({ type: 'error', message: res?.message || 'Unable to update product status.' })
    }
  }

  const rawImages = product?.images || []
  const images = rawImages
    .map((img) => (typeof img === 'string' ? img : img?.url))
    .filter(Boolean)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col bg-white dark:bg-[#111827] shadow-2xl border-l border-[#E2E8F0] dark:border-[#1E293B] overflow-y-auto font-sans"
        aria-label="Product inspector panel"
      >
        {/* Top Close bar */}
        <div className="flex items-center justify-between p-4 border-b border-[#F1F5F9] dark:border-[#1E293B]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Product Inspector</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {loading && !product ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : product ? (
          <div className="p-5 space-y-5">
            {/* Gallery: Main featured image + thumbnails on side */}
            <div className="grid grid-cols-[1fr_80px] gap-2.5">
              <div className="relative rounded-2xl overflow-hidden border border-[#E2E8F0] dark:border-[#2D3748] bg-slate-50 aspect-4/3">
                <img
                  src={images[activeImageIndex] || images[0]}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-2">
                {images.slice(1, 4).map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx + 1)}
                    className="relative rounded-xl overflow-hidden border border-[#E2E8F0] dark:border-[#2D3748] aspect-square group focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <img src={img} alt="thumb" className="h-full w-full object-cover" />
                    {idx === 2 && images.length > 3 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xs">
                        +{images.length - 1}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Title, Status, and Price */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#0B1220] dark:text-white leading-snug">
                    {product.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                        statusStyles[product.status] || statusStyles.Pending
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-lg font-extrabold text-[#0B1220] dark:text-white">
                    <span>₹{Number(product.price).toLocaleString('en-IN')}</span>
                    <button
                      type="button"
                      title="Open marketplace link"
                      className="text-[#94A3B8] hover:text-[#2563EB]"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Profile Card (Image 3) */}
            <div className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] dark:border-[#2D3748] bg-[#F8FAFC] dark:bg-[#161F32] p-3.5">
              <div className="flex items-center gap-3">
                <Avatar
                  src={product.seller?.avatar}
                  name={product.seller?.name || 'Seller'}
                  className="h-10 w-10 text-xs"
                  ringClassName="ring-1 ring-white dark:ring-[#334155]"
                />
                <div>
                  <p className="text-xs font-bold text-[#0B1220] dark:text-white">{product.seller?.name || 'Seller'}</p>
                  <p className="text-[10px] text-[#94A3B8]">
                    {typeof product.seller?.campus === 'string'
                      ? product.seller.campus
                      : product.seller?.campus?.name || (typeof product.campus === 'string' ? product.campus : product.campus?.name) || 'Campus'}
                  </p>
                </div>
              </div>
            </div>

            {/* Details Content */}
            <div className="space-y-4 text-xs">
                {/* 2x2 Specs Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">Category</span>
                    <p className="font-bold text-[#0B1220] dark:text-white mt-0.5">{product.category || 'General'}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">Campus</span>
                    <p className="font-bold text-[#0B1220] dark:text-white mt-0.5">
                      {typeof product.campus === 'string' ? product.campus : product.campus?.name || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">Condition</span>
                    <p className="font-bold text-[#0B1220] dark:text-white mt-0.5">{product.condition || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">Listed On</span>
                    <p className="font-bold text-[#0B1220] dark:text-white mt-0.5">{formatDate(product.listedOn || product.created || product.createdAt)}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium">Description</span>
                  <p className="mt-1 text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed bg-[#F8FAFC] dark:bg-[#161F32] p-3 rounded-xl border border-[#E2E8F0]/60 dark:border-[#24304A]">
                    {product.description}
                  </p>
                </div>

                {/* Product Images (4) Grid */}
                <div>
                  <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium">Product Images ({images.length})</span>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {images.slice(0, 3).map((img, i) => (
                      <div
                        key={i}
                        onClick={() => setActiveImageIndex(i)}
                        className="rounded-xl overflow-hidden border border-[#E2E8F0] dark:border-[#2D3748] aspect-4/3 cursor-pointer hover:opacity-90 transition"
                      >
                        <img src={img} alt="view" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons Section from Image 3 */}
                <div className="space-y-2 pt-2">
                  {/* Row 1: Approve and Reject */}
                  <div className="grid grid-cols-1 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleAction('listed')}
                      disabled={!canWrite}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white py-2.5 px-4 font-semibold text-xs shadow-sm shadow-emerald-500/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>List Product</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction('unlisted')}
                      disabled={!canWrite}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 py-2.5 px-4 font-semibold text-xs transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      <span>Unlist Product</span>
                    </button>
                  </div>

                  {/* Row 2: Block Product and Contact Seller */}
                  <div className="grid grid-cols-1 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleAction('blocked')}
                      disabled={!canWrite}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 py-2.5 px-4 font-semibold text-xs transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                      </svg>
                      <span>Block Product</span>
                    </button>
                  </div>
                </div>
            </div>

          </div>
        ) : (
          <p role="alert" className="p-5 text-sm text-rose-600">{loadError || 'Unable to load product details.'}</p>
        )}
      </aside>
    </>
  )
}

export default memo(ProductDetailsDrawer)
