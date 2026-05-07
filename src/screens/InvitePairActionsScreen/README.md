# InvitePairActionsScreen

Creates the pair record (via `POST /pairs`) using the `pairType` selected on
the previous screen, then surfaces the returned invite token as a shareable
URL.

## Flow
- On mount: calls `pairs.create(pairType, requestFromId)` with the current
  user's ID. The response includes a `token` used to build the invite URL.
- The base URL switches by data source:
  - `live` → `https://app.emotionalpulse.ai/pair-invite?pair_token=<token>`
  - other → `https://d40d63f2-ae0c-4e43-afd2-4047cb3a7a9c-staging.weweb-preview.io/pair-invite?pair_token=<token>`

## Actions
- **Copy link**: writes the invite URL to the clipboard via `expo-clipboard`.
- **Share link**: opens the native share sheet with the invite URL.

## Navigation
- `Back`: returns to the pair-type selection screen.
