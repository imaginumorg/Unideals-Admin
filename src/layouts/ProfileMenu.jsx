import { memo, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Building2, Check, ChevronDown, LogOut, Monitor, Moon, Sun, UserCircle2 } from 'lucide-react'
import { useAuth } from '../features/auth/context/AuthContext'
import { useToast } from '../shared/components/ToastContext'
import { useTheme } from '../shared/context/ThemeContext'
import Avatar from '../shared/components/Avatar'
import { Badge, cx } from '../shared/components/ui'

const THEME_CHOICES = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
]

const ProfileMenu = () => {
  const menuRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { admin, logout, myCampuses } = useAuth()
  const { showToast } = useToast()
  const { preference, setTheme } = useTheme()
  const [openPath, setOpenPath] = useState(null)
  // Closing on navigation: the menu is open only for the path it was opened on.
  const isOpen = openPath === location.pathname

  useEffect(() => {
    if (!isOpen) return undefined
    const onPointer = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpenPath(null)
    }
    const onKey = (event) => event.key === 'Escape' && setOpenPath(null)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  const handleLogout = async () => {
    setOpenPath(null)
    await logout()
    showToast({ type: 'success', message: 'Signed out' })
    navigate('/login', { replace: true })
  }

  if (!admin) return null

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpenPath(isOpen ? null : location.pathname)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={cx(
          'flex h-8 items-center gap-2 rounded-lg pr-1 pl-0.5 transition-colors hover:bg-surface-2 md:pr-2',
          isOpen && 'bg-surface-2',
        )}
      >
        <Avatar src={admin.avatar} name={admin.name} initials={admin.initials} className="h-7 w-7 text-[10.5px]" />
        <span className="hidden max-w-[140px] truncate text-[13px] font-medium text-fg md:block">{admin.name}</span>
        <ChevronDown className={cx('hidden h-3.5 w-3.5 text-subtle transition-transform md:block', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div role="menu" className="pop animate-pop-in absolute top-full right-0 z-50 mt-2 w-64 p-1">
          <div className="flex items-center gap-3 px-2.5 py-2.5">
            <Avatar src={admin.avatar} name={admin.name} initials={admin.initials} className="h-10 w-10 text-xs" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">{admin.name}</p>
              <p className="truncate text-xs text-muted">{admin.email}</p>
              <Badge tone={admin.role === 'admin' ? 'brand' : 'info'} className="mt-1">
                {admin.roleLabel}
              </Badge>
            </div>
          </div>
          {myCampuses.length > 0 && (
            // Campus-limited support: say which campuses their data covers.
            <p className="flex items-start gap-2 px-2.5 pb-2 text-xs leading-5 text-muted" title={myCampuses.map((c) => c.name).join(', ')}>
              <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-subtle" />
              <span className="min-w-0">
                Limited to <span className="text-fg-2">{myCampuses.map((c) => c.shortName || c.name).join(', ')}</span>
              </span>
            </p>
          )}

          <div className="my-1 h-px bg-line" />

          <button
            type="button"
            role="menuitem"
            onClick={() => navigate('/profile')}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-fg-2 transition hover:bg-surface-2 hover:text-fg"
          >
            <UserCircle2 className="h-4 w-4 text-muted" /> My profile
          </button>

          <div className="my-1 h-px bg-line" />
          <p className="px-2.5 pt-2 pb-1 text-[11px] font-medium text-subtle">Appearance</p>
          {THEME_CHOICES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={preference === value}
              onClick={() => setTheme(value)}
              className={cx(
                'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition hover:bg-surface-2',
                preference === value ? 'text-fg' : 'text-fg-2',
              )}
            >
              <Icon className="h-4 w-4 text-muted" /> {label}
              {preference === value && <Check className="ml-auto h-4 w-4 text-brand-fg" />}
            </button>
          ))}

          <div className="my-1 h-px bg-line" />
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-danger transition hover:bg-danger-soft"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(ProfileMenu)
