# DORMDESK DATABASE PERFORMANCE FIX REPORT

## Fixes Implemented

### 1. Bound Unlimited Request Lists
- Updated `src/app/api/requests/route.ts` to implement cursor-based pagination for the student's request history endpoint. Added parsing for `cursor` and `limit`, used `prisma.request.findMany({ take, skip, cursor })`, and returned a `{ data, nextCursor }` payload structure.
- Updated `src/app/student/requests/page.tsx` UI to safely extract the payload from `.data` while remaining backward-compatible with any cached JSON responses.

### 2. Audit Log Pagination
- Modified `AuditService.getHistory` in `src/lib/services/audit.ts` to support `cursor` and `limit` in `AuditQueryFilter`, applying them to `prisma.auditLog.findMany`.
- Handled UI safety around `getHistory`'s transition to returning `{ data, nextCursor }`.

### 3. Notification Pagination
- Updated `NotificationService.list` in `src/lib/services/notification.ts` with cursor-based pagination and a default limit of 50.
- Wired the `/api/notifications/route.ts` GET endpoint to pass `cursor` and `limit` parameters to the underlying service and return `nextCursor` alongside `data`.
- The UI in `src/app/student/notices/page.tsx` automatically respects this change without breakage since it already unwrapped `.data`.

### 4. Email Delivery Log Pagination
- Verified that there are currently no un-bounded API endpoints returning `EmailDeliveryLog` lists. Bounded queries are naturally limited by request context or tests, so no changes were necessary.

### 5. Admin Request Export Payload
- Fixed the catastrophic N+1 JSON memory explosion in `src/app/api/admin/requests/export/route.ts` by replacing `include: { requester, assignedAuthority }` with explicit sparse `select` queries containing only the string/boolean fields required for CSV generation.

### 6. Incident Intelligence N+1
- Refactored `calculateImpact` inside `src/lib/services/incident-intelligence.ts`. Replaced the sequential `await NotificationService.create(...)` in the admin loop with an efficient parallel `Promise.all` map.
- Refactored `autoClusterIncidents` to pre-fetch relevant candidate incidents using an `OR` array and map them in memory instead of executing a `prisma.incident.findFirst` query on every loop iteration.

### 7. Request Engine N+1
- Rewrote `RequestEngine.clusterIntoIncident` and `RequestEngine.attachToIncident` in `src/lib/services/request-engine.ts`. Instead of iterating and calling `.update()` individually, these now execute a bulk `updateMany` combined with grouped batched auditing through a `$transaction`.

### 8. Request-Engine Transaction Audit (Atomicity)
- Solved the atomicity vulnerability in `updateRequestStatus`, `clusterIntoIncident`, and `attachToIncident`. Previously, side effects ran completely outside of DB consistency guarantees. 
- Passed `tx?: Prisma.TransactionClient` safely through `triggerNotification` and `NotificationService.create`. 
- DB creation for `AuditLog` and `Notification` now strictly belongs inside the `prisma.$transaction`.
- Critical `dispatchOperationalEmail` side-effects are decoupled and only executed after the transaction commit successfully resolves, preventing hanging SQLite connections or email dispatches for rolled-back updates.

## Verification
- **Test Suite:** 294 tests passing cleanly (No behavioral regressions).
- **TypeScript:** `tsc --noEmit` is perfectly clean.
- **SQLite Configuration:** Retained all WAL benefits. General cache, DB lease, and denormalization explicitly avoided per instructions.
