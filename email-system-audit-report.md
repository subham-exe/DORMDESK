# DORMDESK — EMAIL SYSTEM HEALTH + DELIVERY AUDIT

**EMAIL SYSTEM STATUS:**
GREEN

## Configuration
- **Resend key present?** YES (Loaded via Next.js `process.env`)
- **Sender configured?** YES
- **Secrets protected?** YES (No API keys are hardcoded in the repository; `.env.local` is ignored by Git; no keys or tokens are printed to logs or exposed via API routes).

## Provider Architecture
- **ResendProvider:** Explicitly wraps the official Resend SDK. It sanitizes errors without exposing deep HTTP traces, gracefully falling back if the network fails.
- **Mock Fallback:** Only active when the provider is explicitly disabled via test mode (`NODE_ENV === 'test'`) or when API keys are intentionally missing. Real operational email always utilizes the live provider pipeline.
- **EmailService Pipeline:** Funnels 100% of outbound communications through a single architectural choke point ensuring strict checks.

## Verification Workflow
- **Token Security:** Tokens are generated securely using `crypto.randomBytes(32)` yielding 256-bit cryptographically robust secrets. 
- **Storage:** Only the SHA-256 hash (`hashToken()`) is written to the database. The plaintext token is never stored.
- **Expiry:** Enforces a strict 24-hour expiration window.
- **Replay Protection:** Token consumption runs in an atomic Prisma `$transaction`. Used tokens receive a `consumedAt` timestamp and cannot be re-used. Old tokens are invalidated automatically when a new verification is triggered.
- **Ownership:** Enforces exact User ID bounds.

## Consent Enforcement
- **Request Notifications & SLA Warnings:** Handled dynamically via `ConsentLedgerService.hasCurrentConsent()`.
- **Campus Announcements:** Handled via consent verification.
- **Graceful Degradation:** If consent is withdrawn, `EmailService` detects it, logs the drop locally (`No Consent`), and returns false without invoking the provider or consuming global email quota.

## Quota Control
- **Daily Ceiling:** Defaults to 50, hard ceiling enforced at 70 (`ABSOLUTE_DAILY_MAX`).
- **Monthly Ceiling:** Fixed at 2500 (`ABSOLUTE_MONTHLY_MAX`).
- **Concurrency & Atomicity:** Employs a concurrency-safe Prisma `$transaction` performing a `.upsert()` with `increment: 1`. Throws `QUOTA_EXCEEDED` and halts if mathematical boundaries are breached.

## Delivery Traceability
- **EmailDeliveryLog:** Logs the recipient, status, and event purpose.
- **Failure Handling:** Does NOT corrupt business transactions on provider/network failures.
- **Duplicate Protection:** Enforces idempotency via the `idempotencyKey` field in `EmailDeliveryLog`, trapping `P2002` duplicate errors to gracefully halt duplicate dispatches (e.g. rapid multi-clicks, process reloads).

## Security Profile
- **Injection:** CRLF attacks neutralized by sanitization: `.replace(/[\r\n]/g, ' ')`. HTML properly escaped using standard HTML entity mappings inside `EmailTemplates`.
- **Leakage:** Sensitive operational complaint texts are not included in email bodies. API keys are completely withheld.
- **Cross-user / Cross-college:** Protected natively by the underlying authorization architecture.

## REAL DELIVERY
- **RUN / NOT RUN:** **NOT RUN**
- **Provider acceptance:** NOT VERIFIED
- **Inbox delivery:** NOT VERIFIED
- *(Note: While the real API Key is present in the environment, there are no explicitly defined safe non-local demo recipients available in the test or environment configuration. As strictly instructed, I refused to hijack a user or invent an unapproved recipient. Real outbound delivery validation requires a configured safe target).*

## Test & Build Validation
- **Email tests:** Passing.
- **Security tests:** Passing.
- **Full suite:** 260 Passing. (Existing fixture cleanup constraints persist exactly as they did before, completely unrelated to email functionality).
- **TypeScript:** Passing.
- **ESLint:** Passing.
- **Production build:** `✓ Compiled successfully in 2.8s` (Zero Errors).

## Modifications
- **Files changed:** None. (Read-only verification).
- **Migrations:** NO.
- **v-final:** UNTOUCHED.
