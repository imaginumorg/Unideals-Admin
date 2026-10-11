import { lazy, memo, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Loader from '../shared/components/Loader'
import { useAuth } from '../features/auth/context/AuthContext'
import AdminLayout from '../layouts/AdminLayout'

const Login = lazy(() => import('../features/auth/pages/Login'))
const Dashboard = lazy(() => import('../features/dashboard/pages/Dashboard'))
const Users = lazy(() => import('../features/users/pages/Users'))
const Products = lazy(() => import('../features/products/pages/Products'))
const Orders = lazy(() => import('../features/orders/pages/Orders'))
const Campuses = lazy(() => import('../features/campuses/pages/Campuses'))
const ModerationQueue = lazy(() => import('../features/reports/pages/ModerationQueue'))
const Reports = lazy(() => import('../features/reports/pages/Reports'))
const Analytics = lazy(() => import('../features/analytics/pages/Analytics'))
const AuditLog = lazy(() => import('../features/analytics/pages/AuditLog'))
const Notification = lazy(() => import('../features/notifications/pages/Notification'))
const Settings = lazy(() => import('../features/settings/pages/Settings'))

const App = () => {
  const { isAuthenticated, sessionLoading } = useAuth()

  if (sessionLoading) return <Loader />

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/products" element={<Products />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/campuses" element={<Campuses />} />
          <Route path="/moderation" element={<ModerationQueue />} />
          <Route path="/moderation-queue" element={<Navigate to="/moderation" replace />} />
          <Route path="/reports" element={<Navigate to="/moderation" replace />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/push-notifications" element={<Notification />} />
          <Route path="/notification" element={<Notification />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default memo(App)
