# DormDesk --- Roadmap (Sep 19 → Oct 10 Mid-Evaluation)

> Execution plan derived from `brain.md` v3 (§3A Execution Decisions) and `plan67.md`. This is the working plan for the team; `brain.md` stays the reference spec for *why*, this file is *what to do, in what order*.

## Non-Negotiables (check every week)

1. Complaint, Leave/Gate-Pass, and Certificate are **rows of one Request table**, not three separate systems. If backend starts building type-specific tables/APIs, stop and fix before continuing.
2. Every new feature must reduce a queue, a visit, or a phone call — if it doesn't, cut it.
3. Finished and demoable beats architecturally impressive and half-done.

## Stack

Next.js (frontend + API routes, one codebase) · SQLite + Prisma. The primary hackathon demo runs on a host laptop. Users access it over LAN/Wi-Fi/hotspot. Public deployment is optional. See `architect.md` §29.

---

## Week 1 (Sep 19 – Sep 25): Foundation

**Goal:** one workflow works end to end. Ugly UI is fine; wrong data model is not.

- [x] Project skeleton on Next.js, repo set up, local network deployment tested (run on host laptop on day 1, not day 14)
- [x] Prisma schema for the **unified Request model**: type, requester, assignee, status, priority, SLA due date, escalation level, audit log — lock this before any workflow code is written
- [x] Auth + roles (student, warden, admin — minimum viable, hierarchy config can be simple/hard-coded for now)
- [x] Backend: Complaint workflow fully wired to the Request model (submit → route → status)
- [x] Frontend: student request form + "my requests" status view, calling the real API (no mocked data)
- [x] Clock service stub in place (SLA/escalation reads time from one function, not `Date.now()` scattered everywhere) — needed for Week 2's live SLA breach demo

**End-of-week checkpoint:** a student can submit a complaint and see its real status. If this isn't true by Sep 25, Week 2 scope needs to shrink.

---

## Week 2 (Sep 26 – Oct 2): Breadth + Differentiators

**Goal:** 3 workflows live, Operations Command Center real, first zero-touch rule working.

- [x] Add Leave/Gate-Pass and Certificate workflows **onto the same engine** — this is the test of Week 1's data model. If adding them requires new tables or duplicated logic, the foundation is wrong; fix it before moving on.
- [x] Admin dashboard: pending count, ageing buckets, resolution time, one recurring-issue flag, staff workload — this alone covers the 20%-weighted admin-visibility criterion
- [x] Zero-touch rule #1: leave ≤2 days auto-approves (Differentiator 2) — cheap, high payoff, do this before anything fancier
- [x] Certificate auto-issue with a QR verification page
- [x] Duplicate detection + Nudge button (Differentiator 3) — block resubmission of an open request, show "already pending since [time]"
- [x] Notice/notification board with read tracking (in-app only — skip SMS integration, simulator only per §3A)
- [x] Scholarship Status Tracking — student visibility into current-year scholarship state (ELIGIBLE → APPLIED → ... → DISBURSED) + seeded demo data.
- [ ] **Stretch, only if backend has real slack:** config-driven new request type (Differentiator 1) — attempt this now, not in Week 3, so there's time to fix it if it breaks

**End-of-week checkpoint:** all 3 workflows work, the dashboard shows real (not fake) ageing/workload numbers, and at least one request type never touches a human.

---

## Week 3 (Oct 3 – Oct 9): Accessibility, Data, Rehearsal

**Goal:** the demo is real, measured, and rehearsed — not scrambled together the night before.

- [ ] One real accessibility moment (Differentiator 5): throttled-connection test or a cold, unfamiliar user operating the app on camera. Pick one language toggle (Odia or Hindi + English) — not both.
- [ ] Seed realistic demo data: ~6 months of fake request history, one hostel with a planted recurring issue, one overloaded staff member, a few requests of varied age (including a long-open one) — this is what makes the dashboard look real instead of empty
- [ ] Get real friction numbers: time an actual task (e.g. walking to get a bonafide certificate) and fold in the 37-response survey data into the Friction Scorecard (see `plan67.md` §20 / `brain.md` §35) — replace every `[measure]` placeholder
- [ ] Live Incident joining + SLA breach demo: Student reports problem → joins existing incident → advance time → SLA breach → escalation → staff resolution → student verification → recurring issue detected.
- [ ] Judge Q&A prep pass (`brain.md` §35 already has a draft list — rehearse answers out loud, don't just read them)
- [ ] Rehearse the full demo script at least 3 times, timed
- [ ] Record a backup video of the complete flow in case of live-demo failure

**End-of-week checkpoint (Oct 9, day before eval):** demo run start-to-finish with no one touching code, backup video exists, scorecard has real numbers, not placeholders.

---

## TARGET HERO DEMO

**The Hero Demo:**
1. Student reports problem
2. Related request detected (Incident Intelligence)
3. Student joins existing incident ("Me Too")
4. Automatic routing & Assignment
5. SLA countdown & warning
6. Escalation
7. Staff resolution & Resolution evidence
8. Student verification (Resolve → Verify → Close)
9. Recurring issue detected (Admin Operations Command Center)

Pitch opening → survey stats cold (no slide) → Hero Demo → Operations Command Center → engine reveal (add new request type live, if built) → close on adoption/rollout note.

## Cut List (do not build these for Oct 10 — see `brain.md` §3A)

Offline-first sync · real SMS gateway · more than one non-English language · hash-chained audit trail. Revisit only if all of Week 1–3 above is done early and stable.

## Open Items to Confirm

- Team structure is locked (Subham/Overseer+Backend, Snigdhaa/Platform, SK/Design, Zoya/Student-UI, Bonisha/Admin-UI).
- Whether the config-driven module reveal is attempted or dropped, decided at the Week 2 checkpoint based on backend slack
- Demo slot length and format (live in front of judges vs. screen share) — affects how much of the script needs to be scripted vs. adaptive
