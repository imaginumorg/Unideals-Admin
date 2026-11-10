import { memo, useState } from 'react'
import { Eye, KeyRound, Lock, PencilLine, RotateCcw, ShieldCheck } from 'lucide-react'
import { accessApi } from '../api/accessApi'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/components/ToastContext'
import { Badge, Card, CardHeader, ErrorState, PageHeader, Skeleton, Spinner, Toggle, cx } from '../../../shared/components/ui'
import { formatRelative } from '../../../shared/lib/format'

// manage needs view; sections without actions can't be managed.
const normalize = (features, permissions) =>
  Object.fromEntries(
    features.map((f) => {
      const p = permissions?.[f.key] || {}
      const view = Boolean(p.view)
      return [f.key, { view, manage: Boolean(f.manage && view && p.manage) }]
    }),
  )

const countChanges = (features, a, b) =>
  features.reduce((n, f) => n + (a[f.key].view !== b[f.key].view) + (a[f.key].manage !== b[f.key].manage), 0)

const RoleAccess = () => {
  const { data, loading, error, refetch } = useFetch(accessApi.get)
  const { reloadAccess } = useAuth()
  const { showToast } = useToast()
  const [draft, setDraft] = useState(null) // edits on top of the saved policy
  const [saving, setSaving] = useState(false)

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-1/2" />
        <Skeleton className="h-[480px] w-full rounded-xl" />
      </div>
    )
  }
  if (error && !data) return <Card><ErrorState message={error} onRetry={refetch} /></Card>

  const features = data.features || []
  const saved = normalize(features, data.support)
  const current = draft || saved
  const changes = countChanges(features, saved, current)
  const defaults = normalize(features, data.defaults)
  const isDefault = countChanges(features, defaults, current) === 0

  const set = (key, level, value) => {
    const next = { ...current, [key]: { ...current[key], [level]: value } }
    if (level === 'view' && !value) next[key].manage = false
    if (level === 'manage' && value) next[key].view = true
    setDraft(normalize(features, next))
  }
  const setAll = (view, manage) => setDraft(normalize(features, Object.fromEntries(features.map((f) => [f.key, { view, manage }]))))

  const save = async () => {
    setSaving(true)
    const response = await accessApi.updateSupport(current)
    setSaving(false)
    if (!response.success) {
      showToast({ type: 'error', message: response.message })
      return
    }
    showToast({ type: 'success', message: `${response.message}. Support staff see it on their next page load.` })
    setDraft(null)
    await refetch()
    reloadAccess()
  }

  const visible = features.filter((f) => current[f.key].view)
  const editable = features.filter((f) => current[f.key].manage)

  return (
    <div>
      <PageHeader
        title="Roles & access"
        description="Choose which sections Support staff can see and what they can change. Super Admins always have full access. Every change is recorded in the audit log."
        icon={KeyRound}
        actions={
          <button type="button" onClick={() => setDraft(defaults)} disabled={isDefault} className="btn btn-secondary">
            <RotateCcw className="h-4 w-4" /> Reset to default
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden">
          <CardHeader
            title="Support role"
            description={data.updatedAt ? `Last changed ${formatRelative(data.updatedAt)}${data.updatedBy ? ` by ${data.updatedBy}` : ''}` : 'Using the default access'}
            icon={ShieldCheck}
            actions={
              <div className="hidden items-center gap-1 sm:flex">
                <button type="button" onClick={() => setAll(true, false)} className="btn btn-ghost btn-sm">View only</button>
                <button type="button" onClick={() => setAll(true, true)} className="btn btn-ghost btn-sm">Allow everything</button>
              </div>
            }
          />

          {/* Column headings (desktop) */}
          <div className="hidden grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] gap-6 border-b border-line bg-surface-2/40 px-5 py-2.5 text-xs font-medium text-muted md:grid">
            <span>Section</span>
            <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Can see</span>
            <span className="flex items-center gap-1.5"><PencilLine className="h-3.5 w-3.5" /> Can change</span>
          </div>

          <ul className="divide-y divide-line">
            {features.map((feature) => {
              const value = current[feature.key]
              const changed = value.view !== saved[feature.key].view || value.manage !== saved[feature.key].manage
              return (
                <li
                  key={feature.key}
                  className={cx(
                    'grid gap-3 px-5 py-4 transition-colors md:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] md:items-center md:gap-6',
                    changed && 'bg-brand-soft/60',
                  )}
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-fg">
                      {feature.label}
                      {changed && <Badge tone="brand" className="h-[18px] px-1.5 text-[10px]">Unsaved</Badge>}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{feature.description}</p>
                  </div>

                  <label className="flex items-center gap-2.5 text-[13px] text-fg-2">
                    <Toggle checked={value.view} onChange={(v) => set(feature.key, 'view', v)} label={`Support can see ${feature.label}`} />
                    <span className={value.view ? 'text-fg' : 'text-muted'}>{value.view ? 'Visible' : 'Hidden'}</span>
                  </label>

                  {feature.manage ? (
                    <label className={cx('flex items-start gap-2.5 text-[13px]', !value.view && 'opacity-50')}>
                      <span className="pt-px">
                        <Toggle
                          checked={value.manage}
                          disabled={!value.view}
                          onChange={(v) => set(feature.key, 'manage', v)}
                          label={`Support can: ${feature.manage}`}
                        />
                      </span>
                      <span className={value.manage ? 'text-fg' : 'text-muted'}>{feature.manage}</span>
                    </label>
                  ) : (
                    <p className="text-[13px] text-subtle">Read-only section</p>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>

        <div className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          <Card>
            <CardHeader title="What support will see" icon={Eye} />
            <div className="space-y-4 p-5">
              <div>
                <p className="eyebrow mb-2">Sections in their sidebar · {visible.length}</p>
                {visible.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {visible.map((f) => <Badge key={f.key}>{f.label}</Badge>)}
                  </div>
                ) : (
                  <p className="text-[13px] text-muted">Nothing but their own profile.</p>
                )}
              </div>
              <div>
                <p className="eyebrow mb-2">Can change · {editable.length}</p>
                {editable.length ? (
                  <ul className="space-y-1.5 text-[13px] text-fg-2">
                    {editable.map((f) => (
                      <li key={f.key} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        <span><span className="font-medium text-fg">{f.label}:</span> {f.manage}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-muted">View only. They can't change anything.</p>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Always Super Admin only" icon={Lock} />
            <ul className="space-y-2 p-5 text-[13px] text-fg-2">
              {(data.adminOnly || []).map((item) => (
                <li key={item} className="flex gap-2">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-subtle" /> {item}
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-5 py-3 text-xs text-muted">
              The server checks these permissions on every request, so hidden sections can't be reached by URL either.
            </p>
          </Card>
        </div>
      </div>

      {/* Save bar */}
      {changes > 0 && (
        // Sticky inside the content column, so it stays centred on the page
        // whatever the sidebar width.
        <div className="animate-pop-in sticky bottom-4 z-40 mt-6 flex justify-center">
          <div className="pop flex w-full max-w-xl items-center gap-3 px-4 py-3">
            <span className="h-2 w-2 shrink-0 rounded-full bg-warning" />
            <p className="min-w-0 flex-1 text-[13px] text-fg">
              {changes} unsaved change{changes === 1 ? '' : 's'}
            </p>
            <button type="button" onClick={() => setDraft(null)} disabled={saving} className="btn btn-ghost btn-sm">
              Discard
            </button>
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary btn-sm">
              {saving && <Spinner />} Save changes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(RoleAccess)
