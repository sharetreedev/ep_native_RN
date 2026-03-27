# Known TypeScript Errors

13 errors across 7 files (as of 2026-03-24). None are runtime-blocking but should be resolved.

---

## 1. `src/components/LastCheckInCard.tsx:177` — TS2769

**`onDataPointClick` type mismatch with `react-native-chart-kit`**

The `handleDataPointClick` callback (line 101) expects `{ index, value, x, y, datasetIndex }` but the library's type signature provides `{ index, value, dataset, x, y, getColor }`.

**Fix:** Update the callback parameter type to match the library's `onDataPointClick` signature — replace `datasetIndex: number` with `dataset: Dataset` and `getColor: (opacity: number) => string`.

---

## 2. `src/components/visualization/OutlookChart.tsx:37,38,49,63` — TS2339 (4 errors)

**`colors.chartOutlookFrom` does not exist in theme**

The component references `colors.chartOutlookFrom` which was never added to `src/theme/index.ts`.

**Fix:** Add `chartOutlookFrom` to the `colors` object in the theme, or replace with an existing color token.

---

## 3. `src/components/visualization/PulseChart.tsx:37,38,49,63` — TS2339 (4 errors)

**`colors.chartPulseFrom` does not exist in theme**

Same issue as OutlookChart — references `colors.chartPulseFrom` which doesn't exist.

**Fix:** Add `chartPulseFrom` to the `colors` object in the theme, or replace with an existing color token.

---

## 4. `src/contexts/AuthContext.tsx:198` — TS2339

**`xanoAuth.microsoftSSO` does not exist**

The `microsoftSSO` method is called but not declared in the `xanoAuth` API object in `src/lib/xano.ts`.

**Fix:** Add the `microsoftSSO` method to the `xanoAuth` export in `src/lib/xano.ts`.

---

## 5. `src/screens/NotificationsScreen/NotificationsScreen.tsx:269` — TS2322

**`alignItems: 'left'` is not a valid `FlexAlignType`**

React Native does not support `'left'` for `alignItems`. Valid values are `'flex-start'`, `'flex-end'`, `'center'`, `'stretch'`, `'baseline'`.

**Fix:** Replace `'left'` with `'flex-start'`.

---

## 6. `src/screens/OnboardingScreen/OnboardingScreen.tsx:186` — TS2345

**`Emotion` not assignable to `MappedEmotion`**

`createCheckIn` expects a `MappedEmotion` (which includes `xanoId`, `emotionColour`, `themeColour`) but receives a plain `Emotion` object.

**Fix:** Map the `Emotion` to a `MappedEmotion` before passing to `createCheckIn`, or update the function signature to accept `Emotion`.

---

## 7. `src/screens/UserProfileScreen/UserProfileScreen.tsx:441` — TS2322

**`pairsUserId` expects `number` but receives `string`**

The `userId` from route params is a `string` but `CheckInWithUser` component expects `pairsUserId: number`.

**Fix:** Parse `userId` to a number before passing: `pairsUserId={Number(userId)}`, or update the route param type to `number`.
