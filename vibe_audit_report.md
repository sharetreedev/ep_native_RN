# Vibe & Fragility Audit: Pulse 4.0

This audit deep-scans the current codebase to identify areas where the "Pulse 4.0" brand identity is diluted and where structural shortcuts introduce fragility.

## 1. Aesthetic "Vibe" Analysis

The application has a strong foundation with the `Quicksand` (headers) and `Manrope` (body) typography, but the execution drifts in several key screens.

### Design System Drift
- **Hardcoded Colors**: Several core components (`CircleButton.tsx`, `PulseGrid.tsx`, `AuthScreen.tsx`) hardcode hex values (e.g., `#6366f1`, `#D1D5DB`) instead of using the tokens in `src/theme/index.ts`. This makes brand updates fragile and inconsistent.
- **Iconography Inconsistency**: The app uses `react-native-heroicons` but lacks a unified styling wrapper, leading to varying stroke widths and colors across screens.
- **Glassmorphism Missing**: The "Pulse 4.0" brand (implied in the requested "vibrant colors, glassmorphism") is only partially implemented. The `HomeScreen` has some premium touches, but auxiliary screens like `Account` and `EmergencyServices` feel like generic React Native templates.

## 2. Structural Fragility

### The Data Layer "Glue"
- **Loose Xano Client**: `src/lib/xano.ts` is effectively a set of wrapper functions around `fetch`. It lacks a robust retry mechanism, global error handling, and unified type safety.
- **Type Safety Gaps**: Many API responses are typed as `any` or cast to interfaces without runtime validation (Zod/Valibot). This is a "silent failure" risk when the Xano backend schema changes.
- **Authentication Silos**: `AuthContext` has duplicated logic across `login`, `signup`, and `microsoftSSO` methods.

### State & Navigation
- **Race Condition "Timeouts"**: `CheckInScreen.tsx` uses `setTimeout` to handle post-check-in navigation. This is fragile and can lead to broken UI states on slower devices.
- **Hidden Mounts**: The `CheckInScreen` mounts both `SliderFlow` and `Grid` simultaneously, toggling `display: 'none'`. This increases initial memory footprint and complexity.

## 3. High-Priority Optimization Targets

1. **Tokenize Everything**: Move all hardcoded hex values in `.tsx` and `.css` files into `src/theme`.
2. **Xano Client Hardening**: Refactor `src/lib/xano.ts` into a class-based client with interceptors for auth headers and global error handling.
3. **Zod Integration**: Add schema validation for the most critical API responses (Check-ins, User Profile).
4. **Transition Optimization**: Replace `setTimeout` navigation with proper async/await flow and potential loading states.

## Summary Status
| Category | Status | Notes |
| :--- | :--- | :--- |
| **Typography** | ✅ Solid | Quicksand/Manrope correctly integrated via Expo. |
| **Color Systems** | ⚠️ Fragile | Too many hardcoded hex codes bypassing the theme. |
| **Data Synchronization** | ⚠️ Fragile | Error handling is ad-hoc; no centralized retry logic. |
| **UX Transitions** | ❌ Weak | Relies on timeouts and hidden views. |
