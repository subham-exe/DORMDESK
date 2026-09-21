# Design System: Core Component Inventory

Rules for fundamental UI components.

## Interactive Elements
- **Buttons:**
  - **Primary:** Dark slate background, white text. For the single most important action on a page.
  - **Secondary:** Light slate background, dark text. For alternative actions.
  - **Outline:** Transparent background, slate border. For secondary/tertiary actions.
  - **Ghost:** No background, no border. For subtle actions within lists or headers.
  - **Destructive:** Red background or outline. For irreversible actions (e.g., Reject).
  - *Rule:* All buttons must have a minimum `44px` touch target height on mobile.

- **Inputs & Textareas:**
  - Standard border (`Slate 200`), white background.
  - Focus state: `2px` ring, `Slate 900`. No outline.
  - Validation: Red border for errors, accompanied by a text error message (do not rely on color alone).

- **Selects / Dropdowns:**
  - Native select on mobile for better accessibility and touch support.
  - Custom select on desktop if needed, matching input styling.

## Information Display
- **Cards:**
  - White background, `1px` border (`Slate 200`), `Sm` shadow.
  - `16px` padding by default.
  - Do NOT nest cards inside cards. Use subtle muted backgrounds for inner grouping.

- **Badges:**
  - Pill-shaped (`rounded-full`).
  - Small text (`12px`, medium weight).
  - Used strictly for status, roles, or counts.

- **Status Indicators (Dots):**
  - Small `8px` colored dot, usually placed next to text when a full badge is too visually heavy.

- **Tables:**
  - Clean `1px` bottom borders for rows.
  - No vertical borders.
  - Hover state on rows (`Slate 50`).
  - Mobile: Tables must collapse into card lists or support horizontal scrolling with a sticky first column.

## Feedback & Overlays
- **Modals / Dialogs:**
  - Used for focused tasks (e.g., Acknowledging a request, adding an audit note).
  - Must include a distinct close button and a cancel action.
  - Dimmed backdrop (`black/50`).

- **Drawers (Slide-overs):**
  - Slide in from the right.
  - Used for complex details (e.g., full Request Audit Trail or Incident Details) without losing context of the underlying list.

- **Toasts:**
  - Temporary feedback for actions (e.g., "Request #42 assigned successfully").
  - Bottom-right on desktop, top-center on mobile.
