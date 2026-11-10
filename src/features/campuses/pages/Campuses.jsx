import { memo, useMemo, useState } from 'react'
import { Building2, CirclePause, CirclePlay, MapPin, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { campusesApi } from '../api/campusesApi'
import { useAuth } from '../../auth/context/AuthContext'
import { useFetch } from '../../../shared/hooks/useFetch'
import { invalidateCampusOptions } from '../../../shared/hooks/useListFilters'
import { useToast } from '../../../shared/components/ToastContext'
import {
  Badge,
  Card,
  ConfirmDialog,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  InlineAlert,
  PageHeader,
  SearchInput,
  Spinner,
  StatCard,
  StatusBadge,
  TableSkeleton,
  Tabs,
  Toggle,
} from '../../../shared/components/ui'
import { formatDate } from '../../../shared/lib/format'

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DOMAIN_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/

const toForm = (campus) => ({
  slug: campus?.slug || '',
  name: campus?.name || '',
  short_name: campus?.short_name || '',
  city: campus?.city || '',
  state: campus?.state || '',
  email_domains: (campus?.email_domains || []).join(', '),
  is_active: campus ? Boolean(campus.is_active) : true,
})

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

const CampusForm = ({ campus, onClose, onSaved }) => {
  const isEdit = Boolean(campus)
  const [form, setForm] = useState(() => toForm(campus))
  const [slugTouched, setSlugTouched] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key, value) =>
    setForm((current) => {
      const next = { ...current, [key]: value }
      if (key === 'short_name' && !slugTouched) next.slug = slugify(value)
      return next
    })

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    const domains = form.email_domains
      .split(/[\s,]+/)
      .map((domain) => domain.trim().toLowerCase().replace(/^@/, ''))
      .filter(Boolean)
    if (!isEdit && !SLUG_RE.test(form.slug)) return setError('Slug can only use lowercase letters, numbers and dashes.')
    if (form.name.trim().length < 2) return setError('Enter the full campus name.')
    if (!form.short_name.trim()) return setError('Enter a short name.')
    const badDomain = domains.find((domain) => !DOMAIN_RE.test(domain))
    if (badDomain) return setError(`“${badDomain}” isn't a valid email domain.`)

    const payload = {
      name: form.name.trim(),
      short_name: form.short_name.trim(),
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      email_domains: domains,
      is_active: form.is_active,
      ...(isEdit ? {} : { slug: form.slug }),
    }
    setSaving(true)
    const response = isEdit ? await campusesApi.updateCampus(campus._id, payload) : await campusesApi.createCampus(payload)
    setSaving(false)
    if (!response.success) return setError(response.message)
    onSaved(isEdit ? 'Campus updated' : 'Campus created')
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={isEdit ? `Edit ${campus.short_name || campus.name}` : 'Add campus'}
      description="Students pick their campus at sign-up; email domains help suggest the right one."
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" form="campus-form" disabled={saving} className="btn btn-primary">
            {saving && <Spinner />} {isEdit ? 'Save changes' : 'Create campus'}
          </button>
        </>
      }
    >
      <form id="campus-form" onSubmit={submit} className="space-y-4">
        {error && <InlineAlert>{error}</InlineAlert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Short name">
            <input className="input" value={form.short_name} onChange={(e) => set('short_name', e.target.value)} placeholder="IIT Delhi" maxLength={40} />
          </Field>
          <Field label="Slug" hint={isEdit ? 'Slugs are permanent' : 'Used in URLs; cannot change later'}>
            <input
              className="input font-mono"
              value={form.slug}
              disabled={isEdit}
              onChange={(e) => {
                setSlugTouched(true)
                set('slug', e.target.value.toLowerCase())
              }}
              placeholder="iit-delhi"
            />
          </Field>
        </div>
        <Field label="Full name">
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Indian Institute of Technology Delhi" maxLength={120} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City">
            <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="New Delhi" maxLength={80} />
          </Field>
          <Field label="State">
            <input className="input" value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="Delhi" maxLength={80} />
          </Field>
        </div>
        <Field label="Email domains" hint="Comma separated, e.g. iitd.ac.in, mail.iitd.ac.in">
          <input className="input" value={form.email_domains} onChange={(e) => set('email_domains', e.target.value)} placeholder="iitd.ac.in" />
        </Field>
        <div className="flex items-center justify-between rounded-xl border border-line p-3.5">
          <div>
            <p className="text-sm font-semibold text-fg">Live</p>
            <p className="text-xs text-muted">Paused campuses are hidden from sign-up and their feeds stop showing.</p>
          </div>
          <Toggle checked={form.is_active} onChange={(value) => set('is_active', value)} label="Campus live" />
        </div>
      </form>
    </Dialog>
  )
}

const RowActions = ({ campus, onEdit, onToggle, onDelete }) => {
  const [open, setOpen] = useState(false)
  const item = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-surface-2'
  return (
    <div className="relative inline-block" onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setOpen(false)}>
      <button type="button" aria-label="Campus actions" onClick={() => setOpen((v) => !v)} className="btn btn-ghost btn-icon h-8 w-8">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="pop animate-pop-in absolute top-full right-0 z-20 mt-1 w-44 p-1 text-left">
          <button type="button" className={`${item} text-fg-2`} onClick={() => { setOpen(false); onEdit() }}>
            <Pencil className="h-4 w-4 text-muted" /> Edit
          </button>
          <button type="button" className={`${item} text-fg-2`} onClick={() => { setOpen(false); onToggle() }}>
            {campus.is_active ? <CirclePause className="h-4 w-4 text-muted" /> : <CirclePlay className="h-4 w-4 text-muted" />}
            {campus.is_active ? 'Pause' : 'Make live'}
          </button>
          <button type="button" className={`${item} text-danger`} onClick={() => { setOpen(false); onDelete() }}>
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

const Campuses = () => {
  const { canWrite } = useAuth()
  const { showToast } = useToast()
  const { data, loading, error, refetch } = useFetch(campusesApi.getCampuses)
  const campuses = useMemo(() => data || [], [data])
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // campus | 'new' | null
  const [pending, setPending] = useState(null) // { campus, kind }
  const [working, setWorking] = useState(false)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return campuses.filter((campus) => {
      if (status === 'active' && !campus.is_active) return false
      if (status === 'paused' && campus.is_active) return false
      if (!q) return true
      return [campus.name, campus.short_name, campus.slug, campus.city, campus.state, ...(campus.email_domains || [])]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q))
    })
  }, [campuses, status, search])

  const activeCount = campuses.filter((campus) => campus.is_active).length

  const afterChange = (message) => {
    invalidateCampusOptions()
    showToast({ type: 'success', message })
    refetch()
  }

  const runPending = async () => {
    const { campus, kind } = pending
    setWorking(true)
    const response =
      kind === 'delete'
        ? await campusesApi.deleteCampus(campus._id)
        : await campusesApi.updateCampus(campus._id, { is_active: !campus.is_active })
    setWorking(false)
    if (!response.success) {
      showToast({ type: 'error', message: response.message })
      return
    }
    setPending(null)
    afterChange(kind === 'delete' ? `${campus.name} deleted` : `${campus.name} ${campus.is_active ? 'paused' : 'is live'}`)
  }

  return (
    <div>
      <PageHeader
        title="Campuses"
        description="Each campus is its own marketplace. Slugs are permanent; pause a campus to hide it."
        icon={Building2}
        actions={
          canWrite && (
            <button type="button" onClick={() => setEditing('new')} className="btn btn-primary">
              <Plus className="h-4 w-4" /> Add campus
            </button>
          )
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total campuses" icon={Building2} value={campuses.length} loading={loading && !data} />
        <StatCard label="Live" icon={CirclePlay} tone="success" value={activeCount} loading={loading && !data} onClick={() => setStatus('active')} />
        <StatCard label="Paused" icon={CirclePause} tone="warning" value={campuses.length - activeCount} loading={loading && !data} onClick={() => setStatus('paused')} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={status}
            onChange={setStatus}
            tabs={[
              { value: 'all', label: 'All', count: campuses.length },
              { value: 'active', label: 'Live', count: activeCount },
              { value: 'paused', label: 'Paused', count: campuses.length - activeCount },
            ]}
          />
          <SearchInput value={search} onChange={setSearch} placeholder="Name, slug, city or domain" className="sm:max-w-xs" />
        </div>

        {loading && !data ? (
          <TableSkeleton rows={6} columns={5} />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={campuses.length ? 'No campuses match' : 'No campuses yet'}
            message={campuses.length ? 'Try another search or filter.' : 'Add the first campus to open its marketplace.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table min-w-[820px]">
              <thead>
                <tr>
                  <th>Campus</th>
                  <th>Location</th>
                  <th>Email domains</th>
                  <th>Status</th>
                  <th>Added</th>
                  {canWrite && <th className="w-12" />}
                </tr>
              </thead>
              <tbody>
                {visible.map((campus) => (
                  <tr key={campus._id}>
                    <td>
                      <p className="font-semibold text-fg">{campus.name}</p>
                      <p className="text-xs text-muted">
                        {campus.short_name} · <span className="font-mono">{campus.slug}</span>
                      </p>
                    </td>
                    <td>
                      {campus.city || campus.state ? (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-subtle" />
                          {[campus.city, campus.state].filter(Boolean).join(', ')}
                        </span>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex max-w-[260px] flex-wrap gap-1">
                        {(campus.email_domains || []).slice(0, 3).map((domain) => <Badge key={domain} className="normal-case">@{domain}</Badge>)}
                        {(campus.email_domains || []).length > 3 && <Badge>+{campus.email_domains.length - 3}</Badge>}
                        {!(campus.email_domains || []).length && <span className="text-subtle">—</span>}
                      </div>
                    </td>
                    <td><StatusBadge status={campus.is_active ? 'active' : 'paused'} label={campus.is_active ? 'Live' : 'Paused'} /></td>
                    <td className="whitespace-nowrap">{formatDate(campus.createdAt)}</td>
                    {canWrite && (
                      <td className="text-right">
                        <RowActions
                          campus={campus}
                          onEdit={() => setEditing(campus)}
                          onToggle={() => setPending({ campus, kind: 'toggle' })}
                          onDelete={() => setPending({ campus, kind: 'delete' })}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && (
        <CampusForm
          campus={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null)
            afterChange(message)
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={runPending}
        loading={working}
        tone={pending?.kind === 'delete' || pending?.campus.is_active ? 'danger' : 'primary'}
        title={
          pending?.kind === 'delete'
            ? `Delete ${pending.campus.name}?`
            : pending?.campus.is_active
              ? `Pause ${pending?.campus.name}?`
              : `Make ${pending?.campus.name} live?`
        }
        description={
          pending?.kind === 'delete'
            ? 'This cannot be undone. Students on this campus will be asked to pick a new one. Campuses that still have listings cannot be deleted — pause them instead.'
            : pending?.campus.is_active
              ? 'New sign-ups can no longer choose it and its feeds are hidden. You can make it live again any time.'
              : 'Students can pick this campus at sign-up and its marketplace becomes visible.'
        }
        confirmLabel={pending?.kind === 'delete' ? 'Delete campus' : pending?.campus.is_active ? 'Pause campus' : 'Make live'}
      />
    </div>
  )
}

export default memo(Campuses)
