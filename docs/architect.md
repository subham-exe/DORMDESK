# ARCHITECTURE.md

# Campus Life / DormDesk

## Technical Architecture & Engineering Baseline

> **Status:** Technical baseline\
> **Budget:** ₹0\
> **Primary goal:** Reliable hackathon demo with a real end-to-end
> campus operations platform\
> **Architecture principle:** Keep the core simple, local-first,
> replaceable, and demonstrable.

------------------------------------------------------------------------

## 1. Purpose

This document is the technical source of truth for the Campus Life /
DormDesk implementation.

It defines:

-   application architecture
-   technology choices
-   database strategy
-   request/workflow architecture
-   authentication and authorization boundaries
-   local/demo deployment
-   offline strategy
-   team ownership
-   engineering rules
-   scope boundaries

If another document conflicts with this one, the team must stop and
resolve the conflict before implementing the affected area.

------------------------------------------------------------------------

# 2. Core Product Architecture

Campus Life is **one campus operations platform**, not a collection of
separate mini-apps.

The central architectural idea is:

``` text
ONE IDENTITY
     +
ONE PERMISSION MODEL
     +
ONE REQUEST ENGINE
     +
ONE NOTIFICATION SYSTEM
     +
ONE AUDIT SYSTEM
     +
ONE ADMIN COMMAND CENTER
```

Different campus services use the same operational foundation.

Examples:

-   hostel complaint
-   maintenance request
-   leave request
-   gate pass
-   certificate request
-   notice / communication
-   future campus services

The business rules differ, but the underlying request infrastructure is
shared.

------------------------------------------------------------------------

# 3. High-Level Architecture

``` text
                    DORMDESK
                       |
             UNIVERSAL REQUEST ENGINE
                       |
       +---------------+---------------+
       |               |               |
     HOSTEL         ACADEMIC       FACILITIES
       |               |               |
       +---------------+---------------+
                       |
                 SMART ROUTING
                       |
                 POLICY ENGINE
                       |
                   SLA ENGINE
                       |
              INCIDENT INTELLIGENCE
                       |
            RESOLUTION + EVIDENCE
                       |
             STUDENT VERIFICATION
                       |
            RECURRING ISSUE DETECTION
```

### Important rule

The frontend **never talks directly to SQLite**.

All database access goes through the server-side application and Prisma.

------------------------------------------------------------------------

# 4. Technology Stack

## 4.1 Core stack

  -----------------------------------------------------------------------
  Layer                   Technology              Reason
  ----------------------- ----------------------- -----------------------
  Frontend                Next.js + TypeScript    Full-stack web app with
                                                  one codebase

  UI                      React + Tailwind CSS    Fast development and
                                                  responsive UI

  Backend                 Next.js server/API      Avoid separate backend
                          layer                   deployment

  ORM                     Prisma                  Typed database access
                                                  and migrations

  Database                SQLite                  ₹0, simple, local,
                                                  reliable for prototype

  Authentication          Application-managed     No paid auth provider
                          auth

  PWA                     Web App Manifest +      Installable and
                          Service Worker          low-bandwidth capable

  Offline storage         IndexedDB               Queue/cache
                                                  browser-side data

  QR                      Open-source browser QR  No paid scanner service
                          library

  Charts                  Open-source chart       Admin analytics
                          library

  Source control          Git + GitHub            Free collaboration

  Hosting                 Local host first        Zero-cost and
                                                  offline-capable

  Public deployment       Optional                Only if a genuinely
                                                  free reliable setup is
                                                  available
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 5. Zero-Budget Rule

The project must not depend on paid infrastructure.

## Allowed

-   open-source libraries
-   GitHub
-   local SQLite
-   local laptop hosting
-   local Wi-Fi / hotspot
-   browser APIs
-   free hosting if it remains genuinely free and reliable
-   seeded demo data
-   simulated integrations

## Not required

-   paid cloud database
-   paid authentication service
-   paid AI API
-   paid SMS gateway
-   paid email service
-   paid WhatsApp API
-   paid monitoring service
-   paid maps API

### Rule

If a feature requires money to work, it must not become a critical
dependency of the demo.

------------------------------------------------------------------------

# 6. Database Architecture

## 6.1 Primary database

The hackathon baseline is:

``` text
SQLite
   |
Prisma
   |
campus.db
```

SQLite is sufficient for the expected prototype/demo workload.

The database is accessed only through Prisma.

------------------------------------------------------------------------

## 6.2 Local host architecture

One laptop can act as the application server during the demo.

``` text
                 LOCAL WI-FI / HOTSPOT
                         |
          +--------------+--------------+
          |              |              |
        Phone          Phone          Laptop
          |              |              |
          +--------------+--------------+
                         |
                    Host Laptop
                         |
                 Next.js Application
                         |
                       Prisma
                         |
                      SQLite
```

A user only needs a browser.

They do **not** need:

-   Node.js
-   Prisma
-   SQLite
-   the repository
-   direct database access

------------------------------------------------------------------------

## 6.3 Local access

The host application may be exposed on the local network using the host
machine's LAN IP.

Example:

``` text
http://192.168.x.x:3000
```

A QR code can point to the local application URL for easier access
during a demo.

The exact IP must not be hard-coded into application business logic.

------------------------------------------------------------------------

# 7. Development vs Demo Environment

## Development

Every developer may use their own local database.

``` text
Developer 1 → local SQLite
Developer 2 → local SQLite
Developer 3 → local SQLite
Developer 4 → local SQLite
```

This prevents developers from corrupting a shared database during
development.

## Integration / Demo

One designated laptop becomes the integration host.

``` text
                    GitHub
                       |
                 Integration
                    Laptop
                       |
              Next.js + Prisma
                       |
                   campus.db
                       |
              Demo users / judges
```

The demo database is seeded from code.

Required commands should include equivalents of:

``` bash
npm run db:setup
npm run db:seed
npm run db:reset
```

The exact scripts may change during implementation, but database reset
and deterministic seeding are mandatory.

------------------------------------------------------------------------

# 8. Data Model

The following entities form the architectural baseline.

## Identity and access

``` text
User
Role
Permission
UserRole
Domain
Department
```

## People and context

``` text
StudentProfile
StaffProfile
Hostel
Block
Room
```

## Operational engine

``` text
Request
RequestType
RequestAssignment
Approval
SLA
Incident
IncidentRequest
```

## Communication

``` text
Notification
Announcement
AnnouncementAudience
NotificationDelivery
```

## Accountability

``` text
AuditLog
Feedback
```

Additional tables may be introduced when required by an approved
workflow.

Do not create separate database architectures for each module.

------------------------------------------------------------------------

# 9. Unified Request Engine

The request engine is the core of the system.

Every operational request should follow a common lifecycle.

``` text
CREATE
  ↓
PENDING (or APPROVED if Leave <= 2 days)
  ↓
ASSIGN
  ↓
ACKNOWLEDGE
  ↓
PROCESS
  ↓
RESOLVE
  ↓
VERIFY
  ↓
CLOSE (Auto-triggered upon VERIFY) (Auto-triggered upon VERIFY)
```

Exceptions such as rejection, cancellation, reopening, escalation, and
auto-approval are handled as valid state transitions.

------------------------------------------------------------------------

## 9.1 Common request fields

Conceptually:

``` text
Request
├── id
├── ticketNumber
├── requestType
├── category
├── requester
├── requesterContext
├── description
├── location
├── priority
├── status
├── assignedDepartment
├── assignedAuthority
├── SLA
├── dueAt
├── createdAt
├── updatedAt
├── resolvedAt
└── auditHistory
```

The exact Prisma schema is owned by Backend 1 + Backend 2.

------------------------------------------------------------------------

# 10. Incident Model

A major product differentiator is that repeated complaints can represent
one underlying incident.

Example:

``` text
Student A → "No water in Hostel B"
Student B → "No water in Hostel B"
Student C → "No water in Hostel B"
Student D → "No water in Hostel B"
```

Instead of creating four unrelated operational problems:

``` text
Incident: Hostel B water outage
        |
        +-- Request A
        +-- Request B
        +-- Request C
        +-- Request D
```

The incident becomes the operational object.

The system can track:

-   number of affected students
-   responsible team
-   current status
-   SLA
-   escalation
-   resolution
-   notifications to affected users

------------------------------------------------------------------------

# 11. Authority and Permission Model

Do **not** hard-code one universal hierarchy such as:

``` text
Principal → HOD → Professor → Warden
```

Academic and campus operations are parallel domains.

Use:

``` text
Role
+
Domain
+
Scope
+
Permission
```

Examples:

``` text
Principal
  domain: institution
  scope: institution-wide

Warden
  domain: hostel
  scope: assigned hostel

Faculty
  domain: academic
  scope: assigned department / classes

Maintenance Staff
  domain: facilities
  scope: assigned facilities

Accounts Staff
  domain: finance
  scope: finance operations
```

Permissions must be enforced server-side.

Frontend hiding is not authorization.

------------------------------------------------------------------------

# 12. Multi-Role Identity

One person should have one account.

Roles and contexts belong to that identity.

Example:

``` text
User
├── Role: Teacher
├── Resident: Yes
├── Hostel: A
└── Room: A104
```

The same user may therefore:

-   perform teacher actions
-   submit a hostel complaint
-   receive resident notices

Do not create duplicate accounts merely because a person has multiple
contexts.

------------------------------------------------------------------------

# 13. Workflow Architecture

## 13.1 Workflow 1: Hostel Complaint / Maintenance

``` text
Student
   ↓
Submit issue
   ↓
Classify
   ↓
Duplicate / similar issue check
   ↓
Match existing incident OR create incident
   ↓
Route
   ↓
Assign
   ↓
SLA starts
   ↓
Acknowledge
   ↓
In progress
   ↓
Resolve
   ↓
Student verifies
   ↓
Close
```

Required capabilities:

-   location
-   category
-   priority
-   assignment
-   SLA
-   escalation
-   status timeline
-   duplicate prevention / "me too"
-   audit history

------------------------------------------------------------------------

# 14. Workflow 2: Leave / Gate Pass

``` text
Student
   ↓
Submit request
   ↓
Validate
   ↓
Check policy
   ↓
Approval / auto-approval
   ↓
Notify
   ↓
Generate digital pass
   ↓
QR verification
   ↓
Audit
```

The QR verification page must be lightweight.

It should not expose unnecessary student information.

------------------------------------------------------------------------

# 15. Workflow 3: Certificate Request

``` text
Student
   ↓
Request certificate
   ↓
Validate eligibility
   ↓
Policy check
   ↓
Auto-issue OR route to authority
   ↓
Approve / reject
   ↓
Certificate ready
   ↓
Notify student
```

A certificate may contain:

``` text
Certificate ID
QR
Issue date
Certificate type
Verification endpoint
```

The public verification page should reveal only the minimum information
required for verification.

------------------------------------------------------------------------

# 16. Notification Architecture

There must be **one notification service**.

Modules must not implement their own unrelated notification systems.

Notifications may be triggered by:

``` text
Request created
Request assigned
Status changed
Approval required
Approved
Rejected
SLA warning
SLA breached
Escalated
Resolved
Reopened
Announcement published
```

Primary channel:

``` text
In-app notification
```

Optional:

``` text
PWA/browser notification
```

External delivery channels (SMS/WhatsApp) are explicitly out of scope.

------------------------------------------------------------------------

# 17. Communication / Notice Engine

Announcements must support targeting.

Possible targeting dimensions:

``` text
Institution
Department
Branch
Year
Batch
Hostel
Block
Role
```

The system should track:

``` text
Sent
Delivered
Read
Acknowledged
Action completed
```

This is a platform service, not a separate messaging application.

------------------------------------------------------------------------

# 18. SLA and Escalation

Every applicable request should be capable of having:

``` text
SLA duration
Due time
Warning threshold
Escalation target
```

Example:

``` text
SLA = 6 hours

0h       Created
4.5h     Warning
6h       Breach
6h+      Escalation
```

For the hackathon demo, a **simulated demo clock** should allow SLA
warnings and breaches to be shown without waiting real hours.

------------------------------------------------------------------------

# 19. Audit Trail

Sensitive and operational actions must be auditable.

Examples:

``` text
Request created
Assignment changed
Priority changed
Status changed
Approval performed
SLA changed
Incident linked
Incident resolved
Certificate issued
User permission changed
```

Each audit event should record at minimum:

``` text
actor
action
entity
entityId
timestamp
metadata
```

The audit system must be server-generated.

A client must not be able to claim:

``` text
"admin approved this"
```

without the server recording the action.

------------------------------------------------------------------------

# 20. Authentication

Authentication must remain application-managed unless a genuinely free
external provider is later approved.

The system must support seeded demo accounts for:

``` text
Student
Faculty
Warden
Maintenance Staff
Admin
Principal / Institution Admin
```

Passwords, sessions, tokens, and secrets must never be hard-coded into
source control.

For the hackathon, demo credentials may be documented separately from
production secrets.

------------------------------------------------------------------------

# 21. Offline / Poor Connectivity Strategy

The brief requires support for low-bandwidth and poor connectivity.

The application should be designed as a PWA.

## Online

``` text
Browser
 ↓
Next.js
 ↓
API
 ↓
SQLite
```

## Temporary offline

``` text
Browser
 ↓
IndexedDB
 ↓
Offline action queue
 ↓
Connection restored
 ↓
Sync
```

The first offline implementation should prioritize:

-   viewing cached essential information
-   creating a request
-   storing the request locally
-   syncing when connectivity returns

Do not attempt a giant distributed offline database.

Build only what the demo and requirement need.

------------------------------------------------------------------------

# 22. Low-End Device Strategy

The UI should prioritize:

-   small payloads
-   responsive layouts
-   simple components
-   limited animations
-   compressed assets
-   lazy loading
-   readable typography
-   touch-friendly controls
-   minimal network requests

A user on a basic Android phone should still be able to:

``` text
Login
View requests
Create a request
Track a request
Read notices
View approvals
```

------------------------------------------------------------------------

# 23. No-Smartphone / Assisted Access

The system should support staff-assisted filing.

Example:

``` text
Student without smartphone
        ↓
Warden / Office Staff
        ↓
"File on behalf of student"
        ↓
Request created
        ↓
Student identity recorded
```

This is preferable to making the entire platform depend on smartphone
ownership.

------------------------------------------------------------------------

# 24. API / Service Boundaries

Do not create microservices.

This is a **modular monolith**.

Recommended logical services:

``` text
authService
userService
requestService
routingService
incidentService
approvalService
slaService
notificationService
announcementService
auditService
analyticsService
```

These are code-level service boundaries inside one Next.js application.

They are not separate servers.

------------------------------------------------------------------------

# 25. Frontend Architecture

The main application is a Next.js App Router monolith (`src/app`). Frontend components operate strictly as Client Components (`"use client"`) leveraging REST fetches to Next.js API Routes (`/api/requests`). A separate React+Vite prototype (`dormdesk-prototype`) exists for isolated UI iteration but is not part of the production build.



Recommended conceptual structure:

``` text
app/
components/
features/
  auth/
  requests/
  incidents/
  approvals/
  certificates/
  gate-pass/
  notices/
  admin/
lib/
services/
types/
```

The exact directory structure can evolve.

The important rule is:

**feature code should consume service APIs rather than directly reaching
into the database.**

------------------------------------------------------------------------

# 26. Backend Architecture

Recommended conceptual structure:

``` text
API route
   ↓
Validation
   ↓
Service
   ↓
Business rule
   ↓
Prisma
   ↓
SQLite
```

Do not put complex business logic directly into route handlers.

Example:

``` text
POST /api/requests
        ↓
requestService.createRequest()
        ↓
validate
        ↓
classify
        ↓
route
        ↓
calculate SLA
        ↓
create request
        ↓
create audit event
        ↓
create notification
```

------------------------------------------------------------------------

# 27. Validation

All important server endpoints must validate:

-   authentication
-   authorization
-   input shape
-   allowed state transitions
-   ownership / scope
-   required fields
-   duplicate conditions

Never trust:

-   hidden frontend fields
-   client-side role values
-   client-side user IDs
-   client-side status transitions
-   client-generated audit claims

------------------------------------------------------------------------

# 28. Security Baseline

Minimum requirements:

-   server-side authorization
-   password hashing
-   secure session handling
-   environment variables for secrets
-   no secrets in Git
-   input validation
-   output escaping where required
-   least-privilege data access
-   audit logging
-   rate limiting for sensitive actions where practical
-   no unnecessary personal data exposure

The demo should use fictional/seeding data.

------------------------------------------------------------------------

# 29. Demo Architecture

The demo must be able to operate without internet.

## Primary demo

``` text
Host Laptop
   |
   +-- Next.js
   +-- Prisma
   +-- SQLite
   +-- Seeded data
   |
Local Wi-Fi / Hotspot
   |
   +-- Judge phone
   +-- Team phone
   +-- Team laptop
```

## Public demo

If a reliable free deployment is available:

``` text
Internet
   ↓
Public URL
   ↓
Same application
```

Public deployment is optional.

The local demo must remain functional regardless of public hosting.

------------------------------------------------------------------------

# 30. Demo Failure Strategy

If internet fails:

``` text
Switch to local host.
```

If public hosting fails:

``` text
Use local host.
```

If venue Wi-Fi fails:

``` text
Host laptop creates hotspot.
```

If the database becomes corrupted:

``` text
Reset and reseed.
```

If the host laptop fails:

``` text
Move the repository + seeded database to backup laptop.
```

If the live demo still fails:

``` text
Use recorded walkthrough as final fallback.
```

------------------------------------------------------------------------

# 31. Seed Data

The system must have deterministic seed data.

Seed data should demonstrate:

-   active requests
-   overdue requests
-   resolved requests
-   recurring incidents
-   multiple departments
-   multiple hostels
-   different roles
-   different request priorities
-   approval chains
-   notification activity
-   realistic workload distribution

The Operations Command Center must not look empty.

Do not use fake numbers that claim to represent a real college.

Clearly treat seed data as demonstration data.

------------------------------------------------------------------------

# 32. Admin Command Center

The Operations Command Center should surface actionable information.

Minimum metrics:

``` text
Open Requests
Overdue Requests
SLA Compliance
Average / Median Resolution Time
Active Incidents
Affected Students
Recurring Issues
Staff Workload
```

Every important metric should connect to an action.

Example:

``` text
12 overdue requests
        ↓
View overdue
        ↓
Filter
        ↓
Assign / escalate
```

Avoid decorative dashboards that provide no operational action.

------------------------------------------------------------------------

# 33. AI Policy

AI is completely out of scope for the current MVP. The current implementation relies 100% on deterministic rules (e.g., hardcoded auto-approvals) and manual interventions. Intelligence layers are planned for future phases.

The core product must work without external AI APIs.

First preference:

``` text
Rules
↓
Deterministic classification
↓
Similarity / clustering
↓
Optional AI suggestion
```

AI may suggest:

-   category
-   priority
-   routing
-   similar incident

AI must not silently make high-impact decisions.

The final authority remains the configured workflow and authorized
human.

------------------------------------------------------------------------

# 34. QR Policy

QR codes are useful for:

-   room identification
-   gate passes
-   certificate verification
-   quick request entry

QR generation and scanning must use free/open-source browser-compatible
libraries.

A QR code must never be treated as a security boundary by itself.

The server must validate:

``` text
ID
status
expiry
authorization
```

------------------------------------------------------------------------

# 35. File / Attachment Policy

Attachments are not allowed to become a paid infrastructure dependency.

For the hackathon:

-   keep attachments small
-   validate file type and size
-   use local/demo storage where possible
-   avoid building a complicated media-storage system

Attachments are secondary to the operational workflow.

------------------------------------------------------------------------

# 36. Team Architecture Ownership

## Backend 1

Owns:

-   Prisma schema
-   database models
-   migrations
-   seed data
-   identity
-   roles
-   permissions
-   organization structure

## Backend 2

Owns:

-   request engine
-   routing
-   assignments
-   approvals
-   SLA
-   escalation
-   incidents
-   notifications
-   audit

## Frontend 1

Owns:

-   authentication screens
-   student dashboard
-   request creation
-   request tracking
-   notifications
-   leave / gate pass
-   certificate request

## Frontend 2

Owns:

-   staff dashboard
-   admin command center
-   request queue
-   incident management
-   workload views
-   analytics
-   administrative actions

## Designer

Owns:

-   design system
-   typography
-   spacing
-   component appearance
-   responsive behavior
-   status states
-   dashboard visual hierarchy
-   accessibility presentation

## Overseer / Product Lead

Owns:

-   architecture decisions
-   scope control
-   integration
-   cross-team contracts
-   QA
-   demo flow
-   final acceptance
-   documentation

No one owns a feature in isolation.

A feature is complete only when its frontend, backend, data,
permissions, and demo flow work together.

------------------------------------------------------------------------

# 37. Implementation Order

Do not build the project in random feature order.

## Phase 1: Foundation

``` text
Repository
↓
Next.js
↓
TypeScript
↓
Tailwind
↓
Prisma
↓
SQLite
↓
Environment setup
```

## Phase 2: Data + Identity

``` text
Schema
↓
Seed data
↓
Authentication
↓
Roles
↓
Permissions
↓
Scopes
```

## Phase 3: Request Engine

``` text
Request model
↓
Lifecycle
↓
Assignment
↓
Routing
↓
SLA
↓
Audit
```

## Phase 4: First vertical slice

Build the complete hostel complaint workflow.

Do not move on until:

``` text
Student → Request → Staff → Resolution → Student
```

works end-to-end.

## Phase 5: Additional workflows

``` text
Gate Pass / Leave
Certificate
```

## Phase 6: Platform features

``` text
Notifications
Announcements
Incident clustering
Admin analytics
```

## Phase 7: Accessibility

``` text
PWA
Offline queue
Lite mode
Assisted filing
```

## Phase 8: Demo hardening

``` text
Seed data
Demo clock
Failure recovery
Local network testing
Mobile testing
Role testing
Full walkthrough
```

------------------------------------------------------------------------

# 38. Engineering Rules

### Rule 1

Do not build a separate backend for every module.

### Rule 2

Do not create a separate database for every module.

### Rule 3

Do not allow frontend-only authorization.

### Rule 4

Do not make external APIs mandatory for core workflows.

### Rule 5

Do not add a feature just because it sounds impressive.

### Rule 6

Every workflow must have a visible end state.

### Rule 7

Every operational request must have an owner.

### Rule 8

Every important operational action must be auditable.

### Rule 9

Every demo-critical workflow must work locally.

### Rule 10

Do not modify the core architecture without updating this document and
the project brain.

------------------------------------------------------------------------

# 39. Definition of Architecture-Ready

The architecture is considered ready when:

-   [ ] repository structure is initialized
-   [ ] Next.js application runs
-   [ ] Prisma is configured
-   [ ] SQLite database initializes
-   [ ] seed command works
-   [ ] authentication strategy is implemented
-   [ ] role / permission model exists
-   [ ] request model exists
-   [ ] request lifecycle is defined
-   [ ] audit logging exists
-   [ ] local network access works
-   [ ] one phone can access the host laptop
-   [ ] one complete request workflow works end-to-end
-   [ ] database reset is reproducible

Only after this should the team aggressively expand UI/features.

------------------------------------------------------------------------

# 40. Final Architecture

``` text
                         CAMPUS LIFE
                              |
                         WEB / PWA
                              |
                    +---------+---------+
                    |                   |
                 STUDENT              STAFF
                    |                   |
                    +---------+---------+
                              |
                         NEXT.JS APP
                              |
                    +---------+---------+
                    |                   |
                 FRONTEND            SERVER
                                        |
                              +---------+---------+
                              |         |         |
                           AUTH     REQUESTS   NOTIFY
                              |         |         |
                              |     INCIDENTS   AUDIT
                              |         |         |
                              +---------+---------+
                                        |
                                      PRISMA
                                        |
                                      SQLITE
                                        |
                                    campus.db
```

### The non-negotiable idea

**The database location may change. The operational architecture should
not.**

Today:

``` text
Next.js → Prisma → SQLite
```

Later, if needed:

``` text
Next.js → Prisma → PostgreSQL
```

The product remains the same.

------------------------------------------------------------------------

## Architecture mantra

> **one app. one identity. one request engine. one source of truth. zero
> paid dependencies. local-first demo.**

## STABILIZATION ADDENDUM (Fix 11)

### Request Lifecycle Updates
- The
esolvedAt timestamp is strictly set to
ew Date() when a request enters a terminal state (RESOLVED, APPROVED, CANCELLED, REJECTED, CLOSED).
- If a request transitions backwards from a terminal state to a Work-in-Progress (WIP) state (PROCESSING, ASSIGNED, ACKNOWLEDGED), the
esolvedAt timestamp is automatically cleared (
ull).
- SLA calculation halts as long as the request is in any terminal or resolved state (RESOLVED, VERIFIED, CLOSED, REJECTED, APPROVED, CANCELLED).

### Implemented RBAC Roles
- **Admin:** Universal access (domain: Any, scope: Any).
- **Warden:** Can manage requests and incidents in their hostel (domain: Request, Incident, User, scope: Hostel, Own).
- **Faculty:** Can view/process department requests (domain: Request, User, scope: Department, Own).
- **Staff:** Can manage requests and scholarships (domain: Request, Incident, Scholarship, scope: Department, Own, Any).
- **Student:** Can only manage their own data (domain: Request, Scholarship, User, scope: Own).
- **Rule:** Students are strictly forbidden from rejecting requests.

### Audit & Notification Hooks
- **Zero-Touch Auto-Approval:** Leave requests of <= 2 days bypass PENDING directly to APPROVED, logging an AUTO_APPROVED audit event.
- **Auto-Close:** Transitioning a request to VERIFIED automatically chains a system transition to CLOSED, accompanied by the audit note 'System: Auto-closed after verification'.
- **Status Change:** Status transitions trigger an audit event STATUS_CHANGED and an in-app notification STATUS_CHANGED_{newStatus} to the requester.

## Q2.3 Addendum: Accountability & Timeline
- **Request Accountability:** Request lifecycle history is now explicitly modeled via \RequestStatusHistory\ and \RequestAssignment\.
- **Authoritative Timeline:** The Request timeline exposed via API is generated securely on the backend by chronologically merging explicit history relations and audit log anomalies, guaranteeing UI consistency without client-side fuzzy parsing.
- **Audit Distinctness:** The \AuditLog\ focuses on immutability (capturing actor identity strings) and system-wide security, while Request-specific histories focus on operational workflow. Both serve complementary, distinct purposes.
- **Security:** Clients cannot directly write history; all history is securely generated via \RequestEngine\ lifecycle mutations.


## Q2.4 Addendum: SLA & Incident Persistence
- **SLA Persistence Authority:** The \SLAService\ is explicitly authoritative over the \RequestSLA\ database record. Warning and Breach times are now securely and deterministically pushed directly into the model rather than relying solely on ephemeral calculations.
- **Timestamp Synchronicity:** When a \Request\ is created, its top-level \dueAt\ is strictly locked and synchronized with the newly minted \RequestSLA.dueAt\ to prevent silent target divergence.
- **Deterministic Incident Groupings:** Incidents strictly group using exact matching (\category\ + \location\ in last 24h) via \IncidentIntelligenceService\. Deleting an incident safely detaches requests without causing a destructive cascade. ML/Embeddings remain strictly prohibited.


## Q2.5 Addendum: Idempotency & Database Constraints
- **Database Authority:** The \@unique\ index on \Request.idempotencyKey\ serves as the absolute authority on preventing duplicated operational records.
- **Race Condition Resolution:** The system anticipates duplicate concurrent requests (such as a retried offline-queue network packet). If \RequestEngine.createRequest\ encounters a \P2002\ unique violation specific to \idempotencyKey\, it cleanly catches the exception, resolving and returning the initial Request instance natively.
- **Side Effect Atomicity:** Audit logs and asynchronous Notification events reside downstream of the \prisma.request.create\ step to definitively eliminate side-effect duplication during a concurrency race failure.


## Q2.6 Addendum: Query-Driven Database Indexes
- **Performance Integrity:** Composite database indexes have been surgically added to support the existing production query paths used by `CommandCenterService`, `AdminAPI`, `RequestEngine`, and `AcademicService`.
- **Targeted Strategies:** 
  - `Request` model uses dual-column composite indexes (`[status, createdAt]`, `[status, updatedAt]`, `[requesterId, updatedAt]`, `[status, resolvedAt]`) for extremely rapid frontend dashboard filtering and chronological sorting.
  - `AuditLog` leverages `[entity, entityId, timestamp]` for rapid contextual timeline reconstruction.
  - `Incident` utilizes `[status, createdAt]` for open-incident fetching.
  - `Escalation` utilizes `[createdAt]` and `Policy` utilizes `[isActive, updatedAt]` for active monitoring.
- **Avoidance of Speculation:** No redundant or speculative single-column indexes were added, preserving write-performance and respecting the principle of boring, targeted relational architecture.

## Q2.7 Addendum: Migration & Startup Hardening
- **Migration Authority:** The application relies completely on `prisma migrate deploy` to evolve the schema. Implicit schema mutation via `prisma db push` during normal startup (`npm run local`) is strictly disabled to prevent destructive data loss and desynchronization.
- **Startup Safety:** Normal startup (`npm run local` or `npm run dev`) is now purely passive regarding schema state. It verifies the database file exists and halts with an instructive error if not, requiring an explicit database deployment via `npm run db:deploy`.
- **Destructive Reset Preservation:** Local development retains a functional `npm run local:reset` command utilizing `prisma migrate reset --force --skip-generate --skip-seed && npx prisma db seed`, properly honoring the migration history while completely resetting and seeding the demo environment.

## Q2.8 Addendum: Deterministic Seed & Reset Validation
- **Seed Contract:** The seed script (`prisma db seed`) explicitly implements a "reset-before-seed" contract internally via `deleteMany()`. This ensures 100% deterministic recreation of demo scenarios without duplication.
- **Explicit Identifiers:** All core entities generated during seed (Users, Policies, Requests, Escalations, Notifications) now use explicit deterministic UUIDs/strings (e.g., `usr-student`, `pol-general`). This guarantees absolute functional and referential stability across iterative reset/seed cycles.
- **Preserved Idempotency:** The deterministic seed respects the Q2.5 constraint guarantees and the Q2.6 query indexes while preserving a stable baseline for functional frontend testing.

## Q2.9 Addendum: Full Persistence Regression Suite
- **Persistence Proven:** A comprehensive, multi-file regression suite strictly validates the real SQLite database behavior. This explicitly moves beyond in-memory API stubs to ensure physical persistence integrity across the Q2.2-Q2.8 architecture changes.
- **Process Reload Survival:** Tests explicitly instantiate entirely fresh PrismaClient instances to confirm that complex relation graphs (RequestStatusHistory, RequestAssignment, RequestSLA) successfully survive process death and database reconnection without data loss or corruption.
- **End-to-End Contract Assurance:** The suite conclusively verifies all database contracts, including constraint integrity, complex multi-entity atomic transactions, deterministic seeding, SLA sync loops, and immutable audit logs.



## R1 Addendum: Mobile PWA & Offline Experience
- **Installable PWA**: Configured Next.js manifest generation with responsive maskable icons to ensure full standalone web app installation on mobile devices.
- **User Cache Isolation**: The IndexedDB store securely enforces userId isolation. Cached data and queued mutations are strictly filtered by the authenticated session, and the entire IndexedDB database is cleared upon explicit logout or when a different user logs in, safely preserving the active user's offline queue while preventing cross-session leakage.
- **Offline Synchronization**: Implemented a robust offline queue. Local request creation generates an idempotency key and pushes to IndexedDB. A background OfflineProvider continually checks network status, attempting to flush the queue when online. Synchronization categorizes failures strictly into transient (queued for retry), permanent (discarded), or authentication errors (halts sync until login).
- **Service Worker Safety**: Implemented a conservative service worker that only caches static assets. All authenticated API paths, admin routes, and student views are explicitly excluded from cache-first mechanics to ensure private UI states are never served from a stale offline cache to the wrong user.


