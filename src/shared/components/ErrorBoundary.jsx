import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

// After a deploy, an open tab can ask for page code that no longer exists.
// Reloading picks up the new build; the flag stops a reload loop.
const RELOAD_FLAG = 'admin_chunk_reload_at'
const isChunkError = (error) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(
    String(error?.message || error),
  )

const reloadOnceForNewBuild = () => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_FLAG) || 0)
    if (Date.now() - last < 10_000) return false
    sessionStorage.setItem(RELOAD_FLAG, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}

/**
 * Keeps one broken page from blanking the whole console. `resetKey`
 * (the current path) clears the error when staff navigate elsewhere.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    if (isChunkError(error) && reloadOnceForNewBuild()) return
    console.error('[admin] render error', error, info?.componentStack)
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const chunk = isChunkError(error)
    return (
      <div className={this.props.fullScreen ? 'flex min-h-dvh items-center justify-center bg-canvas p-6' : 'py-16'}>
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-soft text-danger">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-fg">
            {chunk ? 'A new version of the console is available' : 'This page ran into a problem'}
          </h2>
          <p className="mt-1.5 text-[13px] leading-5 text-muted">
            {chunk
              ? 'Reload to get the latest version. Nothing you saved is lost.'
              : 'Reload the page to try again. If it keeps happening, tell the tech team what you were doing.'}
          </p>
          <div className="mt-5 flex gap-2">
            <button type="button" onClick={() => window.location.reload()} className="btn btn-primary btn-sm">
              <RefreshCw className="h-3.5 w-3.5" /> Reload
            </button>
            {!this.props.fullScreen && (
              <a href="/" className="btn btn-secondary btn-sm">
                Go to home
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }
}
