import { memo, useMemo, useState } from 'react'
import { Building2, Check, Search } from 'lucide-react'
import { Badge, Tabs, cx } from '../../../shared/components/ui'

/**
 * Which campuses' data a support person (or the whole role) covers.
 * value: null = every campus; [] / [ids] = only those (empty is not savable).
 */
const CampusScopePicker = ({ campuses, value, onChange, editable, who, changed, differsFromRole, scopedLabels }) => {
  const [query, setQuery] = useState('')
  const limited = value !== null
  const selected = useMemo(() => new Set(value || []), [value])
  const known = new Set(campuses.map((c) => c.id))
  const missing = (value || []).filter((id) => !known.has(id)).length

  const q = query.trim().toLowerCase()
  const shown = q ? campuses.filter((c) => `${c.name} ${c.shortName}`.toLowerCase().includes(q)) : campuses

  const toggle = (id) => {
    if (!editable) return
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange([...next].sort())
  }
  const setMany = (ids) => onChange([...new Set(ids)].sort())

  const summary = !limited
    ? 'Every campus'
    : value.length === 0
      ? 'No campus picked yet'
      : `${value.length} of ${campuses.length} campus${campuses.length === 1 ? '' : 'es'}`

  return (
    <div className={cx('space-y-3 border-b border-line px-5 py-4 transition-colors', changed && 'bg-brand-soft/60')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-fg">
            <Building2 className="h-4 w-4 text-muted" /> Campuses
            {changed && <Badge tone="brand" className="h-4.5 px-1.5 text-[10px]">Unsaved</Badge>}
            {!changed && differsFromRole && <Badge tone="violet" className="h-4.5 px-1.5 text-[10px]">Differs from role</Badge>}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Whose data {who} can see and act on · <span className="text-fg-2">{summary}</span>
          </p>
        </div>
        {editable ? (
          <Tabs
            className="shrink-0"
            value={limited ? 'some' : 'all'}
            onChange={(next) => onChange(next === 'all' ? null : value || [])}
            tabs={[
              { value: 'all', label: 'All campuses' },
              { value: 'some', label: 'Only some' },
            ]}
          />
        ) : (
          <Badge className="shrink-0">{limited ? 'Only some campuses' : 'All campuses'}</Badge>
        )}
      </div>

      {limited && (
        <div className={cx('space-y-2.5', !editable && 'opacity-60')}>
          {editable && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {campuses.length > 6 && (
                <label className="relative block min-w-0 flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
                  <input
                    className="input pl-8"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Find a campus"
                    aria-label="Find a campus"
                  />
                </label>
              )}
              <div className="flex items-center gap-1 sm:ml-auto">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMany([...(value || []), ...shown.map((c) => c.id)])}>
                  Select {q ? 'shown' : 'all'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMany([])} disabled={!value?.length}>
                  Clear
                </button>
              </div>
            </div>
          )}

          {campuses.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-4 text-center text-[13px] text-muted">No campuses yet.</p>
          ) : shown.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-4 text-center text-[13px] text-muted">No campus matches “{query}”.</p>
          ) : (
            <ul className="grid max-h-72 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-2">
              {shown.map((campus) => {
                const on = selected.has(campus.id)
                return (
                  <li key={campus.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      disabled={!editable}
                      onClick={() => toggle(campus.id)}
                      className={cx(
                        'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors duration-100 disabled:cursor-default',
                        on ? 'border-brand/50 bg-brand-soft' : 'border-line bg-surface-2/40 hover:border-line-strong',
                      )}
                    >
                      <span
                        className={cx(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                          on ? 'border-brand bg-brand text-white' : 'border-line-strong bg-surface-2',
                        )}
                      >
                        {on && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-fg">{campus.name}</span>
                        {campus.shortName && <span className="block truncate text-[11px] text-subtle">{campus.shortName}</span>}
                      </span>
                      {!campus.active && <Badge tone="warning" className="h-4.5 px-1.5 text-[10px]">Paused</Badge>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {editable && value.length === 0 && (
            <p className="text-xs text-warning">Pick at least one campus, or choose All campuses.</p>
          )}
          {missing > 0 && (
            <p className="text-xs text-muted">
              {missing === 1 ? '1 picked campus no longer exists.' : `${missing} picked campuses no longer exist.`} Click All campuses or Clear to tidy up.
            </p>
          )}
        </div>
      )}

      <p className="text-xs leading-5 text-subtle">
        Limits {scopedLabels.join(', ')}. Audit log, Service status and Background jobs stay platform-wide. With a limit, creating or deleting campuses also needs every campus.
      </p>
    </div>
  )
}

export default memo(CampusScopePicker)
