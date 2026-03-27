# Pulse 4.0 — Code Quality Audit

**Date:** 2026-03-25
**Audit Type:** Code Quality (Modularity, Structure, Duplication, Type Safety)
**Status:** Incomplete

---

## Executive Summary

The codebase is a React Native (Expo) app with ~30 screens, ~30 components, 12 custom hooks, and a 999-line monolithic API client. It shows decent foundational organization but has significant issues with **duplication (~25-30%)**, **god components/contexts**, and **loose typing**.

---

## 1. Monolithic API Client (`src/lib/xano.ts` — 999 lines)

**The biggest structural problem.** All 16+ API domains (auth, check-ins, courses, groups, pairs, notifications, support requests, etc.) live in a single file.

- No separation by domain — finding endpoints requires scrolling through 1000 lines
- Response types are inconsistent: `unknown`, `| string` unions, `result1` field names
- `requestMultipart` duplicates core request logic
- No request/response interceptors for cross-cutting concerns

**Recommendation:** Split into domain modules (`api/auth.ts`, `api/checkins.ts`, `api/groups.ts`, etc.) with a shared `api/client.ts` base.

---

## 2. Duplicated Error Handling Wrapper

An identical `wrap` helper function is copy-pasted across **6 hooks**: `useOnboarding`, `usePairs`, `useRunningStats`, `useUser`, `useCourses`, `useGroups`. Meanwhile 3 other hooks (`useNotifications`, `useCheckIns`, `useCurrentUser`) each use a different pattern — or none at all.

**Recommendation:** Extract to a shared `hooks/useAsyncHandler.ts` utility. Standardize all hooks to use it.

---

## 3. God Components (500+ lines)

| File | Lines | Problem |
|------|------:|---------|
| `GroupProfileScreen` | 1,115 | Data fetching, visualization, tabs, stats all in one |
| `UserProfileScreen` | 748 | Direct API calls, coordinate mapping, 3 tab renderers |
| `OnboardingScreen` | 604 | 6+ step renderers in a single component |
| `RiskAssessmentScreen` | 591 | 200-line render function for suggested actions |
| `QuadrantGrid` | 527 | Emotion selection + coordinate picking + animations |
| `MeshGradientSlider` | 513 | Gesture handling + animation + emotion logic |

These files mix data fetching, business logic, state management, and rendering. Splitting into sub-components and extracting logic into hooks would improve testability and readability.

---

## 4. God Context (`AuthContext.tsx` — 326 lines)

AuthContext handles three unrelated concerns:

1. **Core auth** (login/logout/session) — belongs here
2. **Check-in tracking** (hasCheckedInToday, markCheckedInToday) — should be its own context
3. **MHFR support requests** (mhfrRequests, hasOpenMHFRRequest) — should be its own context

---

## 5. Oversized Hooks

### `useCourses` (215 lines)

The largest hook handles enrollment fetching, JSON module parsing, progress calculation, lesson completion with optimistic updates, and legacy backward compatibility. Should be split into `useEnrollments` and `useCourseModules`.

### `useUser` (118 lines, 9 methods) and `useGroups` (139 lines, 10+ methods)

Similar "kitchen sink" problems — too many unrelated responsibilities in a single hook.

---

## 6. Repeated UI Patterns Not Extracted

These patterns appear 3-10+ times with near-identical code:

- **Modal pickers** (country, group, frequency) — 4+ duplicates across `RemindersScreen`, `EditProfileScreen`, `GroupsScreen`, `CheckinSupportRequestScreen`
- **Avatar rendering** with fallback — 10+ inline implementations
- **Coordinate mapping** (xAxis/yAxis to grid index) — 4 duplicates across pulse screens
- **Tab rendering** (Pulse/Outlook/Timeline tabs) — 5+ duplicates
- **Status filtering** — 3+ duplicates
- **COUNTRIES array** — hardcoded in at least 2 files

**Recommendation:** Create shared components (`<ModalPicker />`, `<AvatarDisplay />`) and a `useCoordinateMapping` hook.

---

## 7. Type Safety Gaps

- `any` usage in catch blocks, type assertions (`as any`, `as unknown as`)
- Navigation params: `GroupProfile` route uses `any[]` for 3 params
- `useGroups` returns `unknown[]` and `Record<string, unknown>`
- `useUser.engagementScore` returns `Promise<unknown>`
- `"Lessons"` key defined in both `RootStackParamList` and `MainTabParamList` — type conflict

---

## 8. What's Working Well

- **Theme centralization** (`src/theme/index.ts`) — well-documented, `as const` typed, logical groupings
- **No circular dependencies** detected in the import graph
- **Navigation typing** — 25 routes properly typed (minus the `any` gaps)
- **`emotionUtils.ts`** (46 lines) — a model utility file: focused, typed, with error recovery
- **Constants separation** (`src/constants/emotions.ts`) — clean emotion data
- **Optimistic updates** in several hooks (notifications, groups) — good UX pattern

---

## Metrics

### Hooks

| File | Lines | Single Responsibility | Type Safety | Error Handling |
|------|------:|:--------------------:|:----------:|:--------------:|
| useStateCoordinates | 39 | Yes | Mixed (`any`) | Consistent |
| useCurrentUser | 41 | Partial | Good | None |
| useGlobalPulse | 32 | Yes | Good | Consistent |
| useOnboarding | 43 | Yes | Good | Consistent |
| usePairs | 130 | No | Loose | Consistent |
| useRunningStats | 58 | Yes | Good | Consistent |
| useEmotionStates | 84 | Partial | Poor (`as any`) | Consistent |
| useUser | 118 | No | Loose (`unknown`) | Consistent |
| useNotifications | 74 | Yes | Good | Inconsistent |
| useCourses | 215 | No | Loose | Consistent |
| useCheckIns | 90 | Partial | Good | Inconsistent |
| useGroups | 139 | No | Loose | Consistent |

### Screens (Top 10 by Size)

| File | Lines |
|------|------:|
| GroupProfileScreen | 1,115 |
| UserProfileScreen | 748 |
| SupportRequestDetailsScreen | 679 |
| OnboardingScreen | 604 |
| RiskAssessmentScreen | 591 |
| QuadrantGrid (component) | 527 |
| GroupsScreen | 517 |
| MeshGradientSlider (component) | 513 |
| CreateGroupScreen | 490 |
| CourseDetailsScreen | 467 |

### Lib

| File | Lines | Assessment |
|------|------:|-----------|
| xano.ts | 999 | Monolithic — needs splitting |
| emotionUtils.ts | 46 | Exemplary — focused and typed |
