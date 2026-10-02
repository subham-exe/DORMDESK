# SUBHAM - Overseer + Core Backend + Integrator

You are the Overseer and Core Backend owner. You control the universal request engine, database architecture, and final integration. Frontend completion is NOT a prerequisite for your backend work.

## PHASE 0: Repository/Environment Foundation
- **Task ID:** SUB-01
- **Objective:** Initialize Next.js project with Tailwind, Prisma, and SQLite. Define canonical core domain contracts.
- **Implementation Notes:** Ensure `sqlite` is the Prisma provider. Export TS interfaces/JSON contracts for Request, Incident, and core payloads to unblock the rest of the team conceptually.

## PHASE 1: Database/Schema
- **Task ID:** SUB-02
- **Objective:** Implement the Prisma schema on SQLite.
- **Implementation Notes:** Centralize the `Request` table. Model the state machine. Include Scholarship entity linked to StudentProfile.

## PHASE 2: Universal Request Engine (CURRENT / DONE)
- **Task ID:** SUB-03
- **Objective:** Build core CRUD and request routing logic.
- **Implementation Notes:** Validate lifecycle status transitions (e.g., PROCESSING → RESOLVED). 

## PHASE 3: Core APIs (CURRENT / DONE)
- **Task ID:** SUB-04
- **Objective:** Expose the universal request engine APIs.
- **Implementation Notes:** Provide endpoints that Zoya and Bonisha's mock adapters will eventually be replaced by. 

## PHASE 4: Core Workflows & Scholarship (NEXT)
- **Task ID:** SUB-05
- **Objective:** Implement the specific lifecycle requirements for the required modules.
- **Workflows:** 
  - Complaint workflow
  - Leave/Gate Pass workflow (exit time metadata)
  - Certificate workflow
  - Scholarship status data model & API (current year status retrieval).

## PHASE 5: Config-Driven Module System (PLANNED)
- **Task ID:** SUB-06
- **Objective:** Support dynamic addition of request types without schema changes.

## PHASE 6: Integration (Critical Gate)
- **Task ID:** SUB-07
- **Objective:** The final end-to-end assembly.
- **Implementation Notes:** 
  - Integrate Snigdhaa's platform services (Auth, RBAC middleware, Audit hooks) into your core API routes.
  - Integrate Zoya's student frontend and Bonisha's admin frontend.
  - Replace any frontend mock adapters with real API calls.
  - Seed the SQLite database with realistic deterministic data (including Scholarship states).

## PHASE 7: Live Demo Hardening
- **Task ID:** SUB-08
- **Objective:** Ensure the host laptop can serve the Next.js app locally over LAN/hotspot.
- **Implementation Notes:** Verify SQLite seed/reset processes and demo recovery mechanisms. Ensure demo is functional completely offline.


> **V-FREEZE STATUS:** Execution complete. This document reflects the team structure and responsibilities used during the hackathon development phases.


