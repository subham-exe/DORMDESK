# Campus Operations Platform - PLAN

## 1. Product Vision

Build a unified campus operations platform that replaces fragmented registers, notice boards, WhatsApp groups, paper forms, repeated office visits, and person-dependent processes with one accountable digital workflow.

Core principle:

> We don't digitize campus paperwork. We digitize campus accountability.

The platform should work for both students and institutional staff, with hostel operations as a major use case while remaining campus-wide.

---

## 2. Problem Understanding

The BPUT Hackathon 2026 Problem Statement 07 asks for a working solution to everyday campus operational friction. The expected solution should support at least three distinct end-to-end workflows, an administrator dashboard, targeted communication with tracking, accessibility for low-end/poor-network conditions, a fallback for students without smartphones, and a realistic adoption/migration plan.

The major problem areas identified in the problem statement are:

- Student operations
- Hostel and facility operations
- Communication
- Administrator visibility
- Accessibility and low-bandwidth operation
- Optional intelligence such as routing, recurring-issue detection, demand prediction, and chatbot support

Our exploratory hostel survey with 37 responses is used as problem validation for the hostel/facility side of the product. It should not be presented as statistically representative of all students.

Key survey signals:

- Complaint reporting is highly fragmented and frequently person-dependent.
- Students often have to follow up themselves to know what happened.
- Automatic escalation is uncommon.
- Students strongly value centralized complaint submission, complaint tracking, faster leave/gate-pass processing, knowing who is responsible, and visibility into hostel-wide issues.
- Common hostel pain points include mess/food quality, cleanliness, bathroom/toilet maintenance, Wi-Fi, water, electricity, and complaints not being addressed.

---

## 3. Product Positioning

Do NOT position the product as merely:

- A hostel management app
- A student portal
- A complaint management system
- An AI chatbot
- A collection of unrelated campus modules

Position it as:

> A campus operations platform that turns everyday requests into accountable, trackable workflows.

Hostel operations are a high-intensity use case, but the architecture is campus-wide.

---

## 4. Core Product Model

Everything revolves around one universal request engine.

Student or staff action:

REQUEST
→ CLASSIFY
→ ROUTE
→ ASSIGN
→ ACKNOWLEDGE
→ PROCESS
→ RESOLVE
→ VERIFY
→ CLOSE
→ LEARN

Every request should have a consistent structure:

- request_id
- requester
- request_type
- category
- location
- priority
- department/domain
- assigned authority
- SLA/deadline
- status
- attachments
- timestamps
- approval chain
- incident_id, if related
- resolution notes
- feedback
- audit history

The student should not need to understand the institution's internal bureaucracy. They should simply describe what they need. The system determines the appropriate workflow.

---

# 5. Major Differentiator: Incident Intelligence

## Core concept

Do not treat every complaint as an independent ticket.

Detect when multiple requests are symptoms of the same underlying problem.

Example:

12 students report:

- no water
- water unavailable
- bathroom taps dry
- no water in block B

Instead of creating 12 unrelated tickets:

12 requests
→ same location
→ same category
→ same time window
→ same infrastructure
→ ONE INCIDENT

Example incident:

INCIDENT #WTR-042
Water Supply Failure
Hostel B - Block 2
12 affected students
Maintenance Team B
SLA: 4 hours

One operational resolution can automatically update all affected students.

## Why this matters

This changes the product from:

> complaint management

to:

> campus operational intelligence

The administrator sees underlying incidents rather than being buried under duplicate complaints.

---

# 6. Incident Lifecycle

REQUEST
→ CLASSIFIED
→ MATCHED TO EXISTING INCIDENT OR NEW INCIDENT
→ ASSIGNED
→ ACKNOWLEDGED
→ IN PROGRESS
→ RESOLVED
→ STUDENT/REQUESTER VERIFIED
→ CLOSED

If the SLA expires (evaluated via the simulated demo clock for the hackathon):

ASSIGNED STAFF
→ SLA WARNING
→ SUPERVISOR
→ WARDEN / HOD / DOMAIN AUTHORITY
→ CAMPUS ADMINISTRATOR FOR CRITICAL CASES

Escalation must preserve the complete context and audit history.

---

# 7. Authority and Access Model

Use:

> Role + Domain + Scope + Permission

Do not model the institution as one simple linear hierarchy.

## Top-level institutional authority

### Principal

Scope:
- Entire institution

Capabilities:
- Institution-wide operational visibility
- Institution-wide analytics
- Major escalations
- Policy/workflow oversight
- Authority structure management
- Audit-log visibility

---

## Academic Domain

### HOD

Scope:
- Assigned department

Capabilities:
- Department requests
- Department staff/faculty management
- Department-level escalations
- Department analytics
- Authorized approvals

### Professor / Faculty

Scope:
- Assigned department/classes

Capabilities:
- Attendance
- Academic requests
- Student communication
- Assigned request handling
- Authorized approvals

---

## Hostel Domain

### Warden

Scope:
- Assigned hostel(s)

Capabilities:
- Hostel requests
- Leave/gate-pass approvals
- Hostel complaint management
- Staff assignment
- Escalation
- Hostel analytics

### Hostel Staff

Scope:
- Assigned hostel

Capabilities:
- View assigned requests
- Update request status
- Add notes/evidence
- Work on assigned tasks

---

## Facilities / Maintenance Domain

### Maintenance Supervisor

Scope:
- Assigned facility/hostel/area

Capabilities:
- Assign maintenance work
- Track maintenance workload
- Escalate overdue tasks
- View facility incidents

### Maintenance Staff

Scope:
- Assigned work/area

Capabilities:
- Accept assigned work
- Update status
- Add resolution notes
- Upload evidence
- Mark work complete

---

## Finance Domain

### Accounts Staff

Scope:
- Financial/fee operations

Capabilities:
- View fee/dues requests
- Verify payment status
- Process authorized financial requests
- Issue financial notices
- Handle authorized adjustments/refunds
- Escalate unresolved cases

Accounts should not automatically access unrelated hostel, attendance, or academic data.

---

## Administration Domain

### Admin / Office Staff

Scope:
- Assigned administrative services

Capabilities:
- Process certificates
- Handle general requests
- Manage authorized notices
- Track administrative workflows
- Escalate requests

---

## Student

Students are service/request users rather than part of the authority chain.

Profile includes:

- student ID
- name
- department
- year
- branch
- hostel/day-scholar status
- hostel/block/room where applicable

---

# 8. Residence-Aware Experience

The product is campus-wide, not hostel-only.

Residence type is a user attribute.

## Everyone gets

- Attendance
- Timetable/class updates
- Certificates/documents
- Fees/dues
- Notices
- General requests
- Campus complaints
- Communication

## Hostel residents additionally get

- Room/facility complaints
- Mess
- Hostel notices
- Leave/gate pass
- Visitor/gate workflows

## Day scholars can additionally receive relevant

- Campus access information
- Transport information, if supported by the institution
- Parking/access workflows, if applicable
- General campus services

Do not create separate applications for hostel residents and day scholars. Use one platform with context-aware services.

---

# 9. Student Experience

The student interface should remain simple.

Instead of forcing students to understand bureaucratic categories, provide three primary actions:

### Report something

Example:
> The fan in my room is not working.

### Request something

Example:
> I need a bonafide certificate.

### Ask something

Example:
> Is the mess open today?

The system determines the appropriate workflow.

---

# 10. Flagship Workflow 1: Smart Complaint / Incident

Example:

Student:
> Water is not available in Hostel B.

System:

1. Creates request
2. Classifies as water supply
3. Detects location
4. Checks existing incidents
5. Matches related complaints
6. Creates or attaches to incident
7. Assigns responsible maintenance team
8. Starts SLA
9. Tracks acknowledgement
10. Tracks progress
11. Escalates if overdue
12. Updates all affected students
13. Requests resolution confirmation
14. Closes incident
15. Stores analytics/history

Admin sees one incident with affected-student count rather than many disconnected complaints.

---

# 11. Flagship Workflow 2: Leave / Gate Pass

Student:

1. Creates leave request
2. Provides required details
3. System checks applicable rules
4. Routes to authorized approver
5. Warden/faculty/authority approves or rejects
6. Student receives notification
7. Digital pass/QR is generated if applicable
8. Security verifies the pass
9. Entry/exit can be recorded
10. Full action history is retained

Goal:

Remove repeated paperwork, unclear approvals, and situations where one authority has approved something but another authority has no visibility.

---

# 12. Flagship Workflow 3: Targeted Communication

Admin creates an announcement.

Example:

> Water maintenance in Hostel B from 2 PM to 5 PM.

System determines target audience:

Hostel B residents

Then:

ADMIN
→ TARGET AUDIENCE
→ NOTIFICATION
→ DELIVERY
→ READ
→ ACKNOWLEDGEMENT / ACTION
→ TRACKING

Avoid broadcasting everything to everyone.

This replaces fragmented WhatsApp communication while retaining a formal record.

---

# 13. Optional Flagship Workflow: Administrative Request

Example:

Bonafide certificate.

Student:
→ submits request
→ system routes to office/admin
→ staff verifies
→ authorized authority approves
→ certificate generated
→ student notified
→ request closed
→ audit history retained

This can be used as the third workflow instead of communication if it produces a stronger demo.

---

# 14. Admin Command Center

The admin dashboard should be the product's intelligence layer.

## Top-level KPIs

- Open requests
- Overdue requests
- Active incidents
- Average resolution time
- Escalated cases
- Students affected
- Recurring issues

## Attention Required

- Requests past SLA
- Unassigned requests
- Escalated incidents
- High-impact incidents
- Repeated issues

## Recurring Issue Detection

Example:

Hostel B
- Water: 18 complaints
- Wi-Fi: 9 complaints
- Sanitation: 7 complaints

System flags:

> Recurring infrastructure issue detected.

## Workload Distribution

Example:

Maintenance Team
- Staff A: 14 open
- Staff B: 8 open
- Staff C: 3 open

This helps administrators identify workload imbalance.

---

# 15. Campus Health Layer

The dashboard should evolve beyond a ticket count.

Potential indicators:

- Resolution health
- SLA compliance
- Incident recurrence
- Complaint concentration
- Affected student count
- Department workload
- Hostel/facility hotspots

Example:

HOSTEL B
- Water incidents ↑
- Wi-Fi incidents ↑
- Sanitation incidents stable

The purpose is to help administrators move from reactive complaint handling toward preventive operations.

---

# 16. Intelligence / AI Layer

AI should support the workflow, not be the product itself.

## AI / automation opportunities

### Classification

Convert natural language into:

- category
- department
- location
- priority
- request type

### Routing

Automatically identify responsible department/authority.

### Incident clustering

Identify related complaints that may represent one underlying incident.

### Recurring issue detection

Detect repeated problems over time.

### Demand prediction

Optional future capability for:

- facilities
- mess demand
- maintenance workload
- service requests

### FAQ / campus assistant

Answer common questions using verified institutional information.

Do not add AI simply for presentation value. Every intelligence feature must solve an operational problem.

---

# 17. Audit Trail

Every important action should be recorded.

Example:

09:14 - Student submitted request
09:14 - System classified request
09:15 - Matched to Incident WTR-042
09:16 - Assigned to Maintenance Team B
10:02 - Staff acknowledged
11:17 - Marked in progress
13:41 - SLA warning
14:00 - Escalated to Warden
14:22 - Reassigned
16:08 - Marked resolved
16:20 - Student verified resolution

The audit trail answers:

- What happened?
- When?
- Who acted?
- Who was responsible?
- How long did it take?
- Why was it escalated?
- Who resolved it?

---

# 18. Notifications

Notifications should be event-driven.

Examples:

- Request received
- Request assigned
- Request acknowledged
- Status changed
- Approval required
- Request approved/rejected
- SLA warning
- Escalation
- Incident update
- Resolution requested
- Announcement

Support targeted delivery by:

- institution
- department
- branch
- year
- batch
- hostel
- block
- role

Track:

- sent
- delivered
- read
- acknowledged
- action completed

---

# 19. Accessibility / Reality Layer

This is a required part of the product, not a decorative feature.

## Low-bandwidth mode

- Lightweight UI
- Minimal images
- Small payloads
- Cached essential data
- Offline request queue
- Sync when connection returns

Example:

REQUEST SAVED LOCALLY
→ CONNECTION RESTORED
→ REQUEST SYNCHRONIZED

## Low-end device support

- Responsive UI
- Lightweight components
- Avoid unnecessary animations
- Minimal data usage
- Fast initial load

## No-smartphone fallback

Provide a staff-assisted/kiosk/help-desk mode.

Staff can create a request on behalf of a student using:

- Student ID
- Request details
- Relevant category/location

The same universal request engine handles it.

---

# 20. Security / Permission Principle

Use least-privilege access.

Examples:

- Maintenance staff should not see fee records.
- Accounts staff should not see unrelated hostel complaints.
- Faculty should not automatically see financial data.
- Warden should see assigned hostel operations.
- Principal/admin can have institution-wide oversight.
- Students can only access their own requests and relevant communication.

Permissions should be configurable rather than hard-coded to job titles.

---

# 21. Core Data Model

Main entities:

- User
- Student
- Staff
- Role
- Permission
- Department
- Domain
- Hostel
- Block
- Room
- Facility
- Asset
- Request
- Incident
- Approval
- Assignment
- SLA
- Notification
- Announcement
- AuditLog
- Resolution
- Feedback
- Attachment

Important relationships:

User
→ Role
→ Permissions
→ Scope

Request
→ Requester
→ Department
→ Assignee
→ SLA
→ Incident
→ Approval
→ AuditLog
→ Resolution

Incident
→ Multiple Requests
→ Affected Students
→ Assigned Team
→ SLA
→ Resolution

---

# 22. Technical Architecture Direction

Recommended high-level architecture:

Frontend
→ Authentication
→ Role-aware dashboard
→ Request interface
→ Notifications
→ Admin command center

Backend API
→ Authentication / RBAC
→ Request engine
→ Workflow engine
→ Incident engine
→ Notification service
→ Audit service
→ Analytics service
→ AI/automation service

Database
→ Users
→ Organizational structure
→ Requests
→ Incidents
→ Approvals
→ Notifications
→ Audit logs
→ Analytics data

Optional / Demo Architecture:

Modular Monolith (Next.js API)
→ Simulated Demo Clock / API-triggered evaluation for SLA monitoring and Escalation
→ Incident clustering
→ Notifications
→ Analytics aggregation

---

# 23. Demo Story

The demo should NOT be a feature tour.

Tell one connected story.

### Scene 1: Student

Student reports:

> "No water in Hostel B for the last hour."

### Scene 2: Intelligence

System classifies the request and discovers several similar requests.

It creates/links:

> INCIDENT #WTR-042

### Scene 3: Authority

The incident is automatically routed to the responsible maintenance team.

### Scene 4: Tracking

Staff acknowledges and updates the incident.

### Scene 5: Escalation

If the SLA is missed (triggered by advancing the simulated demo clock), the system automatically escalates to the appropriate authority.

### Scene 6: Communication

All affected students receive the incident update.

### Scene 7: Resolution

Staff resolves the issue.

Students receive the update and verify resolution.

### Scene 8: Admin

Admin dashboard shows:

- affected students
- resolution time
- staff workload
- incident history
- recurring issue pattern

### Scene 9: Day Scholar / Other Domain

Show that the same platform handles a completely different request, such as a certificate or fee-related request, through the appropriate authority.

This proves that the system is campus-wide rather than just a hostel app.

---

# 24. Product Differentiators

Primary:

### 1. Request → Incident intelligence

Multiple complaints can represent one underlying campus incident.

### 2. Accountability engine

Every request has:

- owner
- deadline
- status
- escalation path
- audit trail

### 3. Authority-aware routing

The system understands:

- role
- department/domain
- scope
- permissions
- approval chain

### 4. Affected-student awareness

One incident can automatically communicate with everyone affected.

### 5. Operational intelligence

The system identifies:

- recurring issues
- hotspots
- SLA breaches
- workload imbalance
- resolution trends

### 6. Residence-aware campus experience

One platform supports hostel residents and day scholars without splitting them into separate products.

### 7. Accessibility by design

Low bandwidth, low-end devices, offline queue, and no-smartphone fallback.

---

# 25. What NOT to Build

Do not build:

- 20 shallow modules
- AI chatbot just for show
- Generic social feed
- Random gamification
- Fake predictive analytics
- Complicated student UI
- Separate apps for every authority
- Features without an operational workflow behind them

Prioritize working end-to-end workflows over feature count.

---

# 26. MVP Priority

## P0 - Must work

- Login/authentication
- Role + permission system
- Student dashboard
- Staff dashboard
- Admin dashboard
- Universal request engine
- Complaint/incident workflow
- Leave/gate-pass workflow
- Notification system
- Audit trail
- SLA + escalation (via simulated demo clock)
- Incident clustering/matching
- Hostel + day-scholar context

## P1 - Strong differentiators

- Recurring issue detection
- Workload analytics
- Campus health dashboard
- QR gate pass
- Targeted announcements
- Scholarship status tracking (ELIGIBLE → APPLIED → ... → DISBURSED)
- Offline request queue
- Staff-assisted/no-smartphone flow

## P2 - Only if time allows

- Demand prediction
- Advanced forecasting
- Full chatbot (downgraded to optional future functionality; core workflows must work without external AI APIs)
- More complex recommendation systems
- Additional administrative workflows

---

# 27. Success Definition

The product succeeds if a judge can understand this within a few minutes:

> A student does not need to know which office, staff member, register, WhatsApp group, or authority handles their problem.

They submit one request.

The system understands it.

It routes it to the right authority.

The authority has a deadline and accountability.

Related requests become incidents.

Students can see progress.

Administrators can see patterns.

And the institution gets a persistent operational record instead of scattered conversations.

---

# 28. One-Line Pitch

> **A unified campus operations platform that turns everyday student requests into accountable, intelligent, and trackable workflows.**

Alternative pitch:

> **From campus complaints to campus intelligence: one system for requests, authorities, incidents, communication, and resolution.**
