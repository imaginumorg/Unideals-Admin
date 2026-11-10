import { memo, useCallback, useState } from 'react'
import { Ban, Download, Eye, EyeOff, Flag, ImageOff, Package, RotateCcw, ShieldAlert, Trash2 } from 'lucide-react'
import { PRODUCT_CATEGORY_OPTIONS, bulkProducts, productsApi } from '../api/productsApi'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/components/ToastContext'
import { useAttention } from '../../../layouts/AttentionContext'
import { BulkBar, BulkConfirmDialog, Checkbox, SavedViews, useSelection } from '../../../shared/components/listTools'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useCampusOptions, useListFilters, useSearchFilter } from '../../../shared/hooks/useListFilters'
import ProductDetailsDrawer from '../components/ProductDetailsDrawer'
import Avatar from '../../../shared/components/Avatar'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatusBadge,
  TableSkeleton,
  Tabs,
} from '../../../shared/components/ui'
import { downloadCsv, formatCurrency, formatDate, titleCase } from '../../../shared/lib/format'

const PAGE_SIZE = 12
const FILTER_DEFAULTS = { search: '', status: 'all', category: 'all', campus: 'all' }
const STATUS_TABS = ['all', 'listed', 'draft', 'unlisted', 'blocked', 'sold']

// "review" is a virtual tab: listings auto-hidden by the report threshold.
const BULK_ACTIONS = {
  unlisted: { label: 'Unlist', icon: EyeOff, tone: 'secondary', title: 'Unlist selected listings?', text: 'Hidden from the marketplace; sellers can fix and relist them. Each seller is notified.' },
  blocked: { label: 'Block', icon: Ban, tone: 'danger', title: 'Block selected listings?', text: "Removed from the marketplace and can't be relisted. Each seller is notified." },
  listed: { label: 'Make live', icon: Eye, tone: 'secondary', title: 'Make selected listings live?', text: 'Visible on the marketplace again. Sellers are told their listing is back.' },
  delete: { label: 'Delete', icon: Trash2, tone: 'danger', title: 'Permanently delete selected listings?', text: 'This cannot be undone. Open reports are closed and reporters and sellers are notified.' },
}

const thumbOf = (product) => {
  const first = product.images?.[0]
  return (typeof first === 'string' ? first : first?.url) || ''
}

const Products = () => {
  const campuses = useCampusOptions()
  const { filters, setFilter, resetFilters, isFiltered } = useListFilters(FILTER_DEFAULTS)
  const [searchText, setSearchText] = useSearchFilter(filters, setFilter)
  const [selectedId, setSelectedId] = useState(null)
  const [bulkAction, setBulkAction] = useState(null)
  const { canWrite } = useAuth()
  const { showToast } = useToast()
  const { counts: attention, refresh: refreshAttention } = useAttention()
  const reviewTab = filters.status === 'review'

  const load = useCallback(
    () =>
      productsApi.getProducts({
        search: filters.search,
        status: filters.status === 'all' || reviewTab ? '' : filters.status,
        flag: reviewTab ? 'auto_hidden' : '',
        category: filters.category === 'all' ? '' : filters.category,
        campus: filters.campus === 'all' ? '' : filters.campus,
        page: filters.page,
        limit: PAGE_SIZE,
      }),
    [filters.search, filters.status, filters.category, filters.campus, filters.page, reviewTab],
  )
  const { data, pagination, loading, refreshing, error, refetch } = useFetch(load)
  const products = data?.items || []
  const counts = data?.statusCounts
  const selection = useSelection(products)

  const runBulk = async (reason) => {
    const response = await bulkProducts(selection.selectedIds, bulkAction, reason)
    if (!response.success) {
      showToast({ type: 'error', message: response.message })
      return null
    }
    showToast({ type: response.data.failed ? 'info' : 'success', message: response.message })
    selection.clear()
    refetch()
    refreshAttention()
    return response.data
  }

  const exportCsv = () =>
    downloadCsv(
      `listings-page-${filters.page}.csv`,
      ['ID', 'Title', 'Category', 'Price', 'Status', 'Seller', 'Seller email', 'Open reports', 'Listed'],
      products.map((p) => [p.id, p.title, p.category, p.price, p.status, p.seller?.name, p.seller?.email, p.reports ?? 0, formatDate(p.createdAt)]),
    )

  return (
    <div>
      <PageHeader
        title="Listings"
        description="Everything students have put up for sale."
        icon={Package}
        actions={
          <button type="button" onClick={exportCsv} disabled={!products.length} className="btn btn-secondary">
            <Download className="h-4 w-4" /> Export page
          </button>
        }
      />

      <Card className="overflow-hidden">
        <div className="space-y-3 border-b border-line p-4">
          <Tabs
            value={filters.status}
            onChange={(value) => setFilter('status', value)}
            tabs={[
              ...STATUS_TABS.map((status) => ({
                value: status,
                label: status === 'all' ? 'All' : titleCase(status),
                count: counts && !reviewTab ? counts[status] ?? 0 : undefined,
              })),
              { value: 'review', label: 'Needs review', count: attention.autoHiddenListings || undefined },
            ]}
          />
          {reviewTab && (
            <p className="flex items-start gap-2 rounded-xl bg-warning-soft px-3.5 py-2.5 text-[13px] text-warning">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              These listings were hidden automatically after 5 reports. Sellers can't relist them until you review: make them live,
              or block / unlist them. Dismissing the reports on the Reports page also puts them back.
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput value={searchText} onChange={setSearchText} placeholder="Title, seller name/email or ID" className="sm:max-w-sm" />
            <Select
              label="Category"
              value={filters.category}
              onChange={(value) => setFilter('category', value)}
              options={[{ value: 'all', label: 'All categories' }, ...PRODUCT_CATEGORY_OPTIONS.map((c) => ({ value: c, label: titleCase(c) }))]}
              className="sm:w-52"
            />
            <Select
              label="Campus"
              value={filters.campus}
              onChange={(value) => setFilter('campus', value)}
              options={[{ value: 'all', label: 'All campuses' }, ...campuses.map((c) => ({ value: c.id, label: c.name }))]}
              className="sm:w-52"
            />
            {isFiltered && (
              <button type="button" onClick={resetFilters} className="btn btn-ghost">
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            )}
            <div className="sm:ml-auto">
              <SavedViews page="products" />
            </div>
          </div>
        </div>

        {loading && !data ? (
          <TableSkeleton rows={8} columns={6} />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : products.length === 0 ? (
          <EmptyState icon={Package} title="No listings found" message={isFiltered ? 'Try a different search or clear the filters.' : 'Listings appear here once students post items.'} />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${refreshing ? 'opacity-60' : ''}`}>
            <table className="table min-w-[900px]">
              <thead>
                <tr>
                  {canWrite && (
                    <th className="w-10">
                      <Checkbox
                        checked={selection.allSelected}
                        indeterminate={selection.someSelected}
                        onChange={selection.toggleAll}
                        label="Select all listings on this page"
                      />
                    </th>
                  )}
                  <th>Listing</th>
                  <th>Seller</th>
                  <th className="text-right">Price</th>
                  <th>Status</th>
                  <th>Reports</th>
                  <th>Listed</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const thumb = thumbOf(product)
                  return (
                    <tr
                      key={product.id}
                      onClick={() => setSelectedId(product.id)}
                      className={`cursor-pointer ${selection.selected.has(product.id) ? 'bg-brand-soft' : ''}`}
                    >
                      {canWrite && (
                        <td onClick={(event) => event.stopPropagation()}>
                          <Checkbox checked={selection.selected.has(product.id)} onChange={() => selection.toggle(product.id)} label={`Select ${product.title}`} />
                        </td>
                      )}
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-2 text-subtle">
                            {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" /> : <ImageOff className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-[280px] truncate font-semibold text-fg">{product.title}</p>
                            <p className="flex items-center gap-1.5 text-xs text-muted">
                              {titleCase(product.category)}
                              {product.auto_hidden_at && (
                                <Badge tone="warning" className="py-0 text-[10px]">
                                  <ShieldAlert className="h-3 w-3" /> Auto-hidden
                                </Badge>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar src={product.seller?.avatar} name={product.seller?.name} className="h-7 w-7 text-[10px]" />
                          <span className="max-w-[160px] truncate">{product.seller?.name || '—'}</span>
                        </div>
                      </td>
                      <td className="text-right font-semibold text-fg tabular-nums">{formatCurrency(product.price)}</td>
                      <td><StatusBadge status={product.status} /></td>
                      <td>
                        {product.reports > 0 ? (
                          <Badge tone="danger"><Flag className="h-3 w-3" /> {product.reports}</Badge>
                        ) : (
                          <span className="text-subtle">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap">{formatDate(product.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {pagination && <Pagination {...pagination} onPageChange={(page) => setFilter('page', page)} />}
      </Card>

      <ProductDetailsDrawer
        productId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={() => {
          refetch()
          refreshAttention()
        }}
      />

      <BulkBar
        count={selection.count}
        noun="listing"
        actions={Object.entries(BULK_ACTIONS).map(([key, a]) => ({ key, label: a.label, icon: a.icon, tone: a.tone }))}
        onAction={setBulkAction}
        onClear={selection.clear}
      />
      <BulkConfirmDialog
        open={Boolean(bulkAction)}
        title={bulkAction ? BULK_ACTIONS[bulkAction].title : ''}
        description={bulkAction ? `${selection.count} selected. ${BULK_ACTIONS[bulkAction].text}` : ''}
        confirmLabel={bulkAction ? `${BULK_ACTIONS[bulkAction].label} ${selection.count}` : ''}
        tone={bulkAction ? BULK_ACTIONS[bulkAction].tone === 'danger' ? 'danger' : 'primary' : 'primary'}
        askReason={bulkAction !== 'listed'}
        onClose={() => setBulkAction(null)}
        onConfirm={runBulk}
      />
    </div>
  )
}

export default memo(Products)
