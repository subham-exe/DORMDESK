# Design System: Incident UX

DormDesk clusters multiple related requests into a single **Incident**. It is critical that the UX distinguishes an individual user Request from an aggregate Incident.

## Visual Distinction
- **Request ID Format:** `#REQ-2049`
- **Incident ID Format:** `#INC-WTR-042` (Always prefixed with `INC-` and a category code).
- **Incident Visuals:** Incidents use a heavier border or distinct background (e.g., `Surface Muted` `#f8fafc`) to separate them from standard requests.

## Incident Lifecycle
Incidents track the aggregate problem, while related Requests track individual reports.

### Incident Creation
- **Trigger:** Created manually by Admin/Warden, or auto-suggested when >X similar requests appear in the same location/category.
- **UI:** A clear "Group into Incident" action on the Admin Command Center.

### Incident Details View
- **Header:** Incident ID, Title (e.g., "Block B Water Supply Failure"), Severity Badge, Status.
- **Related Requests:** A collapsible list or table of all linked student requests.
- **Affected Users:** Count of affected users prominently displayed.
- **Communication:** "Notify Affected Students" broadcast button.

### Merging Requests
- When a new request comes in that matches an active incident, the Admin UI should display a "Merge into Incident #INC-..." suggestion button.

### Resolution
- **Bulk Action:** Resolving the Incident must visually indicate that it will auto-resolve all linked Requests.
- **Confirmation Modal:** "You are about to resolve Incident #INC-WTR-042. This will mark 14 linked requests as RESOLVED and notify the affected students. Continue?"

## Severity Levels
Severity dictates SLA and escalation rules.
- **Low:** Slate 500 (Minor maintenance, isolated).
- **Medium:** Yellow 500 (Affects a few users, moderate impact).
- **High:** Orange 500 (Affects an entire floor/block).
- **Critical:** Red 500 (Campus-wide issue, safety risk).
