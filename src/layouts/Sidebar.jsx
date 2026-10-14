import { memo } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/context/AuthContext'

const navigationSections = [
  {
    section: 'MAIN',
    items: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        ),
      },
    ],
  },
  {
    section: 'MANAGE',
    items: [
      {
        label: 'Users',
        path: '/users',
        icon: (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        label: 'Products',
        path: '/products',
        icon: (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m7.5 4.27 9 5.15" />
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
        ),
      },
      {
        label: 'Orders',
        path: '/orders',
        icon: (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        ),
      },
      {
        label: 'Campuses',
        path: '/campuses',
        icon: (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21h18" />
            <path d="M5 21V7l7-4 7 4v14" />
            <path d="M9 21v-6h6v6" />
          </svg>
        ),
      },
    ],
  },
  {
    section: 'CONTENT',
    items: [
      {
        label: 'Push Notifications',
        path: '/push-notifications',
        icon: (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        ),
      },
    ],
  },
  {
    section: 'MODERATION',
    items: [
      {
        label: 'Reports',
        path: '/moderation',
        icon: (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
      },
      {
        label: 'Audit Log',
        path: '/audit-log',
        icon: (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
            <path d="M10 9H8" />
          </svg>
        ),
      },
    ],
  },
]

const Sidebar = ({ open, collapsed, onClose, onToggleCollapse }) => {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    onClose?.()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-[#0E1526] border-r border-[#E2E8F0] dark:border-[#1E293B] text-[#64748B] dark:text-[#94A3B8] shadow-2xl transition-[width,transform] duration-200 lg:static lg:translate-x-0 ${
          collapsed ? 'lg:w-[76px]' : 'w-[250px] lg:w-[250px]'
        } ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:h-screen lg:shrink-0 select-none`}
      >
        {/* Brand header */}
        <div className={`border-b border-[#F1F5F9] dark:border-[#1E293B] ${collapsed ? 'flex flex-col items-center gap-2.5 py-4 px-2' : 'flex items-center justify-between py-4 px-4'}`}>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] dark:bg-[#1E293B]">
                  <img src="/unideals-logo.svg" alt="UniDeals" className="h-6 w-6 object-contain" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[18px] font-bold text-[#0B1220] dark:text-white tracking-tight leading-tight">UniDeals</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3838EC] dark:text-[#58A6FF]">ADMIN PORTAL</p>
                </div>
              </div>

              {/* Collapse button on Desktop (< Chevron matching Image 2) */}
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar"
                className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:text-[#0B1220] dark:text-[#94A3B8] dark:hover:text-white transition"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            </>
          ) : (
            <>
              {/* Collapsed top: Logo badge (matching Image 3) */}
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] dark:bg-[#1E293B]">
                <img src="/unideals-logo.svg" alt="UniDeals" className="h-6 w-6 object-contain" />
              </span>

              {/* Collapsed bottom: Hamburger expand button directly underneath (matching Image 3) */}
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Expand sidebar"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] dark:bg-[#1E293B] hover:bg-[#E0E7FF] dark:hover:bg-[#2D3B55] text-[#3838EC] dark:text-[#58A6FF] transition cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              </button>
            </>
          )}

          {/* Close button on Mobile */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:text-[#0B1220] dark:text-[#94A3B8] dark:hover:text-white lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs font-medium no-scrollbar">
          {navigationSections.map((group) => (
            <div key={group.section} className="space-y-1">
              {!collapsed && (
                <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#94A3B8] dark:text-[#64748B]">
                  {group.section}
                </p>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center justify-between rounded-xl px-3 py-2.5 transition text-[13px] ${
                      isActive
                        ? 'bg-[#2563EB] text-white font-semibold shadow-md shadow-blue-600/30'
                        : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#161F32] hover:text-[#0B1220] dark:hover:text-white'
                    } ${collapsed ? 'justify-center px-0' : ''}`
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span
                      className={`ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white ${
                        item.badgeColor || 'bg-[#2563EB]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom user / logout */}
        <div className="mt-auto border-t border-[#F1F5F9] dark:border-[#1E293B] p-3">
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? 'Log Out' : undefined}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:text-rose-400 transition ${
              collapsed ? 'justify-center px-0' : ''
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {open && <button type="button" aria-label="Close menu" onClick={onClose} className="fixed inset-0 z-30 bg-black/60 lg:hidden backdrop-blur-sm" />}
    </>
  )
}

export default memo(Sidebar)
