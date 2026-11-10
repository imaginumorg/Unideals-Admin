import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  BadgeCheck,
  Building2,
  CalendarDays,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Monitor,
  Moon,
  Palette,
  Pencil,
  Phone,
  ScrollText,
  ShieldCheck,
  Sun,
  UserCircle2,
} from 'lucide-react'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/components/ToastContext'
import { useTheme } from '../../../shared/context/ThemeContext'
import { profileApi } from '../api/profileApi'
import Avatar from '../../../shared/components/Avatar'
import ActivityRow from '../../../shared/components/ActivityRow'
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Field,
  InlineAlert,
  Skeleton,
  Spinner,
  StatCard,
  cx,
} from '../../../shared/components/ui'
import { formatDate, formatDateTime, formatNumber, formatRelative, roleLabel } from '../../../shared/lib/format'

// What each role can do, shown so staff understand their own access.
const PERMISSIONS = {
  admin: [
    'View every dashboard, user, listing and order',
    'Suspend or reactivate users and change roles',
    'Block, unlist or delete listings',
    'Update order status',
    'Create, pause and delete campuses',
    'Send and schedule push notifications',
    'Approve gender change requests',
    'Resolve and dismiss reports',
  ],
  support: [
    'View every dashboard, user, listing and order',
    'Resolve and dismiss reports',
    'Read the audit log and notification history',
  ],
}

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/

const passwordStrength = (value) => {
  let score = 0
  if (value.length >= 8) score += 1
  if (value.length >= 12) score += 1
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  return Math.min(score, 4)
}
const STRENGTH = [
  { label: 'Too weak', className: 'bg-danger' },
  { label: 'Weak', className: 'bg-danger' },
  { label: 'Fair', className: 'bg-warning' },
  { label: 'Good', className: 'bg-success' },
  { label: 'Strong', className: 'bg-success' },
]

const EditProfileForm = ({ profile, onSaved, onCancel }) => {
  const [name, setName] = useState(profile.name || '')
  const [mobile, setMobile] = useState(profile.mobile || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (name.trim().length < 2) return setError('Name must be at least 2 characters.')
    if (mobile && !/^\d{10}$/.test(mobile)) return setError('Mobile must be 10 digits.')
    setSaving(true)
    const response = await profileApi.updateProfile({ name: name.trim(), mobile: mobile || null })
    setSaving(false)
    if (!response.success) return setError(response.message)
    onSaved(response.data)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <InlineAlert>{error}</InlineAlert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} />
        </Field>
        <Field label="Mobile" hint="10 digits, optional">
          <input
            className="input"
            inputMode="numeric"
            value={mobile}
            onChange={(event) => setMobile(event.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="9876543210"
          />
        </Field>
      </div>
      <Field label="Email" hint="Email and role can only be changed by a Super Admin.">
        <input className="input" value={profile.email} disabled />
      </Field>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving && <Spinner />} Save changes
        </button>
      </div>
    </form>
  )
}

const PasswordInput = ({ value, onChange, autoComplete, placeholder }) => {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        className="input pr-10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-subtle hover:text-fg"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

const ChangePasswordCard = () => {
  const { showToast } = useToast()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const strength = passwordStrength(form.next)
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.current) return setError('Enter your current password.')
    if (!PASSWORD_RULE.test(form.next)) return setError('Use 8+ characters with at least one letter and one number.')
    if (form.next !== form.confirm) return setError('New passwords do not match.')
    setSaving(true)
    const response = await profileApi.changePassword({ currentPassword: form.current, newPassword: form.next })
    setSaving(false)
    if (!response.success) return setError(response.message)
    setForm({ current: '', next: '', confirm: '' })
    showToast({ type: 'success', message: response.message || 'Password changed' })
  }

  return (
    <Card>
      <CardHeader title="Change password" description="Signs out every other session" icon={KeyRound} />
      <form onSubmit={submit} className="space-y-4 p-5">
        {error && <InlineAlert>{error}</InlineAlert>}
        <Field label="Current password">
          <PasswordInput value={form.current} onChange={set('current')} autoComplete="current-password" />
        </Field>
        <Field label="New password">
          <PasswordInput value={form.next} onChange={set('next')} autoComplete="new-password" placeholder="8+ characters, letters & numbers" />
          {form.next && (
            <span className="mt-2 flex items-center gap-2">
              <span className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((index) => (
                  <span key={index} className={cx('h-1 flex-1 rounded-full', index < strength ? STRENGTH[strength].className : 'bg-surface-3')} />
                ))}
              </span>
              <span className="w-16 text-right text-[11px] font-medium text-muted">{STRENGTH[strength].label}</span>
            </span>
          )}
        </Field>
        <Field label="Confirm new password">
          <PasswordInput value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
        </Field>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving && <Spinner />} Update password
          </button>
        </div>
      </form>
    </Card>
  )
}

const AppearanceCard = () => {
  const { preference, setTheme } = useTheme()
  const options = [
    { value: 'dark', label: 'Dark', icon: Moon, hint: 'Default' },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'system', label: 'System', icon: Monitor, hint: 'Follow OS' },
  ]
  return (
    <Card>
      <CardHeader title="Appearance" description="Saved on this device" icon={Palette} />
      <div className="grid grid-cols-3 gap-3 p-5">
        {options.map(({ value, label, icon: Icon, hint }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={cx(
              'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition',
              preference === value ? 'border-brand bg-brand-soft text-fg' : 'border-line text-fg-2 hover:border-line-strong',
            )}
          >
            <Icon className={cx('h-5 w-5', preference === value ? 'text-brand-fg' : 'text-muted')} />
            <span className="font-semibold">{label}</span>
            {hint && <span className="text-[11px] text-muted">{hint}</span>}
          </button>
        ))}
      </div>
    </Card>
  )
}

const Profile = () => {
  const { admin, updateAdmin } = useAuth()
  const { showToast } = useToast()
  const { data: profile, loading, error, refetch } = useFetch(profileApi.getProfile)
  const [editing, setEditing] = useState(false)

  if (error && !profile) {
    return (
      <Card>
        <ErrorState message={error} onRetry={refetch} />
      </Card>
    )
  }

  if (loading && !profile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    )
  }

  const activity = profile.activity || {}
  const role = profile.role || admin?.role

  const handleSaved = (updated) => {
    updateAdmin({ name: updated.name, mobile: updated.mobile })
    setEditing(false)
    refetch()
    showToast({ type: 'success', message: 'Profile updated' })
  }

  return (
    <div className="space-y-6">
      {/* Identity header */}
      <Card className="overflow-hidden">
        <div className="relative h-28 bg-gradient-to-br from-[#2f35f4] via-[#4B45FF] to-[#7472f5]">
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>
        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
            {/* Only the avatar overlaps the banner; the text stays below it. */}
            <Avatar src={profile.avatar} name={profile.name} className="-mt-12 h-24 w-24 text-2xl" ringClassName="ring-4 ring-surface" />
            <div className="min-w-0 sm:pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-fg">{profile.name}</h1>
                <Badge tone={role === 'admin' ? 'brand' : 'info'}>
                  <ShieldCheck className="h-3 w-3" /> {roleLabel(role)}
                </Badge>
                <Badge tone={profile.status === 'active' ? 'success' : 'danger'} dot>
                  {profile.status}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted">{profile.email}</p>
            </div>
          </div>
          {!editing && (
            <button type="button" onClick={() => setEditing(true)} className="btn btn-secondary self-start sm:mt-4">
              <Pencil className="h-4 w-4" /> Edit profile
            </button>
          )}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Actions, last 7 days" icon={Activity} value={formatNumber(activity.last7d)} />
        <StatCard label="Actions, last 30 days" icon={CalendarDays} tone="violet" value={formatNumber(activity.last30d)} />
        <StatCard
          label="All-time actions"
          icon={ScrollText}
          tone="success"
          value={formatNumber(activity.totalActions)}
          hint={activity.lastActionAt ? `Last ${formatRelative(activity.lastActionAt)}` : 'No actions yet'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="Account details" icon={UserCircle2} />
            <div className="p-5">
              {editing ? (
                <EditProfileForm profile={profile} onSaved={handleSaved} onCancel={() => setEditing(false)} />
              ) : (
                <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  {[
                    { icon: UserCircle2, label: 'Full name', value: profile.name },
                    {
                      icon: Mail,
                      label: 'Email',
                      value: (
                        <span className="inline-flex items-center gap-1.5">
                          {profile.email}
                          {profile.isEmailVerified && <BadgeCheck className="h-4 w-4 text-success" aria-label="Verified" />}
                        </span>
                      ),
                    },
                    { icon: Phone, label: 'Mobile', value: profile.mobile || 'Not added' },
                    { icon: Building2, label: 'Home campus', value: profile.campus?.name || 'Not assigned' },
                    { icon: CalendarDays, label: 'Member since', value: formatDate(profile.memberSince) },
                    { icon: Clock, label: 'Last sign in', value: profile.lastLoginAt ? formatDateTime(profile.lastLoginAt) : '—' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-xs text-muted">{label}</dt>
                        <dd className="mt-0.5 truncate text-sm font-medium text-fg">{value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="My recent activity"
              icon={ScrollText}
              actions={
                <Link to={`/audit-log?actor_id=${profile.id}`} className="text-xs font-semibold text-brand-fg hover:underline">
                  View all
                </Link>
              }
            />
            {activity.recent?.length ? (
              <ul className="divide-y divide-line">
                {activity.recent.map((entry) => (
                  <ActivityRow key={entry.id} entry={entry} showActor={false} />
                ))}
              </ul>
            ) : (
              <EmptyState icon={ScrollText} title="No actions yet" message="Moderation and management actions you take will show here." />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Your access" description={roleLabel(role)} icon={ShieldCheck} />
            <ul className="space-y-2.5 p-5">
              {(PERMISSIONS[role] || []).map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] text-fg-2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-5 py-4">
              <p className="eyebrow mb-3">Actions by area</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(activity.byTarget || {}).map(([key, count]) => (
                  <div key={key} className="rounded-lg bg-surface-2 px-3 py-2">
                    <p className="text-[11px] text-muted capitalize">{key}s</p>
                    <p className="text-sm font-semibold text-fg tabular-nums">{formatNumber(count)}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <ChangePasswordCard />
          <AppearanceCard />
        </div>
      </div>
    </div>
  )
}

export default memo(Profile)
