import { Suspense, memo, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Loader from '../shared/components/Loader'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { AttentionProvider } from './AttentionContext'
import { useAuth } from '../features/auth/context/AuthContext'

const COLLAPSE_KEY = 'campus_mart_admin_sidebar_collapsed'

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const { isAuthenticated, sessionLoading } = useAuth()
  const location = useLocation()

  if (sessionLoading) return <Loader fullScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, value ? '0' : '1')
      } catch {
        // storage unavailable
      }
      return !value
    })
  }

  return (
    <AttentionProvider>
      <div className="min-h-dvh bg-canvas lg:flex">
        <Sidebar
          open={sidebarOpen}
          collapsed={collapsed}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={toggleCollapsed}
        />
        <div className="min-w-0 flex-1">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="mx-auto w-full max-w-[1400px] px-4 pt-6 pb-16 sm:px-6 lg:px-10 lg:pt-9">
            <Suspense fallback={<Loader />}>
              {/* Keyed on path (not query) so filters don't replay the entrance. */}
              <div key={location.pathname} className="animate-page">
                <Outlet />
              </div>
            </Suspense>
          </main>
        </div>
      </div>
    </AttentionProvider>
  )
}

export default memo(AdminLayout)
