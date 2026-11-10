# Changelog — Admin Console Revamp

Every change made to the admin console (`Campus-Mart-Admin`), the backend (`Campus-Mart/backend`) and the storefront (`Campus-Mart/frontend`) during the admin revamp. Grouped by release; newest first.

How to use the portal is covered in [ADMIN_PORTAL.md](ADMIN_PORTAL.md).

---

## 4. Service status page

### Added
- **Service status page** (`/system/status`, under System). It shows:
  - overall state (operational / degraded / outage);
  - core services: API, MongoDB with live ping, Socket.io connections, background jobs, event-loop lag;
  - external providers: Razorpay, ImageKit, Resend, Google sign-in, Gemini — each checked for reachability and for keys being set;
  - API traffic: requests, 5xx rate, median and p95 response time, a per-minute chart and a per-area table;
  - server uptime, memory and load.
  - It refreshes every 30 seconds.
- Backend `GET /api/admin/system/status` (staff).
- Backend middleware `requestMetrics` records every `/api` request into 60 one-minute in-memory buckets, grouped by area. No new dependencies.
- Chart color tokens `--c-chart-1` and `--c-chart-error`, checked in both themes with the palette validator.

### Notes
- External checks are cached for 60 s. A forced recheck is throttled to once per 15 s.
- Metrics are per process and reset on restart.

---

## 3. Moderation workflow, bulk actions, saved views, background jobs

### Reports and moderation
- **Chat evidence on reports.**
  - Reports filed from a chat now store `conversation_id` and a snapshot of the last 40 messages.
  - The server checks that the reporter, and the reported user or listing, belong to that conversation.
  - Evidence links (`evidence`) are now saved; before, they were checked and then thrown away.
  - New *Evidence* panel on the Reports page shows each report with its chat transcript.
  - `GET /api/admin/moderation/reports`
- **Sellers are notified** when staff block, unlist, delete or reinstate a listing, with the staff reason included.
- **Reporters are notified** when their reports are resolved or dismissed. `Report.reporter_notified_at` records when.
- **Auto-hidden listings.**
  - Listings hidden at 5 reports are now marked with `Product.auto_hidden_at`, and the seller is notified.
  - They appear in a *Needs review* tab and on the dashboard.
  - Dismissing their reports puts them back live.
- **Security fix:** sellers could relist a listing staff had **blocked**. Relisting is now refused for blocked and auto-hidden listings.
- Deleting a listing closes its reports and notifies reporters *before* the delete. The delete wipes the reports, so this used to happen silently.
- New `moderation.service.js` holds all moderation actions, so single, queue and bulk actions behave the same.

### Bulk actions and saved views
- Bulk actions: listings (unlist / block / make live / delete) and users (suspend / reactivate).
  - Up to 100 per request, with a result per item.
  - Admins can't suspend themselves through a bulk selection.
  - `POST /api/admin/products/bulk`, `POST /api/admin/users/bulk`
- Saved filter views per staff member, stored on the account: Users, Listings, Orders, Audit log.
  - `GET/POST/DELETE /api/admin/saved-views`

### Background jobs
- New job registry (`src/jobs/jobRegistry.js`). It records every run and doesn't let a job run twice at the same time. Errors are saved instead of only printed to the log.
  - `JobState` stores the latest state of each job.
  - `JobRun` stores 30 days of history.
- All 7 scheduled tasks moved onto it, with the same schedules and logic.
- New *Background jobs* page:
  - status per job: healthy / failing / overdue / running;
  - last run and its result, error, run history;
  - **Run now** for admins.
  - `GET /api/admin/system/jobs`, `GET /api/admin/system/jobs/:key/runs`, `POST /api/admin/system/jobs/:key/run`
- Dashboard and inbox count auto-hidden listings and failing jobs.

### Storefront
- `Chat.jsx` sends `conversation_id` with user and listing reports, instead of putting the conversation ID into the description text.

### Known gap
- `cleanupDeals.job.js` is empty. No job cleans up stale deals yet.

---

## 2. Branding, metrics fix, loader, docs

### Fixed
- **Gross volume was wrong.** It added platform payments to the prices of deals between students, counted deals by the month they *started*, and compared a partial month with a full one, which produced -100%.
  - Replaced with **Deal volume (GMV)**, counted by completion date, and **Platform revenue**, from verified payments.
  - Trends now compare this month so far with the same days last month.
  - The Orders page "vs last month" uses the same fair comparison.
- Profile header: the name and badges no longer overlap the banner.
- The order panel no longer claims students see the admin's cancellation reason; they don't.

### Changed
- The real Unideals logo is used everywhere, and the browser tab icon is the storefront's `fav.svg`.
- Spelling is "Unideals" throughout.
- The storefront's animated "U" loader (`BrandLoader`) replaces the generic spinner, for both page loading and buttons.

### Added
- `ADMIN_PORTAL.md`: what each role can do and how each page works.

---

## 1. Admin console revamp

### Design
- New token-based design system, with dark as the default and light/system available. It uses the storefront palette (indigo `#4B45FF`, charcoal `#131313`/`#1A1D20`) and the Figtree font.
- The theme is applied before first paint, so there's no flash.
- Removed the 6 editor-style themes and roughly 400 hardcoded color classes with their `!important` overrides.
- Shared UI kit (`shared/components/ui.jsx`): PageHeader, Card, Badge/StatusBadge, StatCard, Tabs, Select, SearchInput, Pagination, Dialog/ConfirmDialog, Drawer, and empty, error and skeleton states.
- Icons from `lucide-react`, the same set as the storefront.

### Layout and navigation
- Sidebar grouped by job: Overview, Marketplace, Trust & Safety, Engagement, System. Its collapsed state is remembered.
- Breadcrumbs.
- **Ctrl/⌘+K command palette**: jump to any page, or search users, listings and orders. Before, the shortcut hint was shown but did nothing.
- "Needs attention" inbox, replacing a bell with a hardcoded "3".
- Profile menu with theme choice. Its "Account settings" link used to send you back to the dashboard.

### Pages
- **Login** rebuilt.
  - Removed: the pre-filled real email, the fake dotted password, the silent `password123` substitute, a "remember me" checkbox that did nothing, and a fallback that signed you in as a fake Super Admin when the API was unreachable.
  - Returns you to the page you were on.
- **Dashboard**:
  - attention queues: pending reports, gender requests, suspended users, blocked listings;
  - users by campus, account health, recent staff activity;
  - removed a date-range picker the backend ignored.
- **Users, Listings, Orders**:
  - filters live in the URL;
  - real campus and category options, instead of hardcoded VIT/SRM lists;
  - per-status counts, detail drawers, confirm dialogs, CSV export.
- **Orders** use peer-to-peer stage names: Negotiating → Confirmed → Pickup scheduled → Completed / Cancelled. The old labels were Shipped and Delivered.
- **Campuses**: create, edit, pause, delete. The slug is filled in from the short name and is permanent.
- **Reports**: queue grouped by item; resolve, dismiss, enforce.
- **Push notifications**:
  - the form starts empty, instead of pre-filled with a fake "30% off" promo;
  - real templates and app links;
  - a confirm step showing the recipient count;
  - history and scheduled sends.
- **Audit log**: filters for action, target, role, person and date range; "My actions"; expandable details; CSV.
- **New: My profile.** Details, access level, activity stats, edit name and mobile, change password (signs out other sessions), appearance.
- **New: Gender requests.** Approve or reject Girls Corner gender changes. The backend existed but had no UI.

### Platform
- Automatic token refresh: a 401 triggers one shared refresh and the request is retried. Before, sessions died after 15 minutes.
- Dead components removed: DataTable, SectionCard, ThemePicker, the old PageHeader, Modal, EmptyState. Unused public assets removed too.

### Backend
- New: `GET/PATCH /api/admin/profile` and `POST /api/admin/profile/change-password` (rate limited; revokes other sessions).
- Audit log can be filtered by `actor_id`, `from` and `to`.
- **Fixed:** order status changes were never audited. The audit schema rejected `target_type: "order"`, and the error was swallowed.
- **Fixed:** the users list ignored the campus filter. Campus filters now work on users, listings and orders.
- **Fixed:** orders fell back to the made-up campus name "VIT Vellore" and showed cancelled deals as "Refunded" when no refund happened.
- Listings return real per-status counts.
- An optional reason on listing status changes is stored as the audit note.
- **Fixed:** deleting a campus left its listings orphaned. Deletion is now refused while the campus has listings.
- Dashboard counts pending gender requests.
- Removed dead code: the old report close functions in `admin.service.js`.

---

## Tests

Backend integration suite `npm run test:admin`, with 33 cases on an in-memory MongoDB. It covers:
- profile and password change;
- list filters;
- audit filters;
- money metrics;
- campus delete guard;
- chat evidence and participant checks;
- seller and reporter notifications;
- auto-hide and relist guards;
- bulk actions;
- job tracking;
- traffic metrics;
- service status.

The existing suites (plans, views, deals, reviews) still pass.

## Data model additions
| Model | Fields |
| --- | --- |
| `Report` | `conversation_id`, `chat_snapshot[]`, `evidence[]`, `reporter_notified_at` |
| `Product` | `auto_hidden_at`, `auto_hidden_report_count` |
| `User` | `admin_saved_views[]` (hidden by default) |
| `AuditLog` | `target_type` now allows `order` |
| new `JobState`, `JobRun` | job bookkeeping; `JobRun` expires after 30 days |

All additions are optional fields with defaults, so no migration is required.
