import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Moon, Package, Search, ShoppingBag, Sun, Users } from 'lucide-react'
import { ALL_NAV_ITEMS, isNavItemVisible } from './navigation'
import { useAuth } from '../features/auth/context/AuthContext'
import { useTheme } from '../shared/context/ThemeContext'
import { cx, usePresence } from '../shared/components/ui'

/**
 * Ctrl/⌘+K launcher: jump to any page, or search users / listings / orders.
 */
const CommandPalette = ({ open, onClose }) => {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const { can, isAdmin } = useAuth()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const { mounted, state } = usePresence(open, 150)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [open])

  const commands = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pages = ALL_NAV_ITEMS.filter(
      (item) => isNavItemVisible(item, { can, isAdmin }) && (!q || item.label.toLowerCase().includes(q) || item.keywords?.includes(q)),
    ).map((item) => ({
      id: item.path,
      group: 'Go to',
      label: item.label,
      icon: item.icon,
      run: () => navigate(item.path),
    }))

    const searches = q
      ? [
          { id: 's-users', label: `Search users for “${query.trim()}”`, icon: Users, path: '/users', feature: 'users' },
          { id: 's-products', label: `Search listings for “${query.trim()}”`, icon: Package, path: '/products', feature: 'listings' },
          { id: 's-orders', label: `Search orders for “${query.trim()}”`, icon: ShoppingBag, path: '/orders', feature: 'orders' },
        ].filter((entry) => can(entry.feature)).map((entry) => ({
          ...entry,
          group: 'Search',
          run: () => navigate(`${entry.path}?search=${encodeURIComponent(query.trim())}`),
        }))
      : []

    const actions = [
      {
        id: 'theme',
        group: 'Actions',
        label: isDark ? 'Switch to light mode' : 'Switch to dark mode',
        icon: isDark ? Sun : Moon,
        run: toggleTheme,
      },
    ].filter((action) => !q || action.label.toLowerCase().includes(q) || 'theme'.includes(q))

    return [...searches, ...pages, ...actions]
  }, [query, navigate, isDark, toggleTheme, can, isAdmin])

  const close = () => {
    setQuery('')
    setActiveIndex(0)
    onClose()
  }

  const runCommand = (command) => {
    if (!command) return
    command.run()
    close()
  }

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, commands.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      runCommand(commands[activeIndex])
    } else if (event.key === 'Escape') {
      close()
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[14vh]">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={close}
        data-presence="overlay"
        data-state={state}
        className="absolute inset-0 bg-overlay backdrop-blur-[3px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        data-presence="dialog"
        data-state={state}
        className="pop relative w-full max-w-[600px] overflow-hidden rounded-[14px]"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-[18px] w-[18px] shrink-0 text-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="Search pages, users, listings, orders…"
            className="h-[52px] w-full bg-transparent text-[15px] text-fg outline-none placeholder:text-subtle focus-visible:shadow-none"
          />
          <span className="kbd">Esc</span>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-1.5">
          {commands.length === 0 && <p className="px-3 py-10 text-center text-[13px] text-muted">No results for “{query}”</p>}
          {commands.map((command, index) => {
            const Icon = command.icon
            const showGroup = command.group !== commands[index - 1]?.group
            const active = index === activeIndex
            return (
              <div key={command.id}>
                {showGroup && <p className="px-3 pt-3 pb-1 text-[11px] font-medium text-subtle">{command.group}</p>}
                <button
                  type="button"
                  onMouseMove={() => !active && setActiveIndex(index)}
                  onClick={() => runCommand(command)}
                  className={cx(
                    'flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] transition-colors duration-75',
                    active ? 'bg-surface-3 text-fg' : 'text-fg-2',
                  )}
                >
                  <Icon className={cx('h-4 w-4 shrink-0', active ? 'text-fg' : 'text-subtle')} />
                  <span className="min-w-0 flex-1 truncate">{command.label}</span>
                  {active && <CornerDownLeft className="h-3.5 w-3.5 text-subtle" />}
                </button>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 border-t border-line bg-surface-2/40 px-4 py-2 text-[11px] text-subtle">
          <span className="flex items-center gap-1.5"><span className="kbd">↑</span><span className="kbd">↓</span> Navigate</span>
          <span className="flex items-center gap-1.5"><span className="kbd">↵</span> Open</span>
          <span className="ml-auto flex items-center gap-1.5"><span className="kbd">Esc</span> Close</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default CommandPalette
