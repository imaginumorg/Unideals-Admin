import { memo } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react'
import { NAV_GROUPS } from './navigation'
import { useAttention } from './AttentionContext'
import { cx } from '../shared/components/ui'

const BrandMark = ({ collapsed }) => (
  <div className={cx('flex min-w-0 items-center gap-3', collapsed && 'lg:justify-center')}>
    <img src="/unideals-logo.svg" alt="" className="h-9 w-9 shrink-0 object-contain" />
    <div className={cx('min-w-0', collapsed && 'lg:hidden')}>
      <p className="truncate text-[15px] leading-tight font-bold tracking-tight text-fg">Unideals</p>
      <p className="text-[10px] font-semibold tracking-[0.18em] text-brand-fg uppercase">Admin Console</p>
    </div>
  </div>
)

const Sidebar = ({ open, collapsed, onClose, onToggleCollapse }) => {
  const { counts } = useAttention()

  return (
    <>
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-line bg-surface transition-[width,transform] duration-200 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0',
          collapsed ? 'lg:w-[76px]' : 'lg:w-[248px]',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className={cx('flex h-16 shrink-0 items-center justify-between gap-2 px-4', collapsed && 'lg:justify-center lg:px-2')}>
          <BrandMark collapsed={collapsed} />
          <button type="button" onClick={onClose} aria-label="Close menu" className="btn btn-ghost btn-icon h-8 w-8 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className={cx('eyebrow mb-1.5 px-3', collapsed && 'lg:hidden')}>{group.label}</p>
              {collapsed && <div className="mx-auto mb-2 hidden h-px w-6 bg-line lg:block" />}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const badge = item.badgeKey ? counts[item.badgeKey] : 0
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cx(
                          'group relative flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition',
                          collapsed && 'lg:justify-center lg:px-0',
                          isActive ? 'bg-brand-soft text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && <span className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r-full bg-brand" />}
                          <Icon className={cx('h-[18px] w-[18px] shrink-0', isActive ? 'text-brand-fg' : 'text-subtle group-hover:text-fg-2')} />
                          <span className={cx('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
                          {badge > 0 && (
                            <span
                              className={cx(
                                'ml-auto rounded-md bg-danger-soft px-1.5 text-[11px] font-bold text-danger tabular-nums',
                                collapsed && 'lg:absolute lg:top-0.5 lg:right-1.5 lg:ml-0 lg:h-2 lg:w-2 lg:rounded-full lg:bg-danger lg:p-0 lg:text-[0px]',
                              )}
                            >
                              {badge > 99 ? '99+' : badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="hidden shrink-0 border-t border-line p-3 lg:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cx('btn btn-ghost btn-sm w-full justify-start', collapsed && 'justify-center px-0')}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {open && (
        <button type="button" aria-label="Close menu" onClick={onClose} className="animate-fade-in fixed inset-0 z-40 bg-overlay lg:hidden" />
      )}
    </>
  )
}

export default memo(Sidebar)
