> **ARCHIVED - HISTORICAL DOCUMENT**
>
> This document describes a previous DORMDESK implementation, phase, plan, or decision.
> It is not a current source of truth.
> For current project behavior, refer to the canonical documentation.
# DORMDESK — TECHNICAL AUDIT

**Auditor:** Automated code inspection + runtime verification
**Date:** 2026-09-28
**Commit:** `5dcacd6` on `main`
**Context:** BPUT Hackathon 2026, PS-07 (Fretbox) — "Campus Life, Debugged"

---

## 1. Stack & Architecture

| Layer | Choice | File |
|---|---|---|
| Frontend | Next.js 16.3.5 (App Router, Turbopack) | `package.json` |
| UI | Tailwind CSS v4, custom component library (no shadcn/ui install — hand-rolled components in `src/components/ui/`) | `src/components/ui/` |
| Backend | Next.js API Routes + Server Components | `src/app/api/` |
| ORM | Prisma 5.22.0 | `prisma/schema.prisma` |
| DB | SQLite (file: `prisma/campus.db`) | `prisma/schema.prisma` L2 |
| Auth | JWT (jose HS256, 7-day expiry, httpOnly cookie) | `src/lib/auth/session.ts` |
| Password | bcryptjs, cost factor 10 | `src/app/api/auth/login/route.ts`, `prisma/seed.js` |
| RBAC | Role×Domain×Permission×Scope matrix | `src/lib/auth/policies.ts`, `src/lib/auth/rbac.ts` |
| Testing | Vitest 2.1.9, 1 test file, 19 tests | `src/lib/services/__tests__/request-engine.test.ts` |
| PWA | Service worker (`public/sw.js`), webmanifest, OfflineProvider | `public/sw.js`, `src/components/OfflineProvider.tsx` |

### SQLite Configuration
- **WAL mode:** NOT explicitly enabled. No `PRAGMA journal_mode=WAL` found anywhere. Default is `DELETE` journal mode.
- **Foreign keys pragma:** NOT explicitly enabled at runtime. Prisma migrations use `PRAGMA foreign_keys=OFF/ON` only during migration redefinitions. Prisma client does NOT enforce FK constraints at the SQLite level by default.
- **Connection handling:** Singleton via `globalThis` pattern (`src/lib/db/prisma.ts`). Query logging enabled (`log: ['query']`).
- **PostgreSQL portability:** HIGH. Schema uses only standard types (TEXT, INTEGER, BOOLEAN, DATETIME). No SQLite-specific features used. Prisma abstracts all queries.

### Schema (7 tables)

| Table | Columns | Indexes | Relations |
|---|---|---|---|
| User | 12 (id, email, password, name, role, department, year, branch, isResident, hostel, block, room) | email UNIQUE | → Request (creator, assignee), AuditLog, Scholarship (1:1), Notification |
| Request | 17 (id, ticketNumber, requestType, category, requesterId, description, location, priority, status, assignedDepartment, assignedAuthorityId, SLA, dueAt, incidentId, createdAt, updatedAt, resolvedAt, exitTime, metadata) | ticketNumber UNIQUE | → User (requester, assignee), Incident, Escalation |
| Incident | 9 | none beyond PK | → Request[] |
| Scholarship | 5 (id, studentId, academicYear, status, updatedAt) | studentId UNIQUE | → User |
| AuditLog | 7 | none beyond PK | → User (nullable) |
| Notification | 8 | (recipientId, createdAt) composite | → User |
| Escalation | 4 | (requestId, level) UNIQUE, (requestId, createdAt) | → Request |

### Seed & Credentials

| Role | Email | Password |
|---|---|---|
| Student | `student1@demo.dormdesk.local` | `dormdesk2026` (bcrypt hashed) |
| Student | `student2@demo.dormdesk.local` | same |
| Student | `student3@demo.dormdesk.local` | same |
| Warden | `warden@demo.dormdesk.local` | same |
| Faculty | `professor@demo.dormdesk.local` | same |
| Faculty | `hod@demo.dormdesk.local` | same |
| Admin | `principal@demo.dormdesk.local` | same |
| Staff | `staff.electrical@demo.dormdesk.local` | same |
| Staff | `staff.plumbing@demo.dormdesk.local` | same |

**Commands:** `npm run dev`, `npm run build`, `npm test`, `npx prisma migrate reset --force` (reset+seed), `npx prisma db seed` (seed only)

---

## 2. Feature Inventory

| Feature | Roles | Flow | Files/Routes | Status | Verified? |
|---|---|---|---|---|---|
| **Complaint/Maintenance** | Student creates → Admin assigns → Staff processes → Student verifies → Auto-close | Student form → `POST /api/requests` → RequestEngine → Admin `/admin/requests/[id]` → transition API | `src/app/student/requests/new/page.tsx`, `src/app/api/requests/route.ts`, `src/lib/services/request-engine.ts`, `src/app/api/admin/requests/[id]/status/route.ts` | **WORKING** | Y (API login + seed verified) |
| **Leave Request** | Student creates → Auto-approve if ≤2 days, else manual | Same request form with type=LEAVE, metadata.leaveDays | Same files, auto-approve in `request-engine.ts` L55-58 | **WORKING** | Y (seed has APPROVED leave) |
| **Certificate Request** | Student creates → Admin processes | Same unified request engine | Same files | **WORKING** | Y (seed has PROCESSING certificate) |
| **Gate Pass** | Student creates (exitTime in metadata) → Approved → QR code generated | Same unified request engine. Student detail page generates SVG QR via `react-qr-code` for approved leaves/gate passes | `prisma/schema.prisma` L52, `src/app/student/requests/[id]/page.tsx` | **PARTIAL** — QR generation works; no dedicated exitTime UI field in creation form | N |
| **Incident Clustering** | Admin groups related requests → resolve cascades | Admin UI → `RequestEngine.clusterIntoIncident()` / `attachToIncident()` → cascade resolve | `src/lib/services/request-engine.ts`, `src/lib/admin/api.ts` L307-347, `src/app/admin/incidents/` | **WORKING** | Y (seed has incident with 2 attached requests) |
| **SLA Tracking** | System evaluates, escalation on breach | `SLAService.evaluate()` → `EscalationService.triggerEscalationIfRequired()` → `SLAScheduler.tick()` via cron endpoint | `src/lib/services/sla.ts`, `src/lib/services/escalation.ts`, `src/lib/services/scheduler.ts`, `src/app/api/internal/cron/sla-tick/route.ts` | **WORKING** (logic complete; cron requires external trigger) | N (cron not auto-scheduled) |
| **Scholarship** | Student applies → Admin reviews | Student `/student/scholarship` → `ScholarshipService.transitionState()` → Admin `/admin/scholarships/[id]` | `src/lib/services/scholarship.ts`, `src/app/api/scholarships/`, `src/app/admin/scholarships/` | **WORKING** | Y (3 seeded records) |
| **Notifications** | System creates on request transitions | `NotificationService.create()` called by RequestEngine | `src/lib/services/notification.ts`, `src/app/api/notifications/route.ts`, `src/app/student/notices/page.tsx` | **WORKING** (in-app only) | Y |
| **Audit Log** | System logs all actions | `AuditService.log()` called by RequestEngine + scholarship | `src/lib/services/audit.ts`, admin request detail shows events | **WORKING** | Y (visible in request detail) |
| **Admin Dashboard** | Admin sees KPIs, attention queue, incidents, SLA | Server component calls `AdminAPI.getDashboardKPIs()` + `getAttentionRequests()` + `listIncidents()` | `src/app/admin/page.tsx`, `src/lib/admin/api.ts` L350-401 | **WORKING** | Y |
| **Admin Analytics** | Admin sees breakdown by category/status/priority/SLA | `AdminAPI.getAnalytics()` + `getRecurringIssues()` | `src/app/admin/analytics/page.tsx`, `src/lib/admin/api.ts` L458-522 | **WORKING** | Y |
| **Attendance** | — | — | — | **NOT IMPLEMENTED** | — |
| **Timetable/Class Updates** | — | — | — | **NOT IMPLEMENTED** | — |
| **Fees/Dues** | — | — | — | **NOT IMPLEMENTED** | — |
| **Mess Menu/Feedback** | — | — | — | **NOT IMPLEMENTED** | — |
| **Visitor/Gate Logs** | — | — | — | **NOT IMPLEMENTED** | — |
| **Room/Asset Records** | — | — | — | **NOT IMPLEMENTED** | — |
| **Announcements** | — | Returns empty array | `src/app/api/announcements/route.ts` | **STUB** (no schema model) | Y (returns `[]`) |

---

## 3. Workflow Depth

### 3.1 Complaint/Maintenance (Primary Workflow)

**States:** PENDING → ASSIGNED → ACKNOWLEDGED → PROCESSING → RESOLVED → VERIFIED → CLOSED
Also: PENDING → REJECTED, PENDING → APPROVED, PENDING → CANCELLED, any active → CANCELLED, RESOLVED → PROCESSING (reopen), VERIFIED → CLOSED (auto)

**Transition matrix** (`src/lib/services/request-engine.ts` L6-17):
```
PENDING:      [ASSIGNED, RESOLVED, CANCELLED, REJECTED, APPROVED]
ASSIGNED:     [ACKNOWLEDGED, CANCELLED, REJECTED, RESOLVED]
ACKNOWLEDGED: [PROCESSING, RESOLVED, CANCELLED, REJECTED]
PROCESSING:   [RESOLVED, CANCELLED, REJECTED, ASSIGNED]
RESOLVED:     [VERIFIED, PROCESSING]
VERIFIED:     [CLOSED]          ← auto-transition immediately
APPROVED:     [CLOSED]
CLOSED:       []                ← terminal
REJECTED:     []                ← terminal
CANCELLED:    []                ← terminal
```

**Who can transition:**
- Student: Create, Cancel own, Verify resolved (restriction: Students cannot REJECT — `request-engine.ts` L115-118)
- Admin/Warden/Staff/Faculty: All transitions via `verifyAdminAuthority()` (`src/lib/admin/api.ts` L167-173)

**SLA logic:**
- `SLA` field = hours. `dueAt` = explicit deadline or derived from `createdAt + SLA*3600000`
- `SLAService.evaluate()` returns `isBreached` if `now >= deadline`
- `calculateSLA()` in `admin/api.ts` adds WARNING if ≤6h remaining, BREACHED if past due, fallback BREACHED if no SLA but age >24h
- `EscalationService` creates `Escalation` record (idempotent via unique constraint), notifies all Admin users

**Audit:** Every `transitionStatus`, `assignRequest`, `createRequest` calls `logAudit()` → `AuditService.log()`. Events visible in admin request detail view.

**Edge cases handled:**
- ✅ Rejection blocked for Students
- ✅ Terminal states have empty transition arrays
- ✅ Same-state transition allowed (no-op, `request.status !== payload.newStatus` check)
- ✅ VERIFIED auto-closes (recursive call)
- ❌ Duplicate detection: NOT IMPLEMENTED
- ❌ Attachments/comments: NOT IMPLEMENTED (metadata field exists but no file upload)
- ❌ Offline submit: NOT IMPLEMENTED (no queue/sync)

### 3.2 Leave Request

Same engine. **Differentiator:** Auto-approve if `requestType === 'LEAVE' && metadata.leaveDays <= 2` (`request-engine.ts` L55-57). Creates with status `APPROVED` directly.

### 3.3 Incident Resolution Cascade

Admin calls `resolveIncident()` → Incident status → `RESOLVED` → loops through all non-terminal attached requests → calls `RequestEngine.transitionStatus(RESOLVED)` per request. Failures are caught and logged but don't block other requests.

### 3.4 Scholarship

**States:** ELIGIBLE → APPLIED → SUBMITTED → UNDER_VERIFICATION → APPROVED → SANCTIONED → DISBURSED (also REJECTED, CANCELLED)
State machine in `src/lib/services/scholarship.ts` with `STATE_TRANSITIONS` map and eligibility check (`user.role === 'Student'`).

---

## 4. Admin Dashboard

| Metric/Widget | Data Source | Query | Real Data? |
|---|---|---|---|
| Pending Requests count | `AdminAPI.getDashboardKPIs()` | `reqs.filter(r => r.status === "PENDING").length` | ✅ Real (Prisma) |
| Overdue Requests count | same | `activeReqs.filter(r => r.slaStatus === "BREACHED").length` | ✅ Real |
| Active Incidents count | same | `incidents.filter(i => i.status === "OPEN").length` | ✅ Real |
| Unassigned Requests count | same | `activeReqs.filter(r => !r.assignedAuthorityId).length` | ✅ Real |
| Ageing Buckets (<24h, 24-48h, >48h) | same | Computed from `ageingHours` | ✅ Real |
| Attention Queue (top 10) | `AdminAPI.getAttentionRequests()` | Filters BREACHED/WARNING + unassigned >24h, sorts by severity | ✅ Real |
| Active Incidents list | `AdminAPI.listIncidents()` | Prisma query with `_count.requests` | ✅ Real |
| SLA Overview (breached/warning) | Derived from attention requests | Count by `slaStatus` | ✅ Real |
| Analytics: by category/status/priority/SLA | `AdminAPI.getAnalytics()` | Aggregates from `listRequests()` result | ✅ Real |
| Recurring Issues | `AdminAPI.getRecurringIssues()` | Groups by `category|location`, threshold ≥2 | ✅ Real |
| Staff workload distribution | — | — | ❌ NOT IMPLEMENTED |
| Filters on request queue | Client-side search/filter in `request-queue-client.tsx` | Status, priority, text search | ✅ Real |
| Export (CSV/Excel) | — | — | ❌ NOT IMPLEMENTED |

**Ageing:** ✅ Computed. `ageingHours = (now - createdAt) / 3600000` for active, `(resolvedAt - createdAt)` for resolved.
**Resolution time:** ✅ Partially. Stored in `ageingHours` for resolved requests. No aggregate avg/median chart.
**Recurring issue detection:** ✅ Rules-based. Groups by exact `category + location` string match. Threshold = 2. No ML, no text similarity.
**Hardcoded data:** `programName: "General Scholarship"` in `admin/api.ts` L411. `totalEligible: 0` always in `getScholarshipStats` L437.

---

## 5. Notifications

| Aspect | Status | Evidence |
|---|---|---|
| In-app notifications | ✅ WORKING | `Notification` table, `NotificationService.create()`, student notices page |
| Targeting: individual | ✅ by recipientId | `notification.ts` L10 |
| Targeting: batch/branch/hostel/year | ❌ NOT IMPLEMENTED | No group-send API. One notification per recipient only. |
| Push notifications | ❌ NOT IMPLEMENTED | No Web Push API, no VAPID keys |
| SMS | ❌ NOT IMPLEMENTED | |
| Email | ❌ NOT IMPLEMENTED | |
| WhatsApp | ❌ NOT IMPLEMENTED | |
| Delivery tracking | ❌ NOT IMPLEMENTED | Notifications are fire-and-forget DB inserts |
| Read tracking | ✅ WORKING | `readAt` field, `PATCH /api/notifications/[id]/read` |
| Action/acknowledge tracking | ❌ NOT IMPLEMENTED | No action callback mechanism |
| Retry/failure handling | ❌ No retry | DB insert failure = notification lost |

---

## 6. Accessibility & Performance

### Bundle Size
- **Total static assets:** ~1,105 KB uncompressed (from `.next/static/`)
- **Largest JS chunk:** 224 KB (`27t_qfc-3_lzs.js`), likely React runtime
- **CSS:** 67 KB (single chunk)
- **Fonts:** ~193 KB total (4 woff2 files)
- Gzip compression: Not measured (depends on server config; Next.js production server applies compression)

### PWA / Offline
- **Service Worker:** ✅ EXISTS (`public/sw.js`)
  - Precaches: `/student`, `/student/requests`, `/student/notices`, `/student/profile`, `/favicon.ico`
  - Strategy: Network-first for HTML, cache-first for static assets
  - Offline fallback: Returns cached `/student` page
  - API requests: NOT cached (pass-through), so all data views fail offline
  - Admin routes: Explicitly excluded from caching
- **Manifest:** ✅ EXISTS — `src/app/manifest.ts` (Next.js Metadata Route). Configures `name: 'DormDesk Student Portal'`, `display: 'standalone'`, `start_url: '/student'`. Single favicon icon only.
- **OfflineProvider:** ✅ Shows banner when offline/back-online (`src/components/OfflineProvider.tsx`)
- **Offline data submission:** ✅ PARTIAL — `src/lib/services/offline-store.ts` provides IndexedDB persistence (`DormDeskOfflineDB`) for requests created while offline. Student new request form (`src/app/student/requests/new/page.tsx`) calls `saveOfflineRequest()` when `!navigator.onLine`. Student dashboard merges offline requests from IndexedDB into the request list. However, automatic sync/replay on reconnect is client-side only and not robust (no retry queue, no conflict resolution).

### Lighthouse
Not runnable in this environment. Estimated based on code inspection:
- Performance: ~70-80 (large JS bundle, no image optimization, SSR helps)
- Accessibility: ~80-85 (semantic HTML, focus-visible styles, aria-live on banners, but `role="status px-4..."` is a broken attribute in OfflineProvider L50/L58)

### Responsive
- Tailwind breakpoints used: `sm:`, `md:`, `lg:`, `xl:` throughout
- Mobile nav component exists: `src/app/admin/components/admin-mobile-nav.tsx`
- Bottom tab bar for student: `src/app/student/layout.tsx`

### Regional Language
- ❌ NOT IMPLEMENTED. English only. No i18n framework.

### No-Smartphone Fallback
- ❌ NOT IMPLEMENTED. No SMS, USSD, IVR, kiosk mode, or warden-assisted entry.

---

## 7. Intelligence Features

| Feature | Status | Mechanism |
|---|---|---|
| Auto-routing/assignment | ❌ NOT IMPLEMENTED | Admin manually assigns via UI |
| Recurring issue detection | ✅ PARTIAL | Rules: exact `category|location` string match, threshold ≥2. `src/lib/admin/api.ts` L490-522 |
| Chatbot | ❌ NOT IMPLEMENTED | |
| Prediction | ❌ NOT IMPLEMENTED | |
| Auto-approve (leave ≤2 days) | ✅ WORKING | Hard-coded rule in `request-engine.ts` L55-57 |

No ML, no LLM, no external API calls. All intelligence is deterministic rules. Works fully offline (no internet dependency for logic).

---

## 8. Data & Adoption

| Aspect | Status |
|---|---|
| Bulk import (CSV/Excel) | ❌ NOT IMPLEMENTED |
| Bulk export | ❌ NOT IMPLEMENTED |
| External API/webhooks | ❌ NOT IMPLEMENTED (no documented REST API beyond internal routes) |
| Multi-tenant/multi-hostel | ❌ NOT IMPLEMENTED (single SQLite file, no tenant isolation) |
| Data migration tooling | ❌ NOT IMPLEMENTED |
| Rollout strategy documented | ❌ NOT IMPLEMENTED |

---

## 9. Security & Reliability

| Check | Status | Evidence |
|---|---|---|
| Password hashing | ✅ bcryptjs, cost 10 | `src/app/api/auth/register/route.ts` L28 |
| JWT secret | ⚠️ Hardcoded fallback `'super-secret-key-for-local-dev-only'` | `src/lib/auth/session.ts` L7 |
| RBAC server-side | ✅ `requireAuth()` + `requirePermission()` on sensitive routes | `src/lib/auth/session.ts` L73-84 |
| RBAC coverage gaps | ⚠️ Admin API uses simpler `verifyAdminAuthority()` which checks role list, not full RBAC matrix | `src/lib/admin/api.ts` L167-173 |
| Input validation | ⚠️ MINIMAL. Only checks `!email \|\| !password`. No length limits, no format validation, no sanitization | `src/app/api/auth/login/route.ts` |
| Rate limiting | ❌ NOT IMPLEMENTED | |
| CSRF protection | ⚠️ `sameSite: 'lax'` on cookie. No CSRF token. | `src/lib/auth/session.ts` L40 |
| SQL injection | ✅ Protected via Prisma parameterized queries | All DB access through Prisma |
| XSS | ✅ React auto-escapes. No `dangerouslySetInnerHTML` found. | |
| Secrets in repo | ⚠️ JWT fallback secret in code. Demo password in seed.js and setup.md (intentional for local demo) | |
| Error handling | ✅ Try-catch on all API routes with generic error responses | |
| Logging | ⚠️ `console.error` / `console.warn` only. No structured logging. | |
| Registration open | ⚠️ `POST /api/auth/register` has no auth check — anyone can register as Student | `src/app/api/auth/register/route.ts` |

---

## 10. Code Quality

| Check | Result |
|---|---|
| Tests | 1 file, 19 tests, **ALL PASS** (`src/lib/services/__tests__/request-engine.test.ts`) |
| Test coverage | RequestEngine transitions only. No API route tests, no UI tests, no integration tests. |
| TypeScript | **PASS** (0 errors) |
| ESLint | **PASS** (0 errors, 0 warnings) |
| Build | **PASS** |
| Source files | 62 `.tsx` + 36 `.ts` = 98 source files |
| Dead code | `getStatusBadgeVariant` removed from admin request detail (previously unused). DemoClock removed. Residual `ListTodo` icon import false positive (it's actually used). |
| Hardcoded values | `programName: "General Scholarship"` (L411), `totalEligible: 0` (L437), `SLA: 24` default fallback in `calculateSLA` (L133-134), JWT expiry `'7d'` |
| Mock data in UI | ❌ None found. All pages fetch real data from Prisma. Announcements API returns `[]` intentionally (no model). |
| TODO/FIXME | 0 genuine TODOs. Only `ListTodo` icon name false positives. |
| Demo crash risks | See §14 below |

---

## 11. Rubric Self-Score

### Friction Reduction (30%)

**Score: 16/30**

Evidence FOR:
- Universal Request Engine handles complaints, leaves, certificates in one system — genuine friction reduction
- Auto-approve for short leaves eliminates manual approval bottleneck
- 10-state lifecycle with audit trail replaces paper tracking

Gaps AGAINST:
- No attendance, mess, fees workflows — only covers 3 of ~10 campus pain points
- No SMS/WhatsApp/push — students must open the app to know status
- No offline data submission — unusable in poor-network hostels

### Workflow Breadth (20%)

**Score: 8/20**

Evidence FOR:
- 3 complete end-to-end workflows (complaint, leave, certificate)
- Incident clustering adds a 4th workflow type
- Scholarship lifecycle is a 5th distinct workflow

Gaps AGAINST:
- Attendance: NOT IMPLEMENTED (explicitly required in PS)
- Mess menu/feedback: NOT IMPLEMENTED
- Fees/dues, timetable, visitor logs, room/asset records: all NOT IMPLEMENTED
- Only 5 of ~10 expected campus domains covered

### Admin Visibility/Insight (20%)

**Score: 14/20**

Evidence FOR:
- Real KPIs: pending, overdue, unassigned, ageing buckets — all from live DB
- Recurring issue detection with rules-based pattern matching
- SLA breach tracking with escalation infrastructure

Gaps AGAINST:
- No resolution time aggregates (avg, median, trend)
- No staff workload distribution
- No export capability (CSV/PDF)

### Accessibility/Low-Bandwidth (15%)

**Score: 8/15**

Evidence FOR:
- Service worker with network-first strategy and offline fallback
- IndexedDB offline request submission queue (`src/lib/services/offline-store.ts`)
- Offline detection banner + back-online notification
- Responsive design with mobile bottom nav

Gaps AGAINST:
- No regional language support (required for BPUT context)
- No no-smartphone fallback (SMS, kiosk, USSD)
- Broken `role` attribute in OfflineProvider (concatenated with classNames)
- No 2G/3G optimizations (no lazy loading, no skeleton streaming)

### Usability/Adoption/Demo (15%)

**Score: 8/15**

Evidence FOR:
- Deterministic seed makes demo reproducible
- Clean UI with status badges, priority indicators, SLA visualization
- 9 seeded accounts covering all roles

Gaps AGAINST:
- No bulk import/export for adoption
- No rollout/migration strategy documented
- No adoption note (explicitly required by PS)

### **TOTAL: 54/100**

---

## 12. Gap List (Ranked by Points-at-Risk ÷ Effort)

| # | Gap | Rubric Area | Points at Risk | Effort (hours) | Priority |
|---|---|---|---|---|---|
| 1 | No adoption/rollout note | Usability (15%) | 3-5 | 1 | **DO FIRST** |
| 2 | No notification targeting (batch/hostel/year) | Friction (30%) | 3-4 | 3-4 | HIGH |
| 3 | No attendance workflow (even stub) | Breadth (20%) | 3-4 | 4-6 | HIGH |
| 4 | No mess menu/feedback (even stub) | Breadth (20%) | 2-3 | 3-4 | HIGH |
| 5 | No regional language (even Hindi) | Accessibility (15%) | 2-3 | 4-8 | MEDIUM |
| 6 | No CSV/PDF export | Admin (20%) | 2-3 | 2-3 | MEDIUM |
| 7 | No resolution time analytics (avg/trend) | Admin (20%) | 1-2 | 2-3 | MEDIUM |
| 8 | No SMS/WhatsApp fallback | Accessibility (15%) | 2-3 | 4-8 | MEDIUM |
| 9 | Offline sync is partial (no retry queue, no conflict resolution) | Friction/Accessibility | 1-2 | 4-6 | LOW |
| 10 | No staff workload chart | Admin (20%) | 1-2 | 2-3 | LOW |
| 11 | No timetable/fees/visitor stubs | Breadth (20%) | 2-4 | 4-8 | LOW |
| 12 | Broken role attribute in OfflineProvider | Accessibility (15%) | 0.5 | 0.1 | **DO FIRST** |

---

## 13. Differentiator Scan

### Features Most Teams Likely LACK (Differentiators)
- **Universal Request Engine** — one state machine for all request types. Most teams build separate complaint/leave/certificate modules.
- **Incident clustering** with resolution cascade — groups related complaints into incidents and batch-resolves.
- **SLA engine with escalation** — configurable per-request SLA with automated breach detection and admin notification.
- **RBAC matrix** (Role×Domain×Permission×Scope) — more sophisticated than simple role checks.
- **Auto-approve for short leaves** — zero-touch approval is a genuine workflow optimization.
- **Audit trail** on every state transition with actor tracking.
- **QR code gate pass/certificate** — SVG QR generated client-side via `react-qr-code` for approved leave/certificate requests.
- **IndexedDB offline queue** — student can create requests while offline; they sync when connectivity returns.

### Table Stakes (Most Teams Will Have)
- Login/registration
- Basic complaint submission form
- Admin list/detail views
- Status tracking (some form)
- Mobile-responsive layout
- Dashboard with counts

### Features Competitors Likely Have That DORMDESK Lacks
- Attendance tracking (this is in the problem statement name)
- Mess menu display/feedback
- At least one regional language
- Push notifications or email
- Some form of chat/communication

---

## 14. Demo Risk List

### Reliable Steps ✅
1. Student login with `student1@demo.dormdesk.local` / `dormdesk2026`
2. Student dashboard loads with seeded request cards
3. Student can create a new complaint (form submits, request appears)
4. Admin login with `principal@demo.dormdesk.local`
5. Admin dashboard shows real KPIs (pending, overdue, ageing buckets)
6. Admin request queue loads with seeded requests + filters work
7. Admin request detail shows audit trail events
8. Admin can assign request to staff member
9. Admin can transition request status (PENDING → ASSIGNED → ACKNOWLEDGED → PROCESSING → RESOLVED)
10. Student can verify resolved request (auto-closes)
11. Admin incidents page shows seeded incident with affected request count
12. Admin analytics page shows category/status/priority breakdown
13. Scholarship pages load for both student and admin
14. Seed is idempotent (`npx prisma migrate reset --force` re-creates clean state)

### Fragile Steps ⚠️
1. **SLA cron tick** — requires manual `curl` with `CRON_SECRET` header. If `CRON_SECRET` env var not set, endpoint returns 500. Not auto-scheduled.
2. **Incident resolution cascade** — works but if a request is in an unexpected state (e.g., CANCELLED), the cascade silently skips it (logged as warning). Could confuse demo if not all requests resolve.
3. **Offline banner** — has a broken `role` attribute (`role="status px-4..."` — the CSS classes got concatenated into the role attribute). Will cause accessibility audit failures.
4. **Student notices page** — depends on seeded notifications being for that specific student. Only 2 notifications seeded for student1. If different student logs in, page may appear empty.
5. **Service worker precache** — `/student`, `/student/requests` etc. are dynamic SSR pages. Precaching them during SW install may fail silently (the catch in sw.js L15 suppresses errors).
6. **Admin request assignment** — the staff directory dropdown depends on `/api/admin/incidents` or `AdminAPI.listStaffDirectory()`. If no staff seeded in the right department, assignment could appear to have no options.
7. **Registration endpoint** — completely open, no auth. A demo audience member could register and see the student dashboard (minor risk, but could create unexpected data).

