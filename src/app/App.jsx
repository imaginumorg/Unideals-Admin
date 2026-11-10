import { lazy, memo, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Loader from '../shared/components/Loader'
import { useAuth } from '../features/auth/context/AuthContext'
import AdminLayout from '../layouts/AdminLayout'
import AccessGuard, { HomeRedirect } from '../shared/components/AccessGuard'

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
const RoleAccess = lazy(() => import('../features/access/pages/RoleAccess'))

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
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route element={<AdminLayout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/dashboard" element={<AccessGuard feature="dashboard" redirect><Dashboard /></AccessGuard>} />
          <Route path="/users" element={<AccessGuard feature="users"><Users /></AccessGuard>} />
          <Route path="/gender-requests" element={<AccessGuard feature="genderRequests"><GenderRequests /></AccessGuard>} />
          <Route path="/products" element={<AccessGuard feature="listings"><Products /></AccessGuard>} />
          <Route path="/orders" element={<AccessGuard feature="orders"><Orders /></AccessGuard>} />
          <Route path="/campuses" element={<AccessGuard feature="campuses"><Campuses /></AccessGuard>} />
          <Route path="/moderation" element={<AccessGuard feature="reports"><ModerationQueue /></AccessGuard>} />
          <Route path="/push-notifications" element={<AccessGuard feature="notifications"><Notification /></AccessGuard>} />
          <Route path="/audit-log" element={<AccessGuard feature="auditLog"><AuditLog /></AccessGuard>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/system/jobs" element={<AccessGuard feature="jobs"><Jobs /></AccessGuard>} />
          <Route path="/system/status" element={<AccessGuard feature="systemStatus"><ServiceStatus /></AccessGuard>} />
          <Route path="/system/access" element={<AccessGuard adminOnly><RoleAccess /></AccessGuard>} />
          {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
          <Route path="*" element={<HomeRedirect />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default memo(App)
