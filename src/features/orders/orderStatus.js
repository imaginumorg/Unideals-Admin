// Admin "stages" returned by the API, labelled for a peer-to-peer deal flow.
export const ORDER_STAGES = {
  pending: { label: 'Negotiating', tone: 'warning' },
  processing: { label: 'Confirmed', tone: 'info' },
  scheduled: { label: 'Pickup scheduled', tone: 'violet' },
  delivered: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export const stageOf = (status) => ORDER_STAGES[status] || { label: status || 'Unknown', tone: 'neutral' }

// Stages an admin can move a deal to (backend maps these to deal statuses).
export const ADMIN_TRANSITIONS = ['processing', 'scheduled', 'delivered', 'cancelled']
