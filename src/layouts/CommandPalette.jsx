import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Moon, Package, Search, ShoppingBag, Sun, Users } from 'lucide-react'
import { ALL_NAV_ITEMS } from './navigation'
import { useTheme } from '../shared/context/ThemeContext'
import { cx } from '../shared/components/ui'

/**
 * Ctrl/⌘+K launcher: jump to any page, or search users / listings / orders.
 */
const CommandPalette = ({ open, onClose }) => {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [open])

  const commands = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pages = ALL_NAV_ITEMS.filter(
      (item) => !q || item.label.toLowerCase().includes(q) || item.keywords?.includes(q),
    ).map((item) => ({
      id: item.path,
      group: 'Go to',
      label: item.label,
      icon: item.icon,
      run: () => navigate(item.path),
    }))

    const searches = q
      ? [
          { id: 's-users', label: `Search users for “${query.trim()}”`, icon: Users, path: '/users' },
          { id: 's-products', label: `Search listings for “${query.trim()}”`, icon: Package, path: '/products' },
          { id: 's-orders', label: `Search orders for “${query.trim()}”`, icon: ShoppingBag, path: '/orders' },
        ].map((entry) => ({
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
  }, [query, navigate, isDark, toggleTheme])

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

  if (!open) return null

  let lastGroup = null
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]">
      <button type="button" aria-label="Close" onClick={close} className="animate-fade-in absolute inset-0 bg-overlay backdrop-blur-[2px]" />
      <div role="dialog" aria-modal="true" aria-label="Command palette" className="pop animate-pop-in relative w-full max-w-xl overflow-hidden rounded-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="Search pages, users, listings, orders…"
            className="h-14 w-full bg-transparent text-[15px] text-fg outline-none placeholder:text-subtle"
          />
          <span className="kbd">Esc</span>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {commands.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted">No matches</p>}
          {commands.map((command, index) => {
            const Icon = command.icon
            const showGroup = command.group !== lastGroup
            lastGroup = command.group
            return (
              <div key={command.id}>
                {showGroup && <p className="eyebrow px-3 pt-2.5 pb-1.5">{command.group}</p>}
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => runCommand(command)}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition',
                    index === activeIndex ? 'bg-brand-soft text-fg' : 'text-fg-2',
                  )}
                >
                  <Icon className={cx('h-4 w-4 shrink-0', index === activeIndex ? 'text-brand-fg' : 'text-subtle')} />
                  <span className="min-w-0 flex-1 truncate">{command.label}</span>
                  {index === activeIndex && <CornerDownLeft className="h-3.5 w-3.5 text-subtle" />}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default CommandPalette
