import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  Gauge,
  RefreshCw,
  Server,
  XCircle,
} from 'lucide-react'
import { systemApi } from '../api/jobsApi'
import { useFetch } from '../../../shared/hooks/useFetch'
import { Badge, Card, CardHeader, ErrorState, PageHeader, Skeleton, Tabs, Toggle, cx, toneClass } from '../../../shared/components/ui'
import { formatNumber, formatRelative } from '../../../shared/lib/format'
import { compact } from '../../../shared/charts/primitives'
import { exportRowsCsv } from '../../../shared/charts/analytics'
import ColumnChart from '../../../shared/charts/ColumnChart'
import TrendChart from '../../../shared/charts/TrendChart'
import BarList from '../../../shared/charts/BarList'

const STATE = {
  operational: { label: 'Operational', tone: 'success', icon: CheckCircle2 },
  degraded: { label: 'Degraded', tone: 'warning', icon: AlertTriangle },
  outage: { label: 'Outage', tone: 'danger', icon: XCircle },
  not_configured: { label: 'Not configured', tone: 'neutral', icon: CircleSlash },
}

const OVERALL_COPY = {
  operational: 'All systems operational',
  degraded: 'Some systems are degraded',
  outage: 'Service disruption',
}

const POLL_MS = 30_000

const formatUptime = (seconds) => {
  if (!seconds && seconds !== 0) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d) return `${d}d ${h}h`
  if (h) return `${h}h ${m}m`
  return `${m}m`
}

const ms = (value) => (value === null || value === undefined ? '—' : `${formatNumber(value)} ms`)

const timeOf = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

// Per-minute traffic → rows for the request and latency charts. Minutes with
// no requests have no latency (null), which draws as a gap, not as 0 ms.
const trafficRows = (series) =>
  series.map((point) => ({
    label: timeOf(point.minute),
    title: new Date(point.minute).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }),
    ok: Math.max(0, point.requests - point.serverErrors),
    failed: point.serverErrors,
    p50: point.requests ? point.p50 ?? null : null,
    p95: point.requests ? point.p95 ?? null : null,
  }))

const TRAFFIC_SERIES = [
  { key: 'ok', label: 'Succeeded', color: 'var(--c-chart-1)' },
  { key: 'failed', label: 'Failed (5xx)', color: 'var(--c-chart-error)' },
]
const LATENCY_SERIES = [
  { key: 'p50', label: 'Median', color: 'var(--c-cat-6)' },
  { key: 'p95', label: '95th percentile', color: 'var(--c-cat-2)' },
]

const ComponentRow = ({ component }) => {
  const state = STATE[component.status] || STATE.degraded
  const Icon = state.icon
  return (
    <li className="flex items-center gap-4 px-5 py-3.5">
      <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', toneClass(state.tone))}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg">{component.name}</p>
        <p className="truncate text-xs text-muted">{component.description}</p>
      </div>
      <div className="hidden min-w-0 text-right sm:block">
        <p className="truncate text-xs text-fg-2">{component.detail}</p>
        {component.latencyMs !== null && component.latencyMs !== undefined && (
          <p className="text-[11px] text-subtle tabular-nums">{ms(component.latencyMs)}</p>
        )}
      </div>
      <Badge tone={state.tone} dot className="shrink-0">{state.label}</Badge>
    </li>
  )
}

const ServiceStatus = () => {
  const [windowMinutes, setWindowMinutes] = useState(15)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [rechecking, setRechecking] = useState(false)
  const [compareBy, setCompareBy] = useState('areas')

  const load = useCallback(() => systemApi.getStatus({ window: windowMinutes }), [windowMinutes])
  const { data, loading, refreshing, error, refetch } = useFetch(load)

  // One forced re-probe of external services; regular polls use the cache.
  const recheck = async () => {
    setRechecking(true)
    await systemApi.getStatus({ window: windowMinutes, refresh: true })
    await refetch()
    setRechecking(false)
  }

  useEffect(() => {
    if (!autoRefresh) return undefined
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refetch()
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [autoRefresh, refetch])

  const groups = useMemo(() => {
    const components = data?.components || []
    return {
      core: components.filter((c) => c.group === 'core'),
      external: components.filter((c) => c.group === 'external'),
    }
  }, [data])

  if (error && !data) {
    // If the status endpoint itself can't be reached, that IS the answer.
    return (
      <Card>
        <ErrorState message={`The API did not respond: ${error}. The server may be down.`} onRetry={refetch} />
      </Card>
    )
  }

  const overall = STATE[data?.overall] || STATE.operational
  const OverallIcon = overall.icon
  const traffic = data?.traffic
  const proc = data?.process

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service status"
        description="Live health of the API and the services it depends on."
        actions={
          <>
            <label className="flex items-center gap-2 text-xs text-muted">
              Auto-refresh <Toggle checked={autoRefresh} onChange={setAutoRefresh} label="Auto-refresh every 30 seconds" />
            </label>
            <button type="button" onClick={recheck} disabled={rechecking} className="btn btn-secondary">
              <RefreshCw className={cx('h-4 w-4', (refreshing || rechecking) && 'animate-spin')} /> Recheck now
            </button>
          </>
        }
      />

      {/* Overall banner */}
      {loading && !data ? (
        <Skeleton className="h-20 w-full rounded-xl" />
      ) : (
        <div className={cx('flex items-center gap-3.5 rounded-xl border border-current/15 px-5 py-3.5', toneClass(overall.tone))}>
          <OverallIcon className="h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{OVERALL_COPY[data.overall] || overall.label}</p>
            <p className="text-xs opacity-80">
              Checked {formatRelative(data.checkedAt)} · external services checked {formatRelative(data.externalCheckedAt)}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader title="Core services" description="Inside our own stack" icon={Server} />
          {loading && !data ? (
            <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ul className="divide-y divide-line">{groups.core.map((c) => <ComponentRow key={c.key} component={c} />)}</ul>
          )}
          {groups.core.find((c) => c.key === 'jobs' && c.status !== 'operational') && (
            <p className="border-t border-line px-5 py-3 text-xs text-muted">
              See <Link to="/system/jobs" className="font-semibold text-brand-fg hover:underline">Background jobs</Link> for the failing job and its error.
            </p>
          )}
        </Card>

        <Card className="overflow-hidden">
          <CardHeader title="External services" description="Reachability from our server + credentials set" icon={Activity} />
          {loading && !data ? (
            <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ul className="divide-y divide-line">{groups.external.map((c) => <ComponentRow key={c.key} component={c} />)}</ul>
          )}
          <p className="border-t border-line px-5 py-3 text-xs text-muted">
            “Operational” means the provider answered and keys are present. It can't detect a revoked or wrong key — those show up as failed requests in API traffic.
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title="API traffic"
          description={traffic ? `Since ${formatRelative(traffic.collectingSince)} on this server instance` : ''}
          icon={Gauge}
          actions={
            <Tabs
              value={windowMinutes}
              onChange={setWindowMinutes}
              tabs={[
                { value: 15, label: '15 min' },
                { value: 60, label: '1 hour' },
              ]}
            />
          }
        />
        {loading && !data ? (
          <div className="p-5"><Skeleton className="h-40 w-full" /></div>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
              {[
                { label: 'Requests', value: formatNumber(traffic.totals.requests) },
                {
                  label: 'Failed (5xx)',
                  value: `${traffic.totals.errorRate}%`,
                  sub: `${formatNumber(traffic.totals.serverErrors)} request${traffic.totals.serverErrors === 1 ? '' : 's'}`,
                  tone: traffic.totals.errorRate >= 5 ? 'text-danger' : 'text-fg',
                },
                { label: 'Median response', value: ms(traffic.totals.p50) },
                { label: '95th percentile', value: ms(traffic.totals.p95), tone: traffic.totals.p95 > 2000 ? 'text-warning' : 'text-fg' },
              ].map((item) => (
                <div key={item.label} className="bg-surface px-5 py-4">
                  <dt className="text-xs text-muted">{item.label}</dt>
                  <dd className={cx('mt-1 text-xl font-semibold tabular-nums', item.tone || 'text-fg')}>{item.value}</dd>
                  {item.sub && <dd className="text-[11px] text-subtle">{item.sub}</dd>}
                </div>
              ))}
            </dl>

            <div className="border-t border-line p-5">
              {traffic.totals.requests === 0 ? (
                <p className="py-8 text-center text-sm text-muted">No API requests in this window yet.</p>
              ) : (
                <div className="chart grid gap-8 lg:grid-cols-2">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="eyebrow">Requests per minute</p>
                      <button
                        type="button"
                        onClick={() =>
                          exportRowsCsv(
                            `api-traffic-${windowMinutes}min.csv`,
                            ['Minute', 'Requests', 'Failed (5xx)', 'Median ms', 'p95 ms'],
                            traffic.series.map((p) => [p.minute, p.requests, p.serverErrors, p.p50 ?? '', p.p95 ?? '']),
                          )
                        }
                        className="text-xs font-medium text-brand-fg hover:underline"
                      >
                        Export CSV
                      </button>
                    </div>
                    <ColumnChart rows={trafficRows(traffic.series)} series={TRAFFIC_SERIES} format={formatNumber} height={190} />
                  </div>
                  <div className="min-w-0">
                    <p className="eyebrow mb-1">Response time</p>
                    <TrendChart
                      type="line"
                      rows={trafficRows(traffic.series)}
                      series={LATENCY_SERIES}
                      format={ms}
                      axisFormat={(v) => `${compact(v)}ms`}
                      height={190}
                      brushAt={Infinity}
                    />
                  </div>
                </div>
              )}
            </div>

            {(traffic.areas.length > 0 || groups.core.length > 0) && (
              <div className="chart border-t border-line p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow">Response-time comparison</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {compareBy === 'areas' ? '95th percentile per API area in this window' : 'Latency of the latest health check per service'}
                    </p>
                  </div>
                  <Tabs
                    value={compareBy}
                    onChange={setCompareBy}
                    tabs={[
                      { value: 'areas', label: 'API areas' },
                      { value: 'services', label: 'Services' },
                    ]}
                  />
                </div>
                {compareBy === 'areas' ? (
                  traffic.areas.some((a) => a.p95 !== null && a.p95 !== undefined) ? (
                    <BarList
                      items={traffic.areas.filter((a) => a.p95 !== null && a.p95 !== undefined).map((a) => ({ key: a.area, label: `/api/${a.area}`, value: a.p95, sub: `${formatNumber(a.requests)} req` }))}
                      format={ms}
                      color="var(--c-cat-2)"
                      valueLabel="Slowest"
                      limit={6}
                    />
                  ) : (
                    <p className="py-4 text-sm text-muted">No timed requests in this window yet.</p>
                  )
                ) : (
                  <BarList
                    items={[...groups.core, ...groups.external]
                      .filter((c) => c.latencyMs !== null && c.latencyMs !== undefined)
                      .map((c) => ({ key: c.key, label: c.name, value: c.latencyMs, sub: STATE[c.status]?.label }))}
                    format={ms}
                    color="var(--c-cat-6)"
                    valueLabel="Slowest"
                    limit={10}
                  />
                )}
              </div>
            )}

            {traffic.areas.length > 0 && (
              <div className="overflow-x-auto border-t border-line">
                <table className="table min-w-[620px]">
                  <thead>
                    <tr>
                      <th>API area</th>
                      <th className="text-right">Requests</th>
                      <th className="text-right">4xx</th>
                      <th className="text-right">5xx</th>
                      <th className="text-right">Median</th>
                      <th className="text-right">p95</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traffic.areas.map((area) => (
                      <tr key={area.area}>
                        <td className="font-mono text-[13px] text-fg">/api/{area.area}</td>
                        <td className="text-right tabular-nums">{formatNumber(area.requests)}</td>
                        <td className="text-right tabular-nums">{formatNumber(area.clientErrors)}</td>
                        <td className={cx('text-right tabular-nums', area.serverErrors ? 'font-semibold text-danger' : '')}>
                          {formatNumber(area.serverErrors)}
                        </td>
                        <td className="text-right tabular-nums">{ms(area.p50)}</td>
                        <td className="text-right tabular-nums">{ms(area.p95)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>

      {proc && (
        <Card className="overflow-hidden">
          <CardHeader title="Server" description={`${proc.environment} · Node ${proc.nodeVersion}`} icon={Server} />
          <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
            {[
              { label: 'Uptime', value: formatUptime(proc.uptimeSeconds), sub: `since ${new Date(proc.startedAt).toLocaleString('en-IN')}` },
              { label: 'Memory in use', value: `${proc.memory.rssMb} MB`, sub: `heap ${proc.memory.heapUsedMb} / ${proc.memory.heapTotalMb} MB` },
              { label: 'Event loop lag (p99)', value: ms(proc.eventLoopLagMs.p99), sub: `median ${ms(proc.eventLoopLagMs.p50)}` },
              { label: 'CPU load (1 / 5 / 15 min)', value: proc.loadAverage.join(' / '), sub: `${proc.cpuCount} cores` },
            ].map((item) => (
              <div key={item.label} className="bg-surface px-5 py-4">
                <dt className="text-xs text-muted">{item.label}</dt>
                <dd className="mt-1 text-lg font-semibold text-fg tabular-nums">{item.value}</dd>
                <dd className="text-[11px] text-subtle">{item.sub}</dd>
              </div>
            ))}
          </dl>
          <p className="border-t border-line px-5 py-3 text-xs text-muted">
            Traffic and runtime numbers are for the server instance that answered this page and reset when it restarts.
          </p>
        </Card>
      )}
    </div>
  )
}

export default memo(ServiceStatus)
