import { memo, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/context/AuthContext'
import { useToast } from '../shared/components/ToastContext'
import Avatar from '../shared/components/Avatar'

const ProfileMenu = () => {
  const menuRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { admin, logout } = useAuth()
  const { showToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    showToast({ type: 'success', message: 'Logged out successfully' })
    navigate('/login', { replace: true })
  }

  const displayName = admin?.name || 'Kamal Sinha'
  const displayRole = admin?.roleLabel || (admin?.role === 'admin' ? 'Super Admin' : 'Admin')
  const initials = admin?.initials || 'KS'

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 rounded-xl border border-transparent p-1 sm:px-2 sm:py-1 transition hover:border-[#E2E8F0] dark:hover:border-[#334155] hover:bg-[#F8FAFC] dark:hover:bg-[#1A2234]"
      >
        <Avatar
          src={admin?.avatar}
          name={displayName}
          initials={initials}
          className="h-9 w-9 text-xs"
          ringClassName="ring-2 ring-blue-500/20 shadow-sm"
        />
        <div className="hidden sm:block text-left">
          <p className="text-[13px] font-bold text-[#0B1220] dark:text-white leading-tight">{displayName}</p>
          <p className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">{displayRole}</p>
        </div>
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#94A3B8] hidden sm:block">
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 w-52 origin-top-right rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#161F32] p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-[#F1F5F9] dark:border-[#24304A]">
            <p className="text-xs font-semibold text-[#0B1220] dark:text-white truncate">{displayName}</p>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">{admin?.email || 'admin@unideals.in'}</p>
          </div>
          <div className="py-1">
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F8FAFC] dark:hover:bg-[#1F293D] transition"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Account Settings</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(ProfileMenu)
