import { memo, useContext, useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown } from 'lucide-react'
import { AnalyticsRangeContext } from '../context/AnalyticsRangeContext'
import { PRESETS, fromKey, isDayKey, toKey } from '../lib/dateRange'
import { cx, usePresence } from '../components/ui'

/**
 * Date range picker: presets plus a custom range. Uses the portal-wide
 * analytics range unless `value` + `onChange` are passed (the Audit log
 * drives its table filters with it).
 */
const DateRangeFilter = ({ value, onChange, align = 'end', className }) => {
  const shared = useContext(AnalyticsRangeContext)
  const range = value ?? shared?.range
  const setRange = onChange ?? shared?.setRange
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({ from: '', to: '' })
  const { mounted, state } = usePresence(open, 120)
  const rootRef = useRef(null)
  const today = toKey(new Date())

  useEffect(() => {
    if (!open) return undefined
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = () => {
    if (!open) setDraft({ from: range.from, to: range.to })
    setOpen((v) => !v)
  }

  const pick = (preset) => {
    setRange({ preset })
    setOpen(false)
  }

  // The API accepts up to 3 years per request.
  const tooLong = isDayKey(draft.from) && isDayKey(draft.to) && (fromKey(draft.to) - fromKey(draft.from)) / 86_400_000 > 3 * 365
  const validDraft = isDayKey(draft.from) && isDayKey(draft.to) && draft.from <= draft.to && draft.to <= today && !tooLong
  const apply = (event) => {
    event.preventDefault()
    if (!validDraft) return
    setRange({ preset: 'custom', from: draft.from, to: draft.to })
    setOpen(false)
  }

  if (!range || !setRange) return null

  return (
    <div ref={rootRef} className={cx('relative', className)}>
      <button type="button" onClick={toggle} aria-haspopup="dialog" aria-expanded={open} className="btn btn-secondary max-w-full">
        <CalendarDays className="h-4 w-4 shrink-0 text-muted" />
        <span className="truncate">{range.label}</span>
        {range.preset !== 'custom' && range.preset !== 'today' && <span className="hidden truncate text-subtle md:inline">· {range.span}</span>}
        <ChevronDown className={cx('h-3.5 w-3.5 shrink-0 text-subtle transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {mounted && (
        <div
          role="dialog"
          aria-label="Choose date range"
          data-presence="popover"
          data-state={state}
          className={cx(
            'pop absolute top-full z-40 mt-1.5 w-[288px] max-w-[calc(100vw-32px)] origin-top p-1.5',
            align === 'start' ? 'left-0' : align === 'responsive' ? 'left-0 sm:right-0 sm:left-auto' : 'right-0',
          )}
        >
          <ul className="space-y-px">
            {PRESETS.map((preset) => (
              <li key={preset.key}>
                <button
                  type="button"
                  onClick={() => pick(preset.key)}
                  className={cx(
                    'flex h-8 w-full items-center justify-between rounded-md px-2.5 text-left text-[13px] transition-colors hover:bg-surface-2',
                    range.preset === preset.key ? 'font-medium text-fg' : 'text-fg-2',
                  )}
                >
                  {preset.label}
                  {range.preset === preset.key && <Check className="h-3.5 w-3.5 text-brand-fg" />}
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={apply} className="mt-1.5 border-t border-line px-1.5 pt-2.5 pb-1">
            <p className="eyebrow mb-2">Custom range</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-[11px] text-muted">From</span>
                <input
                  type="date"
                  className="input h-8 px-2 text-xs"
                  value={draft.from}
                  max={draft.to || today}
                  onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] text-muted">To</span>
                <input
                  type="date"
                  className="input h-8 px-2 text-xs"
                  value={draft.to}
                  min={draft.from || undefined}
                  max={today}
                  onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                />
              </label>
            </div>
            {tooLong && <p className="mt-2 text-[11px] text-danger">Pick a range of 3 years or less.</p>}
            <button type="submit" disabled={!validDraft} className="btn btn-primary btn-sm mt-2.5 w-full">
              Apply range
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default memo(DateRangeFilter)
