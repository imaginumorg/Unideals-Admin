const toDate = (value) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  const date = toDate(value)
  return date ? new Intl.DateTimeFormat('en-IN', options).format(date) : '—'
}

export const formatDateTime = (value) =>
  formatDate(value, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

export const formatRelative = (value) => {
  const date = toDate(value)
  if (!date) return '—'
  const diff = Date.now() - date.getTime()
  const future = diff < 0
  const abs = Math.abs(diff)
  const mins = Math.floor(abs / 60000)
  const suffix = (text) => (future ? `in ${text}` : `${text} ago`)
  if (mins < 1) return future ? 'in a moment' : 'just now'
  if (mins < 60) return suffix(`${mins}m`)
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return suffix(`${hrs}h`)
  const days = Math.floor(hrs / 24)
  if (days < 30) return suffix(`${days}d`)
  return formatDate(date)
}

export const formatCurrency = (value) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export const formatNumber = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n.toLocaleString('en-IN') : '0'
}

export const titleCase = (value) =>
  String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

export const initialsOf = (name, fallback = '?') => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return fallback
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const roleLabel = (role) => (role === 'admin' ? 'Super Admin' : role === 'support' ? 'Support' : titleCase(role))

export const downloadCsv = (filename, header, rows) => {
  const escape = (cell) => {
    const text = cell === null || cell === undefined ? '' : String(cell)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
