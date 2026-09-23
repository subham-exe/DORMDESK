# ZOYA Student Portal — Engineering Handoff

## 1. Project Status

The Student Portal frontend sequence ZOY-06 through ZOY-11 is complete and has passed all available validation checks, including linting and production builds. The student experience is fully integrated, locally robust, offline-capable, and ready for further integration by the administrative development team (Subham).

## 2. Completed Work

### ZOY-06 — Leave & Digital Gate Pass
- Supports standard Leave request categories (`Home`, `Medical`, `Outing`, `Other`).
- Numeric `leaveDays` metadata natively integrated.
- Existing zero-touch approval behavior (<= 2 days auto-approval) was rigidly preserved.
- Implemented **Digital Gate Pass** UI bridging to `APPROVED` and `CLOSED` leave records.
- Seamless QR code payload generation implemented via `react-qr-code`.
- Implemented dashboard "Request Leave" quick-action shortcut.

### ZOY-07 — Certificate Workflow
- Comprehensive Certificate request support encompassing `BONAFIDE`, `CONDUCT`, and `TRANSFER` categories.
- Dashboard quick-action shortcuts mapped correctly.
- Created Digital Certificate preview entrypoint, mocking secure download capabilities for resolved certificate records.

### ZOY-08 — Scholarship Status
- Created `/api/scholarships` endpoint exposing data from Prisma.
- Configured dedicated Scholarship Status page representing financial processing phases.
- Bound dynamic Processing Timeline resolving precise status transitions (`ELIGIBLE`, `UNDER_VERIFICATION`, `DISBURSED`, etc.).
- Embedded responsive Dashboard summary cards.
- Integrated robust Loading, Empty, and Error state boundaries.

### ZOY-09 — Notifications
- Architected resilient `/api/notifications` deriving feed dynamically directly from Prisma `AuditLog` entity structures.
- Implemented mock `/api/announcements` API for platform-wide alerts.
- Configured Notification Bell + Dropdown mapped to the Student header.
- Implemented unread count badges and `mark-all-read` persistence utilizing browser `localStorage`.
- Deep-linking mapped natively from updates directly to the respective request detail pages.
- Embedded dismissible Announcement banner mapping layout seamlessly.
- *Note: Announcements currently consume a mock payload due to the absence of a permanent `Announcement` model. This should be addressed upon admin integrations.*

### ZOY-10 — Offline / PWA
- Configured native Next.js `manifest.ts` standalone progressive web application boundaries.
- Authored custom `public/sw.js` executing dual network/cache fallback resolving application shell elements natively offline.
- Explicit API/Admin bypass defined inside Service Worker ensuring no sensitive payloads are aggressively cached.
- Architected `OfflineProvider` component dynamically intercepting `navigator.onLine` context events, painting contextual alert banners.
- Executed local payload storage mechanisms within `offline-store.ts` implementing raw IndexedDB request queuing.
- Adapted Request submission logic natively intercepting offline attempts and deferring payloads into `PENDING_SYNC` state buffers.
- Dashboard natively executes silent background sync loops draining IndexedDB to backend APIs upon connectivity restoration.
- Engineered offline request detail interception routing `offline-*` query requests natively to IndexedDB.

### ZOY-11 — Integration Fixes
- Added missing `GET /api/requests` endpoint bridging Dashboard data pulls correctly.
- Rectified Prisma database import mapping ` '@/lib/db/prisma'` correctly preventing deployment faults.
- Added native query support for dummy `offline-*` tickets inside `src/app/student/requests/[id]/page.tsx`.
- Converted phantom `console.log` audit logging in `request-engine.ts` fully to `Prisma.auditLog` native database entries.
- Fixed `SYSTEM` actor foreign-key database constraint error triggering upon auto-approving Zero-Touch requests by injecting the student's own `actorId`.
- Reconfigured Prisma notification mapping queries specifically acknowledging `AUTO_APPROVED` system overrides within the feed.

## 3. Important Files

- `src/app/student/page.tsx`: Student Dashboard mapping request lists, offline sync buffers, and announcements.
- `src/app/student/layout.tsx`: Root shell injecting `NotificationDropdown` and navigation logic.
- `src/app/student/requests/new/page.tsx`: Universal request form utilizing IndexedDB local interception fallback.
- `src/app/student/requests/[id]/page.tsx`: Ticket Details logic encompassing Gate Pass, Certificates, Timeline logic, and IndexedDB interceptors.
- `src/app/student/scholarship/page.tsx`: Dedicated scholarship progression tracker.
- `src/app/api/requests/route.ts`: Core POST/GET request ingestion handlers.
- `src/app/api/notifications/route.ts`: Generates event feeds analyzing Prisma Audit logs and handling AUTO_APPROVED exceptions.
- `src/app/api/announcements/route.ts`: Mock JSON payload serving global notifications.
- `src/app/api/scholarships/route.ts`: Surfaces `Prisma.scholarship` student data.
- `src/components/NotificationDropdown.tsx`: Client-side logic for the Bell component and read state configurations.
- `src/components/OfflineProvider.tsx`: Window event interceptor handling online/offline banner states dynamically.
- `src/lib/services/offline-store.ts`: Raw abstraction wrapper manipulating native IndexedDB transactions.
- `src/app/manifest.ts`: Standard PWA mapping logic.
- `public/sw.js`: Browser cache interception and asset handler.
- `src/lib/db/prisma.ts`: Canonical Prisma instantiation logic.

## 4. Database / Backend Notes

- **Scholarship mapping**: Isolated natively per student via the `studentId` column.
- **Audit Logging**: Explicitly handles historical notification feeds.
- **Actor Limitations**: Prisma's SQLite implementation fiercely enforces foreign-keys. As `SYSTEM` was not a valid mock user, auto-approval procedures now securely register the Student themselves as the actor triggering an `AUTO_APPROVED` action mapped securely back into the frontend notification UI.
- **Existing Logic**: Zero-Touch policies originally implemented were left fundamentally untouched. 

## 5. Offline / PWA Notes

- **Supported Mechanisms**: The application shell, core layout, styles, and cached routes natively persist offline. 
- **Offline Storage**: Unsent Request packets dump into an IndexedDB database named `DormDeskOfflineDB`.
- **Synchronization**: Handled silently. Re-mounting `src/app/student/page.tsx` on active network connections triggers a bulk `/api/requests` flush and sweeps synced items from `IndexedDB`.
- **Query Resolution**: Users can naturally open `PENDING_SYNC` request tiles within the Dashboard, which natively intercepts the path parameter (`offline-*`) to parse details from IndexedDB directly instead of performing a broken network fetch.
- **Security Bypasses**: The Service worker is hardcoded to intentionally `fetch()` ignore `/api/` or `/admin/` namespaces avoiding any possibility of insecure data caching. 

## 6. Known Limitations / Future Work

- **Static Announcements**: Replace `src/app/api/announcements/route.ts` with a physical Database querying structure mapping a new Prisma `Announcement` table when Administrative tooling supports its creation.
- **Gate Pass Security**: Currently, the QR Gate Pass payload resolves basic Ticket IDs. Future administrative development needs to implement Cryptographic JSON Web Tokens (JWT) inside the payload for undeniable authenticity validation by security guards.
- **E2E Testing**: Add automated integration tests once core E2E pipelines are configured for the greater project repository.
- **Sync Conflict Logic**: Current synchronization logic assumes backend acceptance unconditionally. Proper retry limits, duplicate deduplication logic, and failed sync-queue handlers should be addressed before enterprise deployment. 

## 7. Validation

- `npm run lint`: **PASS** (Zero active errors/warnings mapped to Student logic).
- `npm run build`: **PASS** (16.3.5 Turbopack executes successfully spanning all SSG/SSR components).
- *(Note: No existing `npm test` suite was explicitly found within the repository configuration.)*

## 8. Git / Commit History

The following granular commits represent the complete ZOY series execution sequence currently stored inside `zoya/student-frontend`:
- `fix: resolve ZOY-11 integration issues across APIs and offline handling`
- `feat: implement ZOY-10 offline PWA support`
- `feat: implement ZOY-09 notifications`
- `feat: implement ZOY-08 scholarship status`
- `feat: implement ZOY-07 certificate workflow`
- `feat: implement leave request workflow and QR gate pass`

## 9. Handoff Checklist

- [x] ZOY-06 complete
- [x] ZOY-07 complete
- [x] ZOY-08 complete
- [x] ZOY-09 complete
- [x] ZOY-10 complete
- [x] ZOY-11 complete
- [x] Lint passes
- [x] Production build passes
- [x] Working tree clean
- [ ] Admin-side integration
- [ ] Final production QA
- [ ] E2E test coverage
