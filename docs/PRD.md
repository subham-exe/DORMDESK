# DormDesk Product Requirements Document

## 1. Product Overview
DormDesk is an intelligent campus operations platform for the BPUT Hackathon 2026. 
FretBox digitizes campus operations. DormDesk makes those operations intelligent and accountable.

It unifies everyday campus requests, communication, tracking, resolution, and administrative visibility into a single, cohesive engine.

## 2. Problem
Campus life is currently plagued by fragmentation:
- Multiple disconnected apps and portals
- Manual registers and paper processes
- Poor visibility into request status
- Lost requests and notices
- Complete lack of accountability and auditability
- Systems that simply record problems without understanding operational patterns

## 3. Target Users
- **Students:** Need a simple, low-bandwidth way to request help, track status, and view critical information with explainable transparency.
- **Staff / Faculty:** Need clear assignment queues, reduced paperwork, and incident intelligence to group duplicate requests.
- **Administrative Authorities:** Need an Operations Command Center providing high-level visibility into SLA breaches, staff workload, operational resolution metrics (average/median time), CSV data export, and recurring issues.

## 4. Product Vision & Core Architecture
DormDesk is built on a **Universal Request Engine**. It is not a fragmented collection of modules.
All actions flow through a universal request lifecycle:

`REQUEST → CLASSIFY → ROUTE → ASSIGN → ACKNOWLEDGE → PROCESS → RESOLVE → VERIFY → CLOSE`

The workflow does NOT end when staff clicks "Resolved". The student must verify the resolution.

**Architectural Concept:**
```text
Universal Request Engine
        ↓
Policy + Routing
        ↓
SLA + Escalation
        ↓
Incident Intelligence
        ↓
Resolution + Evidence
        ↓
Student Verification
        ↓
Recurring Issue Intelligence
```

## 5. Major Differentiators

### A. Explainable Workflow Transparency
**Status:** PLANNED
**Evidence:** src/lib/admin/api.ts implements clustering logic, and src/app/student/requests/[id]/page.tsx renders the Incident Intelligence UI when a request is clustered. However, the automatic frontend \'Me Too\' detection logic during submission is still missing.
Students should not see only "Status: Pending". They should see exact reasons:
> "Why is this pending? The assigned technician has not acknowledged the request. SLA: 38 minutes remaining."

### B. Incident Intelligence & "Me Too"
**Status:** PARTIALLY IMPLEMENTED
**Evidence:** `clusterIntoIncident` exists in `RequestEngine`, but no UI or automatic detection logic exists for submission.
When multiple students report the same issue (e.g. 12 students report a water outage), DormDesk groups these into an **Incident**.
When DormDesk detects an existing incident, a new student submitting a request should see:
> "This issue has already been reported. [Join Incident] / [Me Too]"
This prevents unnecessary duplicate tickets.

### C. Targeted Announcements
**Status:** IMPLEMENTED
**Evidence:** `src/lib/services/announcement.ts`, `Announcement` and `AnnouncementReceipt` schema models, complete Admin and Student UI integration.
Admins can construct targeted announcements resolving target students by Branch, Year, Hostel, and Block. Features robust read tracking and acknowledgement requirements.

### D. SLA & Automatic Escalation
**Status:** PROTOTYPE / PARTIALLY IMPLEMENTED
**Evidence:** `SLA` and `dueAt` schema fields are populated and visualized in the frontend. Admin Dashboard includes an interactive `Run SLA check` capability. Background cron escalation engine is PLANNED.
Policy-driven escalation. Evaluates the request against configured SLA policies and automatically triggers escalation when required (not arbitrary AI decision-making).

### D. Zero-Touch Approval
**Status:** IMPLEMENTED (Limited hardcoded automation)
**Evidence:** `RequestEngine.createRequest` applies a deterministic rule `if (leaveDays <= 2)` to automatically approve leaves.
Configurable policy-based automation (e.g., Leave ≤ 2 days → Auto approve) bypassing manual bottlenecks.

### E. Recurring Issue Detection
**Status:** PLANNED
**Evidence:** Not yet implemented in the codebase.
DormDesk analyzes historical incidents and identifies recurring operational problems.
> "SYSTEM INSIGHT: Recurring infrastructure issue detected."

## 6. Core Workflows
1. **Hostel Complaint / Maintenance:**
   - **Status:** IMPLEMENTED (Backend engine and student submission UI)
   - *Student Entry:* Submits complaint with category and description. (Or joins existing incident).
   - *Lifecycle:* Routed → Assigned → SLA tracked → Fixed → Resolved.
   - *Resolution & Audit:* Fix is **verified** by student; SLA and audit logs are recorded.

2. **Leave / Gate Pass:**
   - **Status:** IMPLEMENTED (Backend engine and student submission UI, QR pass PLANNED)
   - *Lifecycle:* Routed to Warden/HOD → Approved/Rejected (or Zero-Touch Auto-Approved).
   - *Resolution:* Digital QR pass generated [NOT IMPLEMENTED].

3. **Certificate / Document Request:**
   - **Status:** PLANNED
   - *Lifecycle:* Routed to Admin → Verified → Approved (or auto-issued).

## 7. Operations Command Center (Admin)
**Status:** PLANNED (No admin portal exists yet in `src/app/admin`)
Prioritizes:
- **Critical intervention:** SLA breaches, unresolved high-priority incidents, severely delayed requests.
- **Emerging issues:** Rapidly increasing complaints, recurring locations.
- **Operational health:** Requests within SLA, average resolution time, verification rate.

## 8. Accessibility and Adoption
**Status:** PROTOTYPE / PLANNED (Offline elements are prototyped in the separate Vite app, but not integrated)
- Built for low-bandwidth and low-end devices.
- Lightweight UI with PWA and offline capability.
- Kiosk mode / assisted filing fallback [NOT IMPLEMENTED] (staff can file on behalf of a student using student ID).

## 9. MVP Scope (Hackathon Hero Demo)
The hackathon demo must deliver one complete vertical slice:
1. Student reports problem
2. Related request detected
3. Student joins existing incident
4. Incident updated
5. Automatic routing & Assignment
6. SLA countdown & warning
7. Escalation
8. Staff resolution & Evidence
9. Student verification
10. Incident closed
11. Recurring issue detected

## 10. Out of Scope
- No unnecessary AI dependency (no decorative chatbots).
- No blockchain, huge payment systems, or elaborate attendance features.
- No copying every FretBox feature.

### E. Mess Menu & Feedback
- **Students:** Can view daily/weekly meal schedules deterministically and submit rated feedback per meal slot.
- **Wardens/Admins:** Can manage meal slot schedules and monitor average rating aggregations to ensure operational quality. (Billing, Inventory, and Vendor APIs remain strictly out of scope).

### F. Attendance-Lite & Class Cancellation
- **Students:** Can view their attendance summary and percentage across enrolled courses, and see class cancellation notices deterministically.
- **Faculty:** Can view their assigned courses, record class session attendance (Present/Absent), and cancel sessions. Cancellations trigger automated system alerts for enrolled students.
- **Scope Limit:** No biometric, QR, GPS, facial, or predictive attendance functionality is included.
\n\n## Prompt G (Language Foundation)\nImplemented lightweight local-first multilingual UI foundation supporting English, Odia, and Hindi. Translates high-visibility student-facing surfaces with English fallback. User-generated content is strictly untranslated.\n