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
- **Administrative Authorities:** Need an Operations Command Center providing high-level visibility into SLA breaches, workload, and recurring issues.

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
Students should not see only "Status: Pending". They should see exact reasons:
> "Why is this pending? The assigned technician has not acknowledged the request. SLA: 38 minutes remaining."

### B. Incident Intelligence & "Me Too"
When multiple students report the same issue (e.g. 12 students report a water outage), DormDesk groups these into an **Incident**.
When DormDesk detects an existing incident, a new student submitting a request should see:
> "This issue has already been reported. [Join Incident] / [Me Too]"
This prevents unnecessary duplicate tickets.

### C. SLA & Automatic Escalation
Policy-driven escalation. Evaluates the request against configured SLA policies and automatically triggers escalation when required (not arbitrary AI decision-making).

### D. Zero-Touch Approval
Configurable policy-based automation (e.g., Leave ≤ 2 days → Auto approve) bypassing manual bottlenecks.

### E. Recurring Issue Detection
DormDesk analyzes historical incidents and identifies recurring operational problems.
> "SYSTEM INSIGHT: Recurring infrastructure issue detected."

## 6. Core Workflows
1. **Hostel Complaint / Maintenance:**
   - *Student Entry:* Submits complaint with category and description. (Or joins existing incident).
   - *Lifecycle:* Routed → Assigned → SLA tracked → Fixed → Resolved.
   - *Resolution & Audit:* Fix is **verified** by student; SLA and audit logs are recorded.

2. **Leave / Gate Pass:**
   - *Lifecycle:* Routed to Warden/HOD → Approved/Rejected (or Zero-Touch Auto-Approved).
   - *Resolution:* Digital QR pass generated.

3. **Certificate / Document Request:**
   - *Lifecycle:* Routed to Admin → Verified → Approved (or auto-issued).

## 7. Operations Command Center (Admin)
Prioritizes:
- **Critical intervention:** SLA breaches, unresolved high-priority incidents, severely delayed requests.
- **Emerging issues:** Rapidly increasing complaints, recurring locations.
- **Operational health:** Requests within SLA, average resolution time, verification rate.

## 8. Accessibility and Adoption
- Built for low-bandwidth and low-end devices.
- Lightweight UI with PWA and offline capability.
- Kiosk mode / assisted filing fallback (staff can file on behalf of a student using student ID).

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