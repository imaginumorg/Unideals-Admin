import { memo, useCallback, useEffect, useState } from 'react'
import { Bell, CalendarClock, CheckCheck, History, LayoutTemplate, MousePointerClick, Send, Users, X } from 'lucide-react'
import { notificationsApi } from '../api/notificationsApi'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/components/ToastContext'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useCampusOptions, useListFilters } from '../../../shared/hooks/useListFilters'
import {
  Badge,
  Card,
  CardHeader,
  ConfirmDialog,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  InlineAlert,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  TableSkeleton,
  Tabs,
  cx,
} from '../../../shared/components/ui'
import { formatDateTime, formatNumber, formatRelative, titleCase } from '../../../shared/lib/format'

const TYPES = ['general', 'announcement', 'promotion']
const AUDIENCES = [
  { value: 'all', label: 'Everyone' },
  { value: 'buyers', label: 'Buyers' },
  { value: 'sellers', label: 'Sellers' },
  { value: 'campus', label: 'One campus' },
]
const TYPE_TONE = { general: 'neutral', announcement: 'info', promotion: 'violet', order: 'success', message: 'brand' }

// Starting points only — every field is editable before sending.
const TEMPLATES = [
  {
    name: 'Safety reminder',
    title: 'Meet safely on campus',
    message: 'Meet at a public spot on campus, check the item before paying, and never share OTPs or passwords.',
    type: 'general',
    actionLabel: 'Safety tips',
    actionUrl: '/faq',
  },
  {
    name: 'New feature',
    title: 'Something new on Unideals',
    message: 'Describe the feature in one sentence and why students will care.',
    type: 'announcement',
    actionLabel: 'Try it',
    actionUrl: '/',
  },
  {
    name: 'Scheduled maintenance',
    title: 'Short maintenance window',
    message: 'Unideals will be unavailable for about 30 minutes tonight from 1:00 AM. Chats and listings are safe.',
    type: 'announcement',
    actionLabel: '',
    actionUrl: '',
  },
  {
    name: 'Campus launch',
    title: 'Your campus is live',
    message: 'Buy and sell with verified students from your campus. List your first item in under a minute.',
    type: 'announcement',
    actionLabel: 'Start selling',
    actionUrl: '/upload',
  },
]

const EMPTY_FORM = { title: '', message: '', type: 'general', audience: 'all', campus: '', imageUrl: '', actionLabel: '', actionUrl: '', schedule: 'now', scheduledAt: '' }

const isValidLink = (value) => !value || value.startsWith('/') || /^https:\/\//.test(value)

const localMinDateTime = () => {
  const date = new Date(Date.now() + 5 * 60 * 1000)
  date.setSeconds(0, 0)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const Preview = ({ form }) => (
  <div className="rounded-[28px] border border-line bg-canvas p-3">
    <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-surface-3" />
    <div className="rounded-xl border border-line bg-surface p-3.5" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-center gap-2 text-[11px] text-muted">
        <img src="/favicon.svg" alt="" className="h-5 w-5 rounded-md" />
        Unideals · now
      </div>
      <p className="mt-2 text-sm font-semibold break-words text-fg">{form.title || 'Notification title'}</p>
      <p className="mt-0.5 text-[13px] break-words whitespace-pre-line text-fg-2">{form.message || 'Your message appears here.'}</p>
      {form.imageUrl && (
        <img src={form.imageUrl} alt="" className="mt-2.5 max-h-40 w-full rounded-lg object-cover" onError={(event) => (event.currentTarget.style.display = 'none')} />
      )}
      {form.actionLabel && (
        <span className="mt-3 inline-flex rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-fg">{form.actionLabel}</span>
      )}
    </div>
  </div>
)

const Compose = ({ canWrite, onSent }) => {
  const { showToast } = useToast()
  const campuses = useCampusOptions()
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [estimate, setEstimate] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    let active = true
    if (form.audience === 'campus' && !form.campus) {
      Promise.resolve().then(() => active && setEstimate(null))
      return () => {
        active = false
      }
    }
    notificationsApi
      .getRecipientEstimate({ targetAudience: form.audience, targetCampus: form.audience === 'campus' ? form.campus : null })
      .then((response) => {
        if (active) setEstimate(response.success ? response.data?.count ?? null : null)
      })
    return () => {
      active = false
    }
  }, [form.audience, form.campus])

  const validate = () => {
    if (!form.title.trim()) return 'Add a title.'
    if (!form.message.trim()) return 'Add a message.'
    if (form.audience === 'campus' && !form.campus) return 'Pick a campus.'
    if (form.imageUrl && !/^https:\/\//.test(form.imageUrl)) return 'Image URL must start with https://'
    if (!isValidLink(form.actionUrl)) return 'Button link must be an app path like /faq or an https:// URL.'
    if (form.actionLabel && !form.actionUrl) return 'Add a link for the button, or clear the button label.'
    if (form.schedule === 'scheduled') {
      if (!form.scheduledAt) return 'Pick a date and time.'
      if (new Date(form.scheduledAt).getTime() < Date.now() + 60_000) return 'Schedule at least a minute in the future.'
    }
    return ''
  }

  const review = (event) => {
    event.preventDefault()
    const message = validate()
    setError(message)
    if (!message) setConfirming(true)
  }

  const send = async () => {
    setSending(true)
    try {
      await notificationsApi.sendNotification({
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        target_audience: form.audience,
        target_campus: form.audience === 'campus' ? form.campus : null,
        image_url: form.imageUrl.trim() || null,
        action_url: form.actionUrl.trim() || null,
        action_label: form.actionLabel.trim() || null,
        schedule_type: form.schedule,
        scheduled_at: form.schedule === 'scheduled' ? new Date(form.scheduledAt).toISOString() : null,
      })
      showToast({ type: 'success', message: form.schedule === 'scheduled' ? 'Notification scheduled' : 'Notification sent' })
      setForm(EMPTY_FORM)
      setConfirming(false)
      onSent(form.schedule)
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Could not send notification' })
    } finally {
      setSending(false)
    }
  }

  const campusName = campuses.find((campus) => campus.id === form.campus)?.name
  const audienceLabel = form.audience === 'campus' ? campusName || 'a campus' : AUDIENCES.find((a) => a.value === form.audience)?.label

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader
          title="Compose"
          icon={Send}
          actions={
            <button type="button" onClick={() => setShowTemplates(true)} className="btn btn-secondary btn-sm">
              <LayoutTemplate className="h-3.5 w-3.5" /> Templates
            </button>
          }
        />
        <form onSubmit={review} className="space-y-5 p-5">
          {!canWrite && <InlineAlert tone="info">Your role can't send notifications. You can draft and preview.</InlineAlert>}
          {error && <InlineAlert>{error}</InlineAlert>}

          <Field label="Title" hint={`${form.title.length}/100`}>
            <input className="input" maxLength={100} value={form.title} onChange={(e) => set('title')(e.target.value)} placeholder="Short and specific" />
          </Field>
          <Field label="Message" hint={`${form.message.length}/500`}>
            <textarea className="input" rows={4} maxLength={500} value={form.message} onChange={(e) => set('message')(e.target.value)} placeholder="What should students know or do?" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <Select label="Type" value={form.type} onChange={set('type')} options={TYPES.map((t) => ({ value: t, label: titleCase(t) }))} />
            </Field>
            <Field label="Audience" hint={estimate === null ? 'Estimating…' : `≈ ${formatNumber(estimate)} recipients`}>
              <Select label="Audience" value={form.audience} onChange={set('audience')} options={AUDIENCES} />
            </Field>
          </div>

          {form.audience === 'campus' && (
            <Field label="Campus">
              <Select
                label="Campus"
                value={form.campus}
                onChange={set('campus')}
                options={[{ value: '', label: 'Choose a campus…' }, ...campuses.map((c) => ({ value: c.id, label: c.name }))]}
              />
            </Field>
          )}

          <details className="group rounded-xl border border-line">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-fg-2 select-none">
              Image & button <span className="font-normal text-muted">(optional)</span>
            </summary>
            <div className="space-y-4 border-t border-line p-4">
              <Field label="Image URL" hint="https:// only">
                <input className="input" value={form.imageUrl} onChange={(e) => set('imageUrl')(e.target.value)} placeholder="https://…" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Button label">
                  <input className="input" maxLength={30} value={form.actionLabel} onChange={(e) => set('actionLabel')(e.target.value)} placeholder="View listing" />
                </Field>
                <Field label="Button link" hint="App path (/faq) or https:// URL">
                  <input className="input" value={form.actionUrl} onChange={(e) => set('actionUrl')(e.target.value)} placeholder="/faq" />
                </Field>
              </div>
            </div>
          </details>

          <div className="space-y-3">
            <span className="label">Delivery</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { value: 'now', label: 'Send now', icon: Send },
                { value: 'scheduled', label: 'Schedule', icon: CalendarClock },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('schedule')(value)}
                  className={cx(
                    'flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold transition',
                    form.schedule === value ? 'border-brand bg-brand-soft text-fg' : 'border-line text-fg-2 hover:border-line-strong',
                  )}
                >
                  <Icon className={cx('h-4 w-4', form.schedule === value ? 'text-brand-fg' : 'text-muted')} /> {label}
                </button>
              ))}
            </div>
            {form.schedule === 'scheduled' && (
              <input type="datetime-local" className="input sm:max-w-xs" min={localMinDateTime()} value={form.scheduledAt} onChange={(e) => set('scheduledAt')(e.target.value)} />
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-line pt-5">
            <button type="button" onClick={() => setForm(EMPTY_FORM)} className="btn btn-ghost">Clear</button>
            <button type="submit" disabled={!canWrite} className="btn btn-primary">
              {form.schedule === 'scheduled' ? <CalendarClock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              Review & {form.schedule === 'scheduled' ? 'schedule' : 'send'}
            </button>
          </div>
        </form>
      </Card>

      <div className="space-y-3 xl:sticky xl:top-24 xl:self-start">
        <p className="eyebrow">Preview</p>
        <Preview form={form} />
        <p className="text-xs text-muted">Appearance varies by device. Recipients: {audienceLabel}{estimate !== null && ` (≈ ${formatNumber(estimate)})`}.</p>
      </div>

      <Dialog open={showTemplates} onClose={() => setShowTemplates(false)} title="Templates" description="Pick a starting point, then edit it." size="lg">
        <div className="grid gap-3 sm:grid-cols-2">
          {TEMPLATES.map((template) => (
            <button
              key={template.name}
              type="button"
              onClick={() => {
                setForm((current) => ({ ...current, title: template.title, message: template.message, type: template.type, actionLabel: template.actionLabel, actionUrl: template.actionUrl }))
                setShowTemplates(false)
              }}
              className="rounded-xl border border-line p-4 text-left transition hover:border-brand hover:bg-brand-soft"
            >
              <Badge tone={TYPE_TONE[template.type]}>{template.name}</Badge>
              <p className="mt-2.5 text-sm font-semibold text-fg">{template.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted">{template.message}</p>
            </button>
          ))}
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={send}
        loading={sending}
        title={form.schedule === 'scheduled' ? 'Schedule this notification?' : 'Send this notification now?'}
        description={`To ${audienceLabel}${estimate !== null ? ` — about ${formatNumber(estimate)} people` : ''}${form.schedule === 'scheduled' && form.scheduledAt ? `, on ${formatDateTime(form.scheduledAt)}` : ''}. Sent notifications can't be recalled.`}
        confirmLabel={form.schedule === 'scheduled' ? 'Schedule' : 'Send now'}
      >
        <Preview form={form} />
      </ConfirmDialog>
    </div>
  )
}

const HistoryTab = ({ version }) => {
  const [page, setPage] = useState(1)
  const load = useCallback(() => notificationsApi.getHistory(page, 15), [page, version]) // eslint-disable-line react-hooks/exhaustive-deps
  const { data, loading, error, refetch } = useFetch(load)
  const items = data?.items || []

  return (
    <Card className="overflow-hidden">
      {loading && !data ? (
        <TableSkeleton rows={6} columns={5} />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState icon={History} title="Nothing sent yet" message="Broadcasts you send will be listed here with delivery stats." />
      ) : (
        <div className="overflow-x-auto">
          <table className="table min-w-[860px]">
            <thead>
              <tr>
                <th>Notification</th>
                <th>Audience</th>
                <th className="text-right">Sent</th>
                <th className="text-right">Delivered</th>
                <th className="text-right">Clicked</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div className="flex items-start gap-2">
                      <Badge tone={TYPE_TONE[item.type]}>{item.type}</Badge>
                      <div className="min-w-0">
                        <p className="max-w-[320px] truncate font-semibold text-fg">{item.title}</p>
                        <p className="max-w-[320px] truncate text-xs text-muted">{item.message}</p>
                      </div>
                    </div>
                  </td>
                  <td>{item.target_audience === 'campus' ? item.target_campus?.name || 'Campus' : titleCase(item.target_audience)}</td>
                  <td className="text-right tabular-nums">{formatNumber(item.stats?.total_sent)}</td>
                  <td className="text-right tabular-nums">{formatNumber(item.stats?.delivered)}</td>
                  <td className="text-right tabular-nums">{formatNumber(item.stats?.clicked)}</td>
                  <td className="whitespace-nowrap" title={formatDateTime(item.createdAt)}>
                    {formatRelative(item.createdAt)}
                    {item.sent_by?.name && <p className="text-xs text-subtle">by {item.sent_by.name}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} limit={15} onPageChange={setPage} />}
    </Card>
  )
}

const ScheduledTab = ({ canWrite, version, onChanged }) => {
  const { showToast } = useToast()
  const load = useCallback(() => notificationsApi.getScheduled(), [version]) // eslint-disable-line react-hooks/exhaustive-deps
  const { data, loading, error, refetch } = useFetch(load)
  const [cancelling, setCancelling] = useState(null)
  const [working, setWorking] = useState(false)
  const items = data || []

  const cancel = async () => {
    setWorking(true)
    try {
      await notificationsApi.cancelScheduled(cancelling._id)
      showToast({ type: 'success', message: 'Scheduled notification cancelled' })
      setCancelling(null)
      refetch()
      onChanged()
    } catch (err) {
      showToast({ type: 'error', message: err.message })
    } finally {
      setWorking(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      {loading && !data ? (
        <TableSkeleton rows={4} columns={4} />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Nothing scheduled" message="Scheduled broadcasts wait here until they go out." />
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item._id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info-soft text-info">
                <CalendarClock className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-fg">{item.title}</p>
                <p className="truncate text-sm text-muted">{item.message}</p>
                <p className="mt-1 text-xs text-fg-2">
                  {formatDateTime(item.scheduled_at)} <span className="text-subtle">({formatRelative(item.scheduled_at)})</span> ·{' '}
                  {item.target_audience === 'campus' ? item.target_campus?.name || 'Campus' : titleCase(item.target_audience)}
                </p>
              </div>
              {canWrite && (
                <button type="button" onClick={() => setCancelling(item)} className="btn btn-danger btn-sm">
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        onConfirm={cancel}
        loading={working}
        tone="danger"
        title="Cancel this scheduled notification?"
        description={cancelling ? `“${cancelling.title}” will not be sent.` : ''}
        confirmLabel="Cancel notification"
      />
    </Card>
  )
}

const Notification = () => {
  const { can } = useAuth()
  const canWrite = can('notifications', 'manage')
  const { filters, setFilter } = useListFilters({ tab: 'compose' })
  const [version, setVersion] = useState(0)
  const { data: stats, refetch: refetchStats } = useFetch(notificationsApi.getStats)
  const { data: scheduled } = useFetch(useCallback(() => notificationsApi.getScheduled(), [version])) // eslint-disable-line react-hooks/exhaustive-deps

  const bump = () => {
    setVersion((value) => value + 1)
    refetchStats()
  }

  return (
    <div>
      <PageHeader title="Push notifications" description="Broadcast to students on the web app and mobile." icon={Bell} />

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Total sent" icon={Send} value={formatNumber(stats?.totalSent)} loading={!stats} />
        <StatCard label="Delivered" icon={CheckCheck} tone="success" value={formatNumber(stats?.delivered)} hint={stats ? `${stats.deliveredPercent}% of sent` : ''} loading={!stats} />
        <StatCard label="Clicked" icon={MousePointerClick} tone="violet" value={formatNumber(stats?.clicked)} hint={stats ? `${stats.clickedPercent}% of sent` : ''} loading={!stats} />
        <StatCard label="Reachable users" icon={Users} tone="info" value={formatNumber(stats?.activeUsers)} loading={!stats} />
      </div>

      <Tabs
        className="mb-4"
        value={filters.tab}
        onChange={(value) => setFilter('tab', value)}
        tabs={[
          { value: 'compose', label: 'Compose' },
          { value: 'history', label: 'History' },
          { value: 'scheduled', label: 'Scheduled', count: scheduled ? scheduled.length : undefined },
        ]}
      />

      {filters.tab === 'compose' && <Compose canWrite={canWrite} onSent={(mode) => { bump(); setFilter('tab', mode === 'scheduled' ? 'scheduled' : 'history') }} />}
      {filters.tab === 'history' && <HistoryTab version={version} />}
      {filters.tab === 'scheduled' && <ScheduledTab canWrite={canWrite} version={version} onChanged={bump} />}
    </div>
  )
}

export default memo(Notification)
