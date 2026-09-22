# SNIGDHAA - Backend 2 (Platform Services)

You own the supporting platform backend services. You work against defined interfaces/contracts and are fully independent from Subham's implementation. 
**IMPORTANT:** Do NOT duplicate the request lifecycle engine, state machine, CRUD, routing, or core workflows owned by Subham. Do NOT introduce a separate distributed worker architecture.

## PHASE 0: (CURRENT / DONE) Platform Service Interfaces
- **Task ID:** SNI-01
- **Objective:** Establish internal service interfaces based on the canonical domain contracts.

## PHASE 1: (NEXT) Authentication
- **Task ID:** SNI-02
- **Objective:** Implement local, application-managed authentication.
- **Implementation Notes:** Use NextAuth.js or custom JWT/cookies. Do not use external paid auth services.

## PHASE 2: RBAC
- **Task ID:** SNI-03
- **Objective:** Build server-side authorization middleware based on Role + Domain + Scope + Permission.

## PHASE 3: Audit Logging
- **Task ID:** SNI-04
- **Objective:** Build an internal service to log operational actions immutably.

## PHASE 4: Notifications
- **Task ID:** SNI-05
- **Objective:** Build a centralized notification service for targeted in-app announcements.

## PHASE 5: SLA + Escalation Service (NEXT - Includes Simulated Demo Clock)
- **Task ID:** SNI-06
- **Objective:** Implement SLA evaluation logic.
- **Implementation Notes:** Evaluate deadlines synchronously or via API trigger. Do not build a standalone worker daemon.

## PHASE 6: Clock/Scheduler/Demo Clock
- **Task ID:** SNI-07
- **Objective:** Build the simulated clock mechanism.
- **Implementation Notes:** Allow the demo runner to advance time artificially to test SLAs and escalations without waiting.

## PHASE 7: Scholarship Platform Logic
- **Task ID:** SNI-08
- **Objective:** Implement authorization, audit, and notification hooks specific to scholarship status changes.
- **Implementation Notes:** Ensure strict privacy (students only see their own scholarship data unless Admin).

## PHASE 8: Integration with Core Backend
- **Task ID:** SNI-09
- **Objective:** Hand over your service classes/middleware to Subham for final wiring into the Request Engine APIs.
