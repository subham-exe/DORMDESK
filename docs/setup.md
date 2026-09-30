# DORMDESK — Development Context

This file explains how a team member should get started with the DORMDESK repository and how development is expected to work.

This is an onboarding/execution guide.

It does NOT replace:
- `BRAIN.md`
- `architect.md`
- `PRD.md`
- `RULES.md`
- `TEAM.md`
- `plan.md`
- `roadmap.md`
- role-specific files

For project decisions and architecture, always follow the repository's source-of-truth hierarchy.

---

# 1. Before Doing Anything

Do not immediately start coding after receiving a task.

First read the relevant project documentation.

At minimum, read:

```text
BRAIN.md
architect.md
TEAM.md
PRD.md
RULES.md
plan.md
roadmap.md
````

Then read your assigned role document:

```text
SUBHAM.md
SNIGDHAA.md
SK.md
ZOYA.md
BONISHA.md
```

Also inspect any other documentation directly relevant to your assigned task.

Before implementation, understand:

1. What DORMDESK is.
2. What problem it solves.
3. The current architecture.
4. Your team's ownership boundaries.
5. Your own responsibilities.
6. Dependencies between team members.
7. Existing API/data contracts relevant to your task.
8. What is explicitly out of scope.
9. The current implementation phase.

Do not invent architecture or features without first checking the existing documentation.

---

# 2. Project Ownership

The current team structure is:

| Person   | Branch                      | Responsibility                                      |
| -------- | --------------------------- | --------------------------------------------------- |
| Subham   | `subham/core-backend`       | Core backend, database, Request Engine, integration |
| Snigdhaa | `snigdhaa/platform-backend` | Auth, RBAC, notifications, audit, SLA               |
| SK       | `sk/ui-ux`                  | Design system + UX foundation                       |
| Zoya     | `zoya/student-frontend`     | Student experience                                  |
| Bonisha  | `bonisha/admin-frontend`    | Admin experience                                    |

The ownership boundaries are intentional.

Do not duplicate another teammate's responsibility.

---

# 3. GitHub Repository

Repository:

```text
https://github.com/subham-exe/DORMDESK.git
```

The project uses:

```text
main
├── subham/core-backend
├── snigdhaa/platform-backend
├── sk/ui-ux
├── zoya/student-frontend
└── bonisha/admin-frontend
```

`main` is the stable integration branch.

Nobody should push directly to `main`.

Changes should enter `main` through Pull Requests.

---

# 4. First-Time Repository Setup

Clone the repository:

```powershell
git clone https://github.com/subham-exe/DORMDESK.git
```

Enter the repository:

```powershell
cd DORMDESK
```

Check the repository:

```powershell
git status
```

Make sure you are on `main`:

```powershell
git checkout main
```

Pull the latest version:

```powershell
git pull origin main
```

---

# 5. Create Your Assigned Branch

Create your branch from the latest `main`.

First:

```powershell
git checkout main
git pull origin main
```

Then create your assigned branch.

## Subham

```powershell
git checkout -b subham/core-backend
git push -u origin subham/core-backend
```

## Snigdhaa

```powershell
git checkout -b snigdhaa/platform-backend
git push -u origin snigdhaa/platform-backend
```

## SK

```powershell
git checkout -b sk/ui-ux
git push -u origin sk/ui-ux
```

## Zoya

```powershell
git checkout -b zoya/student-frontend
git push -u origin zoya/student-frontend
```

## Bonisha

```powershell
git checkout -b bonisha/admin-frontend
git push -u origin bonisha/admin-frontend
```

This only needs to be done once.

---

# 6. Check Your Current Branch

At any time:

```powershell
git branch
```

Example:

```text
  main
* subham/core-backend
```

The `*` indicates the branch you are currently using.

Always check this before starting significant work.

---

# 7. Starting a New Work Session

Before starting work:

```powershell
git checkout main
git pull origin main
```

Then return to your branch:

```powershell
git checkout YOUR-BRANCH
```

For example:

```powershell
git checkout subham/core-backend
```

Update your branch with the latest `main`:

```powershell
git merge main
```

Then begin implementation.

---

# 8. Before Editing Code

After reading the documentation, briefly establish:

```text
What I found:
- relevant architecture decisions
- relevant ownership boundaries
- relevant contracts

What I expect to change:
- files/modules likely to be touched

Dependencies:
- other systems or teammates this work depends on

Constraints:
- rules or existing decisions that must not be violated
```

Then implement the assigned task.

Do not spend time rewriting documentation unless a genuine contradiction is discovered.

---

# 9. Development Order

The team does not need to work sequentially.

The initial development streams are:

```text
Subham
    ↓
Core backend
Database
Request Engine
Core APIs


Snigdhaa
    ↓
Auth
RBAC
Audit
Notifications
SLA / Scheduler


SK
    ↓
Design System Foundation
    ↓
Design System Gate
    ↓
Zoya + Bonisha
```

Subham and Snigdhaa can work in parallel.

SK can work independently on the design foundation.

Zoya and Bonisha begin full frontend implementation after the Design System Foundation Gate is ready.

---

# 10. First Implementation Goal

The first major technical goal is NOT to build every feature.

The first goal is to establish a working foundation and then prove the architecture with one complete vertical workflow.

The flagship first workflow should demonstrate:

```text
Student
   ↓
Create Hostel Complaint
   ↓
Request Created
   ↓
Classify
   ↓
Route
   ↓
Assign
   ↓
Acknowledge
   ↓
Process
   ↓
Resolve
   ↓
Verify
   ↓
Close
```

The workflow should also demonstrate the relevant:

```text
Persistence
Notifications
Audit Trail
Student Tracking
Admin Visibility
```

Once this works, the same Universal Request Engine can support additional workflows.

---

# 11. Core Development Sequence

The broad implementation sequence is:

```text
Project Foundation
        ↓
Database / Prisma / SQLite
        ↓
Universal Request Engine
        ↓
Core APIs
        ↓
Platform Services
        ↓
Design System
        ↓
First Complete Vertical Slice
        ↓
Student Frontend
        ↓
Admin Frontend
        ↓
Integration
        ↓
Additional Workflows
        ↓
Demo Hardening
```

Do not interpret this as a requirement for every teammate to wait for every previous step.

The team works in parallel wherever the architecture allows it.

---

# 12. Working With Git

## Check changes

```powershell
git status
```

## View changes

```powershell
git diff
```

## Stage changes

```powershell
git add .
```

## Commit

Commit coherent pieces of work.

Example:

```powershell
git commit -m "feat: implement request creation API"
```

Good examples:

```text
feat: add hostel complaint API
feat: implement student request tracking
feat: add admin request queue
feat: add scholarship status card

fix: resolve request status transition bug
fix: correct mobile request form

docs: update API contract
refactor: simplify request routing
```

Avoid meaningless messages:

```text
update
changes
stuff
final
final2
final-final
```

## Push

```powershell
git push
```

---

# 13. Getting Changes From Main

When another teammate's work has been merged into `main`:

First make sure your own work is safe:

```powershell
git status
```

If you have uncommitted work, commit it or otherwise safely preserve it before syncing.

Then:

```powershell
git checkout main
git pull origin main
```

Return to your branch:

```powershell
git checkout YOUR-BRANCH
```

Merge the latest `main`:

```powershell
git merge main
```

Continue working.

---

# 14. Pull Requests

When your work is ready for integration:

```powershell
git push
```

Go to GitHub and create a Pull Request:

```text
YOUR-BRANCH
      ↓
    main
```

Describe:

```text
Implemented:
- ...

Tested:
- ...

Notes:
- ...
```

Subham performs the final integration/review.

After the Pull Request is merged, update your local branch:

```powershell
git checkout main
git pull origin main

git checkout YOUR-BRANCH
git merge main
```

---

# 15. Important Git Rules

### Never push directly to `main`

Use:

```text
your branch
    ↓
Pull Request
    ↓
main
```

### Never force-push

Do not use:

```powershell
git push --force
```

especially on `main`.

### Pull before starting work

Always synchronize with the latest `main`.

### Commit coherent work

Do not wait until hundreds of unrelated changes accumulate.

### Check your branch

Before working:

```powershell
git branch
```

### Communicate before touching shared code

If another teammate is actively working on the same files/modules, coordinate first.

---

# 16. Handling Uncommitted Work

If you have changes that are not committed:

```powershell
git status
```

Do not blindly pull or merge.

If the changes are ready enough for a checkpoint:

```powershell
git add .
git commit -m "wip: checkpoint before sync"
```

Then synchronize with `main`.

Do not delete or overwrite another teammate's work to resolve a Git problem without understanding the conflict first.

---

# 17. Documentation Rules

Project documentation is treated as an execution contract.

Do not casually modify:

```text
BRAIN.md
architect.md
TEAM.md
plan.md
roadmap.md
PRD.md
RULES.md
SUBHAM.md
SNIGDHAA.md
SK.md
ZOYA.md
BONISHA.md
```

during ordinary implementation.

If implementation reveals:

* a genuine contradiction
* a missing requirement
* an architectural problem
* a necessary scope change

report it to Subham.

Do not silently change the architecture.

Documentation changes should be separated from implementation changes whenever practical.

---

# 18. Definition of a Good Development Cycle

Each work cycle should look like:

```text
READ DOCUMENTATION
        ↓
UNDERSTAND TASK
        ↓
CHECK OWNERSHIP
        ↓
CHECK DEPENDENCIES
        ↓
UPDATE BRANCH
        ↓
IMPLEMENT
        ↓
TEST
        ↓
git status
        ↓
COMMIT
        ↓
PUSH
        ↓
PULL REQUEST
        ↓
REVIEW
        ↓
MERGE
        ↓
SYNC BRANCH
        ↓
NEXT TASK
```

---

# 19. First-Day Checklist

Before considering yourself started:

* [ ] Repository cloned
* [ ] `main` pulled
* [ ] Assigned branch created
* [ ] Relevant project MDs read
* [ ] Role document read
* [ ] Current architecture understood
* [ ] Ownership boundaries understood
* [ ] Current task understood
* [ ] Relevant dependencies identified
* [ ] Implementation started only after the above

---

# 20. Core Principle

DORMDESK is being built as one integrated platform.

Do not build isolated features that happen to share a repository.

Every implementation should fit into the agreed:

```text
Product
   ↓
Architecture
   ↓
Contracts
   ↓
Ownership
   ↓
Implementation
   ↓
Integration
```

When something does not fit, stop and coordinate rather than silently creating a parallel system.

```
```

# 21. Local Demo Setup

## Prerequisites
- Node.js (v18+)
- npm

## Database Deployment
DORMDESK relies strictly on authoritative Prisma migrations. Ordinary startup does **not** mutate the database schema.

To deploy committed migrations to your local database (or a fresh instance), run:
`powershell
npm run db:deploy
`
If this is a fresh setup, you will also need to seed the database:
`powershell
npx prisma db seed
`
*(Note: The seed script is inherently destructive and performs a `deleteMany` across all tables. It is designed exclusively for fresh setups and explicit resets, and must never be run against a production database.)*

## Quick Start (Normal Startup)
DORMDESK is a Next.js full-stack application (frontend and API routes run together in one process). There is NO separate backend server to start.

To start the development server against an already migrated database, run:
`powershell
npm run local
`
*(Note: This command explicitly assumes the database exists and has been migrated. It will NOT run `prisma db push`.)*

## Demo Reset
If you need to explicitly destroy and recreate the local deterministic demo state, use:
`powershell
npm run local:reset
`
*WARNING: This will destroy all your local data, redeploy all migrations from scratch, run the deterministic seed, and start the app.*

## Running Manually
If you just want to run the server without setup checks:
`powershell
npm run dev
`

## Demo Accounts
The database is seeded with deterministic, fictional local accounts. The password for all seeded accounts is: **dormdesk2026**

- **Student:** student@demo.local
- **Staff:** staff@demo.local
- **Warden:** warden@demo.local
- **Admin:** dmin@demo.local

## Testing
The repository uses Vitest for deterministic backend/service testing.
Run the test suite:
`powershell
npm test
`
