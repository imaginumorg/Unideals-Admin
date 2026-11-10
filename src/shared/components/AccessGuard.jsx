/* eslint-disable react-refresh/only-export-components */
import { Link, Navigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Card, EmptyState } from './ui'
import { useAuth } from '../../features/auth/context/AuthContext'
import { NAV_GROUPS, isNavItemVisible } from '../../layouts/navigation'

// First section this person can open (falls back to their profile).
export const useHomePath = () => {
  const { can, isAdmin } = useAuth()
  const first = NAV_GROUPS.flatMap((group) => group.items).find((item) => isNavItemVisible(item, { can, isAdmin }))
  return first?.path || '/profile'
}

export const HomeRedirect = () => <Navigate to={useHomePath()} replace />

/**
 * Renders a page only when the signed-in person can view its section
 * (`feature`) or, with `adminOnly`, is a Super Admin. The API enforces the
 * same rules; this just avoids showing a page that would only error.
 */
const AccessGuard = ({ feature, adminOnly = false, redirect = false, children }) => {
  const { can, isAdmin } = useAuth()
  const home = useHomePath()
  const allowed = adminOnly ? isAdmin : !feature || can(feature, 'view')
  if (allowed) return children
  if (redirect) return <Navigate to={home} replace />
  return (
    <Card>
      <EmptyState
        icon={Lock}
        title="You don't have access to this section"
        message={adminOnly ? 'Only a Super Admin can open this page.' : 'A Super Admin can give your role access under Roles & Access.'}
        action={
          <Link to={home} className="btn btn-secondary">
            Go to an available page
          </Link>
        }
      />
    </Card>
  )
}

export default AccessGuard
