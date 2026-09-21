# Design System: Spacing & Layout

DormDesk uses a standard 4px baseline grid.

## Spacing Scale
- `0`: 0px
- `1`: 4px
- `2`: 8px (Inner component spacing, e.g., button icon to text)
- `3`: 12px
- `4`: 16px (Standard padding for cards, modals, and mobile containers)
- `5`: 20px
- `6`: 24px (Section spacing, desktop container padding)
- `8`: 32px
- `10`: 40px
- `12`: 48px

## Border Radius
Subtle, professional radii. No heavy pill shapes except for badges.
- `sm`: 2px (Checkboxes, small tooltips)
- `md`: 6px (Buttons, inputs)
- `lg`: 8px (Cards, modals, dropdowns)
- `full`: 9999px (Avatars, status indicator dots, badges)

## Elevation (Shadows)
Elevation is used sparingly to define hierarchy.
- **Sm:** `0 1px 2px 0 rgb(0 0 0 / 0.05)` - Standard button, card default.
- **Md:** `0 4px 6px -1px rgb(0 0 0 / 0.1)` - Hover states, dropdown menus.
- **Lg:** `0 10px 15px -3px rgb(0 0 0 / 0.1)` - Modals, drawers, floating action buttons.
