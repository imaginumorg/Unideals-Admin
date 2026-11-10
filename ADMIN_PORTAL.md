# Unideals Admin Portal — What You Can Do

A guide for Unideals staff: what each page is for, what each role can do, and what the portal can't do yet.

## Roles

| | Super Admin | Support |
| --- | :---: | :---: |
| View the dashboard, users, listings, orders, campuses | ✅ | ✅ |
| Resolve or dismiss reports | ✅ | ✅ |
| Read the audit log and notification history | ✅ | ✅ |
| Suspend or reactivate users | ✅ | — |
| Grant or remove support access | ✅ | — |
| Block, unlist, re-list or delete listings | ✅ | — |
| Override an order's stage | ✅ | — |
| Create, edit, pause or delete campuses | ✅ | — |
| Approve or reject gender change requests | ✅ | — |
| Send or schedule push notifications | ✅ | — |
| Edit your own profile and password | ✅ | ✅ |

Support staff see the same screens; action buttons a role can't use are hidden or disabled.

## Signing in

- Use your admin or support account email and password. Student accounts cannot sign in here.
- Forgot your password? Reset it with **Forgot password** on the storefront, then sign in here.
- Repeated wrong passwords lock the account for 15 minutes.
- Sessions renew in the background. If renewal fails, you're signed out with a notice.

## Finding your way

- **Sidebar** groups: Overview · Marketplace · Trust & Safety · Engagement · System.
- **Ctrl + K** (⌘ + K on Mac): jump to any page, or search users, listings and orders by name, email or ID.
- **Inbox icon** (top right): counts of pending reports and gender requests. It checks again every minute.
- **Filters live in the URL**: copy the address bar to share a filtered view, e.g. `/users?status=suspended`.
- **Theme**: dark by default. Switch to light or system from the profile menu.

## Pages

### Dashboard
- Totals for users, live listings and completed deals.
- **Deal volume (GMV)**: total value of completed deals between students.
- **Platform revenue**: money paid to Unideals for plans and boosts.
- Trends compare **this month so far** with the **same days last month**. A card shows no trend when last month has nothing to compare against.
- *Needs attention*: pending reports, gender requests, suspended accounts, blocked listings. Each opens the filtered list.
- Users by campus, account health, and the latest staff actions.

### Users
- Search by name, email or user ID. Filter by status (active / inactive / suspended) and campus.
- Click a row to see profile, contact details, level and XP, listings, report count and last sign-in.
- **Suspend** signs the user out everywhere and blocks sign-in. **Reactivate** reverses it.
- **Make support staff** gives the user access to this portal as Support.
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
- You can add a reason, which is saved to the audit log.
- Listings with 5 or more pending reports are unlisted automatically until someone reviews them.

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

### Campuses
- Each campus is its own marketplace. Its **slug is permanent**.
- **Pause** hides the campus from sign-up and stops its feeds. This is reversible.
- **Delete** works only when the campus has no listings; otherwise pause it. Students on a deleted campus are asked to pick a new one.
- Email domains (e.g. `iitd.ac.in`) help suggest the right campus at sign-up.

### Reports
- Reports are grouped by item (listing, user, or help request), with the most-reported items first.
- **Resolve**: closes every open report on the item as "action taken". You can add a note.
- **Dismiss**: closes the reports with no action.
- **Block / Unlist / Delete** (listings) and **Suspend** (users) enforce and close the reports in one step.
- Help & support requests have a **Reply** button that opens an email to the student.

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

### My profile
- Your role, the actions your role allows, your activity (last 7 and 30 days, and all-time), and your recent actions.
- Edit your name and mobile. Email and role can only be changed by a Super Admin.
- **Change password** signs you out on every other device.
- Choose the theme for this device.

## Not possible yet

These need backend work first. They're listed so nobody looks for them in the portal:

- Reading the chat behind a "report user" (reports don't include the conversation yet)
- Notifying a seller automatically when their listing is blocked or unlisted from the Reports page
- Viewing or removing reviews and ratings
- Viewing payments, subscriptions and boosts, or issuing refunds
- A dispute flow for deals, beyond overriding the stage
- Sending a warning to a user without suspending them
- Bulk actions on many users or listings at once
