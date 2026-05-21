# Environments

This is the highest-leverage doc in the bunch. **Misunderstanding the environment model can ship the wrong backend to real users.** It has bitten this project before; the codebase is now designed to crash loudly rather than fail silently.

## The mental model: two routing axes

A Pulse build's "where does it talk to" is determined by **two independent settings**, not one. Most new devs assume there's one knob ("dev / staging / prod"). There are two.

| Axis | Header / URL | Values | Driven by |
|---|---|---|---|
| **Data source** | `x-data-source` HTTP header | `test` / `staging` / `live` | `EXPO_PUBLIC_XANO_DATA_SOURCE` |
| **API branch** | URL suffix `:staging` or nothing | dev branch / main | `__DEV__` global |

- The **data source** picks which Xano dataset you read/write — separate user accounts, separate check-ins.
- The **API branch** picks which Xano API definitions you hit — the backend team uses `:staging` to ship in-progress endpoints.

A build can have any combination. The standard pairs are:

| Build | API branch | Data source | Channel |
|---|---|---|---|
| Local dev (Expo Go or dev client) | `:staging` | `test` | — |
| EAS `development` channel | `:staging` | `test` | `development` |
| EAS `preview` channel | main | `staging` | `preview` |
| EAS `production` channel | main | `live` | `production` |

## The three EAS environments

Defined in [`eas.json`](../eas.json):

```json
"build": {
  "development": { "developmentClient": true, "distribution": "internal", ... },
  "preview":     { "distribution": "internal", "channel": "preview",    "environment": "preview" },
  "production":  { "autoIncrement": true,      "channel": "production", "environment": "production" }
}
```

Each profile points at an EAS **`environment`** — a server-side bucket of env vars managed via `eas env:create` / `eas env:list`. **EAS env vars are the source of truth for builds and OTAs.** Your local `.env` is for local-machine dev only.

## Env var sources, ranked by trust

| File / source | Purpose | Used by | Committed? |
|---|---|---|---|
| **EAS environment variables** | Source of truth for builds & OTAs | `eas build`, `npm run ota:*` | No (lives on Expo's servers) |
| [`.env`](../.env) | Safe defaults for local dev | Local `expo start` | **Yes** (no secrets) |
| `.env.local` | Per-developer overrides + the Sentry upload token | Local `expo start` | **No** (gitignored) |
| [`app.json`](../app.json) | Non-secret IDs that need to be present at runtime (OneSignal app ID, Intercom app ID, Sentry org) | Build time, baked in | Yes |

### What's in `.env` today

```bash
EXPO_PUBLIC_ONESIGNAL_APP_ID=fb2857a5-9090-4834-8259-2daf3e05ff18
EXPO_PUBLIC_MICROSOFT_CLIENT_ID=533cb409-efe0-4981-97b9-4d6065bef188
EXPO_PUBLIC_XANO_DATA_SOURCE=test
EXPO_PUBLIC_AMPLITUDE_KEY_STAGING=…
EXPO_PUBLIC_AMPLITUDE_KEY_PRODUCTION=…
```

None of these are real secrets — the OneSignal/Microsoft IDs are public, and the Amplitude keys are "client write" keys that only allow event ingest. The data source value is the **interesting** one.

### What goes in `.env.local`

```bash
# Gitignored. Never commit.
SENTRY_AUTH_TOKEN=sntrys_…
```

Used at build time by the Sentry Expo plugin to upload source maps. Without it, builds work but you don't get readable stack traces in Sentry.

### Viewing or editing EAS env vars

```bash
eas env:list --environment production
eas env:list --environment preview
eas env:list --environment development

# Create or update
eas env:create --environment production --name EXPO_PUBLIC_XANO_DATA_SOURCE --value live
```

(`eas env:update` and `eas env:delete` work the same way.)

## The hard rules

### 1. Non-dev builds must use `EXPO_PUBLIC_XANO_DATA_SOURCE=live`

[`src/api/client.ts`](../src/api/client.ts) does this at module load:

```ts
if (!__DEV__ && DATA_SOURCE !== 'live') {
  throw new Error(`[Xano] Non-dev build must use 'live' data source, got "${DATA_SOURCE}"...`);
}
```

If a production build (or any non-dev OTA) ships with a non-`live` data source, the app **crashes on launch**. This is intentional. Users fall back to the previous embedded bundle — far safer than silently pointing the production app at the test dataset and corrupting real data.

> **Do not "fix" this crash by removing the check.** If you hit it, your env wiring is wrong; fix the env wiring.

### 2. Never call `eas update` directly

Always go through the wrapper:

```bash
npm run ota:production    # → scripts/ota.sh production
npm run ota:preview
npm run ota:development
```

Why: a raw `eas update` reads `EXPO_PUBLIC_*` from your local `.env` and bakes them into the published bundle. If you happen to have `EXPO_PUBLIC_XANO_DATA_SOURCE=test` set locally (which you do — that's the committed default), you'd publish a production OTA that points at the test backend. The hard-crash rule above is the safety net for exactly this mistake.

[`scripts/ota.sh`](../scripts/ota.sh):
1. Verifies the target EAS environment has `EXPO_PUBLIC_XANO_DATA_SOURCE` set
2. `unset`s any locally-exported value
3. Calls `eas update --channel <env> --environment <env>` so EAS reads its own server-side env vars

See the [push-ota runbook](./runbooks/push-ota.md) for the full publish flow.

### 3. The runtime version is `appVersion`

[`app.json`](../app.json) sets `runtimeVersion.policy: appVersion`. That means an OTA bundle only runs on app installs with a matching `version` (currently `3.1.2`).

If you bump `app.json` `version`, you've **broken OTA continuity** — existing users won't see any OTA you publish on the old runtime version unless you also publish on the new one (or until they update via the stores).

**Bump `version` only when you do a native build that goes to the stores.** OTAs alone never bump the version.

## Local dev quick reference

```bash
# Normal dev — uses .env (DATA_SOURCE=test, :staging branch)
npm start

# With the dev client (full native experience)
npm start --dev-client

# Clear Metro's cache (if env changes aren't picked up)
npm start -- --clear
```

If you want to point your local dev at the production data source temporarily (e.g. to repro a prod-only bug), set `EXPO_PUBLIC_XANO_DATA_SOURCE=live` in `.env.local`. **Don't commit it.** And remember the in-app data is real-user data; be careful.

## Diagnosing "which environment is this?"

When in doubt, check the API headers and URL in the Metro logs. Every request prints:

```
[Xano] GET https://xdny-scc5-yag9.a2.xano.io/api:LmTnxskw:staging/users/me [x-data-source=test]
```

That tells you both axes in one line:
- URL contains `:staging` → API branch is dev
- `x-data-source=test` → data source is test

## Related

- [Releases](./05-releases.md) — when an OTA isn't enough and you need a native build
- [Push an OTA runbook](./runbooks/push-ota.md) — the safe publish path
- [Rollback runbook](./runbooks/rollback-ota.md) — if a published OTA is bad
