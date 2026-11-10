import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { authApi } from '../api/authApi'
import { useToast } from '../../../shared/components/ToastContext'
import { SESSION_EXPIRED_EVENT } from '../../../shared/lib/apiClient'
import { initialsOf, roleLabel } from '../../../shared/lib/format'

const AuthContext = createContext(null)
// Cached only for display while the session is verified; never trusted for access.
const ADMIN_SESSION_STORAGE_KEY = 'campus_mart_admin'

const formatAdminSession = (admin) => {
  if (!admin) return null
  return { ...admin, roleLabel: roleLabel(admin.role), initials: initialsOf(admin.name, 'A') }
}

const readCachedAdmin = () => {
  try {
    const stored = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

const persist = (admin) => {
  try {
    if (admin) localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(admin))
    else localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
  } catch {
    // storage unavailable
  }
}

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const { showToast } = useToast()
  const adminRef = useRef(null)
  useEffect(() => {
    adminRef.current = admin
  }, [admin])

  useEffect(() => {
    let active = true
    const hadCachedSession = Boolean(readCachedAdmin())

    authApi.getAdminSession().then((response) => {
      if (!active) return
      if (response.success && response.data) {
        const session = formatAdminSession(response.data)
        persist(session)
        setAdmin(session)
      } else {
        persist(null)
        setAdmin(null)
        if (hadCachedSession && response.status !== 401) {
          showToast({ type: 'error', message: response.message })
        }
      }
      setSessionLoading(false)
    })

    return () => {
      active = false
    }
  }, [showToast])

  // Any request whose session can't be refreshed lands here.
  useEffect(() => {
    const onExpired = () => {
      if (adminRef.current) showToast({ type: 'info', message: 'Your session expired. Please sign in again.' })
      setAdmin(null)
      persist(null)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [showToast])

  const login = useCallback(async (email, password) => {
    const response = await authApi.loginAdmin({ email, password })
    if (!response.success) return response
    const session = formatAdminSession(response.data)
    persist(session)
    setAdmin(session)
    return { success: true, message: response.message }
  }, [])

  const logout = useCallback(async () => {
    await authApi.logoutAdmin()
    persist(null)
    setAdmin(null)
  }, [])

  // Merge profile edits into the session so the header updates immediately.
  const updateAdmin = useCallback((updates) => {
    setAdmin((current) => {
      if (!current) return current
      const next = formatAdminSession({ ...current, ...updates })
      persist(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      admin,
      isAuthenticated: Boolean(admin),
      isAdmin: admin?.role === 'admin',
      isSupport: admin?.role === 'support',
      canWrite: admin?.role === 'admin',
      canManageReports: ['admin', 'support'].includes(admin?.role),
      sessionLoading,
      login,
      logout,
      updateAdmin,
    }),
    [admin, sessionLoading, login, logout, updateAdmin],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
