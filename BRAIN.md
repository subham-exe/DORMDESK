# BRAIN.md

## 1. Project Identity
**Product Name:** DormDesk
**Tagline:** One Platform. Every Campus Operation. Every Level.
**Context:** BPUT Hackathon 2026, Problem Statement 07 ("Attendance, Mess, Hostel, Repeat: Campus Life, Debugged").

## 2. Problem Statement
Campus systems can digitize individual workflows, but operational problems often remain fragmented across requests, departments, and people.
**Insight:** Once requests are digital, the system can understand relationships between them.
**Solution:** DormDesk turns individual requests into operational intelligence.

FretBox digitizes campus operations. DormDesk makes those operations intelligent and accountable.

## 3. Product Vision & Architecture
DormDesk is an intelligent campus operations platform built around a **Universal Request Engine**. It is not a collection of basic hostel-management modules.

```text
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

## 4. Current Implementation Status
**CURRENT STATE:** INITIAL FOUNDATION COMPLETE.
- The repository contains a working Next.js + Prisma (SQLite) foundation with the core Request Engine.
- Work on frontend UX (Student and Admin) is about to begin.
- The architecture correctly implements state transitions, authorization, SLA calculation, and incident grouping.

## 5. Technical Architecture Overview
(See `architect.md` for full technical details)
- **Frontend & Backend:** Next.js (full-stack API routes, modular monolith).
- **Database:** SQLite with Prisma ORM. SQLite is the primary hackathon database.
- **Hosting:** Local host (laptop) is the primary reliable hackathon demo architecture.
- **Cost Constraint:** ₹0 Budget. No paid services.

## 6. User Types and Authority Model
Authority uses **Role + Domain + Scope + Permission**.
- **Roles:** Student, Warden, Maintenance Staff, Maintenance Supervisor, HOD, Administrator, Institution-level leadership.
- Different users see and act on the same operational system according to their responsibility, domain, and scope.

## 7. Universal Request Engine
The core of DormDesk. Complaint, Leave, Gate Pass, Certificate, Maintenance, Mess Issue, Academic Request, Facility Request all become standardized requests.
**Lifecycle:**
CREATE → CLASSIFY → ROUTE → ASSIGN → ACKNOWLEDGE → PROCESS → RESOLVE → VERIFY → CLOSE

- **Explainable Workflow Transparency:** Students should not see only "Status: Pending". They should see exact reasons: "Why is this pending? The assigned technician has not acknowledged the request. SLA: 38 minutes remaining."
- **SLA & Escalation Engine:** Policy-driven and explainable. Evaluates request against configured policies and triggers escalation when required (not arbitrary AI decision-making).
- **Zero-Touch Approval:** Configurable policy-based automation (e.g., Leave ≤ 2 days → Auto approve).
- **Student Verification:** The workflow does NOT end when staff clicks "Resolved." It ends when the student verifies the resolution.

## 8. Incident Intelligence (Major Differentiator)
DormDesk detects related requests using factors such as category, location, time window, semantic similarity, and affected facility.
- **Request:** An individual student's operational request.
- **Incident:** A real-world operational problem that may generate multiple related requests (e.g., Water outage - Block B).

**"Me Too" / Incident Joining:**
When DormDesk detects an existing incident, the student sees: "This issue has already been reported. [Join Incident] / [Me Too]". This prevents duplicate tickets and links the student to the incident updates.

**Recurring Issue Detection:**
DormDesk analyzes historical incidents and identifies recurring operational problems. E.g., "SYSTEM INSIGHT: Recurring infrastructure issue detected." The system assists administrators rather than making unsupported decisions.

## 9. Admin Operations Command Center
The dashboard is an action-oriented Operations Command Center. The primary question is: **What needs attention right now?**
Prioritizes critical interventions (SLA breaches, escalations), emerging issues (rapidly increasing complaints, recurring locations), and operational health.

## 10. Notifications
One centralized notification service. Targeted, event-driven announcements rather than global broadcasts. 

## 11. Accessibility & Practicality
- **PWA / Low-Bandwidth:** Lightweight UI, IndexedDB for offline request queue where required.
- **Kiosk Mode / Assisted Filing:** Staff can use kiosk mode to create a request on behalf of a student using their student ID.

## 12. Hero Demo Strategy
The MVP prioritizes one complete vertical slice:
Student reports problem → Related request detected → Student joins existing incident → Incident updated → Automatic routing → Assignment → SLA countdown → SLA warning → Escalation → Staff resolution → Resolution evidence → Student verification → Incident closed → Recurring issue detected.

## 13. AI Philosophy
AI is used where it provides actual operational value (duplicate detection, clustering, recurring pattern detection, operational insights). No generic chatbots or unsupported AI claims.