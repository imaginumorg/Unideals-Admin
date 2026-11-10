import { memo, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, ChevronDown, LogOut, Monitor, Moon, Sun, UserCircle2 } from 'lucide-react'
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
  const { admin, logout } = useAuth()
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
        className="flex items-center gap-2.5 rounded-xl p-1 transition hover:bg-surface-2 sm:pr-2.5"
      >
        <Avatar src={admin.avatar} name={admin.name} initials={admin.initials} className="h-8 w-8 text-[11px]" />
        <span className="hidden min-w-0 text-left md:block">
          <span className="block max-w-[140px] truncate text-[13px] leading-tight font-semibold text-fg">{admin.name}</span>
          <span className="block text-[11px] leading-tight text-muted">{admin.roleLabel}</span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-subtle md:block" />
      </button>

      {isOpen && (
        <div role="menu" className="pop animate-pop-in absolute top-full right-0 z-50 mt-2 w-64 p-1.5">
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

          <div className="my-1 h-px bg-line" />

          <button
            type="button"
            role="menuitem"
            onClick={() => navigate('/profile')}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fg-2 transition hover:bg-surface-2 hover:text-fg"
          >
            <UserCircle2 className="h-4 w-4 text-muted" /> My profile
          </button>

          <div className="my-1 h-px bg-line" />
          <p className="eyebrow px-2.5 pt-1.5 pb-1">Appearance</p>
          {THEME_CHOICES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={preference === value}
              onClick={() => setTheme(value)}
              className={cx(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition hover:bg-surface-2',
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
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-danger transition hover:bg-danger-soft"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(ProfileMenu)
