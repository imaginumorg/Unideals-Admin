import { memo, useCallback, useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight, Check, Eye, ImageOff, Info, ShieldAlert, UserCog, X } from 'lucide-react'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/components/ToastContext'
import { useAttention } from '../../../layouts/AttentionContext'
import { genderRequestsApi } from '../api/genderRequestsApi'
import Avatar from '../../../shared/components/Avatar'
import {
  Badge,
  Card,
  ConfirmDialog,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  InlineAlert,
  PageHeader,
  Pagination,
  Skeleton,
  TableSkeleton,
} from '../../../shared/components/ui'
import { formatDateTime, formatRelative, titleCase } from '../../../shared/lib/format'

const GENDER_TONE = { female: 'pink', male: 'info', other: 'violet' }
const SOURCE_LABEL = { self: 'Self-declared', google: 'From Google account', admin: 'Set by staff' }
const NOTE_MAX = 300
// Matches ID_CARD_RETENTION_DAYS on the server.
const ID_RETENTION_DAYS = 30

const GenderPill = ({ value }) =>
  value ? <Badge tone={GENDER_TONE[value] || 'neutral'}>{titleCase(value)}</Badge> : <Badge>Not set</Badge>

// Loads the private ID photo as a blob (the API refuses cross-site <img>
// embeds) and frees the object URL when the viewer closes.
const IdCardImage = ({ userId, name }) => {
  const [state, setState] = useState({ url: null, error: null, loading: true })

  useEffect(() => {
    let objectUrl = null
    let cancelled = false
    genderRequestsApi.getIdCard(userId).then((response) => {
      if (cancelled) return
      if (!response.success) {
        setState({ url: null, error: response.message, loading: false })
        return
      }
      objectUrl = URL.createObjectURL(response.data)
      setState({ url: objectUrl, error: null, loading: false })
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [userId])

  if (state.loading) return <Skeleton className="aspect-[3/2] w-full rounded-xl" />
  if (state.error) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line p-8 text-center">
        <ImageOff className="h-6 w-6 text-subtle" />
        <p className="text-sm text-muted">{state.error}</p>
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface-2">
      <img
        src={state.url}
        alt={`College ID submitted by ${name}`}
        className="mx-auto max-h-[60dvh] w-auto object-contain"
        draggable={false}
        onContextMenu={(event) => event.preventDefault()}
      />
    </div>
  )
}

const GenderRequests = () => {
  const { can } = useAuth()
  const canWrite = can('genderRequests', 'manage')
  const { showToast } = useToast()
  const { refresh: refreshAttention } = useAttention()
  const [page, setPage] = useState(1)
  const [pending, setPending] = useState(null) // { request, action }
  const [viewing, setViewing] = useState(null) // request whose ID photo is open
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(() => genderRequestsApi.getPending({ page, limit: 20 }), [page])
  const { data, pagination, loading, error, refetch } = useFetch(load)
  const rows = data || []

  const startReview = (request, action) => {
    setViewing(null)
    setNote('')
    setPending({ request, action })
  }

  const confirm = async () => {
    if (!pending) return
    setSubmitting(true)
    const response = await genderRequestsApi.review(
      pending.request.id,
      pending.action,
      pending.action === 'reject' ? note : undefined,
    )
    setSubmitting(false)
    if (!response.success) {
      showToast({ type: 'error', message: response.message })
      return
    }
    showToast({
      type: 'success',
      message: pending.action === 'approve' ? `Approved for ${pending.request.name}` : `Rejected request from ${pending.request.name}`,
    })
    setPending(null)
    setNote('')
    refetch()
    refreshAttention()
  }

  const leavingFemale = pending?.request.gender === 'female' && pending?.request.requestedGender !== 'female'
  const missingCard = pending && !pending.request.hasIdCard

  return (
    <div>
      <PageHeader
        title="Gender change requests"
        description="Gender is set once, then locked. Changes need staff approval with a college ID photo because they control Girls Corner access."
        icon={UserCog}
      />

      {!canWrite && (
        <InlineAlert tone="info" className="mb-4">
          You can view requests. Your role can't approve or reject them.
        </InlineAlert>
      )}

      <Card className="overflow-hidden">
        {loading && !data ? (
          <TableSkeleton rows={5} columns={5} />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : rows.length === 0 ? (
          <EmptyState icon={Check} title="No pending requests" message="New gender change requests from students will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table min-w-[860px]">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Change</th>
                  <th>Requested</th>
                  <th>College ID</th>
                  <th className="text-right">Decision</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={request.name} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-fg">{request.name}</p>
                          <p className="truncate text-xs text-muted">{request.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <GenderPill value={request.gender} />
                        <ArrowRight className="h-3.5 w-3.5 text-subtle" />
                        <GenderPill value={request.requestedGender} />
                      </div>
                      {request.genderSource && (
                        <p className="mt-1 text-[11px] text-subtle">Current: {SOURCE_LABEL[request.genderSource] || titleCase(request.genderSource)}</p>
                      )}
                    </td>
                    <td>
                      <span title={formatDateTime(request.requestedAt)}>{formatRelative(request.requestedAt)}</span>
                    </td>
                    <td>
                      {request.hasIdCard ? (
                        <button type="button" onClick={() => setViewing(request)} className="btn btn-secondary btn-sm">
                          <Eye className="h-3.5 w-3.5" /> View ID
                        </button>
                      ) : (
                        <Badge tone="warning" className="whitespace-nowrap">
                          <ImageOff className="h-3 w-3" /> Photo expired
                        </Badge>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          disabled={!canWrite}
                          onClick={() => startReview(request, 'reject')}
                          className="btn btn-secondary btn-sm"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button
                          type="button"
                          disabled={!canWrite}
                          onClick={() => startReview(request, 'approve')}
                          className="btn btn-success btn-sm"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination && <Pagination {...pagination} onPageChange={setPage} />}
      </Card>

      <p className="mt-3 flex items-start gap-2 text-xs text-subtle">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        ID photos are private, never cached, and deleted as soon as a request is decided (or after {ID_RETENTION_DAYS} days). Every view is recorded in the audit log.
      </p>

      <Dialog
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        size="lg"
        title={viewing ? `College ID: ${viewing.name}` : ''}
        description={
          viewing
            ? `${titleCase(viewing.gender || 'not set')} → ${titleCase(viewing.requestedGender)} · requested ${formatRelative(viewing.requestedAt)}`
            : ''
        }
        footer={
          viewing && canWrite ? (
            <>
              <button type="button" onClick={() => startReview(viewing, 'reject')} className="btn btn-secondary">
                <X className="h-4 w-4" /> Reject
              </button>
              <button type="button" onClick={() => startReview(viewing, 'approve')} className="btn btn-success">
                <Check className="h-4 w-4" /> Approve
              </button>
            </>
          ) : null
        }
      >
        {viewing && (
          <div className="space-y-3">
            <IdCardImage userId={viewing.id} name={viewing.name} />
            <p className="flex items-start gap-2 text-xs text-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Check the name matches the account and the card is from a real college. Don't download or share this photo.
            </p>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={confirm}
        loading={submitting}
        tone={pending?.action === 'reject' ? 'danger' : 'primary'}
        confirmLabel={pending?.action === 'approve' ? 'Approve change' : 'Reject request'}
        title={pending?.action === 'approve' ? 'Approve gender change?' : 'Reject this request?'}
        description={
          pending
            ? `${pending.request.name}: ${titleCase(pending.request.gender || 'not set')} → ${titleCase(pending.request.requestedGender)}`
            : ''
        }
      >
        <div className="space-y-3">
          {pending?.action === 'approve' && missingCard && (
            <InlineAlert tone="warning">
              <span className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                No ID photo on file. It expired after {ID_RETENTION_DAYS} days. Reject instead so they can send a new one.
              </span>
            </InlineAlert>
          )}
          {pending?.action === 'approve' && leavingFemale && (
            <InlineAlert tone="warning">
              This student's Girls Corner listings will be unlisted automatically. They can relist them in the regular marketplace.
            </InlineAlert>
          )}
          {pending?.action === 'reject' && (
            <>
              <Field label="Reason for the student (optional)" hint={`${note.length}/${NOTE_MAX} · e.g. "ID photo unreadable" or "Name doesn't match the account"`}>
                <textarea
                  className="input"
                  rows={3}
                  maxLength={NOTE_MAX}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Shown in their notification"
                />
              </Field>
              <p className="flex items-start gap-2 text-sm text-muted">
                <Info className="mt-0.5 h-4 w-4 shrink-0" /> Their current gender stays unchanged and they can submit a new request later.
              </p>
            </>
          )}
          {pending && (
            <p className="text-xs text-subtle">The student is notified, and their ID photo is deleted, either way.</p>
          )}
        </div>
      </ConfirmDialog>
    </div>
  )
}

export default memo(GenderRequests)
