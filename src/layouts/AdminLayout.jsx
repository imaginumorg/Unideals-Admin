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
          <main className="mx-auto w-full max-w-[1480px] px-4 py-6 lg:px-8 lg:py-8">
            <Suspense fallback={<Loader />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </AttentionProvider>
  )
}

export default memo(AdminLayout)
