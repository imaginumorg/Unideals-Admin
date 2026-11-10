import { memo, useCallback, useState } from 'react'
import { Ban, Eye, EyeOff, Flag, ImageOff, RotateCcw, Trash2 } from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/components/ToastContext'
import { useFetch } from '../../../shared/hooks/useFetch'
import { productsApi } from '../api/productsApi'
import Avatar from '../../../shared/components/Avatar'
import { REPORT_REASON_LABELS } from '../../../shared/constants/constants'
import {
  Badge,
  ConfirmDialog,
  InlineAlert,
  DetailList,
  Drawer,
  ErrorState,
  Field,
  Section,
  Skeleton,
  StatusBadge,
  cx,
} from '../../../shared/components/ui'
import { formatCurrency, formatDateTime, formatRelative, titleCase } from '../../../shared/lib/format'

const ACTIONS = {
  blocked: { label: 'Block listing', verb: 'Blocked', tone: 'danger', icon: Ban, text: 'Hidden from the marketplace. The seller cannot relist it.' },
  unlisted: { label: 'Unlist', verb: 'Unlisted', tone: 'primary', icon: EyeOff, text: 'Hidden from the marketplace. The seller can relist it.' },
  listed: { label: 'Make live', verb: 'Re-listed', tone: 'primary', icon: Eye, text: 'Visible on the marketplace again.' },
  delete: { label: 'Delete permanently', verb: 'Deleted', tone: 'danger', icon: Trash2, text: 'Removes the listing and its images for good. This cannot be undone.' },
}

const Body = ({ productId, onChanged, onClose }) => {
  const { canWrite } = useAuth()
  const { showToast } = useToast()
  const [version, setVersion] = useState(0)
  const load = useCallback(() => productsApi.getProductDetails(productId), [productId, version]) // eslint-disable-line react-hooks/exhaustive-deps
  const { data: product, loading, error, refetch } = useFetch(load)
  const [imageIndex, setImageIndex] = useState(0)
  const [pending, setPending] = useState(null)
  const [reason, setReason] = useState('')
  const [working, setWorking] = useState(false)

  if (loading && !product) {
    return (
      <div className="space-y-4">
        <Skeleton className="aspect-[4/3] w-full rounded-xl" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }
  if (error && !product) return <ErrorState message={error} onRetry={refetch} />

  const images = product.images || []
  const image = images[imageIndex]?.url

  const run = async () => {
    setWorking(true)
    const response =
      pending === 'delete'
        ? await productsApi.hardDeleteProduct(product.id, reason)
        : await productsApi.updateProductStatus(product.id, pending, reason)
    setWorking(false)
    if (!response.success) {
      showToast({ type: 'error', message: response.message })
      return
    }
    showToast({ type: 'success', message: `${ACTIONS[pending].verb}: ${product.title}` })
    setPending(null)
    setReason('')
    onChanged?.()
    if (pending === 'delete') onClose()
    else setVersion((value) => value + 1)
  }

  const available = ['listed', 'unlisted', 'blocked'].filter((status) => status !== product.status)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-2 text-subtle">
          {image ? <img src={image} alt={product.title} className="h-full w-full object-contain" /> : <ImageOff className="h-8 w-8" />}
        </div>
        {images.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
            {images.map((img, index) => (
              <button
                key={img.url}
                type="button"
                onClick={() => setImageIndex(index)}
                className={cx('h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2', index === imageIndex ? 'border-brand' : 'border-transparent opacity-60 hover:opacity-100')}
              >
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={product.status} />
          {product.is_deleted && <Badge tone="danger">Deleted</Badge>}
          {product.auto_hidden_at && <Badge tone="warning">Auto-hidden</Badge>}
          <Badge>{titleCase(product.category)}</Badge>
          {product.condition && <Badge>{titleCase(product.condition)}</Badge>}
        </div>
        <h3 className="mt-2.5 text-lg font-semibold text-fg">{product.title}</h3>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-semibold text-fg">{formatCurrency(product.price)}</span>
          {product.original_price > product.price && <span className="text-sm text-subtle line-through">{formatCurrency(product.original_price)}</span>}
          {product.is_negotiable && <span className="text-xs text-muted">Negotiable</span>}
        </p>
        {product.description && <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-fg-2">{product.description}</p>}
      </div>

      {product.auto_hidden_at && (
        <InlineAlert tone="warning">
          Hidden automatically {formatRelative(product.auto_hidden_at)} after {product.auto_hidden_report_count || 5} reports. The seller
          can't relist it until you decide: make it live if the reports are unfounded, or block / unlist it.
        </InlineAlert>
      )}

      <Section title="Details">
        <DetailList
          items={[
            { label: 'Campus', value: product.campus?.name },
            { label: 'Views', value: product.views_count ?? 0 },
            { label: 'Payment', value: titleCase(product.payment_preference) || '—' },
            { label: 'Pickup', value: product.pickup_address?.label || product.pickup_address?.name || '—' },
            { label: 'Created', value: formatDateTime(product.createdAt) },
            { label: 'Updated', value: formatDateTime(product.updatedAt) },
          ]}
        />
      </Section>

      <Section title="Seller">
        <div className="flex items-center gap-3 rounded-xl border border-line p-3">
          <Avatar src={product.seller?.avatar} name={product.seller?.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">{product.seller?.name || 'Unknown seller'}</p>
            <p className="truncate text-xs text-muted">{product.seller?.email}</p>
          </div>
          {product.seller?.status && <StatusBadge status={product.seller.status} />}
        </div>
      </Section>

      <Section title={`Reports (${product.reportCount ?? 0})`}>
        {product.recentReports?.length ? (
          <ul className="space-y-2">
            {product.recentReports.map((report) => (
              <li key={report.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="danger"><Flag className="h-3 w-3" /> {REPORT_REASON_LABELS[report.reason] || titleCase(report.reason)}</Badge>
                  <span className="text-xs text-subtle">{formatRelative(report.createdAt)}</span>
                </div>
                {report.description && <p className="mt-2 text-sm text-fg-2">{report.description}</p>}
                <p className="mt-1.5 text-xs text-muted">by {report.reporter?.name || 'Anonymous'} · <StatusBadge status={report.status} /></p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">No reports on this listing</p>
        )}
      </Section>

      {canWrite && !product.is_deleted && (
        <Section title="Moderation">
          <div className="grid gap-2 sm:grid-cols-2">
            {available.map((status) => {
              const { label, icon: Icon, tone } = ACTIONS[status]
              return (
                <button key={status} type="button" onClick={() => setPending(status)} className={tone === 'danger' ? 'btn btn-danger' : 'btn btn-secondary'}>
                  {status === 'listed' && product.status !== 'draft' ? <RotateCcw className="h-4 w-4" /> : <Icon className="h-4 w-4" />} {label}
                </button>
              )
            })}
            <button type="button" onClick={() => setPending('delete')} className="btn btn-danger">
              <Trash2 className="h-4 w-4" /> Delete permanently
            </button>
          </div>
        </Section>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={run}
        loading={working}
        tone={pending ? ACTIONS[pending].tone : 'primary'}
        title={pending ? `${ACTIONS[pending].label}?` : ''}
        description={pending ? ACTIONS[pending].text : ''}
        confirmLabel={pending ? ACTIONS[pending].label : ''}
      >
        {pending && (
          <Field label="Reason" hint="Optional. Saved to the audit log and included in the seller's notification.">
            <textarea className="input" rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
          </Field>
        )}
      </ConfirmDialog>
    </div>
  )
}

const ProductDetailsDrawer = ({ productId, onClose, onChanged }) => (
  <Drawer open={Boolean(productId)} onClose={onClose} title="Listing details" subtitle={productId ? `#${productId}` : ''}>
    {productId && <Body key={productId} productId={productId} onChanged={onChanged} onClose={onClose} />}
  </Drawer>
)

export default memo(ProductDetailsDrawer)
