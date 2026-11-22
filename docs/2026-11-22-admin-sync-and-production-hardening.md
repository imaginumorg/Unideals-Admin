# Admin sync check and production hardening (2026-11-22)

Everything changed in the admin console (`Unideals-Admin`) on 2026-11-22, plus what was checked against the backend and the website (`E:\Unideals`) and what still has to be done by hand.

Changes are **not committed** yet.

---

## 1. Local setup fixes (done by hand, not in git)

These were the reasons sign-in failed on localhost. Both live in `.env` files, which are not committed.

| File | Problem | Fix |
| --- | --- | --- |
| `Unideals-Admin/.env` | `VITE_API_BASE_URL=http://localhost:5000` has no `/api`, so the login request went to `/admin/auth/login`, which returns 404. | `VITE_API_BASE_URL=http://localhost:5000/api`, then restart `npm run dev`. |
| `Unideals/backend/.env` | The admin runs on `http://localhost:5174`, but CORS only allowed `FRONTEND_URL`, `ADMIN_FRONTEND_URL` and, in development, `localhost:5173`. The browser blocked every request. | Add the local origin: `ADMIN_FRONTEND_URL=https://admin.unideals.in,http://localhost:5174`, then restart the backend. The CSRF check reads the same variable. |

The backend `.env` also has `FRONTEND_URL=https://localhost:5173`. It should be `http://`. Local CORS still works, but the email links built from it (verification, password reset) point to the wrong address.

---

## 2. Theme: light is the default

Before, the default theme was dark. A saved "System" choice in the browser could also make it look like the default was System.

- `src/shared/context/ThemeContext.jsx`: `DEFAULT_THEME = 'light'`. A saved `dark`, `light` or `system` is still honoured.
- `index.html`: the page starts as `data-theme="light"`. The script that runs before the first paint switches to dark only when the saved choice is `dark`, or `system` on a computer set to dark mode. `theme-color` is now the light background (`#f7f7f8`).
- `src/index.css`: updated the comment that still said dark was the default.

Browsers that already have a saved choice keep it. To reset one: `localStorage.removeItem('campus_mart_admin_theme')`.

---

## 3. Login

### Forgot password removed
- `src/features/auth/pages/Login.jsx`: removed the "Forgot password?" button, its help panel and the `showRecovery` state.

### Only admin and support can sign in
- **Backend (already enforced, unchanged):** `POST /admin/auth/login` and `/admin/auth/refresh-token` pass `allowedRoles: [admin, support]`. Any other role gets a generic `401 Invalid credentials`, so the response doesn't reveal that the account exists. `/auth/me` and `/auth/logout` use `requireRoles(ADMIN, SUPPORT)`.
- **Frontend (new second check):** `src/features/auth/context/AuthContext.jsx`
  - `STAFF_ROLES = ['admin', 'support']` and `isStaff()`.
  - Login: if the server returns a non-staff account, the app calls logout to drop that session and shows "Invalid credentials".
  - Session restore (`/auth/me`): a non-staff session is treated as signed out.
  - `formatAdminSession()` returns `null` for non-staff accounts, so such a session can never render the app.

---

## 4. Gender-change requests (college ID photo)

### Checked end to end: working
| Step | Where | Status |
| --- | --- | --- |
| Student picks a gender, adds a photo (compressed, EXIF removed), sends a multipart request with field `idCard` | `Unideals/frontend/.../GenderChangeRequest.jsx` → `POST /api/user/requestGenderChange` | OK |
| Upload limits: one file, 5 MB, JPG/PNG/WEBP. Type checked from the file bytes, not the stated type | `user.routes.js` (multer) + `genderRequest.service.js` | OK |
| Photo stored in its own `GenderIdCard` collection (never on the CDN), deleted automatically after 30 days | `GenderIdCard.model.js` | OK |
| Admin list returns `hasIdCard` and only shows the caller's campuses | `GET /admin/gender-requests` | OK |
| Admin loads the photo as a blob (`no-store`, every view audited) | `GET /admin/gender-requests/:id/id-card` → `genderRequestsApi.getIdCard` | OK |
| Approve or reject deletes the photo and notifies the student. Approving away from female unlists Girls Corner listings | `PATCH /admin/gender-requests/:id` | OK |
| Backend tests | `tests/genderRequest.integration.test.mjs` | 16 passed |

### Fixed
- **Approving without evidence.** When the photo had expired, the page showed a warning but still let staff approve. In `src/features/users/pages/GenderRequests.jsx`:
  - Approve is disabled when `hasIdCard` is false, with a tooltip telling staff to reject so the student can resend.
  - `confirm()` also refuses an approve when there's no photo, as a second check.

---

## 5. Backend admin route optimisations: frontend compatibility

Backend commit `90817f0`, "Optimise admin lists, add indexes and cache admin stats", was reviewed against the frontend.

### What the commit changed
- `getUsers` and `getProducts`: filter and sort on indexes first, then join seller, listing-count and report data only for the page returned.
- `getAdminOrders`: filtering, search and pagination now run in MongoDB instead of loading every deal into memory.
- `getProductDetails`: the three reads run in parallel.
- Dashboard: the active-campus count and list now share one query.
- `adminStatsCache.js`: 30-second in-memory cache for the dashboard, stats, attention and analytics endpoints. Any successful non-GET admin request clears it.
- New indexes on `Product`, `Report`, `User` and `Deal`.

### Result
- **Response shapes unchanged.** Lists still return `{ data, pagination }`, and order rows keep the same fields (they now come from one shared `toOrderRow`). No frontend change was needed.
- **Every endpoint matches.** All 58 frontend calls (method + path) match a backend admin route. The only routes the frontend doesn't use are the legacy `GET /admin/reports` and `PATCH /admin/reports/:id`, which `/moderation/*` replaces.
- **Database version:** production is MongoDB 8.0. `$lookup` with both `localField` and `pipeline` needs 5.0 or newer, so that's fine.
- **Indexes:** Mongoose `autoIndex` creates the new indexes when the server starts. `npm run indexes` can also sync them.
- **Tests:** `genderRequest` (16), `admin` (34), `access` (12), `campusScope` (11) and `performance` (10). 83 passed, 0 failed.

### Behaviour to know
- Changes made in the admin show immediately. New activity on the website (sign-ups, listings, reports) can take **up to 30 seconds** to show in the dashboard and stat counts. `ADMIN_STATS_CACHE_MS` sets the cache time, and `0` turns it off.
- The cache is per server process. With several backend instances, a staff write only clears the cache on the instance that handled it. Other instances catch up within the 30 seconds.

---

## 6. Admin ↔ website sync

| Item | Result |
| --- | --- |
| `USER_STATUS`, `PRODUCT_STATUS`, `USER_ROLES`, `REPORT_STATUS` | Match the backend `config/constants.js` |
| Audit-log action labels | Every action the backend logs has a label |
| Suspended or inactive users | Blocked on every website request (`auth.middleware.js`, 403) |
| Report reasons | **Mismatch, fixed:** the backend has `fake_gender_girls_corner`. Added to `REPORT_REASONS` and `REPORT_REASON_LABELS` ("Fake gender (Girls Corner)") in `src/shared/constants/constants.js`. Before, these reports showed a title-cased raw value. |

---

## 7. Production improvements

### Error boundary (new `src/shared/components/ErrorBoundary.jsx`)
- Wraps the whole app (`main.jsx`, full-screen) and the page area (`AdminLayout.jsx`, reset on every route change). A crashed page shows a "Reload" / "Go to home" screen instead of a blank white page, and the sidebar and navbar keep working.
- **Stale chunks after a deploy:** when page code fails to load, usually because Vercel shipped a new build while a tab was open, it reloads the page once. A 10-second `sessionStorage` flag stops it looping. If it still fails, it shows "A new version of the console is available".

### Bundle split (`vite.config.js`)
- `manualChunks` puts `react`, `react-dom`, `scheduler`, `react-router`, `react-router-dom` and `@remix-run` into a `vendor` file.

| | Before | After |
| --- | --- | --- |
| Main app file | 548 kB (160 kB gzip) | 129 kB (33 kB gzip) |
| Vendor file | none | 423 kB (128 kB gzip), stays cached between deploys |
| Vite "chunk larger than 500 kB" warning | yes | no |

### Browser tab titles
- `AdminLayout.jsx` sets `document.title` from the navigation config, for example "Orders · Unideals Admin" or "My Profile · Unideals Admin". The login page sets "Sign in · Unideals Admin".

### React Router warnings
- `main.jsx`: `<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>`. This removes the two console warnings. All navigation uses absolute paths, so the splat-path change doesn't affect any link.

---

## 8. Files changed

| File | Change |
| --- | --- |
| `index.html` | Light theme by default, dark only when chosen; light `theme-color` |
| `src/shared/context/ThemeContext.jsx` | `DEFAULT_THEME = 'light'`, accepts a saved `dark` |
| `src/index.css` | Comment update |
| `src/features/auth/pages/Login.jsx` | Forgot password removed; tab title |
| `src/features/auth/context/AuthContext.jsx` | Staff-only check on login and session restore |
| `src/features/users/pages/GenderRequests.jsx` | Approve disabled when there's no ID photo |
| `src/shared/constants/constants.js` | `fake_gender_girls_corner` reason and label |
| `src/shared/components/ErrorBoundary.jsx` | New |
| `src/layouts/AdminLayout.jsx` | Page error boundary; tab titles |
| `src/main.jsx` | App error boundary; router future flags |
| `vite.config.js` | Vendor chunk |

No backend or website files were changed.

---

## 9. Verification

- `npm run lint`: clean.
- `npm run build`: succeeds, with no chunk-size warning.
- The dev server (`:5174`) compiles every changed file, and the CORS preflight from `:5174` returns 204.
- Backend integration tests: 83 passed, 0 failed (in-memory MongoDB, not the real database).
- **Not done:** a visual check in the browser, because the Chrome extension wasn't connected. Before deploying, click through Login, Dashboard, Gender Requests, and the light/dark/system themes once.
