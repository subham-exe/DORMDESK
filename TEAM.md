# TEAM.md - Master Execution Map

## 1. Project Objective
Build an intelligent operational layer and next-generation campus operations platform ("DormDesk") for the BPUT Hackathon 2026. The platform turns student requests, complaints, and campus issues into accountable workflows through a Universal Request Engine. 

**Core Principle:** "We don't digitize campus paperwork. We digitize campus accountability."
**Architecture Principle:** One App. One Identity. One Request Engine. One Source of Truth. Zero Paid Dependencies. Local-First Demo.

## 2. Source-of-Truth Hierarchy
1. `BRAIN.md` (Product Vision & Constraints)
2. `architect.md` (Technical Architecture Baseline)
3. `TEAM.md` (Master Execution & Team Coordination)
4. Individual Role Plans (`SUBHAM.md`, `SNIGDHAA.md`, etc.)

## 3. Team Roster & Ownership Matrix

| Name | Role | Ownership Boundaries |
|---|---|---|
| **SUBHAM** | Overseer + Core Backend + Integrator | Request engine architecture, DB schema, Prisma, SQLite, core APIs, Complaint/Leave/Certificate workflows, config-driven modules, core domain contracts, scholarship data model, final integration. |
| **SNIGDHAA** | Backend 2 — Platform Services | Authentication, RBAC, audit log, notifications, SLA service, escalation, clock/scheduler, scholarship authorization/notifications, platform backend utilities. |
| **SK** | Design System + Product UX | Design system, visual language, responsive behavior, accessibility, UX patterns. **(SEQUENCED PREREQUISITE for frontends)**. |
| **ZOYA** | Frontend 1 (Student) | Student application UI, request submission/tracking flows, student notifications, mobile/low-bandwidth UX, student scholarship experience. |
| **BONISHA** | Frontend 2 (Admin) | Admin application UI, command center, request queue, assignment, status management, incident management, operational analytics, admin scholarship visibility. |

## 4. Execution & Dependency Model
The team utilizes **Contract-First Coordination** combined with **Dependency-Aware Parallelism**:
- **Parallel Backend:** Subham and Snigdhaa work in parallel. Snigdhaa builds against contracts/interfaces without waiting for Subham's complete DB implementation.
- **SK Design Foundation Gate:** The ONLY hard frontend start dependency. Zoya and Bonisha MUST NOT begin their actual frontend implementation until SK delivers the minimum viable design foundation (Target: End of Day 2-3 of Week 1).
- **Parallel Frontend:** After the SK gate, Zoya and Bonisha work in parallel against Subham's API contracts, using mock adapters if real endpoints aren't ready yet. Zoya and Bonisha are NOT dependent on each other.
- **Integration:** Subham remains the final integrator, replacing frontend mock adapters with real API calls and wiring Snigdhaa's platform services into the core API routes.

## 5. SK Design System Foundation Gate
This gate must be passed before Zoya and Bonisha write frontend UI code. It requires SK to deliver:
1. Color system
2. Typography scale
3. Spacing system
4. Core components (Buttons, Inputs, Cards)
5. Form components
6. Request-form patterns
7. Dashboard patterns
8. Status indicators
9. Navigation patterns
10. Responsive/mobile rules
11. Edge states (Loading/Empty/Error/Success)
12. Offline/poor-network states
13. Accessibility/contrast guidance
14. Enough student/admin screen references to unblock implementation.
*(Fallback rule: If the deadline is missed, SK must ship the minimum foundation required to unblock Zoya/Bonisha, then refine detailed design afterward.)*

## 6. Implementation Order
1. Repository/environment foundation
2. Subham core backend foundation
3. Snigdhaa platform service foundation
4. SK design system
5. **DESIGN SYSTEM FOUNDATION GATE (Unblocks Frontend)**
6. Zoya + Bonisha begin frontend implementation in parallel
7. Core Complaint vertical slice
8. Leave/Gate Pass
9. Certificate
10. Incident intelligence
11. Scholarship status capability
12. Notifications/targeted communication
13. Accessibility/offline hardening
14. Full integration owned by Subham
15. LAN testing
16. Demo rehearsal

## 7. Git / Branch / PR Rules
- **Isolation:** Keep Git work isolated by role.
- **No direct pushes to main:** Subham integrates everything.
- **Recommended Branches:**
  - `subham/core-backend`
  - `snigdhaa/platform-backend`
  - `zoya/student-frontend`
  - `bonisha/admin-frontend`
  - `sk/ui-ux`
- `main` is the stable integration branch.

## 8. Definition of Done
A feature is complete when the full vertical slice is achieved: student action → backend persistence → routing → authority action → status update → notification → audit trail. No mock data or static dashboards permitted in final integration.
