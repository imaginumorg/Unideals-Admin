import { memo, useCallback, useMemo, useState } from 'react'
import EmptyState from '../../../shared/components/EmptyState'
import Loader from '../../../shared/components/Loader'
import Modal from '../../../shared/components/Modal'
import { useToast } from '../../../shared/components/ToastContext'
import { useFetch } from '../../../shared/hooks/useFetch'
import { campusesApi } from '../api/campusesApi'
import { useAuth } from '../../auth/context/AuthContext'

const blankCampusForm = {
  slug: '',
  name: '',
  short_name: '',
  city: '',
  state: '',
  email_domains: '',
  is_active: true,
}

const formatDate = (dateValue) => {
  if (!dateValue) return 'Not available'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(dateValue))
}

const normalizeDomains = (domainsText) =>
  domainsText
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)

const CampusFormModal = ({ campus, open, onClose, onSubmit }) => {
  const [formState, setFormState] = useState(() =>
    campus
      ? {
          slug: campus.slug || '',
          name: campus.name || '',
          short_name: campus.short_name || '',
          city: campus.city || '',
          state: campus.state || '',
          email_domains: Array.isArray(campus.email_domains) ? campus.email_domains.join(', ') : '',
          is_active: Boolean(campus.is_active),
        }
      : blankCampusForm,
  )
  const [isSaving, setIsSaving] = useState(false)

  const updateField = (field, value) => {
    setFormState((currentValue) => ({ ...currentValue, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)

    const payload = {
      name: formState.name.trim(),
      short_name: formState.short_name.trim(),
      city: formState.city.trim() || null,
      state: formState.state.trim() || null,
      email_domains: normalizeDomains(formState.email_domains),
      is_active: formState.is_active,
      ...(campus ? {} : { slug: formState.slug.trim().toLowerCase() }),
    }

    await onSubmit(payload)
    setIsSaving(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0F172A]/40 px-4 py-6">
      <form onSubmit={handleSubmit} className="max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-[20px] bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-semibold text-[#0B1220]">{campus ? 'Edit campus' : 'Add campus'}</h2>
            <p className="mt-1 text-sm text-[#64748B]">Manage campus visibility and marketplace discovery details.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC]">
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">Slug</span>
            <input
              value={formState.slug}
              onChange={(event) => updateField('slug', event.target.value)}
              disabled={Boolean(campus)}
              required
              placeholder="iit-delhi"
              className="h-11 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0B1220] outline-none disabled:bg-[#F8FAFC] disabled:text-[#94A3B8]"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">Short name</span>
            <input
              value={formState.short_name}
              onChange={(event) => updateField('short_name', event.target.value)}
              required
              placeholder="IIT Delhi"
              className="h-11 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0B1220] outline-none"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">Campus name</span>
            <input
              value={formState.name}
              onChange={(event) => updateField('name', event.target.value)}
              required
              placeholder="Indian Institute of Technology Delhi"
              className="h-11 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0B1220] outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">City</span>
            <input
              value={formState.city}
              onChange={(event) => updateField('city', event.target.value)}
              placeholder="New Delhi"
              className="h-11 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0B1220] outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">State</span>
            <input
              value={formState.state}
              onChange={(event) => updateField('state', event.target.value)}
              placeholder="Delhi"
              className="h-11 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0B1220] outline-none"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">Email domains</span>
            <input
              value={formState.email_domains}
              onChange={(event) => updateField('email_domains', event.target.value)}
              placeholder="iitd.ac.in, mail.iitd.ac.in"
              className="h-11 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0B1220] outline-none"
            />
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] px-4 py-3 md:col-span-2">
            <input
              type="checkbox"
              checked={formState.is_active}
              onChange={(event) => updateField('is_active', event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm font-semibold text-[#0B1220]">Campus is active and visible to users</span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#334155]">
            Cancel
          </button>
          <button type="submit" disabled={isSaving} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:bg-[#A5B4FC]">
            {isSaving ? 'Saving...' : campus ? 'Save changes' : 'Create campus'}
          </button>
        </div>
      </form>
    </div>
  )
}

const Campuses = () => {
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingCampus, setEditingCampus] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [pendingStatusCampus, setPendingStatusCampus] = useState(null)
  const [pendingDeleteCampus, setPendingDeleteCampus] = useState(null)
  const { showToast } = useToast()
  const { canWrite } = useAuth()

  const loadCampuses = useCallback(() => campusesApi.getCampuses(), [])
  const { data: campuses = [], loading, error, refetch } = useFetch(loadCampuses)

  const visibleCampuses = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    return campuses.filter((campus) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && campus.is_active) ||
        (statusFilter === 'paused' && !campus.is_active)
      const matchesSearch =
        !normalizedSearch ||
        [campus.name, campus.short_name, campus.slug, campus.city, campus.state, ...(campus.email_domains || [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [campuses, searchQuery, statusFilter])

  const submitCampus = useCallback(
    async (payload) => {
      const response = editingCampus
        ? await campusesApi.updateCampus(editingCampus._id, payload)
        : await campusesApi.createCampus(payload)

      if (response.success) {
        showToast({ type: 'success', message: response.message })
        setEditingCampus(null)
        setShowCreateModal(false)
        refetch()
        return
      }

      showToast({ type: 'error', message: response.message })
    },
    [editingCampus, refetch, showToast],
  )

  const confirmStatusChange = useCallback(async () => {
    if (!pendingStatusCampus) return

    const response = await campusesApi.updateCampus(pendingStatusCampus._id, {
      is_active: !pendingStatusCampus.is_active,
    })

    if (response.success) {
      showToast({ type: 'success', message: response.message })
      refetch()
    } else {
      showToast({ type: 'error', message: response.message })
    }

    setPendingStatusCampus(null)
  }, [pendingStatusCampus, refetch, showToast])

  const confirmDeleteCampus = useCallback(async () => {
    if (!pendingDeleteCampus) return

    const response = await campusesApi.deleteCampus(pendingDeleteCampus._id)

    if (response.success) {
      showToast({ type: 'success', message: response.message || 'Campus deleted successfully' })
      refetch()
    } else {
      showToast({ type: 'error', message: response.message || 'Failed to delete campus' })
    }

    setPendingDeleteCampus(null)
  }, [pendingDeleteCampus, refetch, showToast])

  if (loading && !campuses.length) return <Loader rows={4} columns={6} />

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-[#0B1220]">Campus Management</h1>
          <p className="mt-1 text-[14px] text-[#475569]">Control campus availability, discovery metadata, and verified email domains.</p>
        </div>
        {canWrite ? (
          <button type="button" onClick={() => setShowCreateModal(true)} className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm">
            Add campus
          </button>
        ) : null}
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[18px] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">Total campuses</p>
          <p className="mt-4 text-[32px] font-semibold leading-none text-[#0B1220]">{campuses.length}</p>
        </article>
        <article className="rounded-[18px] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">Active</p>
          <p className="mt-4 text-[32px] font-semibold leading-none text-[#16A34A]">{campuses.filter((campus) => campus.is_active).length}</p>
        </article>
        <article className="rounded-[18px] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">Paused</p>
          <p className="mt-4 text-[32px] font-semibold leading-none text-[#DC2626]">{campuses.filter((campus) => !campus.is_active).length}</p>
        </article>
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#94A3B8]" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, slug, city or domain..."
            className="w-full bg-transparent text-sm text-[#0B1220] outline-none placeholder:text-[#64748B]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#0B1220] outline-none"
        >
          <option value="all">All campuses</option>
          <option value="active">Active only</option>
          <option value="paused">Paused only</option>
        </select>
      </div>

      {error ? (
        <EmptyState message={error} />
      ) : (
        <section className="overflow-hidden rounded-[20px] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead className="bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
                <tr>
                  <th className="px-5 py-4">Campus</th>
                  <th className="px-4 py-4">Slug</th>
                  <th className="px-4 py-4">Location</th>
                  <th className="px-4 py-4">Email domains</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Updated</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCampuses.length > 0 ? (
                  visibleCampuses.map((campus) => (
                    <tr key={campus._id} className="border-t border-[#EEF1F5]">
                      <td className="px-5 py-4">
                        <p className="text-[14px] font-semibold text-[#0B1220]">{campus.name}</p>
                        <p className="mt-1 text-[12px] text-[#64748B]">{campus.short_name}</p>
                      </td>
                      <td className="px-4 py-4 text-[13px] font-medium text-[#334155]">{campus.slug}</td>
                      <td className="px-4 py-4 text-[13px] text-[#334155]">
                        {[campus.city, campus.state].filter(Boolean).join(', ') || 'Not set'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex max-w-[280px] flex-wrap gap-1.5">
                          {(campus.email_domains || []).length > 0 ? (
                            campus.email_domains.map((domain) => (
                              <span key={domain} className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[11px] font-semibold text-[#475569]">
                                {domain}
                              </span>
                            ))
                          ) : (
                            <span className="text-[13px] text-[#94A3B8]">No domains</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${campus.is_active ? 'bg-[#ECFDF3] text-[#15803D]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                          {campus.is_active ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[13px] text-[#334155]">{formatDate(campus.updatedAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" disabled={!canWrite} onClick={() => setEditingCampus(campus)} className="rounded-xl bg-[#F8FAFC] px-3 py-2 text-[12px] font-semibold text-[#334155] disabled:cursor-not-allowed disabled:opacity-50">
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={!canWrite}
                            onClick={() => setPendingStatusCampus(campus)}
                            className={`rounded-xl px-3 py-2 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${campus.is_active ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#ECFDF3] text-[#15803D]'}`}
                          >
                            {campus.is_active ? 'Pause' : 'Activate'}
                          </button>
                          {canWrite ? (
                            <button
                              type="button"
                              onClick={() => setPendingDeleteCampus(campus)}
                              className="rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 px-3 py-2 text-[12px] font-semibold text-rose-600 dark:text-rose-400 transition"
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-[#EEF1F5]">
                    <td colSpan="7" className="px-5 py-10 text-center text-[14px] text-[#64748B]">
                      No campuses match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {(showCreateModal || editingCampus) && (
        <CampusFormModal
          key={editingCampus?._id || 'create-campus'}
          open={showCreateModal || Boolean(editingCampus)}
          campus={editingCampus}
          onClose={() => {
            setShowCreateModal(false)
            setEditingCampus(null)
          }}
          onSubmit={submitCampus}
        />
      )}

      <Modal
        open={Boolean(pendingStatusCampus)}
        title={pendingStatusCampus?.is_active ? 'Pause campus' : 'Activate campus'}
        description={
          pendingStatusCampus
            ? `${pendingStatusCampus.is_active ? 'Pause' : 'Activate'} ${pendingStatusCampus.name}? This changes whether users can select it publicly.`
            : ''
        }
        confirmLabel={pendingStatusCampus?.is_active ? 'Pause' : 'Activate'}
        tone={pendingStatusCampus?.is_active ? 'danger' : 'default'}
        onClose={() => setPendingStatusCampus(null)}
        onConfirm={confirmStatusChange}
      />

      <Modal
        open={Boolean(pendingDeleteCampus)}
        title="Delete campus"
        description={
          pendingDeleteCampus
            ? `Are you sure you want to permanently delete "${pendingDeleteCampus.name}"? Users linked to this campus will be prompted to pick an active campus.`
            : ''
        }
        confirmLabel="Delete campus"
        tone="danger"
        onClose={() => setPendingDeleteCampus(null)}
        onConfirm={confirmDeleteCampus}
      />
    </div>
  )
}

export default memo(Campuses)
