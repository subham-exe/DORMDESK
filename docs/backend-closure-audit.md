# DORMDESK — DAILY CAMPUS CORE BACKEND CLOSURE AUDIT

## A. VERIFIED
- **Student Dashboard (`/api/student/dashboard`)**: Genuinely secure. Queries use `where: { studentId: user.id }`. Enforces isolation so a student can only access their own timetables, assignments, attendances, notices, and active mentor. No direct object reference (IDOR) can expose another student's data.
- **Faculty Dashboard (`/api/faculty/dashboard`)**: Securely scoped using `facultyId: user.id`. Faculty only see classes they explicitly teach.
- **Mentor Dashboard (`/api/mentor/dashboard`)**: Securely scoped using `mentorId: user.id`. Mentors only see their specifically assigned mentees.
- **FeeService**: Genuinely secure. Queries strictly isolate to the active student's `feeDue`s.
- **CourseMaterial / Assignments Access**: Genuinely secure via server-side `isEnrolled` lookup checking against the `Enrollment` linkage.
- **Dashboard Role Authorization**: Validated that role + server-derived scopes are correctly employed (`getCurrentUser()` ensures valid DB resolution, not just token claims). Dashboard authorization is **ROLE + SERVER-DERIVED SCOPE**.

## B. BLOCKERS (Discovered during Audit)
1. **MentorAssignment Cross-College/Department Risk**: Initially allowed an HOD to assign mentors outside their own department or assign students from outside their scope.
2. **AnnouncementService Target Forgery**: Lacked publisher validation, meaning a malicious faculty could theoretically target the entire college by passing arbitrary `targetCollegeId`.
3. **Audit Omission**: `AcademicAssignment` and `CourseMaterial` lacked `AuditLog` generation for privileged mutations (creation by Faculty).
4. **Missing Submission Flow**: The `submitAssignment` workflow was absent entirely, preventing end-to-end coursework safety.
5. **Session Identity Ambiguity**: APIs incorrectly used `getSession()` which returns a loosely-typed payload, instead of properly resolving the deterministic database-backed `getCurrentUser()`.

## C. FIXES (Surgically Applied)
1. **Mentor Scope Locked**: Updated `MentorService.assignMentor` to strictly validate `hod.collegeId === mentor.collegeId` and `hod.departmentRefId === mentor.departmentRefId` (and equivalent boundaries for the student). Additionally, implemented active-state exclusivity (transactionally deactivating previous mentors when a student receives a new one).
2. **Announcement Targeting Secured**: Rebuilt `AnnouncementService.create` to strictly enforce publisher scope:
   - Students are blocked from publishing.
   - Faculty can only target `targetCourseId` that match their own `facultyId`.
   - HODs can only target their own `departmentRefId`.
   - Explicit verification prevents arbitrary ID manipulation.
3. **Course Operations Completed**: 
   - Built `CourseService.submitAssignment` with explicit IDOR protection (`isEnrolled` check).
   - Added atomic `AuditLog` insertions (via `$transaction`) to `createMaterial`, `createAssignment`, and `submitAssignment`.
4. **API Refactor for Deterministic Scoping**: Updated all Dashboard endpoints to use `getCurrentUser()`. This deterministically resolves the authenticated identity against the database, guaranteeing safe extraction of `user.id` for scope filters.

## D. DEFERRED (By Requirement)
- **Ping Mentor UI / Request Engine Binding**: Frontend UI is needed to wire up structured requests from student to mentor (Request Engine API is available).
- **Grades**: Explicitly out of scope for Daily Campus Core backend foundation phase.
- **Offline UI Integration**: IndexedDB integration for PWA dashboards must be connected in the React client. (Backend is successfully delivering single-pass offline-ready payloads in `/api/student/dashboard`).
- **Payment Processing Integration**: Fee gateway implementation deferred as requested; only baseline `FeeDue` status tracking is implemented.

## E. VALIDATION
- **Total Tests**: Security boundary testing executed, verifying cross-college and IDOR blocks successfully trap unauthorized calls.
- **TypeScript**: `tsc --noEmit` validates the updated API endpoints correctly type the `user.id` and models safely.
- **ESLint**: Codebase static analysis passed cleanly across the surgical fixes.
- **Build**: Statically analyzed Next.js endpoints are verified as valid exports and route handlers.

## F. EXACT FILES CHANGED
- `src/lib/services/mentor.ts`
- `src/lib/services/course.ts`
- `src/lib/services/announcement.ts`
- `src/app/api/student/dashboard/route.ts`
- `src/app/api/student/mentor/route.ts`
- `src/app/api/faculty/dashboard/route.ts`
- `src/app/api/mentor/dashboard/route.ts`
