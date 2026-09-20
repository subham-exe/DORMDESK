# CamPlus Product Requirements Document

## 1. Product Overview
CamPlus is a unified, zero-budget campus operations platform for the BPUT Hackathon 2026. The core principle of CamPlus is: "We don't digitize campus paperwork. We digitize campus accountability." It unifies everyday campus requests, communication, tracking, resolution, and administrative visibility into a single, cohesive engine.

## 2. Problem
Campus life is currently plagued by fragmentation:
- Multiple disconnected apps and portals
- Physical notice boards that go unread
- Unofficial WhatsApp groups
- Manual registers and paper processes
- Poor visibility into request status
- Lost requests and notices
- Complete lack of accountability and auditability
- Constraints related to low-bandwidth and low-end devices among students

## 3. Target Users
- **Students:** Need a simple, low-bandwidth way to request help, track status, and view critical information.
- **Staff / Faculty:** Need clear assignment queues, reduced paperwork, and easy ways to update request status.
- **Hostel / Facility Authorities:** Need visibility into maintenance issues, leave approvals, and facility health.
- **Administrative Authorities:** Need high-level visibility into campus operations, SLA breaches, workload, and recurring issues.

## 4. Product Vision
CamPlus replaces fragmented paperwork with a unified request and accountability model. All actions flow through a universal request lifecycle:

`REQUEST → CLASSIFY → ROUTE → ASSIGN → ACKNOWLEDGE → PROCESS → RESOLVE → VERIFY → CLOSE`

The student does not need to understand internal institutional routing; they simply submit their need, and the engine routes it to the correct authority automatically.

## 5. Core Product Model
- **Universal Request Engine:** One standardized backend state machine powering all workflows.
- **Incident Intelligence:** Grouping multiple related requests into a single manageable incident.
- **Targeted Communication:** Sending notices and updates to specific cohorts (e.g., specific hostel) rather than broadcasting.
- **Admin Command Center:** A dashboard providing visibility into operational health, SLAs, and workloads.
- **Auditability:** Immutable logging of all state changes, assignments, and approvals.
- **Role + Domain + Scope + Permission:** A robust authority model ensuring users only see and act upon what they are authorized to handle.
- **Accessibility / Low-Bandwidth Operation:** PWA support, offline queuing, and lightweight UI for low-end devices.

## 6. Core Workflows
1. **Hostel Complaint / Maintenance:**
   - *Student Entry:* Submits complaint with category and description.
   - *Lifecycle:* Routed to hostel warden/staff → Assigned → Fixed → Resolved.
   - *Authority Processing:* Staff updates status; can cluster duplicates into an Incident.
   - *Resolution & Audit:* Fix is verified; SLA and audit logs are recorded.

2. **Leave / Gate Pass:**
   - *Student Entry:* Requests leave with dates and reason.
   - *Lifecycle:* Routed to Warden/HOD → Approved/Rejected.
   - *Resolution:* If approved, generates a digital QR pass for security exit. Exit/entry times are logged.

3. **Certificate / Document Request:**
   - *Student Entry:* Requests a bonafide or fee certificate.
   - *Lifecycle:* Routed to Admin → Verified → Approved (or auto-issued).
   - *Resolution:* Digital certificate generated with a QR verification link.

## 7. Scholarship Status Tracking
A P1 differentiator providing visibility into scholarship processing. It is an additional student service, NOT a replacement for the core request engine.
- **Requirements:** 
  - Show whether the student has a scholarship record/eligibility.
  - Show current academic-year status explicitly.
  - Clearly distinguish "Approved" (processed) from "Disbursed" (paid).
- **Supported Statuses:** ELIGIBLE, APPLIED, SUBMITTED, UNDER_VERIFICATION, APPROVED, SANCTIONED, DISBURSED, NOT_APPLIED, NOT_APPLICABLE, REJECTED, CANCELLED.
- **Constraints:**
  - Academic year must be configurable/derived, not hardcoded.
  - Data may be institution-provided, imported, or seeded synthetic data.
  - Do NOT claim live government portal integration.
  - Status changes must remain auditable; notifications may be triggered for relevant status changes.

## 8. Incident Intelligence
Multiple individual requests representing the same underlying issue (e.g., 12 complaints about water in Hostel A) can be clustered into one Incident. The incident shares a single SLA, owner, updates, and resolution status, which cascades down to the individual requests. This is driven by deterministic grouping, not an AI-first feature.

## 9. Notifications and Communication
- Centralized, in-app notifications are the core mechanism.
- Supports targeted communication and delivery/read tracking.
- Optional browser push notifications.
- Do NOT introduce paid SMS or external messaging dependencies.

## 10. Admin Command Center
Provides administrative visibility into:
- Active incidents and pending/open requests.
- Overdue requests and ageing metrics.
- Average resolution time and escalations.
- Affected students and recurring issues.
- Staff workload and hotspots/patterns.

## 11. Accessibility and Adoption
- Built for low-bandwidth and low-end devices.
- Lightweight UI with PWA and offline capability.
- Offline queue/sync for request submission.
- Regional language readiness (e.g., English + Odia/Hindi toggle).
- No-smartphone / assisted filing fallback (staff can file on behalf of a student).

## 12. MVP Scope
The hackathon demo must deliver:
- Login/Auth and Role/Permission system.
- Student, Staff, and Admin dashboards.
- Universal Request Engine with SLA/escalation (via simulated demo clock).
- 3 Core Workflows (Complaint, Gate Pass, Certificate) + Scholarship Status Tracking.
- Incident clustering, audit trail, and notification system.
- QR gate pass, offline request queue, and targeted announcements.

## 13. Out of Scope
- No unnecessary AI dependency (no decorative chatbots).
- No paid dependencies (cloud services, SMS gateways).
- No fake live government integration for scholarships.
- No unnecessary generic ERP expansion (e.g., full finance/payroll).
- No architecture expansion beyond the local-first Next.js/SQLite modular monolith.

## 14. Success Criteria
Product success is defined by:
- Friction reduction (measured in time/steps saved).
- Workflow breadth/completeness.
- Admin visibility and actionable insights provided by dashboards.
- Accessibility and low-bandwidth resilience.
- Usability, adoption readiness, and high-quality live demo execution.
