import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  Gauge,
  HeartPulse,
  RefreshCw,
  Server,
  XCircle,
} from 'lucide-react'
import { systemApi } from '../api/jobsApi'
import { useFetch } from '../../../shared/hooks/useFetch'
import { Badge, Card, CardHeader, ErrorState, Skeleton, Tabs, Toggle, cx, toneClass } from '../../../shared/components/ui'
import { formatNumber, formatRelative } from '../../../shared/lib/format'

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

/* ─── Traffic chart ─────────────────────────────────────────────────────
 * Requests per minute as bars; failed (5xx) requests are the red segment
 * at the base of each bar. Legend always shown (2 series); hover shows the
 * exact minute. The per-area table below is the table view of this data. */
const TrafficChart = ({ series }) => {
  const [hover, setHover] = useState(null)
  const max = Math.max(1, ...series.map((point) => point.requests))
  const width = 100 / series.length
  const height = 140

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-chart-1" /> Requests</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-chart-error" /> Failed (5xx)</span>
        <span className="ml-auto">Peak {formatNumber(max)}/min</span>
      </div>
      <div className="relative" style={{ height }} onMouseLeave={() => setHover(null)}>
        {/* recessive gridlines */}
        {[0, 0.5, 1].map((f) => (
          <div key={f} className="pointer-events-none absolute right-0 left-0 border-t border-line" style={{ bottom: `${f * 100}%` }} />
        ))}
        <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {series.map((point, index) => {
            const total = (point.requests / max) * (height - 4)
            const failed = (point.serverErrors / max) * (height - 4)
            const x = index * width + width * 0.15
            const w = width * 0.7
            return (
              <g key={point.minute} opacity={hover === null || hover === index ? 1 : 0.45}>
                {total > 0 && <rect x={x} y={height - total} width={w} height={total} rx="0.6" className="fill-chart-1" />}
                {/* 2px surface gap between the stacked segments */}
                {failed > 0 && (
                  <rect x={x} y={height - failed} width={w} height={Math.max(failed, 1.5)} className="fill-chart-error stroke-surface" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                )}
              </g>
            )
          })}
        </svg>
        {/* hit targets wider than the marks */}
        <div className="absolute inset-0 flex">
          {series.map((point, index) => (
            <div key={point.minute} className="h-full flex-1" onMouseEnter={() => setHover(index)} />
          ))}
        </div>
        {hover !== null && series[hover] && (
          <div
            className="pop pointer-events-none absolute -top-2 z-10 w-44 -translate-x-1/2 -translate-y-full px-3 py-2 text-xs"
            style={{ left: `${Math.min(88, Math.max(12, (hover + 0.5) * width))}%` }}
          >
            <p className="font-semibold text-fg">
              {new Date(series[hover].minute).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
            </p>
            <p className="mt-1 flex justify-between text-fg-2"><span>Requests</span><span className="tabular-nums">{series[hover].requests}</span></p>
            <p className="flex justify-between text-fg-2"><span>Failed</span><span className="tabular-nums">{series[hover].serverErrors}</span></p>
            <p className="flex justify-between text-fg-2"><span>p95</span><span className="tabular-nums">{ms(series[hover].p95)}</span></p>
          </div>
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-subtle">
        <span>{series.length} min ago</span>
        <span>now</span>
      </div>
    </div>
  )
}

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 hidden h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-brand-fg sm:flex">
            <HeartPulse className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-fg md:text-2xl">Service status</h1>
            <p className="mt-1 text-sm text-muted">Live health of the API and the services it depends on.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted">
            Auto-refresh <Toggle checked={autoRefresh} onChange={setAutoRefresh} label="Auto-refresh every 30 seconds" />
          </label>
          <button type="button" onClick={recheck} disabled={rechecking} className="btn btn-secondary">
            <RefreshCw className={cx('h-4 w-4', (refreshing || rechecking) && 'animate-spin')} /> Recheck now
          </button>
        </div>
      </div>

      {/* Overall banner */}
      {loading && !data ? (
        <Skeleton className="h-20 w-full rounded-2xl" />
      ) : (
        <div className={cx('flex items-center gap-4 rounded-2xl px-5 py-4', toneClass(overall.tone))}>
          <OverallIcon className="h-6 w-6 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold">{OVERALL_COPY[data.overall] || overall.label}</p>
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
                  sub: `${formatNumber(traffic.totals.serverErrors)} requests`,
                  tone: traffic.totals.errorRate >= 5 ? 'text-danger' : 'text-fg',
                },
                { label: 'Median response', value: ms(traffic.totals.p50) },
                { label: '95th percentile', value: ms(traffic.totals.p95), tone: traffic.totals.p95 > 2000 ? 'text-warning' : 'text-fg' },
              ].map((item) => (
                <div key={item.label} className="bg-surface px-5 py-4">
                  <dt className="text-xs text-muted">{item.label}</dt>
                  <dd className={cx('mt-1 text-xl font-bold tabular-nums', item.tone || 'text-fg')}>{item.value}</dd>
                  {item.sub && <dd className="text-[11px] text-subtle">{item.sub}</dd>}
                </div>
              ))}
            </dl>

            <div className="border-t border-line p-5">
              {traffic.totals.requests === 0 ? (
                <p className="py-8 text-center text-sm text-muted">No API requests in this window yet.</p>
              ) : (
                <TrafficChart series={traffic.series} />
              )}
            </div>

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
                <dd className="mt-1 text-lg font-bold text-fg tabular-nums">{item.value}</dd>
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
