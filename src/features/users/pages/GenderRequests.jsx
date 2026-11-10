import { memo, useCallback, useState } from 'react'
import { ArrowRight, Check, Info, UserCog, X } from 'lucide-react'
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
  EmptyState,
  ErrorState,
  InlineAlert,
  PageHeader,
  Pagination,
  TableSkeleton,
} from '../../../shared/components/ui'
import { formatDateTime, formatRelative, titleCase } from '../../../shared/lib/format'

const GENDER_TONE = { female: 'pink', male: 'info', other: 'violet' }

const GenderPill = ({ value }) =>
  value ? <Badge tone={GENDER_TONE[value] || 'neutral'}>{titleCase(value)}</Badge> : <Badge>Not set</Badge>

const GenderRequests = () => {
  const { canWrite } = useAuth()
  const { showToast } = useToast()
  const { refresh: refreshAttention } = useAttention()
  const [page, setPage] = useState(1)
  const [pending, setPending] = useState(null) // { request, action }
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(() => genderRequestsApi.getPending({ page, limit: 20 }), [page])
  const { data, pagination, loading, error, refetch } = useFetch(load)
  const rows = data || []

  const confirm = async () => {
    if (!pending) return
    setSubmitting(true)
    const response = await genderRequestsApi.review(pending.request.id, pending.action)
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
    refetch()
    refreshAttention()
  }

  const leavingFemale = pending?.request.gender === 'female' && pending?.request.requestedGender !== 'female'

  return (
    <div>
      <PageHeader
        title="Gender change requests"
        description="Gender is self-declared once and then locked. Changes need staff approval because they control Girls Corner access."
        icon={UserCog}
      />

      {!canWrite && (
        <InlineAlert tone="info" className="mb-4">
          You can view requests. Only a Super Admin can approve or reject them.
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
            <table className="table min-w-[720px]">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Change</th>
                  <th>Requested</th>
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
                    </td>
                    <td>
                      <span title={formatDateTime(request.requestedAt)}>{formatRelative(request.requestedAt)}</span>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          disabled={!canWrite}
                          onClick={() => setPending({ request, action: 'reject' })}
                          className="btn btn-secondary btn-sm"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button
                          type="button"
                          disabled={!canWrite}
                          onClick={() => setPending({ request, action: 'approve' })}
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
        {pending?.action === 'approve' && leavingFemale && (
          <InlineAlert tone="warning">
            This student's Girls Corner listings will be unlisted automatically. They can relist them in the regular marketplace.
          </InlineAlert>
        )}
        {pending?.action === 'reject' && (
          <p className="flex items-start gap-2 text-sm text-muted">
            <Info className="mt-0.5 h-4 w-4 shrink-0" /> Their current gender stays unchanged and they can submit a new request later.
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}

export default memo(GenderRequests)
