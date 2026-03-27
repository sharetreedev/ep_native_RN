# Production-Grade Transformation: Pulse 4.0

This plan outlines the systematic transformation of the Pulse 4.0 codebase to harden the data layer, enforce the design system, and optimize UX performance.

## Proposed Changes

### [Component] Data Layer (Hardening)
Standardize the Xano client and add runtime type safety.

#### [MODIFY] [xano.ts](file:///Users/dylanj/projects/clients/pulse%20-%204.0/src/lib/xano.ts)
- Refactor the loose functions into a `XanoClient` class.
- Add centralized error handling and auth header management.
- Remove `any` types in favor of strict interfaces or Zod schemas.

#### [MODIFY] [AuthContext.tsx](file:///Users/dylanj/projects/clients/pulse%20-%204.0/src/contexts/AuthContext.tsx)
- Consolidate common token/user state logic.
- Use the new standardized `XanoClient` and hardened types.

---

### [Component] UI/UX & Design System (Aesthetic Polish)
Enforce token usage and remove UX race conditions.

#### [MODIFY] [theme/index.ts](file:///Users/dylanj/projects/clients/pulse%20-%204.0/src/theme/index.ts)
- Audit and expand the color palette to cover all hardcoded hex values found in the deep-scan.

#### [MODIFY] [CheckInScreen.tsx](file:///Users/dylanj/projects/clients/pulse%20-%204.0/src/screens/CheckInScreen/CheckInScreen.tsx)
- Replace `setTimeout` with proper async navigation handling.
- Use `useMemo` for toggleable view components to avoid unnecessary re-renders.

#### [MODIFY] [styles/theme-cleanup]
- Systematically replace hardcoded hex values in `CircleButton.tsx`, `PulseGrid.tsx`, and `AuthScreen.tsx` with theme tokens.

## Verification Plan

### Automated Tests
- Run existing tests (if any are found) using `npm test`.
- Add a smoke test script in `/tmp` to verify the new `XanoClient` can still fetch the `/me` endpoint successfully (simulated/mocked).

### Manual Verification
- Compare UI mocks (if available) vs. rendered screens after tokenization.
- Stress-test the Check-In flow to ensure navigation doesn't fail under variable network latency (removing the 500ms race condition).
