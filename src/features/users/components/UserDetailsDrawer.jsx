import { memo, useEffect, useState } from 'react'
import { usersApi } from '../api/usersApi'
import { useToast } from '../../../shared/components/ToastContext'
import Avatar from '../../../shared/components/Avatar'

const formatDate = (d) => {
  if (!d) return '—'
  try {
    return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(d))
  } catch {
    return '—'
  }
}

const formatPrice = (p) =>
  p != null ? `₹${Number(p).toLocaleString('en-IN')}` : '₹0'

const UserDetailsDrawer = ({ userId, onClose, onStatusChange }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('Overview')
  const { showToast } = useToast()

  useEffect(() => {
    if (!userId || String(userId).startsWith('USR')) {
      setUser(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    usersApi.getUserDetails(userId).then((res) => {
      if (!active) return
      if (res?.success && res?.data) {
        setUser(res.data)
      } else {
        setUser(null)
      }
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setUser(null)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [userId])

  if (!userId) return null

  const handleToggleSuspend = async () => {
    if (!user) return
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended'
    const res = await onStatusChange(user.id, nextStatus)
    if (res?.success) {
      setUser((prev) => ({ ...prev, status: nextStatus }))
    }
  }

  const handleQuickAction = (actionName) => {
    showToast({ type: 'info', message: `${actionName} initiated for ${user?.name}` })
  }

  const tabs = ['Overview', 'Activity', 'Listings', 'Orders', 'Reports']

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col bg-white dark:bg-[#111827] shadow-2xl border-l border-[#E2E8F0] dark:border-[#1E293B] overflow-y-auto font-sans"
        aria-label="User details panel"
      >
        {/* Top Close bar */}
        <div className="flex items-center justify-between p-4 border-b border-[#F1F5F9] dark:border-[#1E293B]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">User Inspector</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {loading && !user ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : user ? (
          <div className="p-5 space-y-6">
            {/* User Hero Info */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <Avatar
                  src={user.avatar}
                  name={user.name}
                  className="h-14 w-14 text-base"
                  ringClassName="ring-2 ring-[#E2E8F0] dark:ring-[#334155]"
                />
                <div>
                  <h3 className="text-base font-bold text-[#0B1220] dark:text-white leading-tight">
                    {user.name}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">#{user.id}</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  user.status === 'suspended'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'suspended' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                {user.status === 'suspended' ? 'Suspended' : 'Active'}
              </span>
            </div>

            {/* Contact details */}
            <div className="space-y-2 text-xs text-[#475569] dark:text-[#94A3B8] border-b border-[#F1F5F9] dark:border-[#1E293B] pb-4">
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#94A3B8]" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#94A3B8]" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>{user.phone || user.mobile || '—'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#94A3B8]" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{typeof user.campus === 'object' ? user.campus?.name : user.campus || '—'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#94A3B8]" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
                <span>Joined {formatDate(user.joined || user.joinedAt || user.createdAt)}</span>
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickAction('View Profile')}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] dark:border-[#334155] py-2 px-3 text-xs font-semibold text-[#0B1220] dark:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>View Profile</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAction('Edit User')}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] py-2 px-3 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 transition"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
                <span>Edit User</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] dark:border-[#1E293B] text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
              {tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTab(t)}
                  className={`pb-2.5 transition relative ${
                    activeTab === t ? 'text-[#2563EB] dark:text-blue-400 font-bold' : 'hover:text-[#0B1220] dark:hover:text-white'
                  }`}
                >
                  {t}
                  {activeTab === t && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] dark:bg-blue-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: Overview */}
            {activeTab === 'Overview' && (
              <div className="space-y-6">
                {/* 3 Metric Counters */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#161F32] border border-[#E2E8F0]/60 dark:border-[#24304A]">
                    <p className="text-lg font-bold text-[#0B1220] dark:text-white">{user.listings ?? user.listingsCount ?? 0}</p>
                    <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-medium">Products Listed</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#161F32] border border-[#E2E8F0]/60 dark:border-[#24304A]">
                    <p className="text-lg font-bold text-[#0B1220] dark:text-white">{user.orders ?? 0}</p>
                    <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-medium">Orders Placed</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#161F32] border border-[#E2E8F0]/60 dark:border-[#24304A]">
                    <p className="text-lg font-bold text-[#0B1220] dark:text-white">{formatPrice(user.totalSpent ?? 0)}</p>
                    <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-medium">Total Spent</p>
                  </div>
                </div>

                {/* 3 Detail Info Rows */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="font-bold text-[#0B1220] dark:text-white">{formatDate(user.joined || user.joinedAt || user.createdAt)}</p>
                    <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Join Date</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#0B1220] dark:text-white">{typeof user.campus === 'object' ? user.campus?.name : user.campus || '—'}</p>
                    <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Campus</p>
                  </div>
                  <div>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">Verified</p>
                    <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Account Status</p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#0B1220] dark:text-white">Recent Activity</h4>
                    <button
                      type="button"
                      onClick={() => setActiveTab('Activity')}
                      className="text-[11px] font-semibold text-[#2563EB] hover:underline"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {user.activities?.length ? (
                      user.activities.map((act) => (
                        <div
                          key={act.id}
                          className="flex items-center justify-between rounded-xl p-2.5 bg-[#F8FAFC] dark:bg-[#161F32] text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#2563EB]">
                              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect width="18" height="18" x="3" y="3" rx="2" />
                              </svg>
                            </span>
                            <div>
                              <p className="font-medium text-[#0B1220] dark:text-white leading-tight">{act.title}</p>
                              {act.detail && <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{act.detail}</p>}
                            </div>
                          </div>
                          <span className="text-[11px] text-[#94A3B8]">{act.time}</span>
                        </div>
                      ))
                    ) : (
                      <p className="py-4 text-center text-xs text-[#94A3B8]">No recent activity recorded.</p>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-[#0B1220] dark:text-white">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleQuickAction('Send Message')}
                      className="flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#161F32] p-2.5 text-xs font-medium text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F8FAFC] dark:hover:bg-[#1F293D] transition shadow-xs"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      <span>Send Message</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAction('View Orders')}
                      className="flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#161F32] p-2.5 text-xs font-medium text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F8FAFC] dark:hover:bg-[#1F293D] transition shadow-xs"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      </svg>
                      <span>View Orders</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleSuspend}
                      className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-medium transition shadow-xs ${
                        user.status === 'suspended'
                          ? 'border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                          : 'border border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" x2="19.07" y1="4.93" y2="19.07" />
                      </svg>
                      <span>{user.status === 'suspended' ? 'Activate User' : 'Suspend User'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAction('Reset Password')}
                      className="flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#161F32] p-2.5 text-xs font-medium text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F8FAFC] dark:hover:bg-[#1F293D] transition shadow-xs"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="18" height="11" x="3" y="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>Reset Password</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* OTHER TABS */}
            {activeTab !== 'Overview' && (
              <div className="py-6 text-center text-xs text-[#94A3B8]">
                <p>Viewing user details for <strong className="text-[#0B1220] dark:text-white">{activeTab}</strong> tab.</p>
                <p className="mt-1">Records are current as of today.</p>
              </div>
            )}
          </div>
        ) : null}
      </aside>
    </>
  )
}

export default memo(UserDetailsDrawer)
