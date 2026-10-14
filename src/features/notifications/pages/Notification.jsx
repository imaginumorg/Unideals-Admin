import { memo, useEffect, useMemo, useState } from 'react'
import { notificationsApi } from '../api/notificationsApi'
import { campusesApi } from '../../campuses/api/campusesApi'
import { useAuth } from '../../auth/context/AuthContext'

const TEMPLATES = [
  {
    title: 'Special Offer for VIT Students!',
    message: 'Get up to 30% off on Laptops and Accessories. Limited time offer!',
    type: 'promotion',
    audience: 'campus',
    actionLabel: 'View Offers',
    actionUrl: '/deals',
    imageUrl:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Campus Moving Out Sale is Live!',
    message: 'Graduating seniors are listing furniture, books, and electronics at discounted prices.',
    type: 'announcement',
    audience: 'all',
    actionLabel: 'Browse Deals',
    actionUrl: '/deals',
    imageUrl:
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Pick-up Spot Safety Reminder',
    message: 'Always meet at verified campus pickup hubs and inspect items before confirming deals.',
    type: 'general',
    audience: 'all',
    actionLabel: 'Learn More',
    actionUrl: '/help',
    imageUrl: '',
  },
  {
    title: 'Weekend Flash Deals in Tech',
    message: 'Calculators, iPads, and lab supplies now available with instant peer delivery.',
    type: 'promotion',
    audience: 'buyers',
    actionLabel: 'Claim Deal',
    actionUrl: '/deals',
    imageUrl:
      'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=600&q=80',
  },
]

const Notification = () => {
  const { canWrite } = useAuth()

  // Tab navigation: 'send' | 'history' | 'scheduled'
  const [activeTab, setActiveTab] = useState('send')

  // Preview sub-tab: 'web' | 'mobile'
  const [previewTab, setPreviewTab] = useState('web')

  // Templates modal
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)

  // Form states
  const [title, setTitle] = useState('Special Offer for VIT Students!')
  const [message, setMessage] = useState(
    'Get up to 30% off on Laptops and Accessories. Limited time offer!',
  )
  const [notificationType, setNotificationType] = useState('promotion')
  const [targetAudience, setTargetAudience] = useState('all')
  const [selectedCampus, setSelectedCampus] = useState('')
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
  )
  const [actionLabel, setActionLabel] = useState('View Offers')
  const [actionUrl, setActionUrl] = useState('/deals')
  const [scheduleType, setScheduleType] = useState('now')
  const [scheduledAt, setScheduledAt] = useState('')

  // Data states
  const [campuses, setCampuses] = useState([])
  const [stats, setStats] = useState({})
  const [recipientCount, setRecipientCount] = useState(null)
  const [historyItems, setHistoryItems] = useState([])
  const [scheduledItems, setScheduledItems] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [sending, setSending] = useState(false)
  const [statusFeedback, setStatusFeedback] = useState(null)

  // Initial load
  useEffect(() => {
    let mounted = true

    const loadInitial = async () => {
      setLoadingData(true)
      try {
        const [statsRes, campusesRes, schedRes, histRes] = await Promise.all([
          notificationsApi.getStats(),
          campusesApi.getCampuses(),
          notificationsApi.getScheduled(),
          notificationsApi.getHistory(1, 20),
        ])

        if (mounted) {
          if (statsRes?.success) setStats(statsRes.data)
          if (campusesRes?.data) {
            setCampuses(campusesRes.data)
            if (campusesRes.data.length > 0) {
              const vit = campusesRes.data.find(
                (c) => c.short_name?.includes('VIT') || c.name?.includes('Vellore'),
              )
              setSelectedCampus(vit ? vit._id : campusesRes.data[0]._id)
            }
          }
          if (schedRes?.data) setScheduledItems(schedRes.data)
          if (histRes?.data?.items) setHistoryItems(histRes.data.items)
          const failedRequest = [statsRes, campusesRes, schedRes, histRes].find((result) => !result?.success)
          if (failedRequest) {
            setStatusFeedback({
              type: 'error',
              message: failedRequest.message || 'Some notification data could not be loaded.',
            })
          }
        }
      } catch (err) {
        if (mounted) {
          setStatusFeedback({ type: 'error', message: err.message || 'Failed to load notification data.' })
        }
      } finally {
        if (mounted) setLoadingData(false)
      }
    }

    loadInitial()
    return () => {
      mounted = false
    }
  }, [])

  // Dynamic recipient count estimation
  useEffect(() => {
    let active = true
    const fetchEstimate = async () => {
      try {
        const res = await notificationsApi.getRecipientEstimate({
          targetAudience,
          targetCampus: targetAudience === 'campus' ? selectedCampus : null,
        })
        if (active && res?.success && res.data?.count !== undefined) {
          setRecipientCount(res.data.count)
        } else if (active && !res?.success) {
          setStatusFeedback({ type: 'error', message: res?.message || 'Unable to estimate recipients.' })
        }
      } catch (err) {
        if (active) setStatusFeedback({ type: 'error', message: err.message || 'Unable to estimate recipients.' })
      }
    }

    fetchEstimate()
    return () => {
      active = false
    }
  }, [targetAudience, selectedCampus])

  // Current campus object
  const currentCampusObj = useMemo(
    () => campuses.find((c) => String(c._id) === String(selectedCampus)),
    [campuses, selectedCampus],
  )

  // Apply template
  const applyTemplate = (tpl) => {
    setTitle(tpl.title)
    setMessage(tpl.message)
    setNotificationType(tpl.type)
    setTargetAudience(tpl.audience)
    setActionLabel(tpl.actionLabel)
    setActionUrl(tpl.actionUrl)
    setImageUrl(tpl.imageUrl)
    setShowTemplatesModal(false)
  }

  // Handle send notification
  const handleSend = async (e) => {
    e.preventDefault()
    if (!canWrite) return
    if (!title.trim() || !message.trim()) {
      setStatusFeedback({ type: 'error', message: 'Title and Message are required' })
      return
    }

    if (scheduleType === 'scheduled' && !scheduledAt) {
      setStatusFeedback({ type: 'error', message: 'Please select a date and time for scheduling' })
      return
    }

    setSending(true)
    setStatusFeedback(null)

    try {
      await notificationsApi.sendNotification({
        title: title.trim(),
        message: message.trim(),
        type: notificationType,
        target_audience: targetAudience,
        target_campus: targetAudience === 'campus' ? selectedCampus : null,
        image_url: imageUrl.trim() || null,
        action_url: actionUrl.trim() || null,
        action_label: actionLabel.trim() || 'View Offers',
        schedule_type: scheduleType,
        scheduled_at: scheduleType === 'scheduled' ? new Date(scheduledAt).toISOString() : null,
      })

      setStatusFeedback({
        type: 'success',
        message:
          scheduleType === 'scheduled'
            ? 'Notification scheduled successfully!'
            : 'Push notification sent to recipients successfully!',
      })

      // Refresh stats, history & scheduled
      const [statsRes, schedRes, histRes] = await Promise.all([
        notificationsApi.getStats(),
        notificationsApi.getScheduled(),
        notificationsApi.getHistory(1, 20),
      ])
      if (statsRes?.success) setStats(statsRes.data)
      if (schedRes?.data) setScheduledItems(schedRes.data)
      if (histRes?.data?.items) setHistoryItems(histRes.data.items)
      const failedRequest = [statsRes, schedRes, histRes].find((result) => !result?.success)
      if (failedRequest) {
        setStatusFeedback({
          type: 'error',
          message: `Notification sent, but ${failedRequest.message || 'the latest data could not be refreshed.'}`,
        })
      }
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        message: err.message || 'Failed to dispatch notification',
      })
    } finally {
      setSending(false)
    }
  }

  // Cancel scheduled notification
  const handleCancelScheduled = async (id) => {
    if (!canWrite) return
    try {
      await notificationsApi.cancelScheduled(id)
      setScheduledItems((prev) => prev.filter((item) => String(item._id) !== String(id)))
      setStatusFeedback({ type: 'success', message: 'Scheduled notification cancelled' })
    } catch (err) {
      setStatusFeedback({ type: 'error', message: err.message || 'Failed to cancel schedule' })
    }
  }

  const notificationTypeBadgeLabel = useMemo(() => {
    switch (notificationType) {
      case 'promotion':
        return 'OFFER'
      case 'order':
        return 'ORDER UPDATE'
      case 'announcement':
        return 'ANNOUNCEMENT'
      default:
        return 'GENERAL'
    }
  }, [notificationType])

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800 dark:text-slate-100">
      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Push Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Send notifications to users, sellers, or specific campuses. Keep your UniDeals
            community informed.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTemplatesModal(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Notification Templates
        </button>
      </div>

      {/* ===================== TABS NAVIGATION ===================== */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-sm font-semibold dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('send')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 transition ${
            activeTab === 'send'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <svg className="h-4 w-4 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Send Notification
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 transition ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <polyline points="12 6 12 12 16 14" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Notification History
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scheduled')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 transition ${
            activeTab === 'scheduled'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
            <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
            <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
            <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
          </svg>
          Scheduled ({scheduledItems.length})
        </button>
      </div>

      {/* ===================== TOP 4 STAT METRICS CARDS ===================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Sent */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <svg className="h-3.5 w-3.5 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </span>
              <span>Total Sent</span>
              <span className="text-slate-400">›</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats.totalSent == null ? '—' : Number(stats.totalSent).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Card 2: Delivered */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </span>
              <span>Delivered</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats.delivered == null ? '—' : Number(stats.delivered).toLocaleString()}
            </div>
            <div className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>{stats.deliveredPercent == null ? '—' : `${stats.deliveredPercent}%`}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Clicked */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                </svg>
              </span>
              <span>Clicked</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats.clicked == null ? '—' : Number(stats.clicked).toLocaleString()}
            </div>
            <div className="flex items-center text-xs font-bold text-amber-600 dark:text-amber-400">
              <span>{stats.clickedPercent == null ? '—' : `${stats.clickedPercent}%`}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Active Users */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              <span>Active Users</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-950"></span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats.activeUsers == null ? '—' : Number(stats.activeUsers).toLocaleString()}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">tracked by backend</div>
          </div>
        </div>
      </div>

      {/* ===================== STATUS FEEDBACK ALERT ===================== */}
      {(loadingData || statusFeedback) && (
        <div
          role={statusFeedback?.type === 'error' ? 'alert' : 'status'}
          className={`flex items-center justify-between rounded-xl p-4 text-sm font-semibold transition ${
            statusFeedback?.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
              : statusFeedback?.type === 'error'
                ? 'border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
                : 'border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          <span>{statusFeedback?.message || 'Loading notification data...'}</span>
          {statusFeedback && (
            <button
              type="button"
              onClick={() => setStatusFeedback(null)}
              className="text-xs font-bold uppercase opacity-75 hover:opacity-100"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* ===================== TAB 1: SEND NOTIFICATION ===================== */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          {/* LEFT: FORM SECTION */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Create Push Notification
            </h2>

            <form onSubmit={handleSend} className="mt-5 space-y-5">
              {/* Title Input with counter */}
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                  <label htmlFor="notif-title">Title *</label>
                  <span className="text-slate-400">{title.length}/100</span>
                </div>
                <input
                  id="notif-title"
                  type="text"
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Special Offer for VIT Students!"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  required
                />
              </div>

              {/* Message Textarea with counter */}
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                  <label htmlFor="notif-message">Message *</label>
                  <span className="text-slate-400">{message.length}/500</span>
                </div>
                <textarea
                  id="notif-message"
                  rows={3}
                  maxLength={500}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Get up to 30% off on Laptops and Accessories. Limited time offer!"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  required
                />
              </div>

              {/* Notification Type Pills */}
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Notification Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'general', label: 'General', icon: '🏷️' },
                    { id: 'promotion', label: 'Offer / Promotion', icon: '🏷️' },
                    { id: 'order', label: 'Order Update', icon: '📦' },
                    { id: 'announcement', label: 'Announcement', icon: '📢' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNotificationType(t.id)}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                        notificationType === t.id
                          ? 'border border-primary bg-indigo-50 text-primary dark:bg-indigo-950/50 dark:text-indigo-300'
                          : 'border border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Audience Pills */}
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Target Audience
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'all', label: 'All Users', icon: '👥' },
                    { id: 'buyers', label: 'Buyers', icon: '🛍️' },
                    { id: 'sellers', label: 'Sellers', icon: '🏷️' },
                    { id: 'campus', label: 'Specific Campus', icon: '🏫' },
                  ].map((aud) => (
                    <button
                      key={aud.id}
                      type="button"
                      onClick={() => setTargetAudience(aud.id)}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                        targetAudience === aud.id
                          ? 'border border-primary bg-indigo-50 text-primary dark:bg-indigo-950/50 dark:text-indigo-300'
                          : 'border border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{aud.icon}</span>
                      <span>{aud.label}</span>
                    </button>
                  ))}

                  {/* Campus Dropdown when Specific Campus is chosen */}
                  {targetAudience === 'campus' && (
                    <div className="relative min-w-[200px]">
                      <select
                        value={selectedCampus}
                        onChange={(e) => setSelectedCampus(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-8 text-xs font-bold text-slate-800 outline-none transition focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                      >
                        {campuses.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.short_name || c.name}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        ▼
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Add Image (Optional) */}
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Add Image (Optional)
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  {imageUrl ? (
                    <div className="relative h-20 w-44 overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-800">
                      <img
                        src={imageUrl}
                        alt="Notification Banner"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80 text-xs font-bold text-white transition hover:bg-rose-600"
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  ) : null}

                  <div className="flex flex-1 flex-col gap-2 min-w-[240px]">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Paste image URL (e.g. ImageKit or banner link)"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none transition focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setImageUrl(
                            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
                          )
                        }
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      >
                        Use Sale Sample
                      </button>
                      <span className="text-[11px] text-slate-400">JPG, PNG (Max 2MB)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button Label & Link */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Action Label (CTA)
                  </label>
                  <input
                    type="text"
                    value={actionLabel}
                    onChange={(e) => setActionLabel(e.target.value)}
                    placeholder="e.g. View Offers"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none transition focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Action Target URL
                  </label>
                  <input
                    type="text"
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    placeholder="e.g. /deals or /myorders"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none transition focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              {/* Schedule Section */}
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Schedule
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="schedule"
                      checked={scheduleType === 'now'}
                      onChange={() => setScheduleType('now')}
                      className="text-primary focus:ring-primary"
                    />
                    <span>Send Now</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="schedule"
                      checked={scheduleType === 'scheduled'}
                      onChange={() => setScheduleType('scheduled')}
                      className="text-primary focus:ring-primary"
                    />
                    <span>Schedule for Later</span>
                  </label>

                  {scheduleType === 'scheduled' && (
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                      required={scheduleType === 'scheduled'}
                    />
                  )}
                </div>
              </div>

              {/* Submit Button & Support Guard */}
              <div className="pt-2">
                {!canWrite ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
                    Support role is view-only. Only full administrators can dispatch push notifications.
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg className="h-4 w-4 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>
                      {sending
                        ? 'Dispatching...'
                        : scheduleType === 'scheduled'
                          ? 'Schedule Notification'
                          : 'Send Notification'}
                    </span>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* RIGHT: LIVE PREVIEW & AUDIENCE BREAKDOWN */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Notification Preview
                </h3>
                <span className="text-xs text-slate-400">ℹ️</span>
              </div>

              {/* Preview Tabs */}
              <div className="mt-4 flex border-b border-slate-200 text-xs font-bold dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewTab('web')}
                  className={`border-b-2 px-4 py-2 transition ${
                    previewTab === 'web'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  In-App (Web)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('mobile')}
                  className={`border-b-2 px-4 py-2 transition ${
                    previewTab === 'mobile'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Mobile Push
                </button>
              </div>

              {/* Live Preview Card */}
              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white shadow-sm">
                      U
                    </span>
                    <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black tracking-wider text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {notificationTypeBadgeLabel}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">Just now</span>
                </div>

                <div className="mt-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {title || 'Notification Title Preview'}
                  </h4>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                    {message || 'Your notification body preview will appear here.'}
                  </p>
                </div>

                {imageUrl && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    <img
                      src={imageUrl}
                      alt="Banner Preview"
                      className="h-28 w-full object-cover"
                    />
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-hover"
                  >
                    <span>{actionLabel || 'View Offers'}</span>
                    <span>↗</span>
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <span>✓</span>
                    <span>Mark as read</span>
                  </button>
                </div>
              </div>

              {/* Will be sent to Summary Panel */}
              <div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Will be sent to
                </h4>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <span>👥</span> Audience
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white capitalize">
                    {targetAudience === 'all'
                      ? 'All Users'
                      : targetAudience === 'campus'
                        ? 'Specific Campus'
                        : targetAudience}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <span>🏫</span> Campus
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {targetAudience === 'campus'
                      ? currentCampusObj?.short_name || currentCampusObj?.name || 'VIT Vellore'
                      : 'All Campuses'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <span>📊</span> Total Recipients
                  </span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                    ~ {recipientCount == null ? 'Unavailable' : recipientCount.toLocaleString()} users
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <span>⏰</span> Scheduled
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {scheduleType === 'now'
                      ? 'Send Now'
                      : scheduledAt
                        ? new Date(scheduledAt).toLocaleString()
                        : 'Scheduled Date'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: NOTIFICATION HISTORY ===================== */}
      {activeTab === 'history' && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Notification History
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {historyItems.length} campaigns dispatched
            </span>
          </div>

          {historyItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <span className="text-3xl">📭</span>
              <p className="mt-2 text-sm font-semibold">No notification campaigns sent yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                    <th className="py-3 px-4">Title & Message</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Audience</th>
                    <th className="py-3 px-4">Sent</th>
                    <th className="py-3 px-4">Delivered</th>
                    <th className="py-3 px-4">Clicked</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {historyItems.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{item.title}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{item.message}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                        {item.type}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {item.target_campus?.name || item.target_audience}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-slate-900 dark:text-white">
                        {item.stats?.total_sent || 1}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-emerald-600">
                        {item.stats?.delivered || 1}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-amber-600">
                        {item.stats?.clicked || 0}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 3: SCHEDULED NOTIFICATIONS ===================== */}
      {activeTab === 'scheduled' && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Scheduled Notifications
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {scheduledItems.length} queued
            </span>
          </div>

          {scheduledItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <span className="text-3xl">📅</span>
              <p className="mt-2 text-sm font-semibold">No scheduled notifications pending.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {scheduledItems.map((item) => (
                <div
                  key={item._id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {item.type}
                      </span>
                      <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {item.message}
                      </p>
                    </div>

                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => handleCancelScheduled(item._id)}
                        className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-400"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <span>
                      📅 {item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : 'Pending'}
                    </span>
                    <span>🎯 {item.target_campus?.name || item.target_audience}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== NOTIFICATION TEMPLATES MODAL ===================== */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Notification Templates
                </h3>
                <p className="text-xs text-slate-500">
                  Select a pre-built template to quickly populate your push notification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplatesModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TEMPLATES.map((tpl, i) => (
                <div
                  key={i}
                  onClick={() => applyTemplate(tpl)}
                  className="group flex cursor-pointer flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:border-primary hover:bg-indigo-50/40 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-primary"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-black uppercase text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                        {tpl.type}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {tpl.audience}
                      </span>
                    </div>
                    <h4 className="mt-2 text-sm font-bold text-slate-900 group-hover:text-primary dark:text-white">
                      {tpl.title}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{tpl.message}</p>
                  </div>
                  <div className="mt-3 text-right text-xs font-bold text-primary">
                    Use Template →
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(Notification)
