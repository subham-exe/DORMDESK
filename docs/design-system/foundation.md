# DORMDESK Product UX + Design System Foundation v1

This directory contains the foundational Design System and Product UX rules for DormDesk (DORMDESK). 

**CRITICAL:** This foundation must be strictly adhered to by frontend engineering to ensure consistency and prevent the app from becoming a collection of randomly styled pages.

## Vision & Principles
DormDesk is a unified campus operations platform built on a Universal Request Engine.
- **We digitize accountability, not paperwork.**
- **One visual language:** A gate pass and a broken window complaint look and behave consistently.
- **Function over form:** Professional, modern, and accessible. No excessive decorations.

## System Documentation Index

### Core Tokens
1. [Colors](colors.md) - The palette and semantic status colors.
2. [Typography](typography.md) - Font scales and text hierarchy.
3. [Spacing](spacing.md) - Consistent layout and gaps.
4. [Components](components.md) - Rules for buttons, inputs, cards, and atomic UI.

### Product UX Patterns
5. [Request States](request-states.md) - Visualizing the Universal Request Engine lifecycle.
6. [Incident UX](incident-ux.md) - Distinguishing grouped Incidents from individual Requests.
7. [Admin UX](admin-ux.md) - The Command Center, prioritizing operational decision-making.
8. [Student UX](student-ux.md) - Mobile-first, action-oriented hub.
9. [Scholarship UX](scholarship-ux.md) - Transparent tracking and clear state definitions.

### Reality Layer
10. [Responsive Rules](responsive.md) - Adapting from mobile to wide admin displays.
11. [Accessibility](accessibility.md) - Contrast, keyboard navigation, and semantic HTML.
12. [Offline UX](offline-ux.md) - Handling low-bandwidth and local queue states.

---

## Foundation Gate Checklist (SK-03)

Before large-scale frontend UI implementation begins, ensure the following are defined and understood:
- [x] Color tokens defined
- [x] Typography defined
- [x] Spacing defined
- [x] Core components (Buttons, Inputs, Cards) defined
- [x] Request Status indicators standardized
- [x] Incident vs Request visual distinction established
- [x] Student navigation planned
- [x] Admin dashboard layout planned
- [x] Approved vs Disbursed scholarship states clarified
- [x] Responsive layout strategy documented
- [x] Accessibility baseline established
- [x] Offline/Queued visual states defined

**Status:** GATE PASSED. Frontend implementation can proceed using these guidelines.
