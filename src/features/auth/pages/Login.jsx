import { memo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ScrollText, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../../../shared/components/ToastContext'
import ThemeToggle from '../../../shared/components/ThemeToggle'
import { InlineAlert, Spinner } from '../../../shared/components/ui'

const HIGHLIGHTS = [
  { icon: Users, title: 'People & listings', text: 'Review students, listings and orders across every campus.' },
  { icon: ShieldCheck, title: 'Trust & safety', text: 'Work the report queue and approve sensitive account changes.' },
  { icon: ScrollText, title: 'Full accountability', text: 'Every staff action is written to an immutable audit log.' },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)

  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const returnTo = (() => {
    const from = location.state?.from
    const path = from ? `${from.pathname || ''}${from.search || ''}` : ''
    return path && path !== '/login' ? path : '/dashboard'
  })()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const cleanEmail = email.trim().toLowerCase()
    if (!EMAIL_RE.test(cleanEmail)) return setError('Enter a valid email address.')
    if (!password) return setError('Enter your password.')

    setSubmitting(true)
    const result = await login(cleanEmail, password)
    setSubmitting(false)

    if (result.success) {
      showToast({ type: 'success', message: 'Welcome back' })
      navigate(returnTo, { replace: true })
      return
    }
    setPassword('')
    setError(result.message || 'Sign in failed. Please try again.')
  }

  return (
    <main className="relative flex min-h-dvh bg-canvas">
      {/* Brand panel: always dark, a restrained indigo glow and faint grid. */}
      <section className="relative hidden w-[44%] max-w-[640px] flex-col overflow-hidden border-r border-white/[0.06] bg-[#08080b] p-10 text-white lg:flex xl:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 20% 0%, rgba(91,86,255,0.22) 0%, transparent 70%), radial-gradient(40% 40% at 100% 100%, rgba(91,86,255,0.10) 0%, transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at 30% 10%, black 10%, transparent 70%)',
          }}
        />

        <div className="relative flex items-center gap-2.5">
          <img src="/unideals-logo.svg" alt="" className="h-8 w-8 object-contain" />
          <span className="font-brand text-lg font-bold tracking-tight">Unideals</span>
          <span className="rounded border border-white/15 px-1.5 py-px text-[10px] font-medium tracking-wide text-white/60 uppercase">
            Admin
          </span>
        </div>

        <div className="relative my-auto max-w-[440px] py-16">
          <h1 className="text-[34px] leading-[1.12] font-semibold tracking-[-0.03em] text-white xl:text-[40px]">
            Run the campus marketplace with confidence.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60">
            One workspace for the Unideals team to keep buying and selling safe for every student.
          </p>

          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                  <Icon className="h-4 w-4 text-[#a9a6ff]" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">{title}</span>
                  <span className="mt-0.5 block text-[13px] leading-5 text-white/55">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} Imaginum · Authorized staff only</p>
      </section>

      {/* Form */}
      <section className="relative flex flex-1 flex-col">
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />

        <div className="relative flex items-center justify-between p-5 sm:p-6">
          <div className="flex items-center gap-2.5 lg:invisible">
            <img src="/unideals-logo.svg" alt="" className="h-8 w-8 object-contain" />
            <span className="font-brand text-[15px] font-bold tracking-tight text-fg">Unideals</span>
            <span className="rounded border border-line px-1.5 py-px text-[10px] font-medium tracking-wide text-muted uppercase">Admin</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="relative flex flex-1 items-center justify-center px-5 pb-16">
          <form onSubmit={handleSubmit} noValidate className="w-full max-w-[380px]">
            <h2 className="text-2xl leading-8 font-semibold tracking-[-0.025em] text-fg">Sign in to Admin</h2>
            <p className="mt-1.5 text-[13px] text-muted">Use your Unideals admin or support account.</p>

            {error && (
              <InlineAlert className="mt-6" tone="danger">
                {error}
              </InlineAlert>
            )}

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="label">Email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-subtle" />
                  <input
                    type="email"
                    autoComplete="username"
                    autoFocus
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@unideals.in"
                    className="input h-10 pl-10"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-fg-2">Password</span>
                  <button
                    type="button"
                    onClick={() => setShowRecovery((value) => !value)}
                    className="text-xs font-medium text-muted transition-colors hover:text-fg"
                  >
                    Forgot password?
                  </button>
                </span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-subtle" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="input h-10 pr-11 pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-subtle transition hover:text-fg"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {showRecovery && (
                <div className="animate-fade-in rounded-xl border border-line bg-surface p-3.5 text-[13px] text-muted">
                  Staff passwords are reset through the main Unideals app: use <b className="text-fg-2">Forgot password</b> on the
                  storefront sign-in with this email, then return here. If your account is locked, ask a Super Admin.
                </div>
              )}
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary mt-6 h-10 w-full text-sm">
              {submitting ? (
                <>
                  <Spinner /> Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="mt-6 flex items-center justify-center gap-2 text-xs text-subtle">
              <ShieldCheck className="h-3.5 w-3.5" /> Protected session · activity is audited
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}

export default memo(Login)
