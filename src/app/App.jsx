import { lazy, memo, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Loader from '../shared/components/Loader'
import { useAuth } from '../features/auth/context/AuthContext'
import AdminLayout from '../layouts/AdminLayout'

const Login = lazy(() => import('../features/auth/pages/Login'))
const Dashboard = lazy(() => import('../features/dashboard/pages/Dashboard'))
const Users = lazy(() => import('../features/users/pages/Users'))
const GenderRequests = lazy(() => import('../features/users/pages/GenderRequests'))
const Products = lazy(() => import('../features/products/pages/Products'))
const Orders = lazy(() => import('../features/orders/pages/Orders'))
const Campuses = lazy(() => import('../features/campuses/pages/Campuses'))
const ModerationQueue = lazy(() => import('../features/reports/pages/ModerationQueue'))
const AuditLog = lazy(() => import('../features/analytics/pages/AuditLog'))
const Notification = lazy(() => import('../features/notifications/pages/Notification'))
const Profile = lazy(() => import('../features/profile/pages/Profile'))
const Jobs = lazy(() => import('../features/system/pages/Jobs'))
const ServiceStatus = lazy(() => import('../features/system/pages/ServiceStatus'))

// Old paths kept working so bookmarks don't break.
const LEGACY_REDIRECTS = {
  '/moderation-queue': '/moderation',
  '/reports': '/moderation',
  '/notification': '/push-notifications',
  '/settings': '/profile',
  '/account': '/profile',
  '/analytics': '/dashboard',
}

const App = () => {
  const { isAuthenticated, sessionLoading } = useAuth()

  if (sessionLoading) return <Loader fullScreen />

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/gender-requests" element={<GenderRequests />} />
          <Route path="/products" element={<Products />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/campuses" element={<Campuses />} />
          <Route path="/moderation" element={<ModerationQueue />} />
          <Route path="/push-notifications" element={<Notification />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/system/jobs" element={<Jobs />} />
          <Route path="/system/status" element={<ServiceStatus />} />
          {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default memo(App)
