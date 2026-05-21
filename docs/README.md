# Pulse 4.0 — Developer Documentation

Welcome. This is the developer-onboarding documentation for **Pulse 4.0**, the Sharetree Emotional Pulse mobile app.

These docs are written for a developer who:

- Has basic web/JavaScript experience but **hasn't necessarily worked with React Native or Expo before**
- Is comfortable working alongside an AI assistant (Claude Code, Cursor, etc.)
- Needs to ship their first change in days, not weeks

If you only read three pages, read these in order:

1. **[Quickstart](./01-quickstart.md)** — clone, install, run the app on your phone
2. **[Architecture](./02-architecture.md)** — how the code is laid out
3. **[AI Handoff](./06-ai-handoff.md)** — what an AI was doing for the previous maintainer that you now need to do yourself (or keep delegating)

## Contents

| # | Doc | What's in it |
|---|---|---|
| — | [README](./README.md) | This file |
| 01 | [Quickstart](./01-quickstart.md) | Local dev setup, running the app |
| 02 | [Architecture](./02-architecture.md) | Code map: navigation, state, API, design system |
| 03 | [Environments](./03-environments.md) | dev / preview / production, data sources, env vars |
| 04 | [Services](./04-services.md) | Xano, Amplitude, OneSignal, Intercom, Sentry, OAuth |
| 05 | [Releases](./05-releases.md) | OTA vs native build, version policy |
| 06 | [AI Handoff](./06-ai-handoff.md) | What the AI was handling that you now own |

### Runbooks

Step-by-step recipes for things you do regularly:

- [Push an OTA update](./runbooks/push-ota.md)
- [Create a Linear issue (with the right labels)](./runbooks/create-linear-issue.md)
- [Write a Teams release-note](./runbooks/write-release-notes.md)
- [Troubleshoot a failed build](./runbooks/troubleshoot-builds.md)
- [Roll back a bad OTA](./runbooks/rollback-ota.md)

## What this app is

**Pulse 4.0** is a React Native (Expo) iOS/Android app for emotional check-ins, peer support pairs, and group cohorts. The backend is [Xano](https://www.xano.com/). The app is published to the App Store as "Emotional Pulse".

- **Codebase:** this repo
- **Build & release:** [Expo Application Services (EAS)](https://expo.dev) — see [Releases](./05-releases.md)
- **Issue tracking:** Linear, project "Emotional Pulse - Mobile Native" — see [Create a Linear issue](./runbooks/create-linear-issue.md)
- **User comms:** Microsoft Teams via a Make webhook — see [Write a Teams release-note](./runbooks/write-release-notes.md)
- **Crash reporting:** Sentry (org `sharetree`, project `mobile-native-react-native`)
- **Analytics:** Amplitude (separate projects for staging vs production)

## Where to ask for help

- **Sharetree contact:** Dylan (developer@sharetree.org)
- **Existing internal docs at repo root:**
  - [`CLAUDE.md`](../CLAUDE.md) — the AI assistant's operating manual (the source of truth these docs translate)
  - [`DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md) — colours, fonts, spacing tokens
  - [`DEVELOPMENT.md`](../DEVELOPMENT.md) — older dev-client setup notes (parts are stale; prefer [Quickstart](./01-quickstart.md))

## Glossary

| Term | What it means |
|---|---|
| **OTA** | "Over-the-air" update. A JS-only bundle pushed via EAS Update; users get it on next app launch. No App Store submission. |
| **EAS** | [Expo Application Services](https://expo.dev) — Expo's build/submit/update SaaS. Replaces local Xcode/Android Studio builds. |
| **Dev client** | A custom native build of Pulse that lets you hot-reload JS but still has all the native modules (OneSignal, Intercom, Amplitude, Sentry). Different from Expo Go, which is a generic shell with none of those. |
| **Data source** | Which Xano dataset the app talks to: `test`, `staging`, or `live`. Sent as the `x-data-source` HTTP header. |
| **API branch** | Which Xano API definition the app uses: `:staging` (dev only) or main (everything else). Different from data source. |
| **Check-in** | Pulse's core action — a user records how they're feeling. |
| **Pair** | A peer-support relationship between two users. |
| **Group** | A cohort of users (e.g. a workplace team). |
| **MHFR** | "Mental Health First Responder" — a user with elevated permissions who can support others in crisis. |
| **Runtime version** | A version string that gates OTA updates. If the JS bundle's runtime version doesn't match the installed app's, the bundle won't load. Pulse uses `policy: appVersion` (auto-matches `app.json` `version`). |
