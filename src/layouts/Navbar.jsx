import { memo, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2, ChevronRight, Cpu, EyeOff, Inbox, Menu, Search, ShieldAlert, UserCog } from 'lucide-react'
import ProfileMenu from './ProfileMenu'
import CommandPalette from './CommandPalette'
import { findNavItem, NAV_GROUPS } from './navigation'
import { useAttention } from './AttentionContext'
import ThemeToggle from '../shared/components/ThemeToggle'
import { cx } from '../shared/components/ui'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

// "Needs attention" inbox: live counts from AttentionContext.
const AttentionInbox = () => {
  const { counts, total } = useAttention()
  const location = useLocation()
  const [openPath, setOpenPath] = useState(null)
  const ref = useRef(null)
  const open = openPath === location.pathname

  useEffect(() => {
    if (!open) return undefined
    const onPointer = (event) => ref.current && !ref.current.contains(event.target) && setOpenPath(null)
    const onKey = (event) => event.key === 'Escape' && setOpenPath(null)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const items = [
    { label: 'Pending reports', count: counts.pendingReports, to: '/moderation', icon: ShieldAlert },
    { label: 'Gender change requests', count: counts.pendingGenderRequests, to: '/gender-requests', icon: UserCog },
    { label: 'Auto-hidden listings', count: counts.autoHiddenListings, to: '/products?status=review', icon: EyeOff },
    { label: 'Failing background jobs', count: counts.failingJobs, to: '/system/jobs', icon: Cpu },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpenPath(open ? null : location.pathname)}
        aria-label={`Needs attention: ${total}`}
        aria-expanded={open}
        data-tip="Needs attention"
        className={cx('tip tip-bottom btn btn-ghost relative h-8 w-8 px-0', open && 'bg-surface-2 text-fg')}
      >
        <Inbox className="h-4 w-4" />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white ring-2 ring-canvas tabular-nums">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>
      {open && (
        <div className="pop animate-pop-in absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-[13px] font-semibold text-fg">Needs attention</p>
            {total > 0 && <span className="text-xs text-muted tabular-nums">{total} open</span>}
          </div>
          {total === 0 ? (
            <div className="flex items-center gap-2.5 px-4 py-5 text-[13px] text-muted">
              <CheckCircle2 className="h-4 w-4 text-success" /> All caught up.
            </div>
          ) : (
            <ul className="p-1.5">
              {items.map(({ label, count, to, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg"
                  >
                    <Icon className="h-4 w-4 text-subtle group-hover:text-fg-2" />
                    <span className="flex-1">{label}</span>
                    <span
                      className={cx(
                        'min-w-6 rounded-md px-1.5 text-center text-xs font-medium tabular-nums',
                        count ? 'bg-danger-soft text-danger' : 'text-subtle',
                      )}
                    >
                      {count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
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
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/75 backdrop-blur-xl backdrop-saturate-150">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-8">
        <button type="button" onClick={onMenuClick} aria-label="Open menu" className="btn btn-ghost -ml-1 h-8 w-8 px-0 lg:hidden">
          <Menu className="h-[18px] w-[18px]" />
        </button>

        <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[13px] md:flex">
          {group && <span className="text-subtle">{group.label}</span>}
          {group && <ChevronRight className="h-3.5 w-3.5 text-subtle" />}
          <span className="truncate font-medium text-fg">{current?.label || 'Admin'}</span>
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="group mr-1 flex h-8 w-full min-w-0 items-center gap-2 rounded-lg border border-line bg-surface-2/60 px-2.5 text-[13px] text-subtle transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-muted sm:w-[260px]"
          >
            <Search className="h-[15px] w-[15px] shrink-0" />
            <span className="truncate">Search or jump to…</span>
            <span className="ml-auto hidden items-center gap-0.5 sm:flex">
              <span className="kbd">{isMac ? '⌘' : 'Ctrl'}</span>
              <span className="kbd">K</span>
            </span>
          </button>
          <ThemeToggle className="h-8 w-8" />
          <AttentionInbox />
          <div className="mx-1.5 hidden h-5 w-px bg-line sm:block" />
          <ProfileMenu />
        </div>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </header>
  )
}

export default memo(Navbar)
