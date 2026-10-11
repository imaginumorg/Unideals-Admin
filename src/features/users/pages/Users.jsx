import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { usersApi } from '../api/usersApi'
import { useToast } from '../../../shared/components/ToastContext'
import UserDetailsDrawer from '../components/UserDetailsDrawer'
import Avatar from '../../../shared/components/Avatar'
import { useAuth } from '../../auth/context/AuthContext'

const campusBadgeStyles = {
  'VIT Vellore': 'bg-[#F3E8FF] text-[#7E22CE] dark:bg-[#581C87]/40 dark:text-[#D8B4FE]',
  'SRM Chennai': 'bg-[#E0E7FF] text-[#3730A3] dark:bg-[#312E81]/40 dark:text-[#A5B4FC]',
  'Amrita': 'bg-[#FCE7F3] text-[#BE185D] dark:bg-[#831843]/40 dark:text-[#F472B6]',
  'Manipal': 'bg-[#FFEDD5] text-[#C2410C] dark:bg-[#7C2D12]/40 dark:text-[#FB923C]',
  'Delhi University': 'bg-[#DCFCE7] text-[#15803D] dark:bg-[#14532D]/40 dark:text-[#86EFAC]',
  'IIT Madras': 'bg-[#FEF9C3] text-[#A16207] dark:bg-[#713F12]/40 dark:text-[#FDE047]',
}

const formatDisplayDate = (dateValue) => {
  if (!dateValue) return '—'
  try {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(new Date(dateValue))
  } catch {
    return '—'
  }
}

const getCampusLabel = (campus) => {
  if (!campus) return 'Not assigned'
  if (typeof campus === 'string') return campus
  return campus.short_name || campus.name || 'Not assigned'
}

const Users = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [campusFilter, setCampusFilter] = useState('All Campuses')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [userTypeFilter, setUserTypeFilter] = useState('All User Types')
  const [joinedDateFilter, setJoinedDateFilter] = useState('All Dates')
  const [selectedUserIds, setSelectedUserIds] = useState(new Set())
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [usersList, setUsersList] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', campus: 'VIT Vellore', phone: '' })
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    totalGrowth: 0,
    activeUsers: 0,
    activePct: 0,
    suspendedUsers: 0,
    suspendedPct: 0,
    newUsers30d: 0,
    newUsersGrowth: 0,
  })
  const { showToast } = useToast()
  const { canWrite } = useAuth()

  const loadData = useCallback(async () => {
    setLoading(true)
    const effectiveCampus = campusFilter === 'All Campuses' ? '' : campusFilter
    const effectiveStatus = statusFilter === 'All Status' ? '' : statusFilter.toLowerCase()
    
    const [res, statsRes] = await Promise.all([
      usersApi.getUsers({
        search: searchQuery,
        campus: effectiveCampus,
        status: effectiveStatus,
        page: currentPage,
        limit: 8,
      }),
      usersApi.getUserStats(),
    ])

    if (res?.success && Array.isArray(res.data)) {
      setUsersList(res.data)
    } else {
      setUsersList([])
    }

    if (statsRes?.success && statsRes.data) {
      setUserStats(statsRes.data)
    }

    setLoading(false)
  }, [searchQuery, campusFilter, statusFilter, currentPage])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(new Set(usersList.map((u) => u.id)))
    } else {
      setSelectedUserIds(new Set())
    }
  }

  const handleToggleSelect = (id, e) => {
    e.stopPropagation()
    setSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setCampusFilter('All Campuses')
    setStatusFilter('All Status')
    setUserTypeFilter('All User Types')
    setJoinedDateFilter('All Dates')
    setCurrentPage(1)
  }

  const handleStatusChange = async (userId, nextStatus) => {
    if (!canWrite) return { success: false, message: 'Support users can view user details but cannot update accounts.' }
    const res = await usersApi.updateUserStatus(userId, nextStatus)
    if (res.success) {
      showToast({ type: 'success', message: `User status changed to ${nextStatus}` })
      loadData()
    }
    return res
  }

  const handleRoleChange = async (userId, nextRole) => {
    if (!canWrite) return
    const res = await usersApi.updateUserRole(userId, nextRole)
    if (res.success) {
      showToast({ type: 'success', message: nextRole === 'support' ? 'User is now support' : 'Support access removed' })
      loadData()
    } else {
      showToast({ type: 'error', message: res.message })
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    if (!newUserForm.name || !newUserForm.email) return
    const res = await usersApi.createUser(newUserForm)
    if (res.success) {
      showToast({ type: 'success', message: 'User added successfully' })
      setShowAddModal(false)
      setNewUserForm({ name: '', email: '', campus: 'VIT Vellore', phone: '' })
      loadData()
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-[#0B1220] dark:text-white tracking-tight">
            User Management
          </h1>
          <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8]">
            Manage platform users, monitor account health, and adjust access permissions.
          </p>
        </div>
        <div>
          {canWrite ? (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 text-sm font-semibold shadow-md shadow-blue-500/20 transition active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              <span>Add User</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* 4 Stat Metric Cards (Image 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Users */}
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Total Users</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-[#0B1220] dark:text-white">
              {userStats.totalUsers.toLocaleString()}
            </p>
            <span className={`inline-flex items-center text-xs font-bold ${userStats.totalGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {userStats.totalGrowth >= 0 ? '↑ +' : '↓ '}{Math.abs(userStats.totalGrowth)}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#94A3B8]">vs last month</p>
        </div>

        {/* Card 2: Active Users */}
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Active Users</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <polyline points="16 11 18 13 22 9" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-[#0B1220] dark:text-white">
              {userStats.activeUsers.toLocaleString()}
            </p>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {userStats.activePct}%
            </span>
          </div>
          {/* Active progress bar */}
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-[#E2E8F0] dark:bg-[#1E293B] overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, userStats.activePct))}%` }} />
          </div>
        </div>

        {/* Card 3: Suspended Users */}
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Suspended Users</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" x2="19.07" y1="4.93" y2="19.07" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-[#0B1220] dark:text-white">
              {userStats.suspendedUsers.toLocaleString()}
            </p>
            <span className="inline-flex items-center text-xs font-bold text-rose-600 dark:text-rose-400">
              {userStats.suspendedPct}%
            </span>
          </div>
          {/* Suspended progress bar */}
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-[#E2E8F0] dark:bg-[#1E293B] overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, userStats.suspendedPct))}%` }} />
          </div>
        </div>

        {/* Card 4: New Users (30d) with Purple Sparkline */}
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">New Users (30d)</span>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-[#0B1220] dark:text-white">
                {userStats.newUsers30d.toLocaleString()}
              </p>
              <span className={`inline-flex items-center text-xs font-bold ${userStats.newUsersGrowth >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500'}`}>
                {userStats.newUsersGrowth >= 0 ? '↑ +' : '↓ '}{Math.abs(userStats.newUsersGrowth)}%
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#94A3B8]">Active registrations</p>
          </div>
          {/* Purple Sparkline SVG */}
          <div className="h-10 w-24">
            <svg viewBox="0 0 100 40" className="h-full w-full overflow-visible">
              <path
                d="M0 35 Q 25 30, 45 15 T 80 18 T 100 5"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, user ID or campus..."
              className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-[#F8FAFC] dark:bg-[#1A2234] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#0B1220] dark:text-white placeholder-[#94A3B8] outline-none transition focus:border-[#2563EB] focus:bg-white dark:focus:bg-[#1A2234]"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Campus dropdown */}
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1A2234] px-3 py-2 text-xs font-medium text-[#334155] dark:text-[#CBD5E1] outline-none"
            >
              <option>All Campuses</option>
              <option>VIT Vellore</option>
              <option>SRM Chennai</option>
              <option>Amrita</option>
              <option>Manipal</option>
              <option>Delhi University</option>
              <option>IIT Madras</option>
            </select>

            {/* Status dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1A2234] px-3 py-2 text-xs font-medium text-[#334155] dark:text-[#CBD5E1] outline-none"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Suspended</option>
            </select>

            {/* User types dropdown */}
            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
              className="rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1A2234] px-3 py-2 text-xs font-medium text-[#334155] dark:text-[#CBD5E1] outline-none hidden sm:block"
            >
              <option>All User Types</option>
              <option>Students</option>
              <option>Moderators</option>
              <option>Admins</option>
            </select>

            {/* Joined Date */}
            <select
              value={joinedDateFilter}
              onChange={(e) => setJoinedDateFilter(e.target.value)}
              className="rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1A2234] px-3 py-2 text-xs font-medium text-[#334155] dark:text-[#CBD5E1] outline-none hidden md:block"
            >
              <option>Joined Date</option>
              <option>Newest First</option>
              <option>Oldest First</option>
            </select>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1A2234] px-3 py-2 text-xs font-medium text-[#64748B] hover:text-[#0B1220] dark:hover:text-white transition"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] dark:bg-[#161F32] border-b border-[#E2E8F0] dark:border-[#1E293B] text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
              <tr>
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={usersList.length > 0 && selectedUserIds.size === usersList.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB]"
                  />
                </th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Campus</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4 text-center">Listings</th>
                <th className="py-3.5 px-4 text-center">Orders</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1E293B] text-[#334155] dark:text-[#CBD5E1]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#94A3B8]">
                    Loading user records...
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#94A3B8]">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                usersList.map((user) => {
                  const isSelected = selectedUserIds.has(user.id)
                  const isViewing = selectedUserId === user.id
                  const campusLabel = getCampusLabel(user.campus)
                  const campusBadge = campusBadgeStyles[campusLabel] || 'bg-slate-100 text-slate-700'

                  return (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`cursor-pointer transition hover:bg-[#F8FAFC] dark:hover:bg-[#1A2234] ${
                        isViewing ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelect(user.id, e)}
                          className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB]"
                        />
                      </td>

                      {/* User Avatar & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={user.avatar}
                            name={user.name}
                            className="h-9 w-9 text-xs"
                            ringClassName="ring-1 ring-[#E2E8F0] dark:ring-[#334155]"
                          />
                          <div>
                            <p className="font-bold text-[#0B1220] dark:text-white leading-tight">{user.name}</p>
                            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">#{user.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-normal text-[#64748B] dark:text-[#94A3B8]">
                        {user.email}
                      </td>

                      {/* Campus Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold ${campusBadge}`}>
                          {campusLabel}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            user.status === 'suspended'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'suspended' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          {user.status === 'suspended' ? 'Suspended' : 'Active'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${user.role === 'support' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {user.role === 'support' ? 'Support' : 'User'}
                        </span>
                      </td>

                      {/* Listings count */}
                      <td className="py-3.5 px-4 text-center font-semibold text-[#0B1220] dark:text-white">
                        {user.listings ?? 0}
                      </td>

                      {/* Orders count */}
                      <td className="py-3.5 px-4 text-center font-semibold text-[#0B1220] dark:text-white">
                        {user.orders ?? 0}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-[#64748B] dark:text-[#94A3B8]">
                        {formatDisplayDate(user.joined)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {canWrite ? (
                            <button
                              type="button"
                              onClick={() => handleRoleChange(user.id, user.role === 'support' ? 'user' : 'support')}
                              className="rounded-lg border border-[#E2E8F0] px-2 py-1 text-[11px] font-semibold text-[#334155] hover:bg-[#F8FAFC] dark:border-[#334155] dark:text-[#CBD5E1]"
                            >
                              {user.role === 'support' ? 'Remove support' : 'Make support'}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setSelectedUserId(user.id)}
                            className="p-1 rounded-lg hover:bg-[#EEF2F6] dark:hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#0B1220] dark:hover:text-white transition"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="19" cy="12" r="1" />
                              <circle cx="5" cy="12" r="1" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-[#E2E8F0] dark:border-[#1E293B] gap-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
          <p>
            Showing 1-{usersList.length} of 5,284 users
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 rounded-lg border border-[#E2E8F0] dark:border-[#2D3748] flex items-center justify-center hover:bg-[#F8FAFC] dark:hover:bg-[#1A2234] disabled:opacity-40"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className={`h-8 w-8 rounded-lg font-bold flex items-center justify-center ${
                currentPage === 1 ? 'bg-[#2563EB] text-white' : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1A2234]'
              }`}
            >
              1
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(2)}
              className={`h-8 w-8 rounded-lg font-bold flex items-center justify-center ${
                currentPage === 2 ? 'bg-[#2563EB] text-white' : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1A2234]'
              }`}
            >
              2
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(3)}
              className={`h-8 w-8 rounded-lg font-bold flex items-center justify-center ${
                currentPage === 3 ? 'bg-[#2563EB] text-white' : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1A2234]'
              }`}
            >
              3
            </button>
            <span className="px-1 text-[#94A3B8]">...</span>
            <button
              type="button"
              onClick={() => setCurrentPage(661)}
              className="h-8 px-2 rounded-lg font-semibold flex items-center justify-center hover:bg-[#F8FAFC] dark:hover:bg-[#1A2234]"
            >
              661
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => p + 1)}
              className="h-8 w-8 rounded-lg border border-[#E2E8F0] dark:border-[#2D3748] flex items-center justify-center hover:bg-[#F8FAFC] dark:hover:bg-[#1A2234]"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* User Details Drawer on the right (Image 2 inspection drawer) */}
      <UserDetailsDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onStatusChange={handleStatusChange}
        onRoleChange={handleRoleChange}
      />

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1E293B] p-6 shadow-2xl border border-[#E2E8F0] dark:border-[#334155] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] dark:border-[#2D3748]">
              <h3 className="text-base font-bold text-[#0B1220] dark:text-white">Add New User</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#94A3B8] hover:text-[#0B1220] dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-[#64748B] dark:text-[#94A3B8] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="e.g. Rohit Verma"
                  className="w-full rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#64748B] dark:text-[#94A3B8] mb-1">College Email</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="e.g. rohit.v@vitstudent.ac.in"
                  className="w-full rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#64748B] dark:text-[#94A3B8] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  placeholder="+91 98765 00000"
                  className="w-full rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#64748B] dark:text-[#94A3B8] mb-1">Campus</label>
                <select
                  value={newUserForm.campus}
                  onChange={(e) => setNewUserForm({ ...newUserForm, campus: e.target.value })}
                  className="w-full rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] p-2.5 outline-none"
                >
                  <option>VIT Vellore</option>
                  <option>SRM Chennai</option>
                  <option>Amrita</option>
                  <option>Manipal</option>
                  <option>Delhi University</option>
                  <option>IIT Madras</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#CBD5E1] font-semibold text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-semibold shadow-xs"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(Users)
