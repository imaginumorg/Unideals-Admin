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
      {/* Brand panel */}
      <section className="relative hidden w-[46%] max-w-[680px] overflow-hidden bg-gradient-to-br from-[#2f35f4] via-[#4B45FF] to-[#7472f5] p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse at 30% 20%, black 20%, transparent 75%)',
          }}
        />
        <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-32 h-[420px] w-[420px] rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg shadow-black/10">
            <img src="/unideals-logo.svg" alt="" className="h-8 w-8 object-contain" />
          </span>
          <div>
            <p className="text-lg leading-tight font-bold">Unideals</p>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-white/70 uppercase">Admin Console</p>
          </div>
        </div>

        <div className="relative mt-auto mb-auto max-w-md pt-16">
          <h1 className="text-[40px] leading-[1.08] font-extrabold tracking-tight xl:text-5xl">
            Run the campus marketplace with confidence.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/75">
            One workspace for the Unideals team to keep buying and selling safe for every student.
          </p>

          <ul className="mt-10 space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5 rounded-2xl bg-white/[0.08] p-4 ring-1 ring-white/15 backdrop-blur-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-[13px] text-white/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Imaginum · Authorized staff only</p>
      </section>

      {/* Form */}
      <section className="relative flex flex-1 flex-col">
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />

        <div className="relative flex items-center justify-between p-5 sm:p-6">
          <div className="flex items-center gap-2.5 lg:invisible">
            <img src="/unideals-logo.svg" alt="" className="h-9 w-9 object-contain" />
            <span className="text-[15px] font-bold text-fg">Unideals Admin</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="relative flex flex-1 items-center justify-center px-5 pb-16">
          <form onSubmit={handleSubmit} noValidate className="w-full max-w-[400px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Staff sign in
            </span>
            <h2 className="mt-5 text-[28px] leading-tight font-bold tracking-tight text-fg">Welcome back</h2>
            <p className="mt-1.5 text-sm text-muted">Sign in with your admin or support account.</p>

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
                    className="input h-11 pl-10"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-fg-2">Password</span>
                  <button
                    type="button"
                    onClick={() => setShowRecovery((value) => !value)}
                    className="text-xs font-semibold text-brand-fg hover:underline"
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
                    className="input h-11 pr-11 pl-10"
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

            <button type="submit" disabled={submitting} className="btn btn-primary mt-6 h-11 w-full text-[15px]">
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
