import { memo } from 'react'
import { Ban, CircleCheck, FileText, ShieldAlert } from 'lucide-react'
import { AUDIT_ACTION_LABELS, AUDIT_ACTION_TONES } from '../constants/constants'
import { Badge, cx, toneClass } from './ui'
import { formatRelative } from '../lib/format'

const TONE_ICONS = { danger: Ban, success: CircleCheck, warning: ShieldAlert }

const ActivityRow = ({ entry, showActor = true }) => {
  const tone = AUDIT_ACTION_TONES[entry.action] || 'brand'
  const Icon = TONE_ICONS[tone] || FileText
  const target = entry.target_snapshot?.name || entry.target_snapshot?.title || entry.target_snapshot?.email
  return (
    <li className="flex items-start gap-3.5 px-5 py-3.5">
      <span className={cx('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', toneClass(tone))}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-fg">
          <span className="font-semibold">{AUDIT_ACTION_LABELS[entry.action] || entry.action}</span>
          {target && <span className="text-muted"> · {target}</span>}
        </p>
        {showActor && (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
            {entry.actor_name}
            <Badge tone={entry.actor_role === 'admin' ? 'brand' : 'info'} className="py-0 text-[10px]">
              {entry.actor_role}
            </Badge>
          </p>
        )}
      </div>
      <time className="shrink-0 text-xs text-subtle" dateTime={entry.createdAt} title={new Date(entry.createdAt).toLocaleString()}>
        {formatRelative(entry.createdAt)}
      </time>
    </li>
  )
}

export default memo(ActivityRow)
