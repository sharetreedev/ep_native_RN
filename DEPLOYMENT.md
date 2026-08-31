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
| **v3.2.0 store release** | **LIVE on both stores** — iOS approved + Android promoted to production, published manually by Maurice from the store consoles | On-device Time-Sensitive verification still open (see runbook) | 18 Aug |
| **EP-1193 Global Pulse coordinate mapping** | **PUBLISHED to `production` OTA 31 Aug** | Global Pulse hand-rolled the coordinate→grid mapping (`axis + 4`) instead of using the shared `useCoordinateMapping`; axis values have no zero and Y is inverted, so all 15 coordinates on the x=4 / y=4 bands fell off the 8x8 grid and the other 49 rendered mis-placed. Native-only — WeWeb/Teams reads the same 24h aggregate and was unaffected. Update group `7146cf16-2b71-41d8-a441-2538355f6d97`, runtime **3.2.0**, commit `b327cf9`, iOS + Android. | 31 Aug |
| Last OTA publish | **31 Aug 2026** — EP-1193, group `7146cf16-2b71-41d8-a441-2538355f6d97`, runtime 3.2.0 | ⚠ First OTA on runtime 3.2.0 — all earlier production updates target 3.1.2, so users who have not taken the v3.2.0 store update do NOT receive this fix. | 31 Aug |
