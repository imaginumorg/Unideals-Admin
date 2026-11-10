import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { authApi } from '../api/authApi'
import { accessApi } from '../../access/api/accessApi'
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

  // Section access for the signed-in person. The server enforces it on every
  // request; the UI uses it to hide what the person can't open or change.
  // Stored with the admin id so a different sign-in never reuses it.
  const [access, setAccess] = useState(null) // { id, data }
  const adminId = admin?.id
  const loadAccess = useCallback(async () => {
    if (!adminId) return
    const response = await accessApi.get()
    // If it can't load, fall back to "see everything, change nothing": the
    // server still refuses anything the policy doesn't allow.
    setAccess({ id: adminId, data: response.success ? response.data : { mine: null, failed: true } })
  }, [adminId])

  useEffect(() => {
    if (!adminId) return undefined
    const first = window.setTimeout(loadAccess, 0)
    // Pick up policy changes when staff come back to the tab.
    const onVisible = () => document.visibilityState === 'visible' && loadAccess()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(first)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [adminId, loadAccess])

  const accessData = adminId && access && access.id === adminId ? access.data : null
  const isAdmin = admin?.role === 'admin'
  const can = useCallback(
    (feature, level = 'view') => {
      if (isAdmin) return true
      if (!accessData) return false
      if (!accessData.mine) return level === 'view'
      return Boolean(accessData.mine[feature]?.[level])
    },
    [isAdmin, accessData],
  )

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
      isAdmin,
      isSupport: admin?.role === 'support',
      // Kept for Super-Admin-only actions (role changes, access settings).
      canWrite: isAdmin,
      can,
      accessReady: !admin || isAdmin || Boolean(accessData),
      reloadAccess: loadAccess,
      // Campuses a limited support person covers ([] = every campus).
      myCampuses: isAdmin ? [] : accessData?.mineCampuses || [],
      sessionLoading,
      login,
      logout,
      updateAdmin,
    }),
    [admin, isAdmin, can, accessData, loadAccess, sessionLoading, login, logout, updateAdmin],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
