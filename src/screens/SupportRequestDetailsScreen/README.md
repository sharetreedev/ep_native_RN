# SupportRequestDetailsScreen

The MHFR-side detail view for a single support request. Shows the requester's
recent emotion timeline, the reason they triggered support, MHFR actions
(contact, mark resolved, escalate), and a log of previous contact attempts.

## Route

- Navigation name: `SupportRequestDetails`
- Params: `{ requestId: number }`
- Entered from: `SupportRequestsScreen` (MHFR inbox list)

## Data dependencies

- `useAuth()` — must be an MHFR user (enforced upstream in `SupportRequestsScreen`)
- `MHFRContext` — for current responder info and running requests
- Xano support request endpoints via `api/client` — fetch detail, update status, log attempts

## Key UI pieces (candidates for extraction — see **EP-793**)

- **EmotionTimeline** — renders the requester's last N check-ins as coloured dots
- **MHFRActionSection** — contact / resolve / escalate buttons
- **ContactAttemptLog** — paginated list of prior contact attempts with timestamps

## Navigation targets

- `UserProfile` — when the MHFR taps the requester header
- Back → `SupportRequestsScreen`

## Notable gotchas

- This file is 670+ lines and is tracked for extraction in **EP-793**.
- The contact attempt log optimistically updates; failures revert the row and show a toast.
- All logging goes through `logger` (dev-only).
