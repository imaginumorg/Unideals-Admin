# Unideals Admin Console

Staff console for running the Unideals campus marketplace. Dark theme by default (light and system available), using the storefront's indigo brand and Figtree type.

## Pages

Navigation is grouped by job:

| Group | Route | What it does |
| --- | --- | --- |
| Overview | `/dashboard` | Headline metrics, "needs attention" queues, users by campus, recent staff activity |
| Marketplace | `/users` | Search and filter students by status and campus; suspend/reactivate; grant or remove support access |
| | `/products` | Listings with real per-status counts; block, unlist, re-list or delete, with an optional audit reason |
| | `/orders` | Peer-to-peer deals from negotiating to completed; stage override for disputes |
| | `/campuses` | Add, edit, pause and delete campuses (campuses that still have listings can't be deleted) |
| Trust & Safety | `/moderation` | Report queue grouped by item; resolve, dismiss, or enforce (enforcing also closes the reports) |
| | `/gender-requests` | Approve or reject Girls Corner gender changes |
| Engagement | `/push-notifications` | Compose with live preview and a confirm step, history with delivery stats, scheduled sends |
| System | `/audit-log` | Every staff action, filterable by action, target, role, person and date range |
| | `/system/status` | Live health of the API, database, realtime, jobs and external providers, plus API traffic |
| | `/system/jobs` | Health of the 7 scheduled background jobs, run history, and manual runs |
| Account | `/profile` | Your details, access level, activity summary, password change, appearance |

Other features:
- **Ctrl/⌘ + K** opens the command palette: jump to any page, or search users, listings and orders.
- The inbox icon in the header shows pending reports and gender requests. It checks again every minute.
- List filters live in the URL, so a filtered view can be bookmarked or shared (for example `/users?status=suspended`).
- Each list can export its current page to CSV.
- Users and Listings support bulk actions (up to 100 rows). Users, Listings, Orders and Audit log support saved views per staff member.
- Access tokens refresh automatically. If a refresh fails, you are signed out with a notice.

Roles: **Super Admin** (`admin`) can do everything. **Support** (`support`) can view everything and resolve or dismiss reports.

## Setup

1. `npm install`
2. Copy `.env.sample` to `.env` and set `VITE_API_BASE_URL` (for example `http://localhost:5000/api`).
3. `npm run dev` serves the console on port `5174`.

The backend must allow this origin. Set `ADMIN_FRONTEND_URL` in the backend environment for CORS and the CSRF origin check.

## Code layout

- `src/index.css` holds the design tokens (`--c-*` variables → `bg-surface`, `text-fg`, `border-line`, `bg-brand`…) and the component classes (`.card`, `.btn-*`, `.input`, `.table`). Use tokens, not hex colors. Both themes come from the same classes.
- `src/shared/components/ui.jsx` is the UI kit: PageHeader, Card, Badge/StatusBadge, StatCard, Tabs, Select, SearchInput, Pagination, Dialog/ConfirmDialog, Drawer, and the empty, error and skeleton states.
- `src/layouts/navigation.js` is the single source for sidebar groups, the command palette and breadcrumbs.
- `src/shared/hooks/useListFilters.js` provides URL-synced filters, debounced search and campus options.

Backend endpoints live in `Campus-Mart/backend/src/routes/admin.routes.js`. Backend tests for the admin features: `npm run test:admin` in the backend folder.

## Scripts

- `npm run dev`: development server
- `npm run build`: production build
- `npm run lint`: ESLint
- `npm run preview`: preview the build
