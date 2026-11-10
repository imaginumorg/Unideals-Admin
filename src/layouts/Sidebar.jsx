import { memo } from 'react'
import { NavLink } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { NAV_GROUPS, isNavItemVisible } from './navigation'
import { useAuth } from '../features/auth/context/AuthContext'
import { useAttention } from './AttentionContext'
import { cx } from '../shared/components/ui'

const Brand = ({ collapsed, onToggleCollapse }) => (
  <div className={cx('group/brand flex h-14 shrink-0 items-center gap-2.5 px-4', collapsed && 'lg:justify-center lg:px-0')}>
    <img src="/unideals-logo.svg" alt="" className="h-[26px] w-[26px] shrink-0 object-contain" />
    <div className={cx('flex min-w-0 flex-1 items-baseline gap-2', collapsed && 'lg:hidden')}>
      <span className="font-brand truncate text-[15px] font-bold tracking-tight text-fg">Unideals</span>
      <span className="rounded border border-line px-1.5 py-px text-[10px] font-medium tracking-wide text-muted uppercase">Admin</span>
    </div>
    {!collapsed && (
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label="Collapse sidebar"
        className="tip tip-bottom hidden h-7 w-7 items-center justify-center rounded-md text-subtle opacity-0 transition-opacity duration-150 group-hover/brand:opacity-100 hover:bg-surface-2 hover:text-fg focus-visible:opacity-100 lg:flex"
        data-tip="Collapse"
      >
        <PanelLeftClose className="h-4 w-4" />
      </button>
    )}
  </div>
)

const Sidebar = ({ open, collapsed, onClose, onToggleCollapse }) => {
  const { counts } = useAttention()
  const { can, isAdmin } = useAuth()
  // Only the sections this person can open; empty groups disappear.
  const groups = NAV_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => isNavItemVisible(item, { can, isAdmin })) })).filter(
    (group) => group.items.length,
  )

  return (
    <>
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-line bg-canvas transition-[width,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0',
          collapsed ? 'lg:w-[60px]' : 'lg:w-[240px]',
          open ? 'translate-x-0 shadow-[var(--shadow-pop)]' : '-translate-x-full',
        )}
      >
        <div className="flex items-center">
          <div className="min-w-0 flex-1">
            <Brand collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
          </div>
          <button type="button" onClick={onClose} aria-label="Close menu" className="btn btn-ghost mr-3 h-8 w-8 px-0 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav aria-label="Main" className={cx('no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pt-1 pb-4', collapsed && 'lg:overflow-visible lg:px-2.5')}>
          {groups.map((group, groupIndex) => (
            <div key={group.label} className={groupIndex ? 'mt-5' : ''}>
              <p className={cx('mb-1 px-2 text-[11px] font-medium text-subtle', collapsed && 'lg:hidden')}>{group.label}</p>
              {collapsed && groupIndex > 0 && <div className="mx-auto mb-2 hidden h-px w-5 bg-line lg:block" />}
              <ul className="space-y-px">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const badge = item.badgeKey ? counts[item.badgeKey] : 0
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={onClose}
                        data-tip={collapsed ? item.label : undefined}
                        aria-label={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          cx(
                            'group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium transition-colors duration-100',
                            collapsed && 'tip lg:h-9 lg:justify-center lg:px-0',
                            isActive
                              ? 'bg-surface-2 text-fg shadow-[inset_0_0_0_1px_var(--c-line)]'
                              : 'text-muted hover:bg-surface-2/70 hover:text-fg',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              className={cx(
                                'h-4 w-4 shrink-0 transition-colors',
                                isActive ? 'text-brand-fg' : 'text-subtle group-hover:text-fg-2',
                              )}
                              strokeWidth={isActive ? 2.2 : 2}
                            />
                            <span className={cx('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
                            {badge > 0 && (
                              <span
                                className={cx(
                                  'ml-auto min-w-5 rounded-full bg-danger-soft px-1.5 text-center text-[11px] leading-[18px] font-semibold text-danger tabular-nums',
                                  collapsed && 'lg:absolute lg:top-1 lg:right-1 lg:ml-0 lg:h-1.5 lg:w-1.5 lg:min-w-0 lg:bg-danger lg:p-0 lg:text-[0px]',
                                )}
                              >
                                {badge > 99 ? '99+' : badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {collapsed && (
          <div className="hidden shrink-0 justify-center border-t border-line py-3 lg:flex">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              data-tip="Expand"
              className="tip flex h-8 w-8 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="animate-fade-in fixed inset-0 z-40 bg-overlay backdrop-blur-[2px] lg:hidden"
        />
      )}
    </>
  )
}

export default memo(Sidebar)
