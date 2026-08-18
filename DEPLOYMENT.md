# Deployment ledger — ep_native_RN (Pulse app)

**Rule:** any session that publishes an OTA or submits a build updates this table.
Publish ONLY via `npm run ota:production|preview|development` (see CLAUDE.md).
Check current published state with `eas update:list` — never trust this table alone
before publishing.

> Seeded 18 Aug 2026 — ⚠ entries need verification.

| Workstream | State | Notes | Last touched |
|---|---|---|---|
| `fix/analytics-groupids` branch | committed locally, NOT merged, NOT published | Rescued 18 Aug from the archived `ep_native_RN-main` duplicate (orig. 16 Jun): Amplitude was receiving `[undefined,…]` groupIds. Review → merge → include in next OTA. | 18 Aug |
| EP-1069 groups.ts revert | ⚠ local-only, NOT deployed | Held to avoid prod OTA footgun while v1 backend fix is held. | ⚠ |
| EP-1194 gitignore hardening + ASC key config | committed to `main` 13 Aug | | 13 Aug |
| Last OTA publish | ⚠ unknown — run `eas update:list` | | |
