import { memo, useCallback, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, Clock, Cpu, Hourglass, Loader, Play, RefreshCw, XCircle } from 'lucide-react'
import { jobsApi } from '../api/jobsApi'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/components/ToastContext'
import { useAttention } from '../../../layouts/AttentionContext'
import {
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Skeleton,
  StatCard,
  cx,
  toneClass,
} from '../../../shared/components/ui'
import { formatDateTime, formatRelative, titleCase } from '../../../shared/lib/format'

const HEALTH = {
  healthy: { label: 'Healthy', tone: 'success', icon: CheckCircle2 },
  failing: { label: 'Failing', tone: 'danger', icon: XCircle },
  overdue: { label: 'Overdue', tone: 'warning', icon: Hourglass },
  running: { label: 'Running', tone: 'info', icon: Loader },
  never_run: { label: 'Not run yet', tone: 'neutral', icon: Clock },
}

const formatDuration = (ms) => {
  if (ms === null || ms === undefined) return '—'
  if (ms < 1000) return `${ms} ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`
  return `${Math.round(ms / 60_000)} min`
}

// { checked: 40, expired: 2 } -> "Checked 40 · Expired 2"
const summarize = (result) => {
  if (!result || typeof result !== 'object') return '—'
  const parts = Object.entries(result).map(([key, value]) => `${titleCase(key.replace(/([A-Z])/g, ' $1'))} ${value}`)
  return parts.length ? parts.join(' · ') : '—'
}

const RunHistory = ({ jobKey }) => {
  const [page, setPage] = useState(1)
  const [onlyFailed, setOnlyFailed] = useState(false)
  const load = useCallback(() => jobsApi.getRuns(jobKey, { page, status: onlyFailed ? 'failed' : '' }), [jobKey, page, onlyFailed])
  const { data, pagination, loading, error, refetch } = useFetch(load)
  const runs = data || []

  return (
    <div className="border-t border-line bg-surface-2/30">
      <div className="flex items-center justify-between px-5 py-3">
        <p className="eyebrow">Run history (30 days)</p>
        <label className="flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={onlyFailed} onChange={(e) => { setOnlyFailed(e.target.checked); setPage(1) }} className="accent-[var(--c-brand)]" />
          Failures only
        </label>
      </div>
      {loading && !data ? (
        <div className="space-y-2 px-5 pb-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} className="py-6" />
      ) : runs.length === 0 ? (
        <p className="px-5 pb-4 text-sm text-muted">No recorded runs. Frequent jobs only keep runs that changed something or failed.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table min-w-[640px]">
            <thead>
              <tr>
                <th>Started</th>
                <th>Result</th>
                <th>Duration</th>
                <th>Trigger</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id}>
                  <td className="whitespace-nowrap">
                    <span title={formatDateTime(run.startedAt)}>{formatRelative(run.startedAt)}</span>
                  </td>
                  <td>
                    {run.status === 'failed' ? (
                      <span className="block max-w-[420px] truncate text-danger" title={run.error}>
                        {run.error?.split('\n')[0] || 'Failed'}
                      </span>
                    ) : (
                      <span className="text-fg-2">{summarize(run.result)}</span>
                    )}
                  </td>
                  <td className="tabular-nums">{formatDuration(run.durationMs)}</td>
                  <td><Badge>{run.trigger}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pagination && pagination.totalPages > 1 && <Pagination {...pagination} onPageChange={setPage} />}
    </div>
  )
}

const Jobs = () => {
  const { canWrite } = useAuth()
  const { showToast } = useToast()
  const { refresh: refreshAttention } = useAttention()
  const { data, loading, refreshing, error, refetch } = useFetch(jobsApi.getJobs)
  const [expanded, setExpanded] = useState(null)
  const [confirmJob, setConfirmJob] = useState(null)
  const [running, setRunning] = useState(false)
  const jobs = data || []

  const counts = jobs.reduce((acc, job) => ({ ...acc, [job.health]: (acc[job.health] || 0) + 1 }), {})

  const runNow = async () => {
    setRunning(true)
    const response = await jobsApi.runNow(confirmJob.key)
    setRunning(false)
    setConfirmJob(null)
    if (!response.success) {
      showToast({ type: 'error', message: response.message })
    } else {
      showToast({
        type: response.data?.status === 'success' ? 'success' : 'error',
        message: response.data?.status === 'success' ? `${confirmJob.name}: ${summarize(response.data.result)}` : response.message,
      })
    }
    refetch()
    refreshAttention()
  }

  return (
    <div>
      <PageHeader
        title="Background jobs"
        description="Scheduled tasks the server runs on its own. Times are server time."
        icon={Cpu}
        actions={
          <button type="button" onClick={refetch} className="btn btn-secondary">
            <RefreshCw className={cx('h-4 w-4', refreshing && 'animate-spin')} /> Refresh
          </button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Jobs" icon={Cpu} value={jobs.length} loading={loading && !data} />
        <StatCard label="Healthy" icon={CheckCircle2} tone="success" value={counts.healthy || 0} loading={loading && !data} />
        <StatCard label="Failing" icon={XCircle} tone="danger" value={counts.failing || 0} loading={loading && !data} />
        <StatCard label="Overdue" icon={Hourglass} tone="warning" value={counts.overdue || 0} hint="No run in over twice its interval" loading={loading && !data} />
      </div>

      {loading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : error && !data ? (
        <Card><ErrorState message={error} onRetry={refetch} /></Card>
      ) : jobs.length === 0 ? (
        <Card><EmptyState icon={Cpu} title="No jobs registered" message="The server reports no scheduled jobs. Is the API running with its scheduler?" /></Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const health = HEALTH[job.health] || HEALTH.never_run
            const HealthIcon = health.icon
            const isOpen = expanded === job.key
            return (
              <Card key={job.key} className={cx('overflow-hidden', job.health === 'failing' && 'border-danger/40')}>
                <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <span className={cx('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', toneClass(health.tone))}>
                      <HealthIcon className={cx('h-4 w-4', job.health === 'running' && 'animate-spin')} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-fg">{job.name}</p>
                        <Badge tone={health.tone} dot>{health.label}</Badge>
                        <Badge><Clock className="h-3 w-3" /> {job.scheduleLabel}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted">{job.description}</p>
                      {job.health === 'failing' && job.lastError && (
                        <p className="mt-2 flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2 font-mono text-xs break-all text-danger">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          {job.lastError.split('\n')[0]}
                          {job.consecutiveFailures > 1 && ` (${job.consecutiveFailures} failures in a row)`}
                        </p>
                      )}
                    </div>
                  </div>

                  <dl className="grid shrink-0 grid-cols-3 gap-x-6 gap-y-1 text-xs lg:w-[420px]">
                    <div>
                      <dt className="text-subtle">Last run</dt>
                      <dd className="font-medium text-fg-2" title={formatDateTime(job.lastRunAt)}>{job.lastRunAt ? formatRelative(job.lastRunAt) : 'Never'}</dd>
                    </div>
                    <div>
                      <dt className="text-subtle">Last success</dt>
                      <dd className="font-medium text-fg-2" title={formatDateTime(job.lastSuccessAt)}>{job.lastSuccessAt ? formatRelative(job.lastSuccessAt) : '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-subtle">Took</dt>
                      <dd className="font-medium text-fg-2">{formatDuration(job.lastDurationMs)}</dd>
                    </div>
                    <div className="col-span-3 mt-1">
                      <dt className="text-subtle">Last result</dt>
                      <dd className="truncate font-medium text-fg-2">{job.lastStatus === 'success' ? summarize(job.lastResult) : '—'}</dd>
                    </div>
                  </dl>

                  <div className="flex shrink-0 gap-2">
                    {canWrite && (
                      <button type="button" disabled={job.running} onClick={() => setConfirmJob(job)} className="btn btn-secondary btn-sm">
                        <Play className="h-3.5 w-3.5" /> Run now
                      </button>
                    )}
                    <button type="button" onClick={() => setExpanded(isOpen ? null : job.key)} className="btn btn-ghost btn-sm" aria-expanded={isOpen}>
                      History <ChevronDown className={cx('h-3.5 w-3.5 transition', isOpen && 'rotate-180')} />
                    </button>
                  </div>
                </div>
                {isOpen && <RunHistory jobKey={job.key} />}
              </Card>
            )
          })}
        </div>
      )}

      <p className="mt-4 text-xs text-subtle">
        Totals since tracking began: runs and failures are counted per job. Failures and runs that changed data are kept for 30 days.
      </p>

      <ConfirmDialog
        open={Boolean(confirmJob)}
        onClose={() => setConfirmJob(null)}
        onConfirm={runNow}
        loading={running}
        title={confirmJob ? `Run “${confirmJob.name}” now?` : ''}
        description={confirmJob ? `${confirmJob.description} It runs immediately, exactly as the scheduled run would, and is recorded as a manual run.` : ''}
        confirmLabel="Run now"
      />
    </div>
  )
}

export default memo(Jobs)
