# Design System: Responsive Rules

DormDesk must function seamlessly across devices, from low-end smartphones to wide desktop monitors used in the Admin Command Center.

## Breakpoints
We follow a mobile-first approach using standard Tailwind CSS breakpoints:
- **Base (Mobile):** `< 640px` (Default styling)
- **Small (sm):** `≥ 640px` (Large phones, small tablets)
- **Medium (md):** `≥ 768px` (Tablets, iPad portrait)
- **Large (lg):** `≥ 1024px` (Laptops, desktop screens)
- **Extra Large (xl):** `≥ 1280px` (Large monitors)

## Mobile-First Principles
- Start by designing for the smallest screen (Base).
- Use breakpoints to *enhance* the layout as the screen gets wider, rather than designing for desktop and degrading for mobile.

## Navigation Shifting
- **Mobile (`< lg`):** Use a Bottom Tab Bar for students and a Hamburger Menu (Drawer/Sheet) for admins.
- **Desktop (`≥ lg`):** Transition to a persistent Left Sidebar.

## Data Tables
Tables are notoriously difficult on mobile.
- **Mobile:** Convert table rows into stacked Cards. Show only the most critical 3-4 data points.
- **Desktop:** Display the full Data Table with all columns.

## Modals & Drawers
- **Mobile:** Use Bottom Sheets (Drawers) that slide up from the bottom for contextual actions, as they are easier to reach with a thumb.
- **Desktop:** Use centered Modals (Dialogs).

## Explicit Sizing
- Avoid hardcoding fixed widths (e.g., `w-[400px]`).
- Use percentages, flexbox, or grid with responsive constraints (e.g., `w-full max-w-md`).
