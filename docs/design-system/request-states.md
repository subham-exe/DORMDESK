# UX: Request States

The Universal Request Engine dictates that all requests—regardless of type—follow a consistent visual lifecycle.

## Status Dictionary and Visuals

| State | Meaning | Badge Visual | Icon |
|-------|---------|--------------|------|
| **DRAFT** | Created but not submitted (offline queue) | Grey background, dark grey text | File/Edit |
| **SUBMITTED** | Created, pending classification | Blue 50 bg, Blue text | Inbox / Send |
| **CLASSIFIED**| Categorized, awaiting routing | Blue 50 bg, Blue text | Tag |
| **ROUTED** | Sent to the correct department | Blue 50 bg, Blue text | Arrow Right |
| **ASSIGNED** | A specific person is responsible | Yellow 50 bg, Yellow text | User Check |
| **ACKNOWLEDGED** | Assignee has seen it and accepted it | Yellow 50 bg, Yellow text | Eye |
| **PROCESSING** | Work is actively happening | Yellow 50 bg, Yellow text | Loader / Activity |
| **RESOLVED** | Assignee marks work as complete | Green 50 bg, Green text | Check Circle |
| **VERIFIED** | System or requester confirms resolution | Green 50 bg, Green text | Shield Check |
| **CLOSED** | Terminal state, fully complete | Green 50 bg, Green text | Archive / Lock |

## Exception States
- **REJECTED:** Red bg, Red text (X Circle icon). Terminal state.
- **CANCELLED:** Grey bg, Grey text (Slash icon). Terminal state.
- **ESCALATED:** Red bg, Red text (Arrow Up / Alert Triangle). Requires immediate attention.

## Request UI Anatomy
Every request must display:
1. **Request ID:** Monospace identifier (e.g., `#MTN-2026-081`).
2. **Title/Category:** E.g., "Broken Window in Room 204".
3. **Status Badge:** Following the dictionary above.
4. **Timestamp / SLA:** "Created 2h ago" or "SLA breaches in 45m" (in Red if urgent).
5. **Assignee/Owner:** Avatar or text of who currently holds the request.

## Timeline / Audit Trail
Requests detailed view must have a vertical timeline showing every state change, who did it, and when.
