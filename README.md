# Campus Mart Admin

Admin portal for managing the marketplace and its moderation workflow.

## Supported features

- `/login` - admin and support sign-in with server-backed session restore
- `/dashboard` - date-range metrics and recent administrative activity
- `/users` - search, campus/status filters, server pagination, user details, status changes, and role changes
- `/products` - search, category/campus/status filters, server pagination, listing details, status changes, and moderation deletion
- `/orders` - searchable/filterable order list, status changes, details, and CSV export
- `/campuses` - campus directory management
- `/moderation` - report queue review and resolution
- `/push-notifications` - send or schedule notifications, estimate recipients, review history, and cancel schedules
- `/audit-log` - filter and review administrative actions

The portal uses the backend endpoints in `Campus-Mart/backend/src/routes/admin.routes.js`.
API failures are shown as errors; the UI does not substitute demo records or fabricated metrics.

## Features not exposed

Analytics and system settings currently have no working admin API or actionable controls, so their placeholder screens are not linked. Categories, banners, disputes, bulk user/product actions, and admin-created users/listings are also not exposed until their workflows are implemented. The old `/analytics` and `/settings` paths redirect to the dashboard.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.sample` to `.env` and set `VITE_API_BASE_URL` to the backend API base URL.
3. Start the app with `npm run dev` (Vite serves the portal on port `5174`).

## Scripts

- `npm run dev` - start the development server
- `npm run build` - create a production build
- `npm run lint` - run ESLint
- `npm run preview` - preview the production build
