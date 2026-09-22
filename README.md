# DormDesk

**One Platform. Every Campus Operation. Every Level.**

**FretBox digitizes campus operations. DormDesk makes those operations intelligent and accountable.**

DormDesk is an intelligent campus operations platform built around a **Universal Request Engine**. It moves campus management from simply recording requests to understanding incidents, automating routine decisions, escalating stalled work, verifying outcomes, and detecting recurring problems.

## Why DormDesk?

Campus systems can digitize individual workflows, but operational problems often remain fragmented across requests, departments, and people. Once requests are digital, the system can understand relationships between them. DormDesk turns individual requests into operational intelligence.

### Current Working Flow (IMPLEMENTED / PROTOTYPE)

*   **Universal Request Engine [IMPLEMENTED]:** A unified `RequestEngine` service and schema powering Complaints and Leaves.
*   **Request Lifecycle & State Machine [IMPLEMENTED]:** Strict backend state machine enforcing valid transitions (e.g., PENDING -> ASSIGNED).
*   **Zero-Touch Approval [IMPLEMENTED]:** Hardcoded deterministic rule bypasses human intervention (Leave <= 2 days -> Auto approve).
*   **Student Verification [PROTOTYPE]:** The verification state exists in the workflow model, and UI mockups exist in the student portal, but the backend transition API is pending.
*   **SLA Tracking [PROTOTYPE]:** SLAs are assigned upon request creation (e.g., 24h for complaints) and visualized in the UI timeline, but automatic escalation policies are not yet implemented.

### Target Hackathon Hero Flow (PLANNED)

*   **Incident Intelligence [BACKEND PRIMITIVE ONLY]:** The `clusterIntoIncident` primitive exists, but automatic detection of related requests (e.g., 12 students reporting "no water") is planned.
*   **"Me Too" / Incident Joining [PLANNED]:** Prompting students to join an existing incident rather than creating duplicate complaints.
*   **SLA & Explainable Escalation [PLANNED]:** Automatic escalation via a simulated demo clock and explainable pending reasons.
*   **Recurring Issue Detection [PLANNED]:** Analyzing historical incidents to identify recurring operational infrastructure problems.
*   **Operations Command Center [PLANNED]:** An action-oriented admin dashboard for staff/wardens.
*   **Configurable Workflows [PLANNED]:** Moving from hardcoded transition rules to dynamic workflow configurations.

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
