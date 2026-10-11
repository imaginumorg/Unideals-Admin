import { memo, useState } from 'react'
import ProfileMenu from './ProfileMenu'
import ThemePicker from '../shared/components/ThemePicker'
import { useNavigate } from 'react-router-dom'

const Navbar = ({ onMenuClick }) => {
  const [globalSearch, setGlobalSearch] = useState('')
  const navigate = useNavigate()

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!globalSearch.trim()) return
    // navigate to users or products search
    navigate(`/users?search=${encodeURIComponent(globalSearch.trim())}`)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#E2E8F0] dark:border-[#1E293B] bg-white/95 dark:bg-[#0E1526]/95 backdrop-blur-md">
      <div className="flex h-[64px] items-center justify-between px-4 lg:px-6 gap-4">
        {/* Mobile menu hamburger */}
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-[#334155] dark:text-[#CBD5E1] lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </svg>
        </button>

        {/* Global Search bar from Image 2 & 3 */}
        <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center flex-1 max-w-md relative">
          <span className="absolute left-3.5 text-[#94A3B8]">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search users, products, orders, campuses..."
            className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-[#F8FAFC] dark:bg-[#1A2234] pl-10 pr-16 py-2 text-xs sm:text-sm text-[#0B1220] dark:text-white placeholder-[#94A3B8] outline-none transition focus:border-[#2563EB] focus:bg-white dark:focus:bg-[#1A2234]"
          />
          <div className="absolute right-2.5 flex items-center gap-1 text-[11px] font-semibold text-[#94A3B8] bg-white dark:bg-[#2A344A] border border-[#E2E8F0] dark:border-[#3E4C69] px-1.5 py-0.5 rounded-md shadow-xs pointer-events-none">
            <span>Ctrl</span>
            <span>K</span>
          </div>
        </form>

        {/* Right Action Icons */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Theme Picker */}
          <ThemePicker />

          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => navigate('/notification')}
              title="Notifications"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition relative"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#0E1526]">
                3
              </span>
            </button>
          </div>

          {/* Super Admin Profile Menu */}
          <ProfileMenu />
        </div>
      </div>
    </header>
  )
}

export default memo(Navbar)
