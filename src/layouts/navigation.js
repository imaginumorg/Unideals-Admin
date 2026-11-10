import {
  Bell,
  Building2,
  Cpu,
  HeartPulse,
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
 */
export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, keywords: 'home metrics stats' }],
  },
  {
    label: 'Marketplace',
    items: [
      { label: 'Users', path: '/users', icon: Users, keywords: 'students accounts members' },
      { label: 'Listings', path: '/products', icon: Package, badgeKey: 'autoHiddenListings', keywords: 'products items inventory review hidden' },
      { label: 'Orders', path: '/orders', icon: ShoppingBag, keywords: 'deals transactions payments' },
      { label: 'Campuses', path: '/campuses', icon: Building2, keywords: 'colleges universities' },
    ],
  },
  {
    label: 'Trust & Safety',
    items: [
      { label: 'Reports', path: '/moderation', icon: ShieldAlert, badgeKey: 'pendingReports', keywords: 'moderation flags queue' },
      { label: 'Gender Requests', path: '/gender-requests', icon: UserCog, badgeKey: 'pendingGenderRequests', keywords: 'girls corner approvals' },
    ],
  },
  {
    label: 'Engagement',
    items: [{ label: 'Push Notifications', path: '/push-notifications', icon: Bell, keywords: 'broadcast announce send' }],
  },
  {
    label: 'System',
    items: [
      { label: 'Audit Log', path: '/audit-log', icon: ScrollText, keywords: 'history actions activity' },
      { label: 'Service Status', path: '/system/status', icon: HeartPulse, keywords: 'health uptime api status outage database' },
      { label: 'Background Jobs', path: '/system/jobs', icon: Cpu, badgeKey: 'failingJobs', keywords: 'cron scheduler health system' },
    ],
  },
]

export const ACCOUNT_ITEMS = [{ label: 'My Profile', path: '/profile', icon: UserCircle2, keywords: 'account password me' }]

export const ALL_NAV_ITEMS = [...NAV_GROUPS.flatMap((group) => group.items), ...ACCOUNT_ITEMS]

export const findNavItem = (pathname) => ALL_NAV_ITEMS.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
