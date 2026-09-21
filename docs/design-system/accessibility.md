# Design System: Accessibility

Accessibility is a core requirement for DormDesk, ensuring the platform is usable by all members of the campus community.

## Contrast Requirements
- **WCAG 2.1 AA Compliance:** Minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text.
- **Brand Colors:** The primary brand colors (`Slate 900`, `Slate 800`) against White backgrounds easily meet contrast requirements.
- **Status Colors:** Ensure foreground text or icons on status badges (e.g., Red, Yellow, Green backgrounds) have sufficient contrast. Do not use white text on a light yellow background.

## Keyboard Navigation & Focus
- **Focus Indicators:** Every interactive element (links, buttons, inputs) must have a visible focus state.
- **Styling:** Use a solid `2px` ring (e.g., `ring-2 ring-offset-2 ring-slate-900`) for keyboard focus. Do not rely solely on `outline: none` without providing a custom visible focus.
- **Logical Flow:** Ensure the DOM order matches the visual reading order.

## Status Communication
- **Never rely on color alone:** Color should enhance information, not be the sole communicator.
- **Example:** A "Rejected" status should not just be a red circle. It must say "Rejected" or use a recognizable icon (like an 'X') alongside the red color.

## Forms & Inputs
- **Labels:** Every input must have an associated, visible label. Placeholders are not substitutes for labels.
- **Error States:** Form errors must be described in text below the input. (e.g., "Student ID is required", not just turning the border red).
- **Required Fields:** Explicitly mark required fields (e.g., with an asterisk `*` or "(Required)").

## Semantics & Screen Readers
- Use semantic HTML tags (`<nav>`, `<main>`, `<article>`, `<button>`, `<a>`).
- Use `aria-labels` when visual labels are absent (e.g., icon-only buttons like a close 'X' button).
- **Touch Targets:** Minimum 44x44px clickable area on mobile devices to accommodate motor impairments.
