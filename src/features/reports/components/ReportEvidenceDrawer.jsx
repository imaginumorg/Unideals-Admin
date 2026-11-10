import { memo, useCallback, useState } from 'react'
import { BellRing, ExternalLink, Flag, MessageSquare, Pencil } from 'lucide-react'
import { moderationApi } from '../api/moderationApi'
import { useFetch } from '../../../shared/hooks/useFetch'
import { REPORT_REASON_LABELS } from '../../../shared/constants/constants'
import Avatar from '../../../shared/components/Avatar'
import { Badge, Drawer, EmptyState, ErrorState, Skeleton, StatusBadge, Toggle, cx } from '../../../shared/components/ui'
import { formatDateTime, formatRelative, titleCase } from '../../../shared/lib/format'

/**
 * Transcript captured when the report was filed. Reporter's messages sit on
 * the right; the other party's (usually the reported user) on the left.
 */
const ChatTranscript = ({ chat, reporterId }) => {
  if (!chat.length) return null
  const dayOf = (message) => (message ? new Date(message.sentAt).toDateString() : null)
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-line">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2/60 px-3 py-2 text-xs text-muted">
        <MessageSquare className="h-3.5 w-3.5" /> Chat at the time of the report · last {chat.length} messages
      </div>
      <ol className="max-h-[420px] space-y-1.5 overflow-y-auto bg-canvas p-3">
        {chat.map((message, index) => {
          const mine = reporterId && message.sender.id === reporterId
          const showDay = dayOf(message) !== dayOf(chat[index - 1])
          return (
            <li key={message.id || index}>
              {showDay && (
                <p className="my-2 text-center text-[10px] font-semibold tracking-wider text-subtle uppercase">
                  {new Date(message.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
              <div className={cx('flex', mine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cx(
                    'max-w-[85%] rounded-xl px-3 py-2 text-[13px]',
                    mine ? 'rounded-br-md bg-brand-soft text-fg' : 'rounded-bl-md border border-line bg-surface text-fg',
                    message.isFlagged && 'ring-1 ring-danger',
                  )}
                >
                  <p className={cx('mb-0.5 text-[11px] font-semibold', mine ? 'text-brand-fg' : 'text-muted')}>
                    {message.sender.name}
                    {mine && ' (reporter)'}
                  </p>
                  {message.type === 'text' || !message.type ? (
                    <p className="break-words whitespace-pre-line">{message.text || <span className="text-subtle italic">(empty)</span>}</p>
                  ) : message.type === 'image' && /^https:\/\//.test(message.text || '') ? (
                    <a href={message.text} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-fg underline">
                      Image <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-muted italic">
                      [{titleCase(message.type)}] {message.text}
                    </p>
                  )}
                  <p className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-subtle">
                    {message.isEdited && (
                      <span className="inline-flex items-center gap-0.5">
                        <Pencil className="h-2.5 w-2.5" /> edited
                      </span>
                    )}
                    {message.isFlagged && <span className="text-danger">flagged</span>}
                    {new Date(message.sentAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

const Body = ({ item }) => {
  const [includeClosed, setIncludeClosed] = useState(false)
  const load = useCallback(
    () => moderationApi.getTargetReports({ targetId: item.targetId, targetModel: item.targetModel, includeClosed }),
    [item.targetId, item.targetModel, includeClosed],
  )
  const { data, loading, error, refetch } = useFetch(load)
  const reports = data || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {reports.length} report{reports.length === 1 ? '' : 's'}
          {includeClosed ? ' (including closed)' : ' open'}
        </p>
        <label className="flex items-center gap-2 text-xs text-muted">
          Show closed <Toggle checked={includeClosed} onChange={setIncludeClosed} label="Show closed reports" />
        </label>
      </div>

      {loading && !data ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : reports.length === 0 ? (
        <EmptyState icon={Flag} title="No reports" message="Nothing to show for this item." />
      ) : (
        reports.map((report) => (
          <article key={report.id} className="rounded-xl border border-line p-4">
            <div className="flex items-start gap-3">
              <Avatar src={report.reporter?.avatar} name={report.reporter?.name || 'Guest'} className="h-8 w-8 text-[11px]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-fg">
                  {report.reporter?.name || 'Anonymous'}
                  {report.reporter?.email && <span className="ml-1.5 font-normal text-muted">{report.reporter.email}</span>}
                </p>
                <p className="text-xs text-subtle" title={formatDateTime(report.createdAt)}>
                  Reported {formatRelative(report.createdAt)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge tone="danger">{REPORT_REASON_LABELS[report.reason] || titleCase(report.reason)}</Badge>
                {report.status !== 'pending' && <StatusBadge status={report.status} />}
              </div>
            </div>

            {report.description && <p className="mt-3 rounded-lg bg-surface-2 p-3 text-sm whitespace-pre-line text-fg-2">{report.description}</p>}

            {report.evidence.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {report.evidence.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    Evidence <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            )}

            {report.chat.length > 0 ? (
              <ChatTranscript chat={report.chat} reporterId={report.reporter?.id} />
            ) : (
              item.targetModel !== 'Support' && (
                <p className="mt-3 text-xs text-subtle">No chat attached (reported from the listing page or before chat evidence existed).</p>
              )
            )}

            {report.reporterNotifiedAt && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                <BellRing className="h-3.5 w-3.5" /> Reporter told the outcome {formatRelative(report.reporterNotifiedAt)}
              </p>
            )}
            {report.adminNote && report.status !== 'pending' && <p className="mt-1 text-xs text-muted">Note: {report.adminNote}</p>}
          </article>
        ))
      )}
    </div>
  )
}

const ReportEvidenceDrawer = ({ item, onClose }) => (
  <Drawer
    open={Boolean(item)}
    onClose={onClose}
    title="Reports & evidence"
    subtitle={item ? item.target?.title || item.target?.name || item.targetModel : ''}
    width="max-w-2xl"
  >
    {item && <Body key={`${item.targetModel}-${item.targetId}`} item={item} />}
  </Drawer>
)

export default memo(ReportEvidenceDrawer)
