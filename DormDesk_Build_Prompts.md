# DormDesk: Build Prompts (BPUT Hackathon 2026, PS-07)

Run in your coding agent from the project root, **one prompt at a time, in order**.
After each: check it manually in the browser, then `git tag after-<letter>`. If a prompt breaks something, `git reset --hard` to the previous tag.

## Schedule (3 days)

| Day | Prompts | Est. hours |
|---|---|---|
| 1 | 0 (safety snapshot), A (quick fixes + seed), B (targeted announcements) | 5.5 |
| 2 | C (admin insight), D (mess), E (warden desk + SMS outbox) | 8 |
| 3 AM | F (attendance-lite + class cancel), then G (Odia) only if ahead | 3-5 |
| 3 PM | **CODE FREEZE.** H (offline verify), J (demo readiness), rehearse | 3 |

Cut order if behind: G, then F, then D. Never cut A, B, C, E, J.
Prompt I (duplicate detection) is optional; do it only if you finish early.

---

## Prompt 0: Safety snapshot (run once, now)

```
Prepare this repo for changes. Do NOT modify any source code.

1. Run `git status` and show the output. If this is not a git repo, run `git init`.
2. Check .gitignore. Make sure these are ignored: .env*, node_modules, build/dist folders, logs, .next. Do NOT ignore the SQLite .db file; just report whether it is tracked.
3. Scan the changes for secrets (API keys, tokens). If found, do NOT commit; list file paths only (never print values) and stop.
4. If clean, run `git add -A`, `git commit -m "pre-build snapshot"`, then `git tag pre-build`.
5. Find the SQLite database file(s). Copy each to `backups/` with a timestamp in the name. If the DB is in use, use `sqlite3 <db> ".backup <target>"`.
6. Add `backups/` to .gitignore.
7. Report: commit hash, tag, DB path, backup path and size, and any warnings.
```

---

## Prompt A: Quick fixes + richer seed data

```
Rules: don't break existing features; low-bandwidth friendly; no new dependencies unless essential; run npm test, tsc, lint and build; commit when green; report files changed.

1. OfflineProvider: fix the broken `role="status px-4..."` attributes. Use `role="status"` only, with classes in className.
2. src/lib/auth/session.ts: remove the hardcoded JWT fallback secret. In production, throw if the env var is missing; in dev allow a documented dev default.
3. /api/auth/register: restrict so it can only create Student accounts, and add validation (email format, password min length 8, name length limit).
4. Enable SQLite WAL and foreign_keys at startup via Prisma (use $queryRawUnsafe for PRAGMA journal_mode=WAL and $executeRawUnsafe for PRAGMA foreign_keys=ON). Turn off query logging unless env DEBUG_SQL=1.
5. Add an admin-dashboard button "Run SLA check" that calls the existing SLA tick logic server-side for Admin role only (no CRON_SECRET needed from the browser).
6. Extend prisma/seed.js (keep it idempotent): about 40 requests across complaint/leave/certificate/gate pass; add ~20 more students spread across at least 3 hostels, 3 branches and 4 years; varied ages (some 3+ days old, some fresh); at least 4 SLA-breached and 3 warning; recurring issues (e.g. 4 "plumbing|Hostel B Block 2" and 3 "electrical|Hostel A Block 1"); resolved requests with varied resolution times; 2 incidents. Keep the existing 9 demo accounts and password unchanged.

Commit message: "quick fixes + demo seed". Then `git tag after-A`.
```

---

## Prompt B: Targeted announcements with delivery/read/acknowledge tracking

```
Rules: don't break existing features; low-bandwidth friendly; no new dependencies unless essential; run npm test, tsc, lint and build; commit when green; report files changed.

Implement targeted announcements. Reuse existing Notification and audit patterns.

Schema (Prisma migration): Announcement(id, title, body, createdById, targetBranch?, targetYear?, targetHostel?, targetBlock?, requiresAck Boolean, priority, createdAt) and AnnouncementReceipt(id, announcementId, userId, deliveredAt, readAt?, acknowledgedAt?) with unique (announcementId, userId).

Backend:
- POST /api/admin/announcements: Admin/Warden/Faculty only (server-side check). Takes title, body, optional filters (branch, year, hostel, block), requiresAck. Resolves matching students, creates one receipt per student (deliveredAt=now) plus an in-app Notification, and writes an audit log entry. Put the logic in a reusable service function (other features will call it).
- GET /api/admin/announcements/preview?filters: returns matching recipient count (used live in the compose form).
- GET /api/admin/announcements and /[id]: list with delivered/read/acknowledged counts and percentages; detail shows per-student status and who hasn't read/acknowledged.
- Student: GET /api/announcements (replace the empty stub; only their own receipts), POST /api/announcements/[id]/read, POST /api/announcements/[id]/ack. Both idempotent.

UI:
- /admin/announcements: compose form with filter dropdowns, live recipient count, "requires acknowledgement" toggle; list with progress bars (delivered / read / acknowledged).
- /admin/announcements/[id]: per-student table with status filters and an "Unread only" toggle.
- Student notices page: show announcements with unread badge, mark as read on open, "Acknowledge" button when required.
- Add nav links for admin and student.

Add Vitest tests for recipient filtering and read/ack idempotency. Add 3 seeded announcements with mixed read/ack states.

Commit message: "targeted announcements". Then `git tag after-B`.
```

---

## Prompt C: Admin insight (resolution time, staff workload, export)

```
Rules: don't break existing features; low-bandwidth friendly; no new dependencies unless essential; run npm test, tsc, lint and build; commit when green; report files changed.

Improve the admin analytics using real data from existing tables (no hardcoded numbers).

1. Resolution time: average and median hours from createdAt to resolvedAt, overall and by category and priority. Show a 6-week trend (avg resolution time per week) as a simple chart. Use plain SVG or the existing chart approach; do not add a heavy chart library.
2. Staff workload: per assignee show open, overdue, resolved-in-last-7-days, and average resolution time. Highlight the most loaded and the least loaded staff member. Show unassigned count.
3. Ageing: keep the existing buckets and add an "oldest open request" card linking to it.
4. Date range filter (7 / 30 / 90 days / all) applied to analytics.
5. CSV export: requests (ticket, type, category, status, priority, requester, assignee, createdAt, resolvedAt, resolution hours, SLA status) and a workload summary. Admin only, server-side check, filename with date. Respect the date range filter.
6. Fix hardcoded values: programName "General Scholarship" and totalEligible: 0 in getScholarshipStats. Compute them from data or remove the widget.
7. Add an "Insights" box at the top of analytics that generates 3 to 4 plain-language findings from data, e.g. "Plumbing in Hostel B Block 2 has 4 repeat complaints in 30 days", "Average resolution for electrical is X hours vs Y overall", "N requests will breach SLA within 6 hours". Rules-based, computed live.

Add Vitest tests for the resolution-time and workload calculations. Commit message: "admin insight + export". Then `git tag after-C`.
```

---

## Prompt D: Mess menu and feedback

```
Rules: don't break existing features; low-bandwidth friendly; no new dependencies unless essential; run npm test, tsc, lint and build; commit when green; report files changed.

Add a Mess module that plugs into the existing systems.

Schema (migration): MessMenu(id, date, meal [BREAKFAST|LUNCH|SNACKS|DINNER], items String, updatedById, updatedAt) unique (date, meal); MessFeedback(id, userId, date, meal, rating Int 1-5, comment?, createdAt) unique (userId, date, meal).

Student:
- /student/mess: today's menu by meal, a 7-day view, and a rating control (1-5 stars plus optional comment) for meals of today only, one rating per meal, editable same day. Hostel residents only (User.isResident). Add to student nav.
- Works offline for viewing (cache the menu response in the service worker or IndexedDB; keep it simple).

Warden/Admin:
- /admin/mess: edit the weekly menu (grid: day x meal, text items). On saving a change to today's or tomorrow's menu, send a targeted announcement to hostel residents using the announcement service from the announcements feature ("Mess menu updated: <meal> on <date>").
- Mess insights: average rating per meal, per day (7-day trend), lowest-rated meals, comment list with rating filter.
- Auto-flagging: if a meal receives 3 or more ratings of 2 or below in one day, create a Notification to Wardens/Admins and a Request (category MESS, location = hostel, priority HIGH, requester = system user or the first rater as appropriate, description summarizing) so it flows into the existing request queue, SLA and recurring-issue detection. Prevent duplicates for the same meal/day.
- Include mess complaints in the existing recurring-issue grouping.

Seed: 7 days of menu, and about 60 feedback records with one meal that has repeated low ratings (so the auto-flag and recurring issue appear in the demo).

Add Vitest tests for the auto-flag threshold and duplicate prevention. Commit message: "mess module". Then `git tag after-D`.
```

---

## Prompt E: Warden-assisted desk mode + simulated SMS outbox (no-smartphone fallback)

```
Rules: don't break existing features; low-bandwidth friendly; no new dependencies unless essential; run npm test, tsc, lint and build; commit when green; report files changed.

Build the fallback for students who have no smartphone.

Part 1: Desk mode (/admin/desk, Warden/Admin/Staff only, server-side check)
- Search a student by name or email. Show their profile, open requests, and recent notifications.
- "File on behalf": create a request (complaint, leave, certificate, gate pass) for that student through the existing RequestEngine. Store metadata { channel: "DESK", filedById } and log both the student and the filing staff member in the audit trail. Notify the student.
- Add the missing gate pass exitTime field to BOTH the student request form and the desk form (visible when type is gate pass; required; stored in Request.exitTime).
- Printable receipt page /admin/desk/receipt/[id] (print-friendly CSS): ticket number, status, student, type, date, QR code (reuse react-qr-code) so the student can track or show it at the gate.
- Show a "channel" badge (APP / DESK) in the admin request queue and detail; add channel share to analytics (percent filed via desk).

Part 2: Simulated SMS outbox
- Add User.hasSmartphone Boolean default true and User.phone String? (migration). Seed 3 students with hasSmartphone=false and phone numbers (fake).
- Create SmsOutbox(id, userId, phone, body, status [QUEUED|SENT|FAILED], createdAt, sentAt?). Body max 160 chars.
- Create a small adapter interface SmsProvider { send(phone, body) } with a MockSmsProvider that marks messages SENT and logs them. Document where MSG91/Twilio would plug in. Label everything in the UI as "SIMULATED".
- Whenever NotificationService creates a notification (including announcements) for a student with hasSmartphone=false, also enqueue a short SMS (ticket number + status, or announcement title + short body).
- /admin/sms-outbox: table of messages with status, recipient, timestamp; a "Retry failed" button.
- Add a checkbox in the desk-mode student profile to toggle hasSmartphone.

Add Vitest tests for desk-mode creation (audit + metadata) and SMS enqueue rules. Commit message: "desk mode + sms fallback". Then `git tag after-E`.
```

---

## Prompt F: Attendance-lite + class cancellation

```
Rules: don't break existing features; low-bandwidth friendly; no new dependencies unless essential; run npm test, tsc, lint and build; commit when green; report files changed.

Add a lightweight attendance and class-update module.

Schema (migration): Subject(id, code, name, branch, year, facultyId); AttendanceRecord(id, subjectId, studentId, date, present Boolean) unique (subjectId, studentId, date); ClassCancellation(id, subjectId, date, reason, createdById, createdAt).

Faculty:
- /faculty/attendance (Faculty role only): choose subject and date; list the students of that subject's branch and year with everyone defaulting to present; toggle absentees; submit in one request. Upsert so re-submitting the same day edits it.
- "Cancel class" action on a subject/date: creates a ClassCancellation and sends a targeted announcement to that branch and year using the announcement service ("<Subject> class on <date> is cancelled: <reason>").

Student:
- /student/attendance: per-subject percentage with a progress bar, colored under 75%, plus "classes you can miss" or "classes needed to reach 75%". Also show upcoming cancellations. Add to student nav.
- When a student's percentage in a subject first drops below 75%, create one Notification (no repeat spam until they recover above 75% and drop again).

Admin:
- /admin/attendance: list of students below 75% filterable by branch/year/subject, with CSV export.

Seed: 3 subjects for one branch/year, 10 days of records with a few students below 75%, and one cancelled class.

Add Vitest tests for percentage calculation, classes-needed math, and the once-only threshold notification. Commit message: "attendance-lite". Then `git tag after-F`.
```

---

## Prompt G (optional): Odia + English toggle

```
Rules: don't break existing features; low-bandwidth friendly; no new dependencies (no i18n library); run npm test, tsc, lint and build; commit when green; report files changed.

Add a lightweight English/Odia language toggle for the student side only.

- Create src/lib/i18n with two dictionaries (en, or) and a small t(key) helper plus a React context/provider. Persist the choice in a cookie so server components can read it.
- Add a language toggle (EN | ଓଡ଼ିଆ) in the student header and on the login page.
- Translate: login page, student dashboard, new request form (labels, types, priorities, buttons, validation messages), request status labels (all states), notices/announcements page, attendance page, mess page, bottom nav, offline banner.
- Do NOT load a web font for Odia. Use a system font stack that includes Odia-capable fonts (Nirmala UI, Noto Sans Oriya, Kalinga, sans-serif) so there is no extra download. Check line-height so Odia text is not clipped.
- Keep keys organized by page. Any missing key falls back to English.
- Put the Odia strings in one file so a native speaker can review and edit them easily.

Commit message: "odia toggle". Then `git tag after-G`.
```

Note: have an Odia speaker check the translations before the demo.

---

## Prompt H (after freeze): Offline sync + low-bandwidth verification

```
Rules: don't break existing features; no new dependencies unless essential; run npm test, tsc, lint and build; commit when green; report files changed.

1. Offline queue: audit src/lib/services/offline-store.ts and the new-request form. Make sync reliable: on reconnect (online event and on app load) automatically sync queued requests in order with retry and exponential backoff; give each queued request a client-generated UUID stored in metadata and reject duplicates server-side (idempotent), so retries never create two tickets; show per-item status in the UI (Queued offline / Syncing / Failed, tap to retry) and a toast on success.
2. Service worker: fix precache so dynamic pages don't silently fail (precache only static shell assets; use network-first with cached fallback for student pages); ensure the offline fallback works for /student, /student/requests, /student/notices, /student/mess and /student/attendance.
3. Performance for slow networks: lazy-load admin chart components, avoid loading admin code on student routes, ensure images use optimized sizes, and make sure API responses for list pages are paginated or limited.
4. Measure and report (do not guess): production build output sizes per route (first-load JS), gzipped CSS/JS totals, and if Lighthouse is available run it against the student dashboard in mobile mode with slow 4G throttling and report the scores. Also report behavior with Chrome-style throttling to slow 3G if you can simulate it.
5. Write ACCESSIBILITY_NOTES.md with the measured numbers, what works offline, and the fallbacks (desk mode, simulated SMS), for use in the pitch.

Commit message: "offline sync + perf". Then `git tag after-H`.
```

---

## Prompt I (optional, if time): Duplicate detection ("me too")

```
Rules: don't break existing features; low-bandwidth friendly; no new dependencies; run npm test, tsc, lint and build; commit when green; report files changed.

When a student starts a complaint, check for open requests with the same category and location (or same hostel block) created in the last 72 hours. If any exist, show "N similar issue(s) already reported" with the ticket status and a "Me too" button that adds the student as a supporter instead of creating a duplicate. Store supporters (RequestSupporter(requestId, userId) unique) and show the supporter count in the admin queue and detail, and raise priority automatically when supporters >= 3. Notify supporters when the ticket status changes. Add Vitest tests for matching and the priority bump.

Commit message: "duplicate detection". Then `git tag after-I`.
```

---

## Prompt J: Demo readiness (last)

```
Rules: do not add features. Only fix bugs and polish. Run npm test, tsc, lint and build; commit when green; report files changed.

1. Add npm scripts: `demo:reset` (backs up the DB, runs `prisma migrate reset --force`, seeds) and `demo:start` (production build and start).
2. Walk through each demo flow via the actual UI/API and report pass/fail with evidence; fix anything failing:
   a. Student files a complaint, admin assigns it, staff processes it, student verifies, closed.
   b. Leave request auto-approve (2 days or fewer) and a manual-approval leave (more than 2 days), gate pass with exitTime and QR.
   c. Admin sends a targeted announcement (branch/year/hostel), students read and acknowledge, admin sees percentages.
   d. Warden desk mode files a request for a no-smartphone student; the simulated SMS appears in the outbox.
   e. Mess: low ratings auto-create a flagged request visible in the admin queue.
   f. Attendance: faculty marks and cancels a class; student sees percentage and cancellation notice.
   g. Offline: submit a request while offline, reconnect, confirm it syncs once with no duplicates.
   h. Admin dashboard, analytics, and CSV export.
3. Add loading states and error boundaries to the main student and admin pages so no screen ever shows a raw error or blank page. Add empty states with helpful text.
4. Remove debug logging and any console errors on the main flows. Check the browser console for warnings on each page.
5. Verify the production build works on a phone over LAN (report the URL pattern and any host/cookie issues to fix).
6. Create DEMO.md: accounts per role, exact click path for a 5-minute demo, reset command, and a "if something breaks" table. Create a README.md section for setup.
7. Confirm the DB file and seed are in the final commit state, run `npm run demo:reset`, and report the resulting counts of users, requests, announcements, mess records and attendance records.

Commit message: "demo readiness". Then `git tag demo-ready`.
```

---

## Optional: security pass (run after B, before the freeze)

Use your CodersVoice audit prompt, but **stop after Phase 3** and add this line at the very end of the prompt:

```
After Phase 3, do NOT ask for approval to implement everything. Implement only Critical and High findings that are small and low-risk (weak or missing server-side authorization, missing input validation on existing endpoints, information leaks in responses, missing security headers, rate limiting on login). Skip anything that changes existing behavior or needs a redesign. Run tests, tsc, lint and build; commit as "security hardening"; then list the remaining Medium/Low items for the pitch as "future hardening".
```

---

## Final checklist before the evaluation

- [ ] `git tag demo-ready` exists and `npm run demo:reset` works from a clean clone
- [ ] Backup copy of the seeded `.db` file outside the repo
- [ ] Demo works on your laptop and once on a phone over LAN
- [ ] Backup screen recording of the full demo (in case Wi-Fi or the app fails)
- [ ] Airplane-mode offline demo rehearsed at least twice
- [ ] Pitch, demo script and adoption note ready (Claude writes these)
- [ ] Odia strings reviewed by a native speaker (if you did G)
