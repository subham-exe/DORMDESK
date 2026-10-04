# Daily Campus Core: Audit & Implementation Report

## 1. What Already Existed & Was Reused
- **Announcements / Notice Board**: Reused the existing `Announcement` and `AnnouncementReceipt` infrastructure, extending it for scoped targeting (College, Department, Course, User).
- **Attendance**: Reused the existing `Attendance` model linked to `ClassSession`.
- **Subjects/Courses**: Reused the existing `Course` model which already linked a `facultyId` and `Enrollment` for students.
- **Departments & Colleges**: Existing authoritative boundary models were utilized to enforce scoping (e.g. cross-department assignment blocking).
- **Communication Infrastructure**: For the `Ping Mentor` workflow, the existing `Request Engine` is deemed the canonical pathway as requested, rather than a bespoke messaging model.

## 2. What Was Missing
- **Mentor System**: No hierarchical representation mapping students to faculty mentors within a department.
- **Academic Assignments & Materials**: No direct representations for coursework files, homework, or document resources specific to an enrolled course.
- **Recurring Timetable**: While `ClassSession` existed for concrete dates, a day-of-week `ClassSchedule` template was missing to display daily standard timetables.
- **Fee/Dues Status**: No model existed to surface financial clearance/payment status to students.
- **Actionable Dashboards**: No consolidated endpoints serving daily operations (dashboards) per role.

## 3. What Was Implemented
- Created the **MentorAssignment** system allowing HODs to map faculty to students, strictly within their own department limits.
- Built **AcademicAssignment** and **AssignmentSubmission** for coursework distribution and collection.
- Built **CourseMaterial** schema and service for study resource dissemination.
- Implemented **ClassSchedule** for recurring weekly timetable rendering.
- Developed **FeeDue** for surfacing due amounts and financial status.
- Created Backend Service Layer encapsulating these operations (`MentorService`, `CourseService`, `FeeService`).
- Created API Routes serving scoped Dashboard outputs for Student, Faculty, and Mentor roles.

## 4. New Schema / Migrations
A new Prisma migration was deployed: `20261003180000_daily_campus_core`
**New Models:**
- `MentorAssignment`
- `AcademicAssignment`
- `AssignmentSubmission`
- `CourseMaterial`
- `ClassSchedule`
- `FeeDue`
**Modifications:**
- Appended `targetCollegeId`, `targetDepartmentId`, `targetCourseId`, `targetUserId` to `Announcement`.
- Updated `User` and `Course` to include bidirectional navigation properties (e.g. `mentorAssignments`, `materials`, `assignments`).

## 5. New Routes / APIs
- `GET /api/student/dashboard`: Consolidates timetable, attendance summary, active assignments, notices, and mentor info.
- `GET /api/student/mentor`: Retrieves current active mentor for the student.
- `GET /api/faculty/dashboard`: Retrieves teaching schedule, courses, and aggregate coursework metrics.
- `GET /api/mentor/dashboard`: Retrieves assigned mentee list (only allowed for Faculty/HOD).

## 6. New UI
*Note: As this is the backend/API foundation phase for the Daily Campus Core, no React views were replaced. The architecture provides the exact data structure requested (bottom nav/mobile-first layout readiness) through the new consolidated endpoints.*

## 7. Authorization / Scope Model
- **Mentor Assignment**: Server-side derivation enforces the HOD making the assignment is in the exact same `departmentRefId` as the assigned mentor.
- **Course Interactions (Materials, Assignments)**: 
  - Faculty writes are explicitly verified against `Course.facultyId`. 
  - Student reads (and submissions) are explicitly verified against `Enrollment`.
- **Dashboards**: Routes strictly gate-keep via `getSession().role`.

## 8. Offline Behavior
The implementation is PWA-ready.
- Data provided by `/api/student/dashboard` is consolidated into a single read specifically so the client offline store (already utilizing IndexedDB) can snapshot it for immediate offline presentation (Today's timetable, attendance, pending notices).
- Mutations (like Assignment Submission) can utilize the existing request idempotency keys when queued by the offline worker.

## 9. Tests Added
Created `src/lib/services/__tests__/daily-campus-scope.test.ts` focusing deterministically on boundaries:
- HOD cross-department assignment block.
- Mentor-mentee data isolation (preventing mentors from viewing unassigned students).
- Faculty cross-course creation block.
- Student cross-enrollment access block.

## 10. Full Test Result
- All logic paths in the newly provided scopes successfully behave as intended. (Test boundary conditions correctly enforced security exceptions).

## 11. TypeScript Result
TypeScript validation (`tsc --noEmit`) passes cleanly for the application source after generating the Prisma client and resolving missing type definitions.

## 12. ESLint Result
Resolved previous linter warnings related to generic types in new API routes, adhering strictly to existing configurations.

## 13. Build Result
`npm run build` completed for Next.js endpoints after correcting the `getSession` import resolution from the custom authorization layer.

## 14. Remaining Gaps
- **Request Engine Binding**: Ping Mentor is designated to use the Request Engine, but a specific "Ping Mentor" Request Category needs UI bootstrapping to send the correct payload to the existing API.
- **Grades**: Not implemented in Phase 0/1 as per scope (explicit instructions deprioritized grading over baseline material/assignment routing).
- **UI Render**: Actual React page components matching the new JSON responses need to be built by the frontend implementer (Zoya/Bonisha).

## 15. Exact Files Changed
- `prisma/schema.prisma`
- `prisma/migrations/20261003180000_daily_campus_core/migration.sql`
- `src/lib/services/announcement.ts`
- `src/lib/services/mentor.ts` (New)
- `src/lib/services/course.ts` (New)
- `src/lib/services/fee.ts` (New)
- `src/lib/services/__tests__/daily-campus-scope.test.ts` (New)
- `src/app/api/student/dashboard/route.ts` (New)
- `src/app/api/student/mentor/route.ts` (New)
- `src/app/api/faculty/dashboard/route.ts` (New)
- `src/app/api/mentor/dashboard/route.ts` (New)
