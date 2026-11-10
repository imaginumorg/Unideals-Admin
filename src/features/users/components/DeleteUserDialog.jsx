import { memo, useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { usersApi } from '../api/usersApi'
import { useToast } from '../../../shared/components/ToastContext'
import { Dialog, Field, Spinner } from '../../../shared/components/ui'

// What the backend removes (services/userDeletion.service.js), in plain words.
const REMOVED = [
  'The account, profile photo and sign-in sessions',
  'Every listing they posted, with images, boosts and reports on them',
  'All their chats, messages, deals and reviews (both sides)',
  'Reports they filed or that name them',
  'Their notifications, payments, subscriptions and badges',
]

/**
 * Super Admin: permanently delete a user and everything linked to them.
 * The email has to be typed back before the button unlocks.
 */
const DeleteUserDialog = ({ user, onClose, onDeleted }) => {
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [working, setWorking] = useState(false)

  // Fresh form for each person (reset while rendering, no effect needed).
  const [formFor, setFormFor] = useState(user?.id)
  if (user && user.id !== formFor) {
    setFormFor(user.id)
    setEmail('')
    setReason('')
  }

  const matches = Boolean(user) && email.trim().toLowerCase() === String(user.email).toLowerCase()

  const run = async () => {
    if (!matches || working) return
    setWorking(true)
    const response = await usersApi.deleteUser(user.id, { confirmEmail: email.trim(), reason: reason.trim() })
    setWorking(false)
    if (!response.success) {
      showToast({ type: 'error', message: response.message })
      return
    }
    const listings = response.data?.removed?.listings ?? 0
    showToast({
      type: 'success',
      message: `${user.name}'s account was deleted${listings ? ` with ${listings} listing${listings === 1 ? '' : 's'}` : ''}`,
    })
    onDeleted?.(user)
  }

  return (
    <Dialog
      open={Boolean(user)}
      onClose={working ? undefined : onClose}
      title={user ? `Delete ${user.name}'s account?` : ''}
      description="This permanently removes the account and everything linked to it. It can't be undone."
      size="sm"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={working} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={run}
            disabled={!matches || working}
            className="btn bg-danger text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {working ? <Spinner /> : <Trash2 className="h-4 w-4" />}
            Delete permanently
          </button>
        </>
      }
    >
      {user && (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            run()
          }}
        >
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5">
            <p className="flex items-center gap-2 text-[13px] font-medium text-danger">
              <AlertTriangle className="h-4 w-4 shrink-0" /> What gets deleted
            </p>
            <ul className="mt-2 space-y-1 pl-6 text-[13px] leading-5 text-fg-2">
              {REMOVED.map((line) => (
                <li key={line} className="list-disc marker:text-danger/70">{line}</li>
              ))}
            </ul>
            <p className="mt-2.5 text-xs leading-5 text-muted">
              The audit log keeps a record of this deletion. People they traded with lose those chats too.
            </p>
          </div>

          <Field label={<>Type <span className="font-mono text-fg">{user.email}</span> to confirm</>}>
            <input
              className="input font-mono"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={user.email}
              autoComplete="off"
              spellCheck={false}
              autoFocus
              disabled={working}
            />
          </Field>
          <Field label="Reason (optional)" hint="Saved in the audit log.">
            <textarea
              className="input"
              rows={2}
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Student asked for their data to be removed"
              disabled={working}
            />
          </Field>
        </form>
      )}
    </Dialog>
  )
}

export default memo(DeleteUserDialog)
