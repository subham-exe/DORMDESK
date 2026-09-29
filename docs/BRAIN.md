# BRAIN.md

## 1. Project Identity
**Product Name:** DormDesk
**Tagline:** One Platform. Every Campus Operation. Every Level.
**Context:** BPUT Hackathon 2026, Problem Statement 07 ("Attendance, Mess, Hostel, Repeat: Campus Life, Debugged").

## 2. Problem Statement
Campus operations are fragmented across paper applications, WhatsApp groups, disconnected apps, and office counters. This causes requests to get lost, students to lack tracking visibility, and administrators to miss institution-wide operational patterns.
**Objective:** Create a unified campus operations platform that turns everyday requests into accountable, intelligent, and trackable workflows.
**Core Principle:** "We don't digitize campus paperwork. We digitize campus accountability."

## 3. Product Vision
DormDesk is a campus-wide operations platform, not just a hostel management app. The architecture revolves around a **Universal Request Engine** where every operational request follows a standardized path of identity, permission, routing, SLA, and audit. Day scholars and hostel residents use the same application, encountering only the services relevant to their context.

## 4. Current Implementation Status
**CURRENT STATE:** PARTIAL MVP IMPLEMENTATION.
**IMPLEMENTED:**
- **Universal Request Engine:** Core `RequestEngine` service and SQLite schema power the system.
- **Request Lifecycle/State Machine:** Strict deterministic backend state machine enforces transitions.
- **Zero-Touch Approval:** Hardcoded leave policy automatically approves short leaves.

**PROTOTYPE / PARTIAL:**
- **Student Verification:** The verification state exists in the workflow model, and the student portal allows verifying resolved requests (which triggers auto-close).
- **SLA Tracking:** SLA targets are calculated and visualized. The system includes an interactive Admin "Run SLA check" capability, though an automated background cron is still planned.

**BACKEND PRIMITIVE / NOT FULLY IMPLEMENTED:**
- **Incident Clustering:** The `clusterIntoIncident` primitive exists in the service, but automatic detection and UI triggers are not yet implemented.

**PLANNED / NOT IMPLEMENTED:**
- Automatic Incident Intelligence and "Me Too" UX (Implemented via Prompt I and Prompt K).
- Automatic SLA escalation (Implemented via Prompt K).
- Recurring issue detection.
- Operations Command Center (Admin Dashboard).
- Configurable workflows.
- Full offline/PWA behavior and kiosk workflows.

## 5. Technical Architecture Overview
(See `architect.md` for full technical details)
- **Frontend & Backend:** Next.js (full-stack API routes, modular monolith).
- **Database:** SQLite with Prisma ORM. SQLite is the primary hackathon database.
- **Hosting:** Local host (laptop) is the primary reliable hackathon demo architecture. Public internet deployment is purely optional. Users connect via local Wi-Fi/LAN.
- **Cost Constraint:** ₹0 Budget. No paid services (e.g., SMS, AI, paid DBs) are mandatory dependencies.

## 6. User Types and Authority Model
Authority is NOT a strict linear hierarchy. It uses **Role + Domain + Scope + Permission**. Authorization is strictly server-side.
- **Domains:** Academic (HOD, Faculty), Administration (Admin), Finance (Accounts), Hostel (Warden, Staff), Facilities (Maintenance).
- **Identity:** One Person = One Identity. Duplicate accounts are not needed for multiple contexts.

## 7. Universal Request Engine
The core of DormDesk. Complaints, gate passes, certificates, and feedback are all rows in a single Request table, not separate disconnected systems.
**Lifecycle:**
PENDING -> ASSIGNED -> ACKNOWLEDGED -> PROCESSING -> RESOLVED -> VERIFIED -> CLOSED (Plus APPROVED/REJECTED for Zero-Touch)
Exceptions such as reject, cancel, reopen, escalate, and auto-approve are valid workflow transitions.
- **SLA & Escalation Engine:** Currently calculates and visualizes SLA targets (PLANNED for automatic escalation).
- **Zero-Touch Auto-Approval:** Limited hardcoded logic (e.g. Leave <= 2 days) auto-approves requests. Configurable policies are PLANNED.

## 8. Incident Intelligence (Major Differentiator - PLANNED)
The vision is for DormDesk to cluster multiple related complaints into a single **Incident**.
Example: 12 students report "no water" -> Same category, same location -> ONE INCIDENT (#WTR-042).
*Current Truth:* A backend primitive exists for this (`clusterIntoIncident`), but automatic clustering and student "Me Too" joining UX are PLANNED.

## 9. Core Workflows
1. **Hostel Complaint / Maintenance:** Includes duplicate detection and a "me too" Nudge button.
2. **Leave / Gate-Pass:** Request → Validation → Approval Chain → Digital Pass/QR Generation. 
3. **Certificate Request:** Student request → Verification → Admin approval (or auto-issue) → Certificate generation with QR verification link.
4. **Scholarship Status Tracking:** Student visibility into current academic year scholarship lifecycle (Eligible → Applied → Submitted → Under Verification → Approved → Sanctioned → Disbursed).
5. **Thin Modules (Breadth):** Lightweight services running on the same engine (e.g., Notices, Timetable, read-only Attendance).

## 10. Admin Command Center
Dashboard focused on operational health and friction reduction.
- **Metrics:** Pending count, ageing buckets, SLA breaches, staff workload.
- **Intelligence:** Recurring issue detection (e.g., flagging repeated Wi-Fi failures).

## 11. Notifications
One centralized notification service. Targeted, event-driven announcements rather than global broadcasts. Tracks sent/delivered/read/acknowledged statuses purely in-app. External delivery channels (SMS/WhatsApp) are explicitly out of scope.

## 12. Accessibility / Reality Layer
- **PWA / Browser-First:** No app store installation required.
- **Low-Bandwidth:** Lightweight UI, IndexedDB for offline request queue where required (syncs when connection returns).
- **No-Smartphone Fallback (Assisted Filing):** Staff can log a request on behalf of a student using their Student ID.

## 13. AI / Intelligence Philosophy
**Optional Assistive Layer:** AI supports operational workflows but does not drive them. No mandatory paid AI APIs.
Current core request workflows use deterministic rules. Intelligence capabilities such as incident detection, semantic similarity, recurring-pattern detection, and operational insights remain planned/prototyped.
No generic AI chatbots are required for core workflows.

## 14. Data Model
- **User:** One identity, multiple contexts (Role, Scope).
- **Request:** The unified table for all operational requests.
- **Incident:** Groups multiple Requests.
- **AuditLog:** Server-side timestamped record of every critical action.

## 15. Demo Strategy
The local demo must remain possible without internet. 
- Show an offline or low-bandwidth test.
- Demonstrate a student filing a complaint.
- Advance a simulated clock to trigger a live SLA breach and escalation.
- Resolve an incident and show affected-student notification.

## 16. Documentation Location
All canonical project documentation is stored under `/docs`.
Before starting implementation, agents must read the relevant documents from `/docs`, including:
- `docs/BRAIN.md`
- `docs/architect.md`
- `docs/TEAM.md`
- `docs/plan.md`
- `docs/roadmap.md`
- `docs/PRD.md`
- `docs/RULES.md`
- the relevant role document
- `docs/setup.md` when environment/setup context is needed

Do not assume these documents exist at repository root.

## 17. Iteration Logging
After each implementation iteration, agents must update:
- `logs.md`
- `state.md`
- `task.md`

These files must reflect:
- what was completed
- what remains
- current blockers
- the next actionable step

Do not modify canonical planning documents merely to record implementation progress.
## Prompt G — Multilingual UI

Status: CLOSED

Final implementation:
d823d74ffbbd4dd9ad3e7b028dec40789443033a

Supported languages:
- English
- Hindi
- Odia

Translated student-facing surfaces:
- Student Dashboard
- Student Navigation / Sidebar
- Requests
- Notices
- Mess Menu
- Attendance
- System Status Badges

Behavior:
- English is the default language.
- Language preference is stored locally using `dormdesk_lang`.
- Invalid/corrupt stored language values fall back to English.
- Missing dictionary keys fall back to English.
- User-generated/database content is not automatically translated.
- Stored database/status enum values are unchanged.
- No external translation API is required.
- No database schema changes were made.

Closure correction:
- The initial Prompt G implementation contained accidental English clones in portions of the Hindi and Odia dictionaries.
- This was detected during closure audit.
- The affected Hindi/Odia dictionary entries were corrected in the final G closure commit.

Validation:
- Tests: 74/74 PASS
- TypeScript: PASS
- ESLint: PASS
- Production build: PASS
- Browser verification: NOT independently performed
- Temporary artifacts: none

Prompt H:
CLOSED\n\n## Prompt H � Offline Sync\nDORMDESK supports resilient offline submission for selected student requests. Requests are queued locally (IndexedDB) and synchronized with the server when connectivity returns, using server-side idempotency protection.\n## Prompt I � Operations Command Center & Incident Intelligence\nImplemented a deterministic IncidentIntelligenceService that auto-clusters requests by category and location within a 24h window. The admin dashboard (Command Center) aggregates active workload, SLA breaches/warnings, stale requests, and high-impact incidents using explainable algorithms (request count, user count, and priority weight). An incident detail view exposes the grouping reasoning and impact formulation.\n\nPrompt I:\nCLOSED\n

## Policy Engine (Prompt J)
- **PolicyService**: Provides deterministic policy evaluation for requests based on type, category, and domain.
- **Precedence**: Specific category + request type > Category > Request Type > Domain > Default.
- **Separation of Concerns**: PolicyService handles *configuration* (SLA targets, auto-approval rules). SLAService handles *state* (calculating remaining time). RequestEngine handles *mutation*.
- **Offline Considerations**: The server remains authoritative. Offline-created requests evaluate policy only upon sync.

 # #   P r o m p t   K   S t a t u s 
 P r o m p t   K :   C L O S E D 
 N o t i f i c a t i o n   a n d   E s c a l a t i o n   I n t e l l i g e n c e   s u c c e s s f u l l y   i m p l e m e n t e d ,   t e s t e d ,   a n d   a u d i t e d . 
 
 
 # #   P r o m p t   L   S t a t u s 
 P r o m p t   L :   I M P L E M E N T E D   -   C L O S U R E   A U D I T   R E Q U I R E D 
 C o n f i g u r a b l e   P o l i c y   A d m i n i s t r a t i o n   l a y e r   h a s   b e e n   a d d e d .   V a l i d a t i o n s ,   t i e - b r e a k i n g ,   C R U D   U I ,   s i m u l a t i o n   c a p a b i l i t y ,   a n d   t i e - b r e a k i n g   a l g o r i t h m s   a r e   i m p l e m e n t e d . 
 
 
 # #   P r o m p t   M   S t a t u s 
 P r o m p t   M :   I M P L E M E N T E D   -   C L O S U R E   A U D I T   R E Q U I R E D 
 O p e r a t i o n s   C o m m a n d   C e n t e r   2 . 0   h a s   b e e n   b u i l t   a t   / a d m i n / c o m m a n d - c e n t e r ,   a g g r e g a t i n g   S L A ,   i n c i d e n t s ,   e s c a l a t i o n s ,   u n a s s i g n e d   r e q u e s t s ,   s t a l e   r e q u e s t s ,   a n d   a c t i v i t y   l o g   w i t h o u t   d u p l i c a t i n g   b a c k e n d   l o g i c . 
 
 
## Prompt N Status
Prompt N: CLOSED
Accessibility and PWA hardening pass complete. Service worker secured against auth leakage, offline page added, UI layout responsive fixed, keyboard navigation improved, semantic markup verified.

## Prompt O Status
Prompt O: CLOSED
Demo seeded properly with deterministic incidents, SLAs, and escalations. Reset mechanism works via npx prisma db seed.

## Prompt P Status
Prompt P: IMPLEMENTED - CLOSURE AUDIT REQUIRED
Security audit fixed a student state escalation path. Regression checked. Demo freeze established.
