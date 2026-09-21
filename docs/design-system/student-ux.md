# Design System: Student UX

The Student UX is mobile-first, lightweight, and focused on clarity. It answers: What needs attention? What requests are active? What action can I take?

## Core Navigation Architecture
- **Bottom Tab Bar (Mobile) / Sidebar (Desktop):**
  - Home
  - Requests (History/Tracking)
  - Notifications
  - Profile

## Student Home (The Hub)
### 1. Action Row
- Prominent, easy-to-tap buttons for frequent actions:
  - New Complaint
  - Gate Pass
  - Leave Request
  - Certificates

### 2. Active Requests (Tracking)
- A focused list of *only* ongoing requests.
- **Card Format:** 
  - Top: ID and Status Badge.
  - Middle: Request Title / Type.
  - Bottom: Last updated timestamp and a mini-progress indicator (e.g., dots or a progress bar).

### 3. Highlights
- Quick view of Timetable (Next class) or Attendance summary.
- Important unread Notices.

## Request Creation (Forms)
- **Step-by-Step:** Complex forms (like Scholarship) should be broken into logical steps to avoid overwhelming the user.
- **Assistance:** Use clear labels, placeholder text, and helper text below inputs.
- **Smart Defaults:** Pre-fill known data (Name, ID, Room Number).

## Request Details
When a student taps an active request:
- **Header:** Status and ID.
- **Timeline:** A vertical timeline component showing the Universal Request Engine states (Created → Routed → Processing → Resolved).
- **Communication:** If the admin/staff left a comment (e.g., "Parts ordered"), it appears in the timeline.
- **Resolution Action:** If status is RESOLVED, prompt the student to VERIFY (Accept or Reopen).

## Visual Principles for Students
- **Touch Targets:** Minimum 44x44px for all interactable elements.
- **Readability:** High contrast, legible typography.
- **Reassurance:** Always show a clear success state (toast or dedicated screen) after a form submission.
