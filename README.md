<p align="center">
  <img src="./assets/dormdesk-hero.svg" alt="DORMDESK - One Campus, One Platform" width="800">
</p>

<p align="center">
  <i>Four apps, six notice boards, two WhatsApp groups, one register.
  Replace all of it.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/BPUT_Hackathon-2026-blue?style=flat-square" alt="BPUT Hackathon 2026">
  <img src="https://img.shields.io/badge/Problem_Statement-07-blue?style=flat-square" alt="Problem Statement 07">
  <img src="https://img.shields.io/badge/Next.js-16.3.5-black?style=flat-square&logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/SQLite-DB-003B57?style=flat-square&logo=sqlite" alt="SQLite">
  <img src="https://img.shields.io/badge/TypeScript-Ready-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
</p>

<p align="center">
  <b>One engine. Multiple campus workflows. One accountable trail.</b>
</p>

DORMDESK is not simply another campus portal.

We don't digitize campus paperwork.
We digitize campus accountability.

Every request should have an owner, a state, a deadline, an action trail, and an outcome.
A request doesn't simply become a database row.
It becomes an accountable workflow.

## The Problem

A student may need a certificate, report a maintenance issue, and find out about a class update — all through different channels.

**BEFORE:**
office → register → notice board → WhatsApp → person → hope

**AFTER:**
raise request → DORMDESK routes/tracks → authority resolves → student verifies → closed

## Why One Engine

DORMDESK does not create a completely separate backend workflow for every campus problem.

The Universal Request Engine provides a common lifecycle. That shared engine is what allows DORMDESK to reason across workflows.

One engine means complaints, leave, certificates, and similar workflows can produce comparable operational signals. That shared data model enables:
- SLA tracking
- audit trails
- incident intelligence
- recurring issue detection
- authority visibility

## Request Lifecycle

CREATE
↓
CLASSIFY
↓
ROUTE
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
CLOSE

The implementation's strict request state machine enforces valid transitions:
PENDING → ASSIGNED → ACKNOWLEDGED → PROCESSING → RESOLVED → VERIFIED → CLOSED

Reopening is supported where appropriate. Every important state change produces structured, append-only audit records.

## Policy Engine

The Policy Engine is a first-class architecture component. Configurable policy logic determines how a request should be handled (e.g., deterministic rules for auto-approving short leaves). Deterministic rules are preferred where decisions need to be explainable.

## SLA & Escalation

Request
↓
SLA clock
↓
Warning / Breach
↓
Escalation
↓
Command Center

Time-sensitive SLA processing is natively supported by the server scheduler to ensure stalled work is automatically escalated to the Operations Command Center.

## Evidence & Verification

Resolution is not merely a status flip.

Authorities can process and resolve requests with accountability and evidence around the operation.

RESOLVED
↓
STUDENT VERIFIES
↓
CLOSED

The student who raised the request gets a role in completing the loop, explicitly verifying resolution before closure.

## Intelligence Without AI HYPE

DORMDESK deliberately doesn't use an LLM where deterministic, auditable rules are the better tool.

Our intelligence layer is built on explainable architecture:
- Rules-based routing
- Deterministic policy engine
- SLA logic
- Serious complaint triage
- Recurring issue detection

For serious complaints (e.g., abuse, harassment, ragging, safety concerns), requests trigger protected deterministic handling:
NORMAL / SERIOUS / SERIOUS_REVIEW

For recurring issues:
category + location + repeated occurrences → recurring issue

This operational insight operates deterministically without relying on unpredictable ML/LLMs.

## Campus Feature Breadth

DORMDESK addresses more than complaints. Workflows mapped through the universal request engine or handled as dedicated modules include:
- Attendance
- Complaints / Maintenance
- Notices
- Mess Menu / Feedback
- Fees / Dues
- Leave workflows through the request engine
- Certificate workflows through the request engine
- Request tracking
- Resolution verification
- Administrative command center
- Notifications
- Email verification
- Consent/preferences
- CSV request export

## Authority Model

001 / SYSTEM ADMIN
        ↓
     PRINCIPAL
        ↓
 HOD / FACULTY / WARDEN / STAFF
        ↓
      STUDENT

- **001** is the single platform-level SYSTEM ADMIN.
- **Principal** is the highest operational authority in their college.
- Hierarchy below Principal can vary.
- Authority is scope-aware.
- System Admin does not have routine college operational access.
- Serious complaint routing is restricted and audited.

## Security

The security question isn't merely: "Can this user open this page?"

It is: "Can this actor perform this operation on this resource within this scope?"

- JWT session tokens
- HttpOnly cookies
- bcrypt password hashing
- Canonical authority resolution
- Server-side authorization
- College-scoped authorization
- Cross-college isolation
- IDOR protection
- Server-derived identity
- Hashed email verification tokens
- Token expiry/replay protection
- Append-only audit records
- Consent ledger
- Notification permission checks
- Persistent email quotas
- Idempotent operational events
- Serious complaint protection

## Notifications & Email

Operational Event
↓
Consent Check
↓
Quota / Rate Check
↓
Email Provider
↓
Delivery Log

DORMDESK handles transactional emails with delivery logging, idempotency, email verification, and notification preferences/consent. It supports Gmail SMTP, Resend, and a Mock provider for local development. Simulated SMS outbox is included only as a prototype component.

## Accessibility & Real Campus Conditions

Offline support queues supported request mutations until connectivity returns.

- Responsive mobile/desktop UI
- Kiosk / assisted access
- Same student account across contexts
- Graceful network failure handling
- Previously available application state

## Architecture

Student / Authority / Admin Interfaces
↓
Universal Request Engine
↓
Routing Engine + Policy Engine + SLA Engine
↓
Incident Intelligence
↓
Resolution + Evidence + Audit
↓
Student Verification
↓
Recurring Issue Detection
↓
Authority Command Center

The application is built as a highly robust modular monolith.

## Tech Stack

- Next.js 16.3.5
- React 19
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- JWT + HttpOnly cookies
- bcryptjs
- Gmail SMTP / Resend / Mock Provider
- Vitest
- Playwright
- Node.js

## Validation

- 340 / 340 Vitest tests
- 10 / 10 core Playwright flows
- 1 / 1 request lifecycle E2E
- 18 / 18 Prisma migrations

✓ TypeScript
✓ Production build
✓ Prisma validation
✓ Authentication routing
✓ Cross-college authorization
✓ Request lifecycle
✓ Email pipeline
✓ Scheduler
✓ Responsive UI
✓ Kiosk behaviour

## Quick Start

```bash
git clone https://github.com/subham-exe/DORMDESK.git
cd DORMDESK
npm install
npm run DORMDESK
```

The normal launcher (`npm run DORMDESK`) preserves the existing usable demo database, initializes, and seeds only when necessary. It does not reset every launch.

For an explicit reset:
```bash
npm run DORMDESK:reset
```
Resetting is intentionally separate to protect ongoing demo states.

## Demo Accounts

DORMDESK provisions a fully-authorized campus hierarchy with a synthetic DEMO simulation.

**Password (for all demo accounts):**
`dormdesk2026`

- **SYSTEM ADMIN:** `system@dormdesk.test`
- **PRINCIPAL:** `principal.demo@dormdesk.local`
- **CSE HOD:** `hod.cse@dormdesk.local`
- **WARDEN:** `warden.boys@dormdesk.local`
- **SIMULATION STUDENT:** `student001@dormdesk.local`

**Simulation range:**
`student001@dormdesk.local` -> `student100@dormdesk.local`

## Recommended Demo

The canonical DORMDESK demonstration flow:
STUDENT
↓
creates request
↓
DORMDESK routes/assigns
↓
WARDEN processes/resolves
↓
STUDENT sees resolution
↓
STUDENT verifies
↓
CLOSED

## FAQ

1. **Why one request engine?**
   It eliminates fragmented backend logic, providing a uniform lifecycle, audit trail, and SLA timeline for every operational problem on campus.
2. **Why deterministic intelligence instead of an LLM?**
   Campus operations require explainability and absolute accountability. Deterministic rules, SLAs, and incident clustering guarantee auditable decisions over unpredictable generative logic.
3. **What if a student doesn't have a smartphone?**
   DORMDESK supports assisted filing where authorized staff can raise a request on behalf of a student.
4. **Does DORMDESK support multiple colleges?**
   Yes. It features strict cross-college isolation and college-scoped authorization.
5. **Why SQLite?**
   SQLite perfectly fits the hackathon requirement of local, reliable execution without depending on external network-bound managed databases.
6. **What is intentionally outside the prototype?**
   Fuzzy/AI timetable conflict optimization, real SMS routing, native blob/S3 storage, and real payment gateway integration.

## Prototype Boundaries

The current implementation has the following known limitations:
1. No fuzzy/AI timetable conflict optimizer (strict equality conflict blocks exist only).
2. Materials/evidence use URL/reference-string semantics rather than native S3/blob storage.
3. Fees are ledger/status tracking without real payment gateway integration.
4. SMS is simulated/mock/outbox only; no real SMS routing.
5. Broad unrestricted offline support (only supported request mutations queue offline).

## Future Scope

The current hackathon build is deliberately a strong prototype. The architecture is designed to grow into a production campus platform.

### Identity & Onboarding
- Institutional student registration and approval workflows
- HOD/Warden verification where appropriate
- Institutional identity / admission-number verification
- Account lifecycle management: onboarding, activation, suspension, graduation/deactivation
- Stronger identity verification and recovery flows

### Mess & Campus Services
- Mess menu management
- Meal feedback and issue tracking
- Mess quality/wastage analytics
- Broader campus service workflows powered by the same Request Engine

### Institutional Workflows
- Payment gateway integration for fee/dues collection
- Advanced certificate/leave/approval workflows using the existing request architecture

### Production Infrastructure
- PostgreSQL for production-scale relational persistence
- Redis/queue-backed asynchronous jobs
- Distributed scheduling for SLA/escalation workloads
- Object storage for evidence/attachments
- Production-grade observability, backups and deployment infrastructure

### Offline & Mobile
- Installable PWA/mobile-friendly experience
- Offline background synchronization for all datasets

### Campus Intelligence
- Richer recurring-issue analytics
- Cross-department and hostel trend analysis
- Predictive maintenance / risk signals
- Data-driven planning dashboards

### Multi-College Platform
- Multi-college deployment
- College-specific policies and authority hierarchies
- Central platform administration with strict tenant isolation
- Institution-level analytics without exposing unrelated college operational data

DORMDESK's goal is not to become another collection of disconnected campus modules. The same accountable workflow engine should remain the foundation as more campus operations move onto the platform.

## Closing

Most campus software asks:

"Where do I submit this?"

DORMDESK asks:

"Who owns it?"
"What happened to it?"
"How long has it been waiting?"
"Was it actually resolved?"
"Is this problem happening again?"

DORMDESK
Campus Life, Debugged.

"We don't digitize campus paperwork.
We digitize campus accountability."

BPUT Tech Carnival 2026
Problem Statement 07
