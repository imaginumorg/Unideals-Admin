import { memo, useCallback, useState } from 'react'
import { Check, Copy, ImageOff, Mail, MapPin, Phone } from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/components/ToastContext'
import { useFetch } from '../../../shared/hooks/useFetch'
import { ordersApi } from '../api/ordersApi'
import Avatar from '../../../shared/components/Avatar'
import { Badge, ConfirmDialog, Drawer, ErrorState, Field, InlineAlert, Section, Select, Skeleton, cx } from '../../../shared/components/ui'
import { formatCurrency, formatDateTime } from '../../../shared/lib/format'
import { ADMIN_TRANSITIONS, ORDER_STAGES, stageOf } from '../orderStatus'

const Party = ({ role, person, campus }) => (
  <div className="rounded-xl border border-line p-3.5">
    <p className="eyebrow mb-2.5">{role}</p>
    <div className="flex items-center gap-3">
      <Avatar src={person?.avatar} name={person?.name} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-fg">{person?.name || '—'}</p>
        {campus && <p className="truncate text-xs text-muted">{campus}</p>}
      </div>
    </div>
    <div className="mt-3 space-y-1.5 text-xs text-fg-2">
      {person?.email && (
        <a href={`mailto:${person.email}`} className="flex items-center gap-2 hover:text-brand-fg">
          <Mail className="h-3.5 w-3.5 text-subtle" /> <span className="truncate">{person.email}</span>
        </a>
      )}
      {person?.phone && (
        <a href={`tel:${person.phone}`} className="flex items-center gap-2 hover:text-brand-fg">
          <Phone className="h-3.5 w-3.5 text-subtle" /> {person.phone}
        </a>
      )}
    </div>
  </div>
)

const Body = ({ orderId, onChanged }) => {
  const { canWrite } = useAuth()
  const { showToast } = useToast()
  const [version, setVersion] = useState(0)
  const load = useCallback(() => ordersApi.getOrderDetails(orderId), [orderId, version]) // eslint-disable-line react-hooks/exhaustive-deps
  const { data: order, loading, error, refetch } = useFetch(load)
  const [nextStage, setNextStage] = useState('')
  const [reason, setReason] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [working, setWorking] = useState(false)
  const [copied, setCopied] = useState(false)

  if (loading && !order) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (error && !order) return <ErrorState message={error} onRetry={refetch} />

  const stage = stageOf(order.status)
  const image = order.product?.images?.[0]
  const isFinal = order.status === 'delivered' || order.status === 'cancelled'
  const discount = (order.originalAmount ?? order.amount) - order.amount

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(order.orderId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      showToast({ type: 'error', message: 'Could not copy' })
    }
  }

  const update = async () => {
    setWorking(true)
    const response = await ordersApi.updateOrderStatus(order.id, nextStage, reason)
    setWorking(false)
    if (!response.success) {
      showToast({ type: 'error', message: response.message })
      return
    }
    showToast({ type: 'success', message: `${order.orderId} → ${stageOf(nextStage).label}` })
    setConfirming(false)
    setNextStage('')
    setReason('')
    setVersion((value) => value + 1)
    onChanged?.()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button type="button" onClick={copyId} className="group flex items-center gap-2 font-mono text-lg font-bold text-fg">
            {order.orderId}
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-subtle opacity-0 transition group-hover:opacity-100" />}
          </button>
          <p className="text-xs text-muted">Started {formatDateTime(order.createdAt)}</p>
        </div>
        <Badge tone={stage.tone} dot>{stage.label}</Badge>
      </div>

      <div className="flex gap-4 rounded-xl border border-line p-3.5">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-2 text-subtle">
          {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <ImageOff className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-fg">{order.product?.title}</p>
          <p className="text-xs text-muted">{order.product?.category}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-fg">{formatCurrency(order.amount)}</span>
            {discount > 0 && (
              <span className="text-xs text-success">
                {formatCurrency(discount)} off {formatCurrency(order.originalAmount)}
              </span>
            )}
          </div>
        </div>
        <Badge tone={order.payment?.status === 'Paid' ? 'success' : 'neutral'} className="self-start">{order.payment?.status}</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Party role="Buyer" person={order.buyer} campus={order.buyer?.campus} />
        <Party role="Seller" person={order.seller} />
      </div>

      {order.deliveryAddress && (
        <Section title="Pickup">
          <p className="flex items-start gap-2 text-sm text-fg-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-subtle" /> {order.deliveryAddress}
          </p>
        </Section>
      )}

      <Section title="Timeline">
        <ol className="relative space-y-4 pl-6 before:absolute before:top-1 before:bottom-1 before:left-[7px] before:w-px before:bg-line">
          {(order.timeline || []).map((step) => (
            <li key={step.label} className="relative">
              <span
                className={cx(
                  'absolute top-1 -left-6 flex h-[15px] w-[15px] items-center justify-center rounded-full border-2',
                  step.completed ? 'border-success bg-success' : 'border-line-strong bg-surface',
                )}
              >
                {step.completed && <Check className="h-2.5 w-2.5 text-surface" strokeWidth={4} />}
              </span>
              <p className={cx('text-sm font-medium', step.completed ? 'text-fg' : 'text-subtle')}>{step.label}</p>
              {step.date && <p className="text-xs text-muted">{formatDateTime(step.date)}</p>}
            </li>
          ))}
        </ol>
        {order.cancellationReason && (
          <InlineAlert tone="neutral" className="mt-3">Cancelled: {order.cancellationReason}</InlineAlert>
        )}
      </Section>

      {canWrite && !isFinal && (
        <Section title="Override stage">
          <p className="text-xs text-muted">Use only when students can't update the deal themselves, e.g. a disputed pickup.</p>
          <div className="flex gap-2">
            <Select
              label="New stage"
              value={nextStage}
              onChange={setNextStage}
              options={[
                { value: '', label: 'Choose a stage…' },
                ...ADMIN_TRANSITIONS.filter((value) => value !== order.status).map((value) => ({ value, label: ORDER_STAGES[value].label })),
              ]}
            />
            <button type="button" disabled={!nextStage} onClick={() => setConfirming(true)} className="btn btn-primary">
              Update
            </button>
          </div>
        </Section>
      )}

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={update}
        loading={working}
        tone={nextStage === 'cancelled' ? 'danger' : 'primary'}
        title={`Move ${order.orderId} to “${stageOf(nextStage).label}”?`}
        description={nextStage === 'delivered' ? 'This also marks payment and item receipt as confirmed.' : 'The deal moves to this stage immediately.'}
        confirmLabel="Update stage"
      >
        {nextStage === 'cancelled' && (
          <Field label="Cancellation reason">
            <textarea className="input" rows={3} maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Saved on the deal for staff" />
          </Field>
        )}
      </ConfirmDialog>
    </div>
  )
}

const OrderDetailsDrawer = ({ orderId, onClose, onChanged }) => (
  <Drawer open={Boolean(orderId)} onClose={onClose} title="Order details" subtitle="Deal, people and timeline">
    {orderId && <Body key={orderId} orderId={orderId} onChanged={onChanged} />}
  </Drawer>
)

export default memo(OrderDetailsDrawer)
