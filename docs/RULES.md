# CamPlus Engineering & Execution Rules

## 1. Source of Truth Hierarchy
If documents conflict, do not silently choose a convenient interpretation. Report the conflict to the integrator (Subham). Subham decides the resolution, and canonical documentation is updated only after that decision.

1. `BRAIN.md` — canonical project memory / product and architecture decisions
2. `architect.md` — technical architecture source of truth
3. `TEAM.md` — ownership and dependency model
4. `plan.md` / `roadmap.md` — execution sequence and timeline
5. Role-specific MDs (`SUBHAM.md`, etc.) — role execution contracts
6. `PRD.md` — product requirements
7. `RULES.md` — enforceable engineering/execution rules

## 2. Planning Document Freeze
**CRITICAL RULE:** Planning documents are frozen execution contracts during active implementation. Team members must NOT casually modify canonical documents (`BRAIN.md`, `architect.md`, `TEAM.md`, `plan.md`, `roadmap.md`, or role-specific planning MDs) while implementing ordinary tasks.

If implementation reveals a genuine contradiction, missing requirement, architectural problem, or necessary scope change, report it to Subham. Subham decides whether canonical documentation needs to change and owns that update. Documentation changes should be committed separately from feature implementation whenever practical. Do NOT instruct agents to continuously rewrite their MDs as they work.

## 3. Ownership and Boundaries
Preserve the locked ownership model. Do not duplicate ownership.
- **Subham:** Core backend, database/schema, request engine, core APIs, integration, final merge/integration.
- **Snigdhaa:** Authentication, RBAC, notifications, audit logs, SLA/escalation, scheduler/demo clock.
- **SK:** Design system foundation, UX patterns, design foundation gate.
- **Zoya:** Student frontend.
- **Bonisha:** Admin frontend.

## 4. Dependency Rules
- Subham + Snigdhaa can work in parallel.
- SK must establish the Design System Foundation Gate before full frontend implementation begins.
- Zoya + Bonisha work in parallel after the SK gate.
- Subham performs final integration.
- If SK is delayed, the minimum agreed design foundation may be used to unblock frontend work. Do not wait indefinitely.

## 5. Architecture Rules
Preserve the architecture in `architect.md` exactly:
- Next.js + TypeScript + React + Tailwind
- Prisma
- SQLite for hackathon/local demo
- Modular monolith
- Application-managed authentication
- Server/API layer owns database access; clients never access SQLite directly
- Local-first demo architecture
- No unnecessary microservices or infrastructure

## 6. Universal Request Engine Rules
Requests must use the agreed lifecycle:
`REQUEST → CLASSIFY → ROUTE → ASSIGN → ACKNOWLEDGE → PROCESS → RESOLVE → VERIFY → CLOSE`

Do not create separate incompatible workflow engines for individual modules. New request types should reuse the universal request engine wherever applicable.

## 7. API and Contract Rules
- Backend contracts are explicit.
- Frontend must not assume undocumented API behavior.
- Frontend mock adapters must be replaceable by real API adapters.
- Server-side authorization is mandatory; do not bypass backend permission checks for convenience.
- Preserve the agreed request/entity contracts.

## 8. Database Rules
- Prisma is the schema authority.
- SQLite is the hackathon database.
- Migrations must remain reproducible.
- Seed/reset scripts must exist for the demo; demo data must be deterministic.
- Do not directly manipulate SQLite from frontend code.

## 9. RBAC and Security Rules
Use `Role + Domain + Scope + Permission`.
Do NOT implement a simplistic linear approval hierarchy (Principal → HOD → Professor → Warden) unless explicitly required by a workflow. Authorization must be enforced server-side. Students are service/request users.

## 10. Audit Rules
Important state changes must be auditable. Audit events should preserve:
- Who acted
- What changed
- When it changed
- Relevant request/entity context
Do not make audit logging an optional frontend feature.

## 11. Notification Rules
Notifications are centralized using the agreed notification system. Do not add paid SMS or unnecessary external messaging dependencies. Notifications must not become a second workflow engine.

## 12. Scholarship Rules
Scholarship status tracking must:
- Reuse existing identity/RBAC/audit/notification infrastructure.
- Use configurable academic year.
- Distinguish approved from disbursed.
- Support the approved status model.
- Use seeded/imported/institution-provided data unless legitimate integration exists.
- Never claim live government integration when none exists.

## 13. Accessibility Rules
All major workflows must account for:
- Low bandwidth and low-end devices
- Responsive UI and lightweight assets
- Offline/poor-network behavior where specified
- No-smartphone/assisted filing fallback
- Accessibility/contrast requirements
Do not treat accessibility as a final cosmetic pass.

## 14. Demo and Data Integrity Rules
The hackathon demo must not depend on fake UI-only state where the corresponding backend workflow is supposed to exist. 
Avoid fake counters disconnected from data, buttons that only look functional, mock resolution after backend integration, fabricated live integrations, and misleading "real-time" claims. Seeded synthetic data is allowed when clearly part of the demo architecture.

## 15. Git Rules
- One GitHub repository.
- `main` is the stable integration branch; no direct pushes to `main`.
- Each member works on their assigned branch:
  - `subham/core-backend`
  - `snigdhaa/platform-backend`
  - `zoya/student-frontend`
  - `bonisha/admin-frontend`
  - `sk/ui-ux`
- Changes enter `main` through PRs. Subham is final integrator/reviewer.
- Do not randomly commit to another member's branch.

## 16. Scope Rules
Do not add features merely because they sound impressive. Before adding a feature, ask:
1. Does it solve the stated problem?
2. Does it strengthen one of the judging dimensions?
3. Does it fit the current architecture?
4. Does it threaten the core demo workflows?
If it threatens the core demo, it should not be added without Subham's decision.

## 17. AI Rules
AI is supportive, not foundational. Core workflows must function without proprietary AI APIs. Rules-first / deterministic behavior is preferred where sufficient. AI should not be used merely as a decorative chatbot.

## 18. Testing Rules
Before a feature is considered complete:
- Happy path and relevant error path works.
- Permissions are checked.
- Data persists correctly.
- Relevant audit events and notifications exist where required.
- UI handles loading/empty/error/success states.
- Integration with existing modules is verified.

## 19. Definition of Done
A feature is not done merely because its UI exists. A feature is done when implementation exists, required backend/API behavior works, authorization works, persistence works, audit/notifications exist where required, relevant UI states work, the branch is clean enough for integration, and integration does not break existing flows.

## 20. Integration Rules
Subham is the final integrator. Before merging:
- Resolve contract mismatches.
- Verify database and API compatibility.
- Verify RBAC and seeded demo state.
- Verify frontend/backend wiring and LAN/local demo behavior.

## 21. Demo Rules
The final demo should prioritize complete workflows, visible accountability, admin visibility, accessibility, realistic seeded data, and clear cause → request → action → resolution flow. Do not sacrifice working core workflows for additional unfinished features.
