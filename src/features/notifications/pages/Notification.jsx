import { memo, useCallback, useMemo, useState } from 'react'
import Loader from '../../../shared/components/Loader'
import { useFetch } from '../../../shared/hooks/useFetch'
import { notificationsApi } from '../api/notificationsApi'
import { useAuth } from '../../auth/context/AuthContext'

const statusStyles = {
  SENT: 'text-primary',
  DRAFT: 'text-[#334155]',
  SCHEDULED: 'text-[#D97706]',
}

const selectionCardStyles = {
  active: 'border-2 border-primary bg-[#EEF2FF] text-primary',
  idle: 'border border-[#E2E8F0] bg-white text-[#0B1220]',
}

const SelectionIndicator = ({ active }) => (
  <span className={`flex h-6 w-6 items-center justify-center rounded-full ${active ? 'border border-primary text-primary' : 'border border-[#CBD5E1] text-[#CBD5E1]'}`}>
    {active && (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="m5 12 4 4 10-10" />
      </svg>
    )}
  </span>
)

const Notification = () => {
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationMessage, setNotificationMessage] = useState('')
  const [recipientMode, setRecipientMode] = useState('all_users')
  const [deliveryMode, setDeliveryMode] = useState('send_now')
  const [channelMode, setChannelMode] = useState('in_app')
  const { canWrite } = useAuth()

  const loadNotificationCenter = useCallback(() => notificationsApi.getNotificationCenter(), [])
  const { data: notificationData, loading } = useFetch(loadNotificationCenter)

  const previewTitle = notificationTitle.trim() || 'Notification Title Preview'
  const previewBody =
    notificationMessage.trim() || 'Your message preview will appear here as you type.'

  const channelCopy = useMemo(
    () => ({
      in_app: {
        title: 'In-App Notification',
        description: "Delivered directly to user's dashboard",
      },
      email: {
        title: 'Email Notification',
        description: 'Sent to primary email address',
      },
    }),
    [],
  )

  if (loading && !notificationData) return <Loader rows={4} columns={2} />

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.78fr]">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#0B1220]">Send Notification</h1>
          <div className="flex items-center gap-3">
            {!canWrite && (
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                Support: View-only
              </span>
            )}
            <button
              type="button"
              disabled={!canWrite}
              className="rounded-xl bg-[#F8FAFC] px-4 py-2.5 text-sm font-semibold text-[#334155] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={!canWrite}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send Now
            </button>
          </div>
        </div>

        <section className="rounded-[20px] bg-white p-5 shadow-sm">
          <div className="space-y-5">
            <label className="block">
              <span className="mb-3 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">Notification Title</span>
              <input
                value={notificationTitle}
                onChange={(event) => setNotificationTitle(event.target.value)}
                placeholder="Enter a descriptive title..."
                className="h-12 w-full rounded-xl border border-[#E2E8F0] px-4 text-sm text-[#0B1220] outline-none placeholder:text-[#64748B]"
              />
            </label>
            <label className="block">
              <span className="mb-3 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">Message Content</span>
              <textarea
                value={notificationMessage}
                onChange={(event) => setNotificationMessage(event.target.value)}
                placeholder="Write your message here..."
                className="min-h-[140px] w-full rounded-xl border border-[#E2E8F0] px-4 py-4 text-sm text-[#0B1220] outline-none placeholder:text-[#64748B]"
              />
            </label>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-[20px] bg-white p-5 shadow-sm">
            <h2 className="text-[22px] font-semibold text-[#0B1220]">Select Recipients</h2>
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => setRecipientMode('all_users')}
                className={`flex w-full items-center justify-between rounded-xl px-5 py-4 text-left transition ${recipientMode === 'all_users' ? selectionCardStyles.active : selectionCardStyles.idle}`}
              >
                <span className="flex items-center gap-3 text-[16px] font-semibold">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  </svg>
                  All Users
                </span>
                <SelectionIndicator active={recipientMode === 'all_users'} />
              </button>
              <button
                type="button"
                onClick={() => setRecipientMode('select_users')}
                className={`flex w-full items-center justify-between rounded-xl px-5 py-4 text-left transition ${recipientMode === 'select_users' ? selectionCardStyles.active : selectionCardStyles.idle}`}
              >
                <span className="flex items-center gap-3 text-[16px] font-semibold">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                  Pro Users
                </span>
                <SelectionIndicator active={recipientMode === 'select_users'} />
              </button>
            </div>
          </section>

          <section className="rounded-[20px] bg-white p-5 shadow-sm">
            <h2 className="text-[22px] font-semibold text-[#0B1220]">Delivery Schedule</h2>
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => setDeliveryMode('send_now')}
                className={`flex w-full items-center justify-between rounded-xl px-5 py-4 text-left transition ${deliveryMode === 'send_now' ? selectionCardStyles.active : selectionCardStyles.idle}`}
              >
                <span className="flex items-center gap-3 text-[16px] font-semibold">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m13 2-2 7h4l-4 13 2-9H9z" />
                  </svg>
                  Send Now
                </span>
                <SelectionIndicator active={deliveryMode === 'send_now'} />
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMode('schedule')}
                className={`flex w-full items-center justify-between rounded-xl px-5 py-4 text-left transition ${deliveryMode === 'schedule' ? selectionCardStyles.active : selectionCardStyles.idle}`}
              >
                <span className="flex items-center gap-3 text-[16px] font-semibold">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4" />
                    <path d="M8 2v4" />
                    <path d="M3 10h18" />
                  </svg>
                  Schedule
                </span>
                <SelectionIndicator active={deliveryMode === 'schedule'} />
              </button>
            </div>
          </section>
        </div>

        <section className="rounded-[20px] bg-white p-5 shadow-sm">
          <h2 className="text-[22px] font-semibold text-[#0B1220]">Notification Channel</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setChannelMode('in_app')}
              className={`rounded-xl p-5 text-left transition ${channelMode === 'in_app' ? selectionCardStyles.active : selectionCardStyles.idle}`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${channelMode === 'in_app' ? 'bg-white text-primary' : 'bg-[#F8FAFC] text-[#334155]'}`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 0 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                  <path d="M10 21a2 2 0 0 0 4 0" />
                </svg>
              </div>
              <p className={`mt-4 text-[18px] font-semibold ${channelMode === 'in_app' ? 'text-primary' : 'text-[#0B1220]'}`}>{channelCopy.in_app.title}</p>
              <p className="mt-2 text-sm text-[#475569]">{channelCopy.in_app.description}</p>
            </button>
            <button
              type="button"
              onClick={() => setChannelMode('email')}
              className={`rounded-xl p-5 text-left transition ${channelMode === 'email' ? selectionCardStyles.active : selectionCardStyles.idle}`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${channelMode === 'email' ? 'bg-white text-primary' : 'bg-[#F8FAFC] text-[#334155]'}`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16v16H4z" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
              </div>
              <p className={`mt-4 text-[18px] font-semibold ${channelMode === 'email' ? 'text-primary' : 'text-[#0B1220]'}`}>{channelCopy.email.title}</p>
              <p className="mt-2 text-sm text-[#475569]">{channelCopy.email.description}</p>
            </button>
          </div>
        </section>
      </div>

      <div className="space-y-5">
        <section className="rounded-[20px] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-semibold text-[#0B1220]">Notification Preview</h2>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0B1220]">Mobile</span>
          </div>
          <div className="mt-5 rounded-[18px] bg-[#F8FAFC] p-4">
            <div className="rounded-[18px] bg-white p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    {channelMode === 'in_app' ? (
                      <>
                        <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 0 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                        <path d="M10 21a2 2 0 0 0 4 0" />
                      </>
                    ) : (
                      <>
                        <path d="M4 4h16v16H4z" />
                        <path d="m4 7 8 6 8-6" />
                      </>
                    )}
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0B1220]">
                      {channelMode === 'in_app' ? 'UniDeals' : 'Email Alert'}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#CBD5E1]">
                      {deliveryMode === 'schedule' ? 'Scheduled' : 'Now'}
                    </span>
                  </div>
                  <p className="mt-2 text-[17px] font-semibold text-[#0B1220]">{previewTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-[#334155]">{previewBody}</p>
                  <p className="mt-3 text-[12px] font-medium text-[#475569]">
                    Audience: {recipientMode === 'all_users' ? 'All Users' : 'Pro Users'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[20px] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-semibold text-[#0B1220]">Recent Broadcasts</h2>
            <button type="button" className="text-sm font-semibold text-primary">
              View All
            </button>
          </div>
          <div className="mt-5 space-y-4">
            {(notificationData?.broadcasts || []).length === 0 ? (
              <p className="py-8 text-center text-sm text-[#94A3B8]">No data available</p>
            ) : (
              (notificationData?.broadcasts || []).map((broadcast) => (
                <article key={broadcast.id} className="border-b border-[#EEF1F5] pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[17px] font-semibold text-[#0B1220]">{broadcast.title}</p>
                      <p className="mt-1 text-sm text-[#64748B]">{broadcast.audience}</p>
                    </div>
                    <span className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${statusStyles[broadcast.status]}`}>{broadcast.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#475569]">{broadcast.time}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default memo(Notification)
