import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

const VARIANTS = {
  success: { icon: CheckCircle2, className: 'text-success' },
  error: { icon: XCircle, className: 'text-danger' },
  info: { icon: Info, className: 'text-info' },
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    ({ message, type = 'info', duration = 3600 }) => {
      if (!message) return
      const id = `${Date.now()}-${Math.random()}`
      setToasts((current) => [...current.slice(-3), { id, message, type }])
      window.setTimeout(() => removeToast(id), duration)
    },
    [removeToast],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-5 bottom-5 z-[80] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2">
        {toasts.map((toast) => {
          const variant = VARIANTS[toast.type] || VARIANTS.info
          const Icon = variant.icon
          return (
            <div key={toast.id} className="pop animate-pop-in pointer-events-auto flex items-start gap-2.5 rounded-lg py-2.5 pr-2.5 pl-3">
              <Icon className={`mt-px h-4 w-4 shrink-0 ${variant.className}`} />
              <p className="min-w-0 flex-1 text-[13px] leading-5 text-fg">{toast.message}</p>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => removeToast(toast.id)}
                className="rounded p-0.5 text-subtle transition-colors hover:bg-surface-3 hover:text-fg"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)
