# Design System: Colors

DormDesk relies on a highly structured, accessible color system optimized for clarity and status communication.

## Core Tokens
- **Primary:** `#0f172a` (Slate 900) - Used for primary actions, critical navigation, active states.
- **Primary Hover:** `#1e293b` (Slate 800)
- **Secondary:** `#f1f5f9` (Slate 100) - Used for secondary buttons, subtle highlights.
- **Secondary Foreground:** `#0f172a`

## Background & Surface
- **Background:** `#ffffff` (White) - Main app background.
- **Surface:** `#ffffff` (White) - Card and modal backgrounds.
- **Surface Muted:** `#f8fafc` (Slate 50) - Applet backgrounds, secondary sections.
- **Border:** `#e2e8f0` (Slate 200) - All borders and dividers.

## Text
- **Text Primary:** `#0f172a` (Slate 900) - Standard readable text.
- **Text Secondary:** `#64748b` (Slate 500) - Muted text, timestamps, captions.
- **Text Inverse:** `#ffffff` (White) - Text on primary backgrounds.

## Status Colors
Colors used for the Universal Request Engine. All status colors must have contrast-compliant foregrounds.

- **Info (Neutral / Draft / Route):** `#3b82f6` (Blue 500), Background: `#eff6ff` (Blue 50)
- **Success (Resolved / Approved / Closed):** `#22c55e` (Green 500), Background: `#f0fdf4` (Green 50)
- **Warning (Pending / Under Verification):** `#eab308` (Yellow 500), Background: `#fefce8` (Yellow 50)
- **Error (Rejected / Escalate / SLA Breach):** `#ef4444` (Red 500), Background: `#fef2f2` (Red 50)

## Incident Severity Colors
- **Low:** Slate 500
- **Medium:** Yellow 500
- **High:** Orange 500 (`#f97316`)
- **Critical:** Red 500

## Network States
- **Offline / Queued:** `#94a3b8` (Slate 400) - Used to indicate unsynced data.
