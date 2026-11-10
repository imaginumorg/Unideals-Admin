import {
  Bell,
  Building2,
  Cpu,
  HeartPulse,
  KeyRound,
  LayoutDashboard,
  Package,
  ScrollText,
  ShieldAlert,
  ShoppingBag,
  UserCircle2,
  UserCog,
  Users,
} from 'lucide-react'

/**
 * Single source for sidebar groups, command palette entries and page titles.
 * `badgeKey` maps to a count from AttentionContext.
 * `feature` is the access section that must be visible to show the item;
 * `adminOnly` items are for Super Admins only. Items with neither (profile)
 * are always shown.
 */
export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', feature: 'dashboard', icon: LayoutDashboard, keywords: 'home metrics stats' }],
  },
  {
    label: 'Marketplace',
    items: [
      { label: 'Users', path: '/users', feature: 'users', icon: Users, keywords: 'students accounts members' },
      { label: 'Listings', path: '/products', feature: 'listings', icon: Package, badgeKey: 'autoHiddenListings', keywords: 'products items inventory review hidden' },
      { label: 'Orders', path: '/orders', feature: 'orders', icon: ShoppingBag, keywords: 'deals transactions payments' },
      { label: 'Campuses', path: '/campuses', feature: 'campuses', icon: Building2, keywords: 'colleges universities' },
    ],
  },
  {
    label: 'Trust & Safety',
    items: [
      { label: 'Reports', path: '/moderation', feature: 'reports', icon: ShieldAlert, badgeKey: 'pendingReports', keywords: 'moderation flags queue' },
      { label: 'Gender Requests', path: '/gender-requests', feature: 'genderRequests', icon: UserCog, badgeKey: 'pendingGenderRequests', keywords: 'girls corner approvals' },
    ],
  },
  {
    label: 'Engagement',
    items: [{ label: 'Push Notifications', path: '/push-notifications', feature: 'notifications', icon: Bell, keywords: 'broadcast announce send' }],
  },
  {
    label: 'System',
    items: [
      { label: 'Audit Log', path: '/audit-log', feature: 'auditLog', icon: ScrollText, keywords: 'history actions activity' },
      { label: 'Service Status', path: '/system/status', feature: 'systemStatus', icon: HeartPulse, keywords: 'health uptime api status outage database' },
      { label: 'Background Jobs', path: '/system/jobs', feature: 'jobs', icon: Cpu, badgeKey: 'failingJobs', keywords: 'cron scheduler health system' },
      { label: 'Roles & Access', path: '/system/access', adminOnly: true, icon: KeyRound, keywords: 'permissions support role access tabs' },
    ],
  },
]

export const ACCOUNT_ITEMS = [{ label: 'My Profile', path: '/profile', icon: UserCircle2, keywords: 'account password me' }]

export const ALL_NAV_ITEMS = [...NAV_GROUPS.flatMap((group) => group.items), ...ACCOUNT_ITEMS]

export const findNavItem = (pathname) => ALL_NAV_ITEMS.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))

// Whether a nav item is available to the signed-in person (see AuthContext).
export const isNavItemVisible = (item, { can, isAdmin }) => (item.adminOnly ? isAdmin : !item.feature || can(item.feature, 'view'))
