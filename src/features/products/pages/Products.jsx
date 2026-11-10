import { memo, useCallback, useState } from 'react'
import { Download, Flag, ImageOff, Package, RotateCcw } from 'lucide-react'
import { PRODUCT_CATEGORY_OPTIONS, productsApi } from '../api/productsApi'
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

const thumbOf = (product) => {
  const first = product.images?.[0]
  return (typeof first === 'string' ? first : first?.url) || ''
}

const Products = () => {
  const campuses = useCampusOptions()
  const { filters, setFilter, resetFilters, isFiltered } = useListFilters(FILTER_DEFAULTS)
  const [searchText, setSearchText] = useSearchFilter(filters, setFilter)
  const [selectedId, setSelectedId] = useState(null)

  const load = useCallback(
    () =>
      productsApi.getProducts({
        search: filters.search,
        status: filters.status === 'all' ? '' : filters.status,
        category: filters.category === 'all' ? '' : filters.category,
        campus: filters.campus === 'all' ? '' : filters.campus,
        page: filters.page,
        limit: PAGE_SIZE,
      }),
    [filters.search, filters.status, filters.category, filters.campus, filters.page],
  )
  const { data, pagination, loading, refreshing, error, refetch } = useFetch(load)
  const products = data?.items || []
  const counts = data?.statusCounts

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
            tabs={STATUS_TABS.map((status) => ({
              value: status,
              label: status === 'all' ? 'All' : titleCase(status),
              count: counts ? counts[status] ?? 0 : undefined,
            }))}
          />
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
                    <tr key={product.id} onClick={() => setSelectedId(product.id)} className="cursor-pointer">
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-2 text-subtle">
                            {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" /> : <ImageOff className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-[280px] truncate font-semibold text-fg">{product.title}</p>
                            <p className="text-xs text-muted">{titleCase(product.category)}</p>
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

      <ProductDetailsDrawer productId={selectedId} onClose={() => setSelectedId(null)} onChanged={refetch} />
    </div>
  )
}

export default memo(Products)
