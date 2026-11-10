# Unideals Admin Portal — What You Can Do

A guide for Unideals staff: what each page is for, what each role can do, and what the portal can't do yet.

## Roles

| | Super Admin | Support |
| --- | :---: | :---: |
| View the dashboard, users, listings, orders, campuses | ✅ | ✅ |
| Resolve or dismiss reports | ✅ | ✅ |
| Read the audit log, notification history, background jobs and service status | ✅ | ✅ |
| Save personal filter views | ✅ | ✅ |
| Suspend or reactivate users | ✅ | — |
| Grant or remove support access | ✅ | — |
| Block, unlist, re-list or delete listings (one or in bulk) | ✅ | — |
| Suspend or reactivate users in bulk | ✅ | — |
| Run a background job manually | ✅ | — |
| Override an order's stage | ✅ | — |
| Create, edit, pause or delete campuses | ✅ | — |
| Approve or reject gender change requests | ✅ | — |
| Send or schedule push notifications | ✅ | — |
| Edit your own profile and password | ✅ | ✅ |

The table shows the **default** Support access. A Super Admin can change it under **System → Roles & Access**:

- For each section, **Can see** shows or hides it for Support (sidebar, search and direct links). **Can change** allows that section's actions; it needs **Can see**.
- **What support will see** previews the result before saving. **Reset to default** restores the table above.
- The server checks the policy on every request, so a hidden section can't be opened by typing its address. Support staff pick up changes the next time they load a page or return to the tab.
- **Different access per person:** pick a person under **Who**, then choose **Custom access** and set their switches. They keep that set even when the role defaults change. **Follow role defaults** puts them back on the role. Custom people show a *Custom* badge. A support user's details panel on the Users page has a **Manage access** link.
- If someone's support role is removed, their custom access is deleted too.
- Changing user roles and editing access always stay Super Admin only.
- Every save is recorded in the audit log as *Changed support access*, with what changed.
- The campus list stays readable for everyone because filters on other pages use it. Hiding *Campuses* hides its page.

Action buttons a role can't use are hidden, and pages explain what's missing.

## Signing in

- Use your admin or support account email and password. Student accounts cannot sign in here.
- Forgot your password? Reset it with **Forgot password** on the storefront, then sign in here.
- Repeated wrong passwords lock the account for 15 minutes.
- Sessions renew in the background. If renewal fails, you're signed out with a notice.

## Finding your way

- **Sidebar** groups: Overview · Marketplace · Trust & Safety · Engagement · System.
- **Ctrl + K** (⌘ + K on Mac): jump to any page, or search users, listings and orders by name, email or ID.
- **Inbox icon** (top right): pending reports, gender requests, auto-hidden listings and failing background jobs. It checks again every minute.
- **Filters live in the URL**: copy the address bar to share a filtered view, e.g. `/users?status=suspended`.
- **Saved views**: on Users, Listings, Orders and Audit log, set your filters and choose **Views → Save current filters**. Views are personal and follow your account to any device.
- **Bulk actions**: tick rows (or the header box for the whole page), then pick an action from the bar at the bottom. Up to 100 at a time. If some items fail, you see which ones and why; the rest still go through.
- **Theme**: dark by default. Switch to light or system from the profile menu.

## Charts and date range

Dashboard, Listings, Orders, Reports, Audit log, Service status and Background jobs have charts built from live data.

- **Date range** (top right): Today, Last 7 days, Last 30 days, This month, Last month, Last 3 months, This year, or a custom range of up to 3 years. The choice is shared across pages and remembered in this browser.
- **Comparisons:**
  - "This month" is compared with the same days last month, and "This year" with the same period last year.
  - The other ranges are compared with the period just before.
  - A trend is left blank when the earlier period has nothing to compare against.
- **Daily / Weekly / Monthly** switches the grouping when the range allows it. A partial first or last week is labelled as partial.
- **Compare** draws the earlier period as a dashed line.
- **Hover** any chart for exact values.
- **Click a legend entry** to hide or show a series.
- **Drag the handles** under long charts to zoom in.
- **Clicking a donut segment, legend row or bar filters the list below it** (or opens the filtered list from the Dashboard). Click it again to clear the filter.
- **Download icon** exports a chart's data as CSV.
- **Hide charts** collapses a page's charts. The choice is remembered per page.
- A range with no activity shows "No data for this range". Nothing is estimated or filled in.

## Pages

### Dashboard
- KPI cards for the chosen range:
  - new users;
  - listings posted;
  - completed deals;
  - **deal volume (GMV)**: the value of completed deals between students;
  - **platform revenue**: money paid to Unideals for plans and boosts.
- Each card shows:
  - the trend vs the comparison period;
  - a sparkline (hover for each day's value);
  - the all-time total;
  - a link to its page (revenue has no page yet).
- **Money:** GMV, revenue or completed deals over time, one at a time.
- **Growth:** sign-ups and new listings.
- **Listing status** and **Account health** donuts. Click opens the filtered list.
- **Campus comparison:** users, new users, live or new listings per campus. Click opens that campus's users or listings.
- *Needs attention*: pending reports, gender requests, auto-hidden listings, failing jobs, suspended accounts, blocked listings. Each opens the filtered list.
- The latest staff actions.

### Users
- Search by name, email or user ID. Filter by status (active / inactive / suspended) and campus.
- Click a row to see profile, contact details, level and XP, listings, report count and last sign-in.
- **Suspend** signs the user out everywhere and blocks sign-in. **Reactivate** reverses it.
- **Make support staff** gives the user access to this portal as Support.
- **Bulk:** select users to **Suspend** or **Reactivate** many at once. Your own account is always skipped.
- Export the current page to CSV.

### Listings
- Tabs show the real count for each status: listed, draft, unlisted, blocked, sold.
- Filter by category and campus. Search by title, seller, or listing/seller ID.
- The detail panel shows photos, price, description, seller and recent reports.
- Actions:
  - **Unlist**: hidden from the marketplace; the seller can relist it.
  - **Block**: hidden; the seller cannot relist it.
  - **Make live**: visible on the marketplace again.
  - **Delete permanently**: cannot be undone.
- You can add a reason. It is saved to the audit log **and included in the notification the seller receives**.
- **Sellers are always notified** when staff block, unlist, delete or put a listing back live.
- A **blocked** listing can't be relisted by its seller.
- **Needs review** tab: listings with 5 or more open reports are hidden automatically and marked *Auto-hidden*. The seller is told it's paused and can't relist it until you decide:
  - reports unfounded → **Make live** (or **Dismiss** on the Reports page), and the seller is told it's back;
  - reports valid → **Block** or **Unlist**.
- **Bulk:** select listings to Unlist, Block, Make live or Delete together, with one reason for all.
- **Charts:**
  - **Status** donut: counts match the table's search and filters. Click a status to filter the table.
  - **Categories:** for the selected status and campus. Click to filter.
  - **Listings posted** over the chosen range.

### Orders
Orders are deals between two students. Stages:

| Stage | Meaning |
| --- | --- |
| Negotiating | Offers are being exchanged |
| Confirmed | Both students agreed on a price |
| Pickup scheduled | A meeting time and place is set |
| Completed | Item handed over and paid |
| Cancelled | Deal called off |

- The detail panel shows the item, buyer, seller, pickup location and timeline.
- **Override stage** is for disputes or stuck deals only. Moving a deal to *Completed* also marks payment and handover as confirmed. Cancelling asks for a reason, which is saved on the deal (students do not see it yet).
- **Charts:**
  - **Order volume:** deals started, completed and cancelled over time.
  - **Deal value:** GMV of completed deals.
  - **Orders by stage** donut: click to filter.
  - The stage cards at the top also filter. Click again to clear.

### Campuses
- Each campus is its own marketplace. Its **slug is permanent**.
- **Pause** hides the campus from sign-up and stops its feeds. This is reversible.
- **Delete** works only when the campus has no listings; otherwise pause it. Students on a deleted campus are asked to pick a new one.
- Email domains (e.g. `iitd.ac.in`) help suggest the right campus at sign-up.

### Reports
- Tabs at the top filter by type (all, listings, users, help & support), with live counts. *N items waiting* shows how many match.
- Each card shows: type, report count and priority, when it was last reported and since when; the item with its status and reasons; and its actions. Actions appear only if your role allows them.
- Reports are grouped by item (listing, user, or help request), with the most-reported items first.
- **Evidence** opens every individual report: who reported, reason, description, links, and — for reports made from a chat — **the last 40 messages of that conversation as they were when the report was filed**. The reporter's messages are on the right. Edits or deletions made afterwards don't change this copy. Items with chat evidence show a *chat* tag.
- **Resolve**: closes every open report as "action taken". You can add a note.
- **Dismiss**: closes the reports with no action. If the listing had been auto-hidden, it goes live again and the seller is told.
- **Block / Unlist / Delete** (listings) and **Suspend** (users) enforce and close the reports in one step. The reason you type is sent to the seller.
- **Reporters always hear back**: when reports close, each reporter gets an in-app notification saying action was taken, or that no violation was found. Reporters are never told who was actioned or what happened to another user.
- Help & support requests have a **Reply** button that opens an email to the student.
- **Charts:**
  - **Open items by type, priority and reason.** Clicking one filters the queue and adds a removable chip.
    - Priority follows the badge: high is 5+ reports, medium 2–4, low 1.
    - An item with several reasons counts under each one.
  - **Reports over time:** filed vs closed.
  - **Outcome** of reports filed in the range: still open, action taken, dismissed.

### Gender requests
- Gender is set once by the student. Changing it needs approval because it controls Girls Corner access.
- Approving a change away from *female* automatically unlists that student's Girls Corner listings.

### Push notifications
- **Compose**: title, message, type and audience (everyone, buyers, sellers, or one campus). Image and button are optional.
- A live preview and recipient estimate update as you type. Every send asks you to confirm first.
- **Send now** or **Schedule** for a future time. Scheduled sends can be cancelled until they go out.
- **History** shows sent, delivered and clicked counts.
- Sent notifications can't be recalled.

### Audit log
- Every staff action is recorded permanently. Entries can't be edited or deleted.
- Filter by action, target type, staff role and date range. **My actions** shows only yours.
- Click a staff name to see only their actions. Click a row to see the note and details.
- **Charts** use the same filters as the table.
  - **Activity timeline:** click a column to narrow the table to that day, week or month.
  - **By action** and **By staff member:** click to filter.
  - With no From/To set, the charts show the last 30 days while the table shows all time. Picking a range sets both.

### Service status
One page answering "is anything broken right now?". It refreshes itself every 30 seconds.

- **Banner**: *All systems operational*, *Some systems are degraded*, or *Service disruption*.
- **Core services**
  - API server: degraded when 5%+ of requests fail or responses are slow; outage at 25%+ failing.
  - Database: live ping and its latency.
  - Realtime (chat/notifications) and how many people are connected.
  - Background jobs.
  - Server runtime responsiveness.
- **External services**: Razorpay, ImageKit, Resend (email), Google sign-in and Gemini. Each is checked for two things: our server can reach the provider, and the keys are set. *Not configured* on an optional service doesn't count as a problem. A wrong or revoked key can't be detected here; it shows up as failed requests instead. **Recheck now** probes them again (at most once every 15 seconds).
- **API traffic** for the last 15 minutes or hour:
  - requests, share failed (5xx), median and 95th-percentile response time;
  - requests per minute (succeeded vs failed) and median / p95 response time per minute; hover for that minute's numbers, export as CSV;
  - a response-time comparison by API area (p95) or by service (latest health-check latency);
  - a table per API area (`/api/product`, `/api/chat`…) so you can see *which part* is failing.
- **Server**: uptime, memory, responsiveness and CPU load.
- Traffic numbers are per server instance and reset when it restarts. If this page can't load at all, the API itself is down.

### Background jobs
The server runs these on a schedule:

| Job | Runs | What it does |
| --- | --- | --- |
| Purge deleted listings | Daily 02:00 | Removes listings deleted 30+ days ago (15+ if sold) and listings whose seller no longer exists |
| Purge stale drafts | Daily 02:30 | Deletes drafts untouched for 30 days |
| Girls Corner eligibility sweep | Daily 02:45 | Unlists Girls Corner listings from sellers no longer eligible |
| Expire subscriptions | Daily 03:00 | Moves ended Pro / Pro+ plans back to free |
| Expire abandoned payments | Daily 03:15 | Expires payment orders unpaid after 24 hours |
| Expire boosts | Every 10 min | Ends expired boosts |
| Send scheduled notifications | Every minute | Sends push notifications whose time has come |

- Each job shows **Healthy**, **Failing** (last run errored — the error is shown), **Overdue** (no run in more than twice its interval, e.g. the server was down), **Running** or **Not run yet**.
- See the last run, last success, how long it took and what it did (e.g. "Boosts expired 3").
- **History** shows runs from the last 30 days. Frequent jobs only keep runs that changed something or failed, so the history isn't flooded.
- **Run now** (Super Admin) runs a job immediately and records it as a manual run.
- Failing jobs appear on the dashboard and in the inbox.
- **Charts** (for the chosen range):
  - **Runs over time:** succeeded vs failed.
  - **Runs by job:** click a job to open its history.
  - **Execution time** of each recorded run for the selected job.
  - These only count recorded runs: history is kept for 30 days, and frequent jobs record only runs that changed something or failed.

### My profile
- Your role, the actions your role allows, your activity (last 7 and 30 days, and all-time), and your recent actions.
- Edit your name and mobile. Email and role can only be changed by a Super Admin.
- **Change password** signs you out on every other device.
- Choose the theme for this device.

## Not possible yet

These need backend work first. They're listed so nobody looks for them in the portal:

- Viewing or removing reviews and ratings
- Viewing payments, subscriptions and boosts, or issuing refunds
- A dispute flow for deals, beyond overriding the stage
- Sending a warning to a user without suspending them
- Reporting individual chat messages or reviews (only listings, users and help requests can be reported)
