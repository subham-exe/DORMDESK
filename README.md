# DormDesk

**One Platform. Every Campus Operation. Every Level.**

**FretBox digitizes campus operations. DormDesk makes those operations intelligent and accountable.**

DormDesk is an intelligent campus operations platform built around a **Universal Request Engine**. It moves campus management from simply recording requests to understanding incidents, automating routine decisions, escalating stalled work, verifying outcomes, and detecting recurring problems.

## Why DormDesk?

Campus systems can digitize individual workflows, but operational problems often remain fragmented across requests, departments, and people. Once requests are digital, the system can understand relationships between them. DormDesk turns individual requests into operational intelligence.

### Final Implementation Features

*   **Universal Request Engine:** A unified service powering Complaints, Leaves, Certificates, and offline workflows.
*   **Request Lifecycle & State Machine:** Strict backend state machine enforcing valid transitions with rollback resilience.
*   **Zero-Touch Approval:** Deterministic policy engine bypasses human intervention (e.g. Leave <= 2 days).
*   **Student Verification & Evidence:** Staff must submit evidence of resolution; students explicitly verify resolution before closure.
*   **SLA Tracking & Escalation:** SLAs are tracked, prioritized in the Command Center, and automatically escalated upon breach.
*   **Incident Intelligence:** Automatic detection of related requests (e.g., multiple students reporting the same issue) and clustering them into a single Incident.
*   **Recurring Issue Detection:** Identifies persistent infrastructure problems by analyzing incident frequency over time.
*   **Operations Command Center:** An action-oriented admin dashboard surfacing SLA risks, incidents, and recurring patterns.
*   **Offline Experience & Sync:** Full PWA offline capability using IndexedDB, request idempotency, and background synchronization.

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

