# Design System: Offline & Low-Bandwidth UX

DormDesk must remain functional in poor campus network conditions (e.g., concrete hostel blocks, basement labs).

## Network State Indicators
The UI must communicate network status subtly without panicking the user.

- **Online:** Default state. No indicator needed.
- **Weak Connection:** A subtle banner or toast: "Slow connection detected. Actions may take longer."
- **Offline:** A prominent but non-blocking banner at the top of the app: "You are offline. Requests will be queued and sent when you reconnect." (Use `Slate 400` or muted styling, not a critical red error).

## The Local Queue (Offline Requests)
When a student files a complaint while offline, it is stored in IndexedDB.

### Offline Request Styling
- **Status Badge:** "Queued Locally" (Muted grey color, distinct from active server states).
- **Visual Cue:** A dashed border or slightly lowered opacity on the request card to indicate it hasn't reached the server.
- **Icon:** A cloud icon with a crossed line or a pause icon.

### Syncing State
When connection returns:
- **Status Change:** Change badge to "Syncing..." with a small spinner.
- **Success:** Transform smoothly into the standard "Created/Pending" state with a success toast.
- **Failure/Retry:** If sync fails, show a "Sync Failed" badge (Red) with a manual "Retry" button.

## Heavy Assets
- Avoid relying on large background images or heavy web fonts that block rendering on slow connections.
- Ensure the app is usable while fonts or icons are still loading (fallback fonts must be styled appropriately).
