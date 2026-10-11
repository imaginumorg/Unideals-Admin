import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../../../shared/components/ToastContext'
import ThemePicker from '../../../shared/components/ThemePicker'

const featuresList = [
  {
    label: 'Monitor users & products',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Handle reports & moderation',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'View analytics & insights',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  {
    label: 'Manage campus marketplaces',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
      </svg>
    ),
  },
]

const Login = () => {
  const [emailAddress, setEmailAddress] = useState('kamalsinha7305@gmail.com')
  const [passwordValue, setPasswordValue] = useState('••••••••••••')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loginErrorMessage, setLoginErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    setLoginErrorMessage('')
    setIsSubmitting(true)

    // If user left dots or placeholder, use default demo pass
    const effectivePass = passwordValue === '••••••••••••' ? 'password123' : passwordValue

    const loginResult = await login(emailAddress, effectivePass)
    setIsSubmitting(false)

    if (loginResult.success) {
      showToast({ type: 'success', message: loginResult.message || 'Signed in successfully' })
      navigate('/dashboard', { replace: true })
      return
    }

    showToast({ type: 'error', message: loginResult.message })
    setLoginErrorMessage(loginResult.message)
  }

  return (
    <main className="min-h-screen bg-[#EEF2F8] dark:bg-[#070B14] p-3 sm:p-6 lg:p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-[1240px] overflow-hidden rounded-[28px] sm:rounded-[36px] bg-[#0C1220] border border-[#CBD5E1]/40 dark:border-[#1E293B] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
        
        {/* Left Side: Dark Hero Presentation */}
        <section className="relative flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-[#0B1220] via-[#0E1729] to-[#0A101D] text-white overflow-hidden">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#2563EB]/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#3B82F6]/10 blur-3xl" />

          {/* Top Brand */}
          <div className="relative z-10 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1E293B] ring-1 ring-[#334155]/60 shadow-inner">
              <img src="/unideals-logo.svg" alt="UniDeals" className="h-7 w-7 object-contain" />
            </span>
            <div>
              <p className="text-[19px] font-bold tracking-tight text-white">UniDeals</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#94A3B8]">Admin Portal</p>
            </div>
          </div>

          {/* Middle Content */}
          <div className="relative z-10 my-8 sm:my-10 space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold tracking-tight leading-[1.15]">
                Manage <br />
                Your Marketplace <br />
                <span className="text-[#3B82F6]">With Ease</span>
              </h1>
              <p className="text-[#94A3B8] text-[15px] sm:text-[16px] max-w-md font-normal leading-relaxed">
                Review deals, reports, and seller activity from one focused workspace.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="space-y-2.5 max-w-sm pt-2">
              {featuresList.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] px-4 py-3 text-[14px] text-white/90 backdrop-blur-sm transition"
                >
                  <span className="text-[#94A3B8] shrink-0">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Hero Image Showcase */}
            <div className="relative pt-4 max-w-md">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
                <img
                  src="/login-workspace.jpg"
                  alt="UniDeals Admin Workspace"
                  className="w-full h-44 sm:h-52 object-cover object-center transform transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220]/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 bg-[#0B1220]/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg">
                  <p className="text-[11px] font-semibold text-white/90 tracking-wide">Better Campus Commerce</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Indicators */}
          <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/[0.07]">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-6 rounded-full bg-[#3B82F6]" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
            </div>
            <p className="text-[12px] text-[#94A3B8]">Powering student commerce across campus.</p>
          </div>
        </section>

        {/* Right Side: Clean Login Card */}
        <section className="relative flex flex-col justify-between bg-white dark:bg-[#111827] p-8 sm:p-12 lg:p-14">
          {/* Top Row: Theme Toggle */}
          <div className="flex items-center justify-end">
            <ThemePicker />
          </div>

          {/* Center Form Area */}
          <div className="mx-auto w-full max-w-[380px] my-auto py-6">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF2FF] dark:bg-[#1E293B] shadow-sm ring-1 ring-[#DDE3FF] dark:ring-[#334155]">
                <img src="/unideals-logo.svg" alt="UniDeals Logo" className="h-9 w-9 object-contain" />
              </div>
              <h2 className="text-2xl sm:text-[28px] font-bold text-[#0B1220] dark:text-white tracking-tight">
                Welcome Back
              </h2>
              <p className="mt-1.5 text-sm text-[#64748B] dark:text-[#94A3B8]">
                Sign in to your UniDeals admin portal
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* EMAIL */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-2">
                  Email
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-[#94A3B8]">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    required
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="kamalsinha7305@gmail.com"
                    className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1A2234] pl-11 pr-4 py-3 text-sm text-[#0B1220] dark:text-white placeholder-[#94A3B8] outline-none transition focus:border-[#2563EB] focus:bg-white dark:focus:bg-[#1A2234] focus:ring-4 focus:ring-[#2563EB]/10"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-2">
                  Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-[#94A3B8]">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordValue}
                    onFocus={() => {
                      if (passwordValue === '••••••••••••') setPasswordValue('')
                    }}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1A2234] pl-11 pr-11 py-3 text-sm text-[#0B1220] dark:text-white placeholder-[#94A3B8] outline-none transition focus:border-[#2563EB] focus:bg-white dark:focus:bg-[#1A2234] focus:ring-4 focus:ring-[#2563EB]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 text-[#94A3B8] hover:text-[#64748B] dark:hover:text-white transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* REMEMBER ME & FORGOT PASSWORD */}
              <div className="flex items-center justify-between pt-1 text-sm">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span className="text-[#334155] dark:text-[#CBD5E1] text-[13px] font-medium">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[13px] font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              {loginErrorMessage && (
                <p className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 px-3.5 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400">
                  {loginErrorMessage}
                </p>
              )}

              {/* SIGN IN BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-3.5 px-5 font-semibold text-sm shadow-md shadow-blue-500/20 transition active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Security Guarantee */}
          <div className="text-center pt-6">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#10B981]">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
              </svg>
              <span className="text-[#64748B] dark:text-[#94A3B8]">Protected and secure admin access</span>
            </div>
          </div>
        </section>
      </div>

      {/* Forgot Password Friendly Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1E293B] p-6 shadow-2xl border border-[#E2E8F0] dark:border-[#334155]">
            <h3 className="text-lg font-bold text-[#0B1220] dark:text-white">Admin Password Recovery</h3>
            <p className="mt-2 text-sm text-[#64748B] dark:text-[#94A3B8]">
              Password reset requests for super-admin accounts must be authorized by campus root administrators.
              Contact system support or use your root environment secrets.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default memo(Login)
