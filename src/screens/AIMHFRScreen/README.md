# AIMHFRScreen

Conversational AI Mental Health First Responder. A user in distress can chat
(text and/or voice) with an ElevenLabs-hosted agent that follows a supportive,
non-clinical protocol. If the conversation crosses a risk threshold the screen
hands off to the human MHFR flow.

## Route

- Navigation name: `AIMHFR`
- Params: none
- Entered from: `EmergencyServicesScreen` ("Talk to someone now")

## Data dependencies

- `useAuth()` — current user for the ElevenLabs session context
- `useSafeEdges()` (via `MHFRContext`) — current emotional safe-edges for tailored prompts
- `request()` (`api/client`) — hits Xano to retrieve a signed ElevenLabs WebSocket URL
- Direct `WebSocket` connection to ElevenLabs for the live agent session

## Key UI pieces

- **Animated orb** — Reanimated + SVG radial gradient using theme tokens (`primaryGradientEnd` → `primary` → `darkForest`). Pulses while the agent is speaking.
- **Chat scroll** — renders message history; streaming and final assistant messages are de-duplicated via `streamHandledRef`.
- **Message input** — text entry; voice input is planned but not yet wired.
- **Consent modal** — shown on first entry; users must acknowledge this is not a clinical service before the WebSocket is opened.

## Navigation targets

- Back → `EmergencyServicesScreen`
- On explicit escalation → `MHFRHandoff` flow (future)

## Notable gotchas

- This screen is ~640 lines and is tracked for extraction in **EP-794**. Until then, treat subsections (consent modal, orb, chat) as candidates for their own components.
- `@livekit/react-native` is imported at the top level today; bundle-size reduction via lazy loading is tracked in **EP-799**.
- All `[AI] ...` logging goes through `logger` (dev-only). Do not add raw `console.*` calls.
- The ElevenLabs WebSocket lifecycle is fragile — avoid changing mount order or cleanup without manually testing reconnection.
