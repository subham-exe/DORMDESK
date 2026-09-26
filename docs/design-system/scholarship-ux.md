# Design System: Scholarship UX

The Scholarship tracking feature requires a distinct lifecycle within the Universal Request Engine. Financial transparency is critical to reducing student anxiety and administration queries.

## Scholarship Lifecycle States
1. **Eligible:** Student meets criteria but hasn't applied. (Neutral styling)
2. **Applied:** Application started but incomplete. (Neutral/Info styling)
3. **Submitted:** Sent for verification. (Info styling)
4. **Under Verification:** Being reviewed by staff. (Warning/Yellow styling)
5. **Approved:** Verification passed, waiting for funds. (Success/Green styling)
6. **Sanctioned:** Funds allocated. (Success/Green styling)
7. **Disbursed:** Funds transferred to the student's account. (Success/Green styling)

## CRITICAL: Approved vs. Disbursed
These two states must never be confused.
- **APPROVED:** Uses `Info` (Blue) styling. It means "You passed the checks, but you don't have the money yet."
- **DISBURSED:** Uses `Success` (Green) styling. It means "The money has left our accounts."
- Do not use Green for Approved, as it sets false expectations.

## Scholarship Card (Student View)
Displayed on the Student Home or a dedicated Scholarship section.
- **Visual:** A prominent card with a slightly elevated shadow.
- **Content:** Scholarship Name, Academic Year, Current Status Badge.
- **Progress Indicator:** A stepped progress bar showing exactly where they are in the 7-step lifecycle.

## Scholarship Details (Student View)
- **Timeline:** Detailed view of when each state change occurred.
- **Action Required:** If an admin flags an issue (e.g., "Upload better income certificate"), this must be highlighted in Red (`Error`) at the top of the details view, with a clear "Upload Document" action button.

## Admin Overview
- Aggregate view showing funnel metrics: Total Eligible -> Applied -> Approved -> Disbursed.
- Highlights bottlenecks (e.g., 500 applications stuck in "Under Verification").
