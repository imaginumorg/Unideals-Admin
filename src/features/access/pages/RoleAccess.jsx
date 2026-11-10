import { memo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Building2, Eye, KeyRound, Lock, PencilLine, RotateCcw, ShieldCheck, UserCog, Users } from 'lucide-react'
import { accessApi } from '../api/accessApi'
import CampusScopePicker from '../components/CampusScopePicker'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/components/ToastContext'
import Avatar from '../../../shared/components/Avatar'
import { Badge, Card, CardHeader, ConfirmDialog, ErrorState, InlineAlert, PageHeader, Skeleton, Spinner, Tabs, Toggle, cx } from '../../../shared/components/ui'
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

// Campus limit in the UI: null = every campus, [ids] = only those (sorted).
const toScope = (list) => (Array.isArray(list) && list.length ? [...list].map(String).sort() : null)
const sameScope = (a, b) => (a === null || b === null ? a === b : a.length === b.length && a.every((id, i) => id === b[i]))

const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || 'This person'

/* ─── Who: the role, then each support person ─────────────────────────── */

const SubjectButton = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cx(
      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150',
      active ? 'bg-brand-soft ring-1 ring-brand/40' : 'hover:bg-surface-2',
    )}
  >
    {children}
  </button>
)

const WhoList = ({ staff, selected, onSelect, customCount }) => (
  <Card>
    <CardHeader title="Who" description="Pick the role or one person" icon={Users} />
    <div className="space-y-1 p-2">
      <SubjectButton active={!selected} onClick={() => onSelect(null)}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-brand-fg">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-fg">Support role defaults</span>
          <span className="block truncate text-xs text-muted">
            {staff.length - customCount} of {staff.length} {staff.length === 1 ? 'person follows' : 'people follow'} these
          </span>
        </span>
      </SubjectButton>

      <p className="eyebrow px-3 pt-3 pb-1">Support staff · {staff.length}</p>
      {staff.length === 0 ? (
        <p className="px-3 pb-3 text-[13px] text-muted">
          No support staff yet. Make someone support staff from{' '}
          <Link to="/users" className="font-medium text-brand-fg hover:underline">Users</Link>.
        </p>
      ) : (
        staff.map((person) => (
          <SubjectButton key={person.id} active={selected === person.id} onClick={() => onSelect(person.id)}>
            <Avatar src={person.avatar} name={person.name} className="h-9 w-9 text-xs" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-fg">{person.name}</span>
              <span className="block truncate text-xs text-muted">{person.email}</span>
            </span>
            {person.custom ? <Badge tone="violet">Custom</Badge> : <Badge>Role</Badge>}
          </SubjectButton>
        ))
      )}
    </div>
  </Card>
)

/* ─── Page ────────────────────────────────────────────────────────────── */

const RoleAccess = () => {
  const { data, loading, error, refetch } = useFetch(accessApi.get)
  const { reloadAccess } = useAuth()
  const { showToast } = useToast()
  const [params, setParams] = useSearchParams()
  const [draft, setDraft] = useState(null) // { subject, mode, permissions, campuses } — unsaved edits
  const [saving, setSaving] = useState(false)
  const [pendingSubject, setPendingSubject] = useState(undefined) // switch target while dirty

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
  const staff = data.staff || []
  const campusCatalog = data.campuses || []
  const role = normalize(features, data.support)
  const roleCampuses = toScope(data.supportCampuses)
  const defaults = normalize(features, data.defaults)
  const scopedLabels = features.filter((f) => (data.campusScoped || []).includes(f.key)).map((f) => f.label)

  // Subject: the role (null) or one support person (?person=<id>).
  const personId = params.get('person')
  const person = staff.find((p) => p.id === personId) || null
  const subject = person ? person.id : null

  const savedMode = person ? (person.custom ? 'custom' : 'role') : 'role'
  const savedPermissions = person ? normalize(features, person.permissions) : role
  const savedCampuses = person ? toScope(person.campuses) : roleCampuses
  const live = draft && draft.subject === subject ? draft : null
  const mode = live ? live.mode : savedMode
  const current = live ? live.permissions : savedPermissions
  const currentCampuses = live ? live.campuses : savedCampuses
  // A person following the role shows the role's switches, read-only.
  const shown = person && mode === 'role' ? role : current
  const shownCampuses = person && mode === 'role' ? roleCampuses : currentCampuses
  const editable = !person || mode === 'custom'

  const campusChanged = editable && !sameScope(savedCampuses, currentCampuses)
  const changes =
    (person && mode !== savedMode ? 1 : 0) + (editable ? countChanges(features, savedPermissions, current) : 0) + (campusChanged ? 1 : 0)
  const isRoleDefault = !person && countChanges(features, defaults, current) === 0 && currentCampuses === null
  // "Only some campuses" with none picked can't be saved.
  const campusesIncomplete = editable && Array.isArray(currentCampuses) && currentCampuses.length === 0

  const select = (id) => {
    if (changes > 0) {
      setPendingSubject(id)
      return
    }
    setDraft(null)
    setParams(id ? { person: id } : {}, { replace: true })
  }
  const confirmSwitch = () => {
    setDraft(null)
    setParams(pendingSubject ? { person: pendingSubject } : {}, { replace: true })
    setPendingSubject(undefined)
  }

  const update = (next, campuses = currentCampuses) => setDraft({ subject, mode, permissions: normalize(features, next), campuses })
  const setCampuses = (campuses) => setDraft({ subject, mode, permissions: current, campuses })
  const set = (key, level, value) => {
    const next = { ...current, [key]: { ...current[key], [level]: value } }
    if (level === 'view' && !value) next[key].manage = false
    if (level === 'manage' && value) next[key].view = true
    update(next)
  }
  const setAll = (view, manage) => update(Object.fromEntries(features.map((f) => [f.key, { view, manage }])))
  const setMode = (nextMode) => {
    // Starting custom access begins from what the person has today.
    const fromRole = nextMode === 'custom' && savedMode === 'role'
    setDraft({ subject, mode: nextMode, permissions: fromRole ? role : current, campuses: fromRole ? roleCampuses : currentCampuses })
  }

  const save = async () => {
    if (campusesIncomplete) return
    setSaving(true)
    let response
    if (!person) response = await accessApi.updateSupport(current, currentCampuses || [])
    else if (mode === 'custom') response = await accessApi.updatePerson(person.id, current, currentCampuses || [])
    else response = await accessApi.resetPerson(person.id)
    setSaving(false)
    if (!response.success) {
      showToast({ type: 'error', message: response.message })
      return
    }
    showToast({ type: 'success', message: `${response.message}. It applies on their next page load.` })
    setDraft(null)
    await refetch()
    reloadAccess()
  }

  const visible = features.filter((f) => shown[f.key].view)
  const canChange = features.filter((f) => shown[f.key].manage)
  const who = person ? firstName(person.name) : 'Support staff'
  const campusName = new Map(campusCatalog.map((c) => [c.id, c.name]))
  const shownCampusNames = (shownCampuses || []).map((id) => campusName.get(id) || 'Removed campus')

  return (
    <div>
      <PageHeader
        title="Roles & access"
        description="Set what Support staff can see and change: one default for the role, and custom access for any person who needs something different. Super Admins always have full access. Every change is recorded in the audit log."
        icon={KeyRound}
        actions={
          !person && (
            <button type="button" onClick={() => update(defaults, null)} disabled={isRoleDefault} className="btn btn-secondary">
              <RotateCcw className="h-4 w-4" /> Reset to default
            </button>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          <WhoList staff={staff} selected={subject} onSelect={select} customCount={staff.filter((p) => p.custom).length} />

          <Card>
            <CardHeader title={`What ${person ? firstName(person.name) : 'support'} will see`} icon={Eye} />
            <div className="space-y-4 p-5">
              <div>
                <p className="eyebrow mb-2">Campuses · {shownCampuses ? shownCampuses.length : 'All'}</p>
                {shownCampuses ? (
                  shownCampusNames.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {shownCampusNames.map((name, i) => (
                        <Badge key={`${name}-${i}`} tone="info"><Building2 className="h-3 w-3" /> {name}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-warning">No campus picked yet.</p>
                  )
                ) : (
                  <p className="text-[13px] text-fg-2">Every campus.</p>
                )}
              </div>
              <div>
                <p className="eyebrow mb-2">Sections · {visible.length}</p>
                {visible.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {visible.map((f) => <Badge key={f.key}>{f.label}</Badge>)}
                  </div>
                ) : (
                  <p className="text-[13px] text-muted">Nothing but their own profile.</p>
                )}
              </div>
              <div>
                <p className="eyebrow mb-2">Can change · {canChange.length}</p>
                {canChange.length ? (
                  <ul className="space-y-1.5 text-[13px] text-fg-2">
                    {canChange.map((f) => (
                      <li key={f.key} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        <span><span className="font-medium text-fg">{f.label}:</span> {f.manage}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-muted">View only. Can't change anything.</p>
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
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader
            title={person ? `${person.name}'s access` : 'Support role defaults'}
            description={
              person
                ? person.custom && person.updatedAt
                  ? `Custom access · changed ${formatRelative(person.updatedAt)}${person.updatedBy ? ` by ${person.updatedBy}` : ''}`
                  : 'Follows the Support role defaults'
                : data.updatedAt
                  ? `For everyone without custom access · changed ${formatRelative(data.updatedAt)}${data.updatedBy ? ` by ${data.updatedBy}` : ''}`
                  : 'For everyone without custom access · using the built-in defaults'
            }
            icon={person ? UserCog : ShieldCheck}
            actions={
              editable && (
                <div className="hidden items-center gap-1 sm:flex">
                  <button type="button" onClick={() => setAll(true, false)} className="btn btn-ghost btn-sm">View only</button>
                  <button type="button" onClick={() => setAll(true, true)} className="btn btn-ghost btn-sm">Allow everything</button>
                </div>
              )
            }
          />

          {person && (
            <div className="space-y-3 border-b border-line px-5 py-4">
              <Tabs
                value={mode}
                onChange={setMode}
                tabs={[
                  { value: 'role', label: 'Follow role defaults' },
                  { value: 'custom', label: 'Custom access' },
                ]}
              />
              {mode === 'role' ? (
                <p className="text-[13px] text-muted">
                  {who} gets the Support role defaults below, and changes to the role apply to {who} too. Choose <span className="font-medium text-fg-2">Custom access</span> to give {who} something different.
                </p>
              ) : (
                <InlineAlert tone="info">
                  {who} has their own access. Changes to the Support role defaults won't affect {who} until you switch back to <span className="font-semibold">Follow role defaults</span>.
                </InlineAlert>
              )}
            </div>
          )}

          <CampusScopePicker
            key={subject || 'role'}
            campuses={campusCatalog}
            value={shownCampuses}
            onChange={setCampuses}
            editable={editable}
            who={person ? who : 'support staff'}
            changed={campusChanged}
            differsFromRole={Boolean(person) && mode === 'custom' && !sameScope(currentCampuses, roleCampuses)}
            scopedLabels={scopedLabels}
          />

          <div className="hidden grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] gap-6 border-b border-line bg-surface-2/40 px-5 py-2.5 text-xs font-medium text-muted md:grid">
            <span>Section</span>
            <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Can see</span>
            <span className="flex items-center gap-1.5"><PencilLine className="h-3.5 w-3.5" /> Can change</span>
          </div>

          <ul className={cx('divide-y divide-line', !editable && 'opacity-60')}>
            {features.map((feature) => {
              const value = shown[feature.key]
              const changed = editable && (value.view !== savedPermissions[feature.key].view || value.manage !== savedPermissions[feature.key].manage)
              const differsFromRole = person && mode === 'custom' && (value.view !== role[feature.key].view || value.manage !== role[feature.key].manage)
              return (
                <li
                  key={feature.key}
                  className={cx(
                    'grid gap-3 px-5 py-4 transition-colors md:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] md:items-center md:gap-6',
                    changed && 'bg-brand-soft/60',
                  )}
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-fg">
                      {feature.label}
                      {changed && <Badge tone="brand" className="h-[18px] px-1.5 text-[10px]">Unsaved</Badge>}
                      {!changed && differsFromRole && <Badge tone="violet" className="h-[18px] px-1.5 text-[10px]">Differs from role</Badge>}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{feature.description}</p>
                  </div>

                  <label className="flex items-center gap-2.5 text-[13px] text-fg-2">
                    <Toggle checked={value.view} disabled={!editable} onChange={(v) => set(feature.key, 'view', v)} label={`${who} can see ${feature.label}`} />
                    <span className={value.view ? 'text-fg' : 'text-muted'}>{value.view ? 'Visible' : 'Hidden'}</span>
                  </label>

                  {feature.manage ? (
                    <label className={cx('flex items-start gap-2.5 text-[13px]', !value.view && 'opacity-50')}>
                      <span className="pt-px">
                        <Toggle
                          checked={value.manage}
                          disabled={!editable || !value.view}
                          onChange={(v) => set(feature.key, 'manage', v)}
                          label={`${who} can: ${feature.manage}`}
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
          <p className="border-t border-line px-5 py-3 text-xs text-muted">
            The server checks access on every request, so a hidden section can't be opened by URL either.
          </p>
        </Card>
      </div>

      {changes > 0 && (
        // Sticky inside the content column, so it stays centred on the page.
        <div className="animate-pop-in sticky bottom-4 z-40 mt-6 flex justify-center">
          <div className="pop flex w-full max-w-xl items-center gap-3 px-4 py-3">
            <span className="h-2 w-2 shrink-0 rounded-full bg-warning" />
            <p className="min-w-0 flex-1 truncate text-[13px] text-fg">
              {person && mode === 'role' && savedMode === 'custom'
                ? `${who} goes back to the role defaults`
                : person && mode === 'custom' && savedMode === 'role'
                  ? `Custom access for ${who}`
                  : `${changes} unsaved change${changes === 1 ? '' : 's'}${person ? ` for ${who}` : ' to the role'}`}
            </p>
            <button type="button" onClick={() => setDraft(null)} disabled={saving} className="btn btn-ghost btn-sm">
              Discard
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || campusesIncomplete}
              title={campusesIncomplete ? 'Pick at least one campus first' : undefined}
              className="btn btn-primary btn-sm"
            >
              {saving && <Spinner />} Save
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingSubject !== undefined}
        onClose={() => setPendingSubject(undefined)}
        onConfirm={confirmSwitch}
        title="Discard unsaved changes?"
        description="You have changes that aren't saved yet. Switching now throws them away."
        confirmLabel="Discard and switch"
        tone="danger"
      />
    </div>
  )
}

export default memo(RoleAccess)
