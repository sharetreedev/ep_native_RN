# Code Quality Audit — Tasks

**Audit Date:** 2026-03-25
**Last Updated:** 2026-03-26 (medium priority completed)

## Tasks

### High Priority

- [x] Extract shared `wrap` error-handling helper to `hooks/useAsyncHandler.ts` — *High* — `useOnboarding`, `usePairs`, `useRunningStats`, `useUser`, `useCourses`, `useGroups`
- [x] Standardize error handling in hooks that don't use `wrap` — *High* — `useNotifications`, `useCheckIns`, `useCurrentUser`
- [x] Split `src/lib/xano.ts` (999 lines) into domain-specific API modules — *High* — `src/api/client.ts`, `src/api/auth.ts`, `src/api/checkins.ts`, `src/api/groups.ts`, `src/api/pairs.ts`, `src/api/courses.ts`, `src/api/notifications.ts`, `src/api/users.ts`, `src/api/support.ts`
- [x] Extract `<ModalPicker />` shared component — *High* — `RemindersScreen`, `EditProfileScreen` (GroupsScreen intentionally skipped — structurally different)
- [x] Extract `<AvatarDisplay />` shared component — *High* — 7 instances across 5 files (PairsAvatarOverlay skipped — too specialized)
- [x] Split `AuthContext` into `AuthContext`, `CheckInContext`, `MHFRContext` — *High* — `src/contexts/AuthContext.tsx`

### Medium Priority

- [x] Break down `GroupProfileScreen` (1,115 lines) into sub-components — *Medium* — `src/screens/GroupProfileScreen/`
- [x] Break down `UserProfileScreen` (748 lines) into sub-components — *Medium* — `src/screens/UserProfileScreen/`
- [x] Break down `OnboardingScreen` (604 lines) — extract step renderers into separate components — *Medium* — `src/screens/OnboardingScreen/`
- [x] Break down `RiskAssessmentScreen` (591 lines) — extract action cards — *Medium* — `src/screens/RiskAssessmentScreen/`
- [x] Extract `useCoordinateMapping` hook from duplicated coordinate logic — *Medium* — `GroupsScreen`, `MyPairsScreen`, `UserProfileScreen`, `GroupProfileScreen`
- [x] Split `useCourses` (215 lines) into `useEnrollments` + `useCourseModules` — *Medium* — `src/hooks/useCourses.ts`
- [x] Split `useUser` (118 lines, 9 methods) into focused hooks — *Medium* — `src/hooks/useUser.ts`
- [x] Split `useGroups` (139 lines, 10+ methods) into focused hooks — *Medium* — `src/hooks/useGroups.ts`
- [x] Extract shared tab rendering pattern (Pulse/Outlook/Timeline) into reusable component — *Medium* — 5+ screens
- [x] Consolidate `COUNTRIES` array into `src/constants/countries.ts` — *Medium* — `RemindersScreen`, `EditProfileScreen`

### Low Priority

- [ ] Remove `any` from catch blocks — replace with `unknown` + type narrowing — *Low* — `useStateCoordinates`, `useEmotionStates`
- [ ] Fix `as any` type assertion in `useEmotionStates` (line 37) — *Low* — `src/hooks/useEmotionStates.ts`
- [ ] Type `GroupProfile` navigation params — replace `any[]` with proper types — *Low* — `src/types/navigation.ts`
- [ ] Type `useGroups` return values — replace `unknown[]` and `Record<string, unknown>` — *Low* — `src/hooks/useGroups.ts`
- [ ] Type `useUser.engagementScore` return — replace `Promise<unknown>` — *Low* — `src/hooks/useUser.ts`
- [ ] Resolve duplicate `"Lessons"` key in `RootStackParamList` and `MainTabParamList` — *Low* — `src/types/navigation.ts`
- [ ] Add error handling to `useCurrentUser` — *Low* — `src/hooks/useCurrentUser.ts`
- [ ] Remove legacy `nextCourse`/`nextLesson` backward-compat code from `useCourses` — *Low* — `src/hooks/useCourses.ts`
- [ ] Clean up redundant white gradient definitions in theme — *Low* — `src/theme/index.ts`

## Deferred

_(None yet)_
