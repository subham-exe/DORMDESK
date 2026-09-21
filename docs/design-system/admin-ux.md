# Design System: Admin UX

The Admin Command Center is optimized for operational decision-making, friction reduction, and handling the Universal Request Engine queue. It is NOT a generic analytics dashboard.

## Core Navigation Architecture
- **Sidebar (Desktop) / Hamburger (Mobile):**
  - Command Center (Home)
  - Active Incidents
  - Request Queue
  - Approvals & Gate Pass
  - Staff Management
  - Settings

## Command Center (Home)
The primary view prioritizes what needs attention *right now*.

### 1. Alert Banner
- Critical system issues or high-severity incidents prominently displayed at the top.

### 2. Operational Health (KPIs)
- **Pending Requests:** Big number, color-coded based on SLA health.
- **SLA Breaches:** Requests that have passed their deadline. Red `Error` styling.
- **Active Incidents:** Number of grouped problems.

### 3. Action Triage (The Queue)
A priority-sorted table/list of incoming requests.
- **Columns:** ID, Type, Requester, Submitted, SLA Time Left, Status, Action.
- **Row Styling:** Overdue rows have a subtle red background (`#fef2f2`).
- **Quick Actions:** Approve, Reject, Route, Merge (to Incident) available directly on the row via a `...` menu or icon buttons.

## Workload & Ageing
- **Ageing Buckets:** Visual representation (bar chart or simple counters) of requests aged 0-12h, 12-24h, 24-48h, 48h+.
- **Staff Workload:** A quick list of staff members (e.g., Maintenance Team) and their open ticket counts to aid routing.

## Visual Principles for Admins
- **Density:** Higher density than the Student UX to show more data, but balanced with adequate whitespace to prevent fatigue.
- **Typography:** Use smaller font sizes (e.g., `text-sm`) for tabular data.
- **Focus:** The most urgent action (e.g., a breached SLA) must be the most visually prominent element on the screen.
