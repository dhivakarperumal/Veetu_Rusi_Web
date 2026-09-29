# Attendance Implementation Guide

This guide is based on the attendance implementation currently in this repository. Use it to implement the same behavior in the three separately deployed applications: Home Chef, Delivery Partner, and Franchise Admin.

## 1. Architecture Recommendation

Keep attendance records in one shared backend and database, even when the three frontends are separate applications. Each frontend should call the same authenticated attendance API. The API should identify the person from the access token, write the attendance session once, and expose franchise-scoped records to the Franchise Admin app.

Do not create separate attendance tables or duplicate attendance state in each frontend. If the applications must have separate backends, use one shared attendance service/database or a defined synchronization contract; otherwise the Franchise Admin app cannot reliably report sessions created in the other apps.

## 2. Existing Behavior Analyzed

### Home Chef

- API router: `backend/src/routes/homeChefAttendance.js`, mounted at `/api/home-chef-attendance`.
- Allowed token roles: `chef` and `homechef`.
- The chef profile is found using authenticated `user_id`/`id`, with email as a fallback. Attendance is saved against the profile's canonical `home_chefs.user_id`.
- `GET /api/home-chef-attendance` returns `{ today, currentSession, records }`. `currentSession` is the newest record without `check_out_at`; `records` contains the chef's full history.
- `POST /api/home-chef-attendance` accepts `{ action: "check_in" }` or `{ action: "check_out" }`. If omitted, `action` defaults to `check_in`.
- Check-in creates a row with `attendance_date = CURDATE()` and `check_in_at = NOW()`. Check-out closes the open row with `check_out_at = NOW()`.
- The write is transactional and locks the chef profile and open session. A duplicate check-in returns HTTP 409; checking out without an open session also returns 409.
- Home chef sessions do not collect GPS coordinates.
- The session row stores `franchise_admin_id` from `home_chefs.created_by`. Confirm this is the same identifier used by the Franchise Admin access token before reusing that mapping in another backend.
- The chef dashboard shows an initial attendance prompt and has a header online/offline control. The client refreshes state every 15 seconds and uses the `home-chef-attendance-updated` browser event to update the shared layout.
- `GET /api/orders/chef` has related but incomplete attendance gating: if the latest session is checked out, it filters out orders created after checkout. If there is no session, it does not filter the returned orders. The Chef Header separately hides order notifications unless there is an active session. Do not treat this as a guaranteed server-side rule that chefs cannot access orders while offline; decide and enforce the intended policy in the API.

### Delivery Partner

- API router: `backend/src/routes/delivery.js`, mounted at `/api/delivery`.
- Allowed token role: `delivery_partner`.
- Attendance identity is the authenticated `user_id` (falling back to `id`) and must resolve to a `delivery_partners` profile.
- `GET /api/delivery/attendance` returns `{ today, currentSession, records }` for that partner.
- `POST /api/delivery/attendance` accepts `{ action, latitude, longitude, accuracy }`. Check-in requires valid latitude and longitude; check-out does not require location. Coordinates and optional accuracy are range-checked server-side.
- Check-in reverse-geocodes coordinates to an address, with a coordinate-based fallback if geocoding fails. The server stores check-in location/address and can store check-out location/address if supplied.
- The write is transactional, locks the partner profile and open session, and rejects duplicate check-in or check-out without an active session with HTTP 409. A missing partner profile returns 404.
- The session row stores `franchise_admin_id` from `delivery_partners.created_by`. Verify that this is the canonical Franchise Admin identifier in the separate apps; prefer an explicit franchise link over an audit/creator field if the schema distinguishes them.
- The Delivery Partner dashboard prompts for attendance and requires browser location for check-in. Its online/offline control also asks for confirmation. The client polls every 15 seconds and uses `delivery-attendance-updated` to synchronize the layout.
- `GET /api/delivery/orders` returns no assigned orders while the partner is checked out. `PATCH /api/delivery/orders/:id/assign` requires an open attendance session and rejects a partner who already has an active order. These are server-side safeguards and must remain server-enforced.
- `GET /api/delivery/orders/available` currently allows an authenticated partner to see eligible unassigned orders whether checked in or not, so an order placed while the partner was logged out can still be seen after login. The assignment endpoint still requires check-in. This is intentional separation between viewing and accepting.

### Franchise Admin

- Admin API router: `backend/src/routes/admin.js`, mounted at `/api/admin` and guarded by `verifyToken` plus `requireRole(['admin'])`.
- There is no Franchise Admin self-attendance endpoint in this implementation. The admin app is a reporting surface for Home Chef and Delivery Partner sessions.
- `GET /api/admin/home-chefs/attendance` and `GET /api/admin/delivery-partners/attendance` return arrays of sessions belonging to the authenticated admin's franchise.
- Both queries scope results by `attendance.franchise_admin_id` matching the authenticated admin's `user_id` and/or `id`. This tenant filter is essential; never accept an arbitrary franchise/admin ID from the browser as authorization.
- Both endpoints accept `date_from` and `date_to`, or a single `date` in `YYYY-MM-DD` format. Results are newest first and capped at 500 rows.
- The Home Chef report includes chef identity/name, date, check-in/out times, and mobile. The Delivery Partner report also includes check-in/out location, accuracy, address, mobile, and vehicle number.
- The UI provides date filters, search/person filtering, summary counts, and table/card views. It reads attendance only; it must not create or edit staff sessions.
- Current role guard allows only the token role `admin`. If the separate Franchise Admin app issues a different role string, update the backend role allowlist intentionally and keep franchise scoping intact.

## 3. Shared Data Contract

Use one session row per check-in/check-out pair. An open session is defined by `check_out_at IS NULL`; do not derive online status from a browser flag or token claim.

Recommended common fields:

| Field | Purpose |
| --- | --- |
| `id` | Session primary key |
| `person_id` | Profile table ID for the role |
| `person_user_id` | Stable authenticated user identifier |
| `person_name` | Name snapshot for historical reporting |
| `franchise_admin_id` | Canonical franchise tenant identifier |
| `attendance_date` | Server/database calendar date for check-in |
| `check_in_at` | Server timestamp when session starts |
| `check_out_at` | Server timestamp when session ends; null means active |
| `latitude`, `longitude`, `accuracy_m`, `check_in_address` | Required for Delivery Partner check-in; optional/not used for Home Chef |
| `check_out_latitude`, `check_out_longitude`, `check_out_accuracy_m`, `check_out_address` | Optional location snapshot at checkout |
| `created_at` | Row creation timestamp |

The current schema uses separate role tables, `home_chef_attendance` and `delivery_partner_attendance`, with role-specific names for person IDs/names. Preserve those names when using the existing API/database. If creating a unified schema in a new backend, map the same concepts explicitly and migrate reports accordingly.

The existing migrations live in `backend/src/config/migrations.js`. They create role-specific indexes for tenant/date and person/date lookups. Apply equivalent migrations before deploying endpoints in a separate backend. `attendance_date` and timestamps are generated by MySQL (`CURDATE()`/`NOW()`); align the database timezone and reporting timezone across all apps.

## 4. Implementation Checklist By App

### Home Chef App

1. After authentication, call `GET /api/home-chef-attendance` and derive online status solely from `currentSession`.
2. Show a check-in prompt when there is no current session. Keep a persistent header control to check in or check out later.
3. Post `{ action: "check_in" }` or `{ action: "check_out" }` to `/api/home-chef-attendance`; use server responses to refresh state and handle HTTP 409 conflicts.
4. Do not request GPS for Home Chef attendance unless the product requirement changes.
5. On success, refresh session state and any features that depend on online status (order inbox, notifications, availability). Do not rely only on a client-side event for authorization.
6. Decide whether offline chefs can fetch/see orders. If not, enforce it in the order API as well as hiding UI notifications. The current `/api/orders/chef` behavior is not a complete offline gate.

### Delivery Partner App

1. After authentication, call `GET /api/delivery/attendance` and derive online status from `currentSession`.
2. Prompt for check-in if offline. Request browser geolocation only when checking in; send latitude, longitude, and accuracy to `POST /api/delivery/attendance`.
3. Provide a status control for check-in/check-out. Check-out should be possible without GPS; if location is sent, validate and persist it.
4. Show available unassigned orders while offline if the intended flow is “log in and see pending orders.” Clearly disable or explain acceptance until checked in.
5. Always enforce check-in, no-active-order, and unassigned-order conditions in the server assignment endpoint. The frontend alone is not a security boundary.
6. Refresh attendance after mutations and synchronize header, order, and dashboard components. Treat location permission denial, timeout, invalid coordinates, 403, 404, and 409 as distinct recoverable errors.

### Franchise Admin App

1. Add separate Home Chef Attendance and Delivery Partner Attendance views. These views are reports, not staff check-in controls.
2. Fetch the role-specific admin endpoint with date filters. Display active sessions where `check_out_at` is null, completed sessions otherwise, and include refresh/loading/empty/error states.
3. Add search/person filtering and pagination in the UI. Since the current API caps results at 500, use server pagination if expected franchise volume can exceed that cap.
4. Display Home Chef check-in/out timestamps and Delivery Partner location/address/accuracy where available. Handle null checkout and null optional location fields.
5. Ensure the access token carries the canonical admin identity and the backend derives allowed franchise IDs from it. The backend must scope every report query to that franchise.
6. Confirm Home Chef and Delivery Partner check-in writes store the same franchise identifier expected by the admin report queries. Test cross-franchise denial; do not solve missing data by removing the tenant filter.

## 5. Backend Rules To Preserve

- Require a valid access token on every attendance endpoint and restrict each write/read endpoint to its intended role.
- Resolve the profile from the authenticated principal; ignore user/person IDs supplied by the browser for attendance ownership.
- Validate action against `check_in` and `check_out`. Keep the current default-to-check-in behavior only if desired; explicit action is clearer for new clients.
- Use a database transaction and lock the profile/open session while checking for duplicates and writing. This prevents concurrent tabs/devices from opening multiple sessions.
- Return 409 for duplicate check-in and checkout without an open session; return 401/403 for authentication/role failures, 404 for a missing profile, and 500 only for unexpected server failures.
- Use server-generated timestamps and attendance dates. Do not accept client timestamps as authoritative attendance evidence.
- Require valid GPS coordinates for Delivery Partner check-in on the server, even if the app requests location first. Do not make GPS mandatory for Home Chef unless that is a separate product requirement.
- Keep Franchise Admin reporting tenant-scoped in SQL. Validate date query values as `YYYY-MM-DD`, parameterize SQL, and cap/page result sets.
- Do not end a session automatically on logout unless that is a deliberate business policy. Current behavior requires an explicit checkout, so an interrupted session remains open and needs a defined recovery/admin workflow.

## 6. Suggested API Contract For Separate Apps

Use these existing paths if all three frontends can share this backend:

| App | Method and path | Purpose |
| --- | --- | --- |
| Home Chef | `GET /api/home-chef-attendance` | Current session and history |
| Home Chef | `POST /api/home-chef-attendance` | Check in/out |
| Delivery Partner | `GET /api/delivery/attendance` | Current session and history |
| Delivery Partner | `POST /api/delivery/attendance` | Check in/out with GPS on check-in |
| Franchise Admin | `GET /api/admin/home-chefs/attendance` | Franchise Home Chef attendance report |
| Franchise Admin | `GET /api/admin/delivery-partners/attendance` | Franchise Delivery Partner attendance report |

Example write bodies:

```json
{ "action": "check_in" }
```

```json
{
  "action": "check_in",
  "latitude": 13.0827,
  "longitude": 80.2707,
  "accuracy": 18.5
}
```

```json
{ "action": "check_out" }
```

For reports, send `?date=YYYY-MM-DD` or `?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`. Keep API base URL and token handling in each app's existing API client; do not store a second attendance status in local storage as the source of truth.

## 7. Integration Test Checklist

- Home Chef can check in, sees an open `currentSession`, checks out, and the row remains in history with `check_out_at` populated.
- Repeated check-in and checkout without a session each return 409, including concurrent requests from two tabs/devices.
- Delivery Partner check-in fails without coordinates, with out-of-range coordinates, and when location permission is denied; valid coordinates create a session and address fallback still works if geocoding is unavailable.
- Delivery Partner can check out without location; if checkout location is submitted, it is validated and saved.
- Logging in after an order was created still shows the unassigned order in the Delivery Partner available list. Accepting it while checked out returns 403; after check-in it can be accepted if no other active order exists.
- A Delivery Partner with an active order cannot accept another one. Two partners racing to accept the same order result in only one successful assignment.
- Checking out a Home Chef filters orders created after checkout according to the current order route; separately test the chosen policy for a chef with no attendance history.
- A Franchise Admin sees only its own chefs' and delivery partners' sessions. Another franchise's sessions are not returned by changing query parameters or IDs.
- Date filters handle today, a date range, invalid dates, empty results, and sessions whose checkout is null.
- All three apps refresh from backend state after a successful mutation and recover correctly after page reload or token renewal.

## 8. Deployment Order

1. Confirm canonical user/profile IDs, role names, franchise linkage, and database timezone across the three apps.
2. Apply attendance migrations to the shared database (or the chosen central attendance service).
3. Deploy/authenticate backend endpoints and verify role and franchise scoping before exposing the UI.
4. Integrate Home Chef and Delivery Partner check-in/out flows; verify the API directly.
5. Integrate Franchise Admin read-only reports and verify cross-franchise isolation.
6. Run the integration checklist in staging with accounts from at least two franchises before production rollout.

## 9. Repository Reference Files

- `backend/src/routes/homeChefAttendance.js`
- `backend/src/routes/delivery.js`
- `backend/src/routes/userFoodOrders.js`
- `backend/src/routes/admin.js`
- `backend/src/controllers/adminController.js`
- `backend/src/config/migrations.js`
- `frontend/src/Components/CommenComponents/AttendancePrompt.jsx`
- `frontend/src/Components/CommenComponents/AttendanceStatusConfirmation.jsx`
- `frontend/src/HomeChef/ChefPanel.jsx`
- `frontend/src/HomeChef/ChefHeader.jsx`
- `frontend/src/DeliveryBoys/DeliveryPanel.jsx`
- `frontend/src/DeliveryBoys/DeliveryHeader.jsx`
- `frontend/src/Admin/Pages/HomeChefAttendance.jsx`
- `frontend/src/Admin/Pages/DeliveryPartnerAttendance.jsx`