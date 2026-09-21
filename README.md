# DormDesk

**One Platform. Every Campus Operation. Every Level.**

**FretBox digitizes campus operations. DormDesk makes those operations intelligent and accountable.**

DormDesk is an intelligent campus operations platform built around a **Universal Request Engine**. It moves campus management from simply recording requests to understanding incidents, automating routine decisions, escalating stalled work, verifying outcomes, and detecting recurring problems.

## Why DormDesk?

Campus systems can digitize individual workflows, but operational problems often remain fragmented across requests, departments, and people. Once requests are digital, the system can understand relationships between them. DormDesk turns individual requests into operational intelligence.

### Key Differentiators

*   **Universal Request Engine:** All services (Complaints, Leaves, Gate Passes, Certificates, Maintenance) flow through one standardized operational engine with configurable routing, approvals, and SLAs. A new campus service should not require building an entirely new application module.
*   **Incident Intelligence:** DormDesk groups multiple related requests (e.g., 12 students reporting "no water") into a single actionable **Incident**.
*   **"Me Too" / Incident Joining:** Students are prompted to join an existing incident rather than creating duplicate complaints.
*   **SLA & Explainable Escalation:** Policy-driven SLA tracking that automatically escalates requests and explains *why* a request is pending.
*   **Zero-Touch Approval:** Configurable policy-based automation (e.g., Leave ≤ 2 days → Auto approve) completely bypasses human intervention when safe.
*   **Student Verification:** The workflow does NOT end when staff clicks "Resolved." True accountability requires the student to verify the resolution before closure (`Resolve → Verify → Close`).
*   **Recurring Issue Detection:** Analyzes historical incidents to identify recurring operational infrastructure problems.
*   **Operations Command Center:** An action-oriented admin dashboard focused on "What needs attention right now?" rather than just charts.

## Architecture Concept

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

## Tech Stack (Hackathon MVP)

*   **Framework:** Next.js (App Router, Modular Monolith)
*   **Database:** SQLite via Prisma ORM
*   **Styling:** Tailwind CSS v4
*   **Accessibility:** PWA ready, low-bandwidth optimized

## Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
