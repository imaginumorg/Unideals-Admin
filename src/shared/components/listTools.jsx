/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bookmark, BookmarkPlus, Check, Minus, Trash2, X } from 'lucide-react'
import { savedViewsApi } from '../lib/savedViewsApi'
import { useToast } from './ToastContext'
import { Field, InlineAlert, Dialog, Spinner, cx } from './ui'

/* ─── Selection ──────────────────────────────────────────────────────── */

/**
 * Row selection for the rows currently on screen. Selection resets when
 * the visible rows change (new page, new filter), so a bulk action can
 * never hit rows the admin can't see.
 */
export const useSelection = (rows) => {
  const visibleIds = useMemo(() => rows.map((row) => row.id), [rows])
  const key = visibleIds.join(',')
  const [state, setState] = useState({ key, ids: new Set() })
  const selected = state.key === key ? state.ids : new Set()

  const toggle = useCallback(
    (id) =>
      setState((current) => {
        const ids = new Set(current.key === key ? current.ids : [])
        if (ids.has(id)) ids.delete(id)
        else ids.add(id)
        return { key, ids }
      }),
    [key],
  )
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))
  const someSelected = selected.size > 0 && !allSelected
  const toggleAll = useCallback(
    () => setState({ key, ids: allSelected ? new Set() : new Set(visibleIds) }),
    [key, allSelected, visibleIds],
  )
  const clear = useCallback(() => setState({ key, ids: new Set() }), [key])

  return { selected, selectedIds: [...selected], count: selected.size, toggle, toggleAll, allSelected, someSelected, clear }
}

export const Checkbox = ({ checked, indeterminate = false, onChange, label }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={indeterminate ? 'mixed' : checked}
    aria-label={label}
    onClick={(event) => {
      event.stopPropagation()
      onChange()
    }}
    className={cx(
      'flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition',
      checked || indeterminate ? 'border-brand bg-brand text-white' : 'border-line-strong bg-surface hover:border-brand',
    )}
  >
    {indeterminate ? <Minus className="h-3 w-3" strokeWidth={3} /> : checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
  </button>
)

/**
 * Floating bar shown while rows are selected.
 * actions: [{ key, label, icon, tone: 'danger'|'secondary'|'primary' }]
 */
export const BulkBar = ({ count, noun = 'item', actions, onAction, onClear, busy }) => {
  if (!count) return null
  return (
    <div className="pop animate-pop-in fixed bottom-5 left-1/2 z-40 flex w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 flex-wrap items-center gap-2 px-4 py-3">
      <span className="mr-auto text-sm font-semibold text-fg">
        {count} {noun}
        {count === 1 ? '' : 's'} selected
      </span>
      {actions.map(({ key, label, icon: Icon, tone }) => (
        <button
          key={key}
          type="button"
          disabled={busy}
          onClick={() => onAction(key)}
          className={cx('btn btn-sm', tone === 'danger' ? 'btn-danger' : tone === 'primary' ? 'btn-primary' : 'btn-secondary')}
        >
          {Icon && <Icon className="h-3.5 w-3.5" />} {label}
        </button>
      ))}
      <button type="button" onClick={onClear} disabled={busy} aria-label="Clear selection" className="btn btn-ghost btn-sm btn-icon h-8 w-8">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

/**
 * Confirm a bulk action with an optional reason; shows per-item failures
 * from the server's result afterwards.
 */
export const BulkConfirmDialog = ({ open, title, description, confirmLabel, tone = 'primary', askReason = true, onClose, onConfirm }) => {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [failures, setFailures] = useState(null)

  const close = () => {
    if (busy) return
    setReason('')
    setFailures(null)
    onClose()
  }

  const confirm = async () => {
    setBusy(true)
    const result = await onConfirm(reason.trim())
    setBusy(false)
    const failed = result?.results?.filter((r) => !r.ok) || []
    if (failed.length) setFailures(failed)
    else close()
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={failures ? 'Some items could not be updated' : title}
      description={failures ? `${failures.length} failed. The rest were updated.` : description}
      size="sm"
      footer={
        failures ? (
          <button type="button" onClick={close} className="btn btn-primary">Done</button>
        ) : (
          <>
            <button type="button" onClick={close} disabled={busy} className="btn btn-secondary">Cancel</button>
            <button
              type="button"
              onClick={confirm}
              disabled={busy}
              className={cx('btn', tone === 'danger' ? 'bg-danger text-white hover:brightness-110' : 'btn-primary')}
            >
              {busy && <Spinner />} {confirmLabel}
            </button>
          </>
        )
      }
    >
      {failures ? (
        <ul className="max-h-60 space-y-1.5 overflow-y-auto text-sm">
          {failures.map((f) => (
            <li key={f.id} className="flex justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2">
              <span className="truncate font-mono text-xs text-muted">{f.id}</span>
              <span className="text-danger">{f.error}</span>
            </li>
          ))}
        </ul>
      ) : (
        askReason && (
          <Field label="Reason" hint="Saved to the audit log and shown to affected sellers.">
            <textarea className="input" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        )
      )}
    </Dialog>
  )
}

/* ─── Saved views ─────────────────────────────────────────────────────── */

/**
 * Per-staff saved filters for a list page. A view stores the URL query, so
 * applying it is just navigation.
 */
export const SavedViews = ({ page }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [views, setViews] = useState([])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const ref = useRef(null)

  const currentQuery = useMemo(() => {
    const params = new URLSearchParams(location.search)
    params.delete('page')
    return params.toString()
  }, [location.search])

  const load = useCallback(async () => {
    const response = await savedViewsApi.list(page)
    if (response.success) setViews(response.data || [])
  }, [page])

  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    if (!open) return undefined
    const onPointer = (event) => ref.current && !ref.current.contains(event.target) && setOpen(false)
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [open])

  const active = views.find((view) => view.query === currentQuery && currentQuery)

  const save = async () => {
    setError('')
    if (!name.trim()) return setError('Give the view a name.')
    setBusy(true)
    const response = await savedViewsApi.create({ page, name: name.trim(), query: currentQuery })
    setBusy(false)
    if (!response.success) return setError(response.message)
    setSaving(false)
    setName('')
    showToast({ type: 'success', message: 'View saved' })
    load()
  }

  const remove = async (view) => {
    const response = await savedViewsApi.remove(view.id)
    if (!response.success) return showToast({ type: 'error', message: response.message })
    setViews((current) => current.filter((v) => v.id !== view.id))
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className={cx('btn', active ? 'btn-primary' : 'btn-secondary')}>
        <Bookmark className="h-4 w-4" /> {active ? active.name : 'Views'}
      </button>
      {open && (
        <div className="pop animate-pop-in absolute top-full right-0 z-30 mt-2 w-72 p-1.5">
          <p className="eyebrow px-2.5 pt-1.5 pb-1.5">Saved views</p>
          {views.length === 0 && <p className="px-2.5 pb-2 text-xs text-muted">No saved views yet. Set filters, then save them here.</p>}
          {views.map((view) => (
            <div key={view.id} className="group flex items-center rounded-lg hover:bg-surface-2">
              <button
                type="button"
                onClick={() => {
                  navigate({ search: view.query ? `?${view.query}` : '' })
                  setOpen(false)
                }}
                className={cx('flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left text-sm', active?.id === view.id ? 'text-fg' : 'text-fg-2')}
              >
                {active?.id === view.id ? <Check className="h-3.5 w-3.5 shrink-0 text-brand-fg" /> : <span className="w-3.5 shrink-0" />}
                <span className="truncate">{view.name}</span>
              </button>
              <button
                type="button"
                aria-label={`Delete view ${view.name}`}
                onClick={() => remove(view)}
                className="mr-1 rounded-md p-1.5 text-subtle opacity-0 transition group-hover:opacity-100 hover:text-danger"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="my-1 h-px bg-line" />
          <button
            type="button"
            disabled={!currentQuery}
            onClick={() => {
              setOpen(false)
              setSaving(true)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-fg-2 hover:bg-surface-2 disabled:opacity-50"
            title={currentQuery ? '' : 'Apply some filters first'}
          >
            <BookmarkPlus className="h-4 w-4 text-muted" /> Save current filters
          </button>
        </div>
      )}

      <Dialog
        open={saving}
        onClose={() => setSaving(false)}
        title="Save this view"
        description="Saves the current filters so you can return to them in one click. Only you can see it."
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setSaving(false)} className="btn btn-secondary">Cancel</button>
            <button type="button" onClick={save} disabled={busy} className="btn btn-primary">{busy && <Spinner />} Save view</button>
          </>
        }
      >
        <div className="space-y-3">
          {error && <InlineAlert>{error}</InlineAlert>}
          <Field label="Name">
            <input
              className="input"
              autoFocus
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              placeholder="e.g. Blocked electronics at VIT"
            />
          </Field>
          <p className="font-mono text-[11px] break-all text-subtle">?{currentQuery}</p>
        </div>
      </Dialog>
    </div>
  )
}
