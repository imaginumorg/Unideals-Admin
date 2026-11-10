export const PRODUCT_STATUS = {
  DRAFT: 'draft',
  LISTED: 'listed',
  SOLD: 'sold',
  UNLISTED: 'unlisted',
  BLOCKED: 'blocked',
}

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
}

export const USER_ROLES = {
  ADMIN: 'admin',
  SUPPORT: 'support',
  USER: 'user',
}

export const REPORT_STATUS = {
  PENDING: 'pending',
  ACTION_TAKEN: 'action_taken',
  DISMISSED: 'dismissed',
}

export const REPORT_REASONS = {
  SPAM_OR_ADVERTISEMENT: 'spam_or_advertisement',
  FAKE_OR_MISLEADING: 'fake_or_misleading',
  INAPPROPRIATE_CONTENT: 'inappropriate_content',
  FRAUD_OR_SCAM: 'fraud_or_scam',
  PROHIBITED_ITEM: 'prohibited_item',
  DUPLICATE_LISTING: 'duplicate_listing',
  WRONG_CATEGORY: 'wrong_category',
  SOLD_OR_UNAVAILABLE: 'sold_or_unavailable',
  OTHER: 'other',
}

export const REPORT_REASON_LABELS = {
  spam_or_advertisement: 'Spam / Ad',
  fake_or_misleading: 'Fake / Misleading',
  inappropriate_content: 'Inappropriate',
  fraud_or_scam: 'Fraud / Scam',
  prohibited_item: 'Prohibited Item',
  duplicate_listing: 'Duplicate',
  wrong_category: 'Wrong Category',
  sold_or_unavailable: 'Sold / Unavailable',
  other: 'Other',
}

export const AUDIT_ACTION_LABELS = {
  'access.update': 'Changed support access',
  'access.person_update': "Changed a person's access",
  'access.person_reset': 'Reset a person to role access',
  'user.suspend': 'Suspended user',
  'user.activate': 'Activated user',
  'user.status_change': 'Changed user status',
  'user.role_change': 'Changed user role',
  'user.delete': 'Deleted user account',
  'user.gender_change_review': 'Reviewed gender change',
  'product.block': 'Blocked listing',
  'product.unlist': 'Unlisted listing',
  'product.activate': 'Re-listed listing',
  'product.status_change': 'Changed listing status',
  'product.soft_delete': 'Removed listing',
  'product.hard_delete': 'Permanently deleted listing',
  'order.status_update': 'Updated order status',
  'campus.create': 'Created campus',
  'campus.update': 'Updated campus',
  'campus.activate': 'Activated campus',
  'campus.pause': 'Paused campus',
  'campus.delete': 'Deleted campus',
  'report.dismiss': 'Dismissed reports',
  'report.resolve': 'Resolved reports',
  'report.action_taken': 'Took action on reports',
  'admin.password_change': 'Changed own password',
}

// Tone used for the activity feed icon of each action.
export const AUDIT_ACTION_TONES = {
  'access.update': 'violet',
  'access.person_update': 'violet',
  'access.person_reset': 'violet',
  'user.suspend': 'danger',
  'user.delete': 'danger',
  'product.block': 'danger',
  'product.hard_delete': 'danger',
  'product.soft_delete': 'danger',
  'campus.delete': 'danger',
  'campus.pause': 'warning',
  'product.unlist': 'warning',
  'user.role_change': 'violet',
  'campus.create': 'success',
  'campus.activate': 'success',
  'user.activate': 'success',
  'product.activate': 'success',
  'report.resolve': 'success',
  'report.dismiss': 'neutral',
  'admin.password_change': 'info',
}

export const AUDIT_TARGET_TYPES = ['user', 'product', 'order', 'campus', 'report', 'settings']

export const REPORT_THRESHOLD = 3
