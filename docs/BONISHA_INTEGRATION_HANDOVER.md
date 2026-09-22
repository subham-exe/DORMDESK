# BONISHA: Admin Experience Integration Handover

This document outlines the final integration boundaries between the DormDesk Admin Frontend (owned by BONISHA) and the backend/service layer (to be owned by the backend/integration developer).

The frontend Admin experience (`/admin/*`) currently connects to a centralized mock adapter (`src/lib/admin/api.ts`). This adapter cleanly isolates all data access, meaning the frontend UI requires zero structural changes to integrate with the real backend. The integration owner simply needs to replace the internal logic of `AdminAPI` methods with actual `fetch()` calls or Server Actions pointing to the real backend services.

---

## 1. Integration Audit

| Domain           | Current Data Source | Integration Status |
| ---------------- | ------------------- | ------------------ |
| **Requests**     | Mock (`AdminAPI`)   | **Pending Backend Hookup** (Real `RequestEngine` exists in `src/lib/services/request-engine.ts`) |
| **Incidents**    | Mock (`AdminAPI`)   | **Pending Backend Hookup** (Real Prisma model and partial `RequestEngine.clusterIntoIncident` exist) |
| **SLA**          | Mock (`AdminAPI`)   | **Pending Backend Hookup** (SLA calculation needs a backend cron/service) |
| **Command Center**| Mock (`AdminAPI`)  | **Pending Backend Hookup** (Derived dynamically from Requests/Incidents) |
| **Analytics**    | Mock (`AdminAPI`)   | **Pending Backend Hookup** (Derived dynamically from historical requests) |
| **Recurring Issues**| Mock (`AdminAPI`)| **Pending Backend Hookup** (Deterministic rule needs backend service implementation) |
| **Scholarships** | Mock (`AdminAPI`)   | **Pending Backend Hookup** (No Prisma models or backend workflow currently exist) |

---

## 2. Integration Boundary

The Admin UI strictly follows this pattern:

```text
Admin UI (Next.js Server & Client Components)
   ↓
AdminAPI Adapter (`src/lib/admin/api.ts`)
   ↓
[ CURRENT MOCK LAYER ] -> [ FUTURE REAL BACKEND / API / PRISMA ]
```

**Rule:** Do not embed Prisma calls directly into the React components. Maintain the adapter pattern.

---

## 3. Domain Handovers

### A. Request Domain
The Admin UI expects to retrieve requests, filter them, and mutate assignment/status.
- **Current Mock:** `AdminAPI.listRequests()`, `AdminAPI.assignRequest()`, `AdminAPI.updateRequestStatus()`.
- **Target Backend:** The backend already has `RequestEngine` (`src/lib/services/request-engine.ts`). 
- **Action Required:** Update `AdminAPI` methods to directly wrap `RequestEngine` (or fetch from an API route that wraps it). Ensure `RequestEngine` handles the timeline events (`AdminRequestEvent`) so the frontend Request Detail page can render the history correctly.

### B. Incident Domain
The UI allows grouping multiple requests into a shared incident and resolving them together.
- **Current Mock:** `AdminAPI.groupRequestsIntoIncident()`, `AdminAPI.resolveIncident()`.
- **Target Backend:** `RequestEngine.clusterIntoIncident` exists.
- **Action Required:** Wire the adapter to the engine. Implement cascade resolution in the backend (when an incident resolves, iterate affected active requests and transition them to `RESOLVED` using `RequestEngine.transitionStatus`).

### C. SLA / Demo Clock
The mock layer utilizes a "Demo Clock" (`demoClockOffset`) to simulate time travel for demonstration purposes.
- **Demo-only logic:** Do NOT port `demoClockOffset` into production business logic.
- **Production logic:** The real backend needs a cron job or dynamic getter to calculate `ageingHours` and `slaStatus` (`ON_TRACK`, `WARNING`, `BREACHED`) based on actual `createdAt` and `dueAt` timestamps. The frontend simply consumes the resulting strings.

### D. Command Center & Analytics
The dashboard (`/admin`) and analytics page (`/admin/analytics`) do not require their own database tables.
- **Current Mock:** They dynamically aggregate data by mapping over `listRequests()` and `listIncidents()`.
- **Target Backend:** The backend owner should create optimized aggregate queries (e.g., `GROUP BY status`, `GROUP BY category`) to return `DashboardKPIs` and `AnalyticsSummary` so the UI doesn't have to fetch the entire database into memory.

### E. Recurring Issues
BON-09 implemented a deterministic recurrence detector:
- **Rule:** If requests with the identical `Category` AND `Location` appear $\ge$ `RECURRENCE_THRESHOLD` (currently 2 for the mock demo), they are flagged.
- **Action Required:** Implement this deterministic SQL/Prisma query on the backend and expose it via the adapter returning `RecurringIssue[]`. Avoid heavy NLP/AI unless explicitly added to the backend roadmap.

### F. Scholarships
There is currently **zero real backend infrastructure** for scholarships.
- **Current Mock:** Isolated mock `ScholarshipApplication` models exist in `AdminAPI`.
- **Action Required:** 
  1. Create Prisma models for Scholarships.
  2. Implement backend workflow validation (`PENDING_REVIEW` $\rightarrow$ `UNDER_VERIFICATION` $\rightarrow$ `APPROVED` $\rightarrow$ `DISBURSED`).
  3. Wire `AdminAPI.listScholarshipApplications` and `updateScholarshipStatus` to the new backend.

---

## 4. Authorization Boundary

DormDesk authorization operates on **Role + Domain + Scope + Permission**.
- The Admin UI currently hides buttons and routes based on structural convention, but **frontend hiding is not security**.
- **Action Required:** The backend owner must enforce authorization inside `RequestEngine`, API routes, and Service functions before executing any mutation (Status changes, Assignments, Incident resolution).

---

## 5. Backend Handover Checklist

- [ ] Connect `AdminAPI.listRequests` to Prisma `findMany`.
- [ ] Replace `AdminAPI.assignRequest` and `updateRequestStatus` with `RequestEngine` calls.
- [ ] Implement backend cascade resolution for Incidents.
- [ ] Move Command Center aggregations to optimized backend queries.
- [ ] Move Analytics & Recurring Issue calculations to optimized backend queries.
- [ ] Define the Prisma Schema for `ScholarshipApplication`.
- [ ] Connect `AdminAPI` Scholarship methods to the new Scholarship backend.
- [ ] Ensure Demo Clock logic is clearly bypassed in production environments.
- [ ] Apply Role-Based Access Control to all API routes wrapping the backend engines.
