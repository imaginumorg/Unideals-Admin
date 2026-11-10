# Changelog — Admin Console Revamp

Every change made to the admin console (`Campus-Mart-Admin`), the backend (`Campus-Mart/backend`) and the storefront (`Campus-Mart/frontend`) during the admin revamp. Grouped by release; newest first.

How to use the portal is covered in [ADMIN_PORTAL.md](ADMIN_PORTAL.md).

---

## 7. Reports redesign, dark-mode contrast, support access control

### Reports page
- **Header:** icon tile, title and description, with the date range and chart toggle on the right.
- **Type tabs:** All, Listings, Users and Help & support, each with an icon and a live count. Next to them, *N items waiting* with a clock icon.
- **Cards:**
  - a header strip with type, report count, priority and chat-evidence pills, and the timing (latest report • since) on the right;
  - the body: image or avatar, a divider, then the title, subtitle, status pill, *Waiting to resolve* and reason chips;
  - then a divider and a 2-column grid of equal-width actions: enforcement and Evidence first, Dismiss and Resolve last.
  - Phones: the actions sit full width under the details.
- Actions follow the viewer's permissions, and the page explains anything that's missing.
- The mockup's *Schedule* button was left out, because there is no scheduling action for reports to connect it to.
- `PageHeader` gained an opt-in `iconTile`, used only on Reports.

### Dark-mode contrast
Measured against `--c-surface` (`#111113`):
- Tertiary text (`--c-subtle`): `#5d5d66` → `#7a7a84`, from 2.9:1 to 4.5:1. Used by timestamps, hints and chart axes.
- Secondary text (`--c-muted`): `#8b8b94` → `#9898a1`, from 5.6:1 to 6.6:1.
- Hairlines: `--c-line` `#232327` → `#2a2a30`, and `--c-line-strong` `#323238` → `#3a3a42`.
- Status and brand soft tints are slightly stronger, so badges read at a glance.
- Danger and success buttons now have a visible tinted border.
- Light mode is unchanged.

### Roles & Access (Super Admin)
- **New page** at System → Roles & Access. For each section, Support can see it and/or change it. It includes "View only" and "Allow everything" shortcuts, reset to default, a live preview of what support will see, and a save bar listing unsaved changes.
- **Enforced on the server:**
  - New `AccessPolicy` model and `config/accessFeatures.js`, which holds the sections and defaults. The defaults equal the previous fixed rules.
  - `services/access.service.js` keeps a 15-second cache and clears it immediately on save.
  - New `requireAccess(section, level)` middleware.
  - Every `/api/admin` route is now guarded by section instead of a fixed role list.
  - Still fixed:
    - user role changes stay Super Admin only;
    - sign-in, profile, saved views and analytics stay open to all staff;
    - the campus list stays readable by all staff, because other pages' filters use it.
- **New endpoints:**
  - `GET /api/admin/access`: everyone's own access; Super Admins also get the editable policy.
  - `PUT /api/admin/access/support`: Super Admin only. Validated, and recorded in the audit log as `access.update` with the list of changes.
  - `GET /api/admin/attention`: the badge counts, limited to sections the caller can see. It replaces using `/admin/dashboard` for badges.
- **Audit log:** gained the `settings` target type.
- **Frontend:**
  - `useAuth().can(section, level)`;
  - the sidebar, Ctrl+K palette and routes hide or block what a role can't open (no-access screen, or redirect to the first available page);
  - every action button checks its own section.
- **Tests:** `tests/access.integration.test.mjs` (8 tests, over HTTP against the real routes):
  - defaults;
  - enforcement after edits;
  - the audit entry;
  - attention scoping;
  - Super Admin always allowed;
  - validation;
  - role changes stay Super Admin only.

### Per-person access
- **What it does:** a Super Admin can give one support person **custom access** that replaces the role defaults for them. Two support staff can now have different access.
- **Storage:** `StaffAccess` model. When a person has custom access, it holds their **full** set of switches, so later edits to the role don't change it.
- **Effective access** = the person's custom set if it exists, otherwise the role defaults. Cached per person and cleared on save.
- **New endpoints** (Super Admin only, audited):
  - `PUT /api/admin/access/staff/:userId`: `access.person_update`, with the changes listed;
  - `DELETE /api/admin/access/staff/:userId`: `access.person_reset`.
  - Both accept only support staff.
- `GET /api/admin/access` now also returns `staff`: each support person with their effective access and whether it's custom. It also returns `mineIsCustom`.
- **Clean-up:** removing someone's support role deletes their custom access.
- **Roles & Access page:**
  - a "Who" list: role defaults, then each support person with a Custom or Role badge;
  - a *Follow role defaults / Custom access* switch;
  - "Differs from role" markers;
  - a per-person preview of what they'll see;
  - a confirmation before discarding unsaved edits when switching person.
- **Users page:** a support user's details panel has a **Manage access** link.
- **Tests:** access tests grow from 8 to 12:
  - two people with different access, over HTTP;
  - role edits don't touch custom access;
  - reset;
  - support-only validation;
  - clean-up on role removal.

### Fixes
- **Admin read limit raised** from 60 to 240 requests per minute per IP (`app.js`). Chart pages load several datasets each, and hitting the limit failed the session check and signed staff out. Sign-in attempts keep their own limit.

---

## 6. Interactive analytics

Every chart reads real records through the API. Nothing is generated or cached; a range with no data shows an empty state, not a flat line made up to fill space.

### Backend (additive; existing endpoints behave as before)
- **New read-only endpoints**, available to Super Admin and Support, rate-limited to 120 requests per minute:
  - `GET /api/admin/analytics/trends`: time series by day, week or month for users, listings, deals started/completed/cancelled, GMV, platform revenue, reports filed/closed and staff actions. Each comes with the comparison period, and buckets are aligned to the viewer's time zone.
  - `GET /api/admin/analytics/breakdown`: listing status and category, a campus comparison, the open report queue by type, priority and reason, report outcomes, and audit entries by action and by staff member.
  - `GET /api/admin/analytics/jobs`: recorded job runs per period and per job, with durations.
  - Code: `services/analytics.service.js`, `controllers/admin.analytics.controller.js`.
- **Reports queue** (`GET /admin/moderation/queue`) accepts optional `priority` (high/medium/low) and `reason` filters, which the charts use for drill-down. Invalid values are ignored.
- The audit-log filter builder is shared by the list and its charts (`auditMatchFromQuery`), so both always count the same entries.
- The per-minute traffic series on the status endpoint now includes the median (`p50`) as well as p95.
- **Tests:** `tests/analytics.integration.test.mjs` (10 tests):
  - time-zone bucketing;
  - week and month buckets;
  - comparison windows;
  - validation;
  - breakdowns match what the queue and lists show;
  - drill-down filters.
  - The existing 33 tests still pass.

### Frontend
- **Recharts 3.10.1** (and its `react-is` peer) for charts. They load only on pages that have charts.
- **Framer Motion was not added.** The existing CSS animations already cover the brief.
- **Reusable chart kit** in `src/shared/charts/`:
  - `TrendChart` (line/area, previous period dashed, brush zoom on long ranges);
  - `ColumnChart` (stacked bars);
  - `Donut` (total in the centre, clickable legend);
  - `BarList` (ranked, sortable, keyboard-friendly bars);
  - `Sparkline`;
  - `DateRangeFilter`;
  - `ChartCard` (loading, error, empty and CSV export built in).
- **Global date range:** Today, 7 days, 30 days, this month, last month, 3 months, this year, or custom.
  - Calendar presets compare like-for-like (this month so far vs the same days last month); rolling ranges compare with the preceding span.
  - The range is remembered per browser.
- **Chart colors:** a categorical palette led by the brand indigo, checked with a color-blindness and contrast validator in both themes. Status charts use the same colors as the status badges. Every chart shows its values in its legend or tooltip, so color is never the only cue.
- **Pages:**
  - **Dashboard:**
    - KPI cards cover the chosen range, with trend vs the comparison period, a sparkline, the all-time total, and a link to their page.
    - Money trend (GMV / revenue / deals, one measure at a time).
    - Growth chart.
    - Listing-status and account-health donuts (click opens the filtered list).
    - Campus comparison bars (click opens that campus's users or listings).
  - **Listings:**
    - Status donut using the list's own counts; click filters the table.
    - Category bars; click filters the table.
    - Listings-posted trend.
  - **Orders:**
    - Volume trend (started / completed / cancelled) and deal-value trend.
    - Stage donut; click filters the table.
    - Stage cards toggle their filter.
  - **Reports:**
    - Open items by type, priority and reason; each click filters the queue and shows a removable chip.
    - Filed-vs-closed trend.
    - Outcome donut.
  - **Audit log:**
    - Charts follow the table's filters.
    - Clicking a timeline column narrows the table to that period.
    - Action and staff bars filter the table.
  - **Service status:**
    - Requests per minute (stacked succeeded/failed).
    - Median and p95 latency lines.
    - Response-time comparison by API area or by service.
  - **Background jobs:**
    - Runs over time (succeeded/failed).
    - Runs by job; click opens that job's history.
    - Execution-time trend per job.
- **Also:**
  - "Show/Hide charts" toggle per list page, remembered per browser.
  - Stat cards can now be links and show their active state.
  - `useListFilters` gained `setFilters` so several URL filters change in one update.
  - "1 items waiting" now reads "1 item waiting".

---

## 5. Visual redesign

UI only. No API, route, business-logic or data changes.

### Design system (`src/index.css`)
- **Type:** Inter for interface text and numbers (Figtree kept for the Unideals wordmark only). A defined scale: 11 eyebrow, 12 meta, 13 body and table, 14 emphasis, 20–22 page title. Tabular numbers in tables.
- **Color:** quieter neutrals with hairline borders.
  - Dark canvas `#0a0a0b`, surface `#111113`.
  - One restrained brand accent, `#5b56ff` in dark and `#4b45ff` in light.
  - Retuned status colors.
  - Chart colors re-validated against the new surfaces in both themes.
- **Shape and depth:** controls have an 8px radius and 36px height (28px small); cards 12px; overlays 14px. Depth comes from a top-edge highlight instead of heavy shadows.
- **Motion:** 120–240 ms ease-out.
  - Dialogs, drawers and the command palette animate in **and out**; a closing overlay can't be clicked twice.
  - Pages fade in on navigation (not on filter changes).
  - Skeletons shimmer instead of blinking.
  - Buttons press in slightly.
  - All of this respects reduced motion.
- **New helpers:** CSS tooltips (`.tip`), `.skeleton`, `usePresence` for exit animations.

### Components (`shared/components/ui.jsx`, same exports and props)
- Page headers without icon tiles.
- Card headers with quiet glyphs.
- KPI cards: the number leads, the trend is a small pill (neutral at 0%), and they sit 2-up on phones.
- Segmented tabs.
- Compact badges with a dot.
- Restyled pagination, empty and error states, toggle, inputs, selects and focus rings.
- Tables: quiet header, hairline rows, subtle hover, generous first and last column padding.

### Shell
- **Sidebar:** Linear-style 32px rows with sentence-case groups. The active row is raised and its icon tinted. The collapse control shows on hover. Collapsed mode has real tooltips and attention dots.
- **Top bar:** 56px, translucent, chevron breadcrumb, refined search trigger. Icon controls have tooltips. The inbox and profile menus are redesigned.
- **Command palette:** Raycast-style selection with a keyboard-hint footer.
- **Toasts and bulk-action bar:** compact, with a count chip.

### Pages
- **Login:** the saturated gradient panel is replaced by a dark panel with a restrained glow and grid; the form is simpler.
- **Profile:** the gradient banner is now a subtle surface. "Campuss" copy fixed.
- **Dashboard:** 5-up KPI row, tighter attention tiles, and cards size to their content.
- **Reports:** the action column no longer wraps awkwardly; primary action on the right; softer high-priority border.
- **Service status:** uses the shared page header. "1 requests" copy fixed.
- **All pages:** heavier weights reduced to semibold, radii unified, stat-grid spacing unified.

### Verified
Every page was rendered against a seeded in-memory demo backend:
- at 1440 px in dark and light;
- at 390 px on a phone, with no horizontal overflow and no runtime errors;
- dialogs, drawers, palette, bulk bar, menus and the collapsed sidebar each captured and reviewed.

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
