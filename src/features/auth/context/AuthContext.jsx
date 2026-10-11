import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { authApi } from '../api/authApi'
import { useToast } from '../../../shared/components/ToastContext'

const AuthContext = createContext(null)
const ADMIN_SESSION_STORAGE_KEY = 'campus_mart_admin'

const formatAdminSession = (admin) => {
  if (!admin) return null

  return {
    ...admin,
    roleLabel: admin.role === 'admin' ? 'Superuser' : 'Support',
    initials: admin.name
      .split(' ')
      .map((namePart) => namePart[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  }
}

export const AuthProvider = ({ children }) => {
  const [authenticatedAdmin, setAuthenticatedAdmin] = useState(() => {
    const storedAdmin = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY)
    return storedAdmin ? JSON.parse(storedAdmin) : null
  })
  const [sessionLoading, setSessionLoading] = useState(true)
  const { showToast } = useToast()
  const hadStoredSession = useRef(Boolean(authenticatedAdmin))

  useEffect(() => {
    let active = true

    const restoreSession = async () => {
      const sessionResponse = await authApi.getAdminSession()
      const finalResponse = sessionResponse.success ? sessionResponse : await authApi.refreshAdminSession()

      if (!active) return

      if (finalResponse.success) {
        const adminSession = formatAdminSession(finalResponse.data)
        localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(adminSession))
        setAuthenticatedAdmin(adminSession)
      } else {
        localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
        setAuthenticatedAdmin(null)

        if (hadStoredSession.current && finalResponse.message) {
          showToast({ type: 'error', message: finalResponse.message })
        }
      }

      setSessionLoading(false)
    }

    restoreSession()

    return () => {
      active = false
    }
  }, [showToast])

  const login = useCallback(async (email, password) => {
    const response = await authApi.loginAdmin({ email, password })

    if (!response.success) {
      return response
    }

    const adminSession = formatAdminSession(response.data)

    localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(adminSession))
    setAuthenticatedAdmin(adminSession)

    return { success: true, message: response.message }
  }, [])

  const logout = useCallback(async () => {
    await authApi.logoutAdmin()
    localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
    setAuthenticatedAdmin(null)
  }, [])

  const authContextValue = useMemo(
    () => ({
      admin: authenticatedAdmin,
      isAuthenticated: Boolean(authenticatedAdmin),
      isAdmin: authenticatedAdmin?.role === 'admin',
      isSupport: authenticatedAdmin?.role === 'support',
      canWrite: authenticatedAdmin?.role === 'admin',
      canManageReports: ['admin', 'support'].includes(authenticatedAdmin?.role),
      sessionLoading,
      login,
      logout,
    }),
    [authenticatedAdmin, sessionLoading, login, logout],
  )

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
