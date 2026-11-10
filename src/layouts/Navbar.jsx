import { memo, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Cpu, EyeOff, Inbox, Menu, Search, ShieldAlert, UserCog } from 'lucide-react'
import ProfileMenu from './ProfileMenu'
import CommandPalette from './CommandPalette'
import { findNavItem, NAV_GROUPS } from './navigation'
import { useAttention } from './AttentionContext'
import ThemeToggle from '../shared/components/ThemeToggle'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

// "Needs attention" inbox: the real replacement for the old hardcoded bell.
const AttentionInbox = () => {
  const { counts, total } = useAttention()
  const location = useLocation()
  const [openPath, setOpenPath] = useState(null)
  const ref = useRef(null)
  const open = openPath === location.pathname

  useEffect(() => {
    if (!open) return undefined
    const onPointer = (event) => ref.current && !ref.current.contains(event.target) && setOpenPath(null)
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [open])

  const items = [
    { label: 'Pending reports', count: counts.pendingReports, to: '/moderation', icon: ShieldAlert },
    { label: 'Gender change requests', count: counts.pendingGenderRequests, to: '/gender-requests', icon: UserCog },
    { label: 'Listings auto-hidden by reports', count: counts.autoHiddenListings, to: '/products?status=review', icon: EyeOff },
    { label: 'Failing background jobs', count: counts.failingJobs, to: '/system/jobs', icon: Cpu },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpenPath(open ? null : location.pathname)}
        aria-label={`Needs attention: ${total}`}
        title="Needs attention"
        className="btn btn-ghost btn-icon relative"
      >
        <Inbox className="h-[18px] w-[18px]" />
        {total > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-surface">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>
      {open && (
        <div className="pop animate-pop-in absolute top-full right-0 z-50 mt-2 w-72 p-1.5">
          <p className="eyebrow px-2.5 pt-1.5 pb-2">Needs attention</p>
          {items.map(({ label, count, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm text-fg-2 transition hover:bg-surface-2 hover:text-fg"
            >
              <Icon className="h-4 w-4 text-muted" />
              <span className="flex-1">{label}</span>
              <span className={`rounded-md px-1.5 text-xs font-bold tabular-nums ${count ? 'bg-danger-soft text-danger' : 'bg-surface-2 text-muted'}`}>
                {count}
              </span>
            </Link>
          ))}
          {total === 0 && <p className="px-2.5 pt-1 pb-2 text-xs text-muted">All caught up.</p>}
        </div>
      )}
    </div>
  )
}

const Navbar = ({ onMenuClick }) => {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { pathname } = useLocation()
  const current = findNavItem(pathname)
  const group = NAV_GROUPS.find((entry) => entry.items.includes(current))

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <button type="button" onClick={onMenuClick} aria-label="Open menu" className="btn btn-ghost btn-icon lg:hidden">
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-2 text-sm md:flex">
          {group && <span className="text-subtle">{group.label}</span>}
          {group && <span className="text-subtle">/</span>}
          <span className="truncate font-semibold text-fg">{current?.label || 'Admin'}</span>
        </nav>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="ml-auto flex h-9 w-full max-w-[320px] items-center gap-2.5 rounded-xl border border-line bg-surface px-3 text-sm text-subtle transition hover:border-line-strong hover:text-muted md:ml-6"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">Search or jump to…</span>
          <span className="ml-auto hidden items-center gap-1 sm:flex">
            <span className="kbd">{isMac ? '⌘' : 'Ctrl'}</span>
            <span className="kbd">K</span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1 md:ml-auto">
          <ThemeToggle />
          <AttentionInbox />
          <div className="mx-1.5 hidden h-6 w-px bg-line sm:block" />
          <ProfileMenu />
        </div>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </header>
  )
}

export default memo(Navbar)
