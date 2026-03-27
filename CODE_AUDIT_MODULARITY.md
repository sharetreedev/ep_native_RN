# Code Audit: Modularity — `mobile/`

**Scope:** `mobile/src` (screens, components, navigation, theme, types, lib, constants)  
**Focus:** Separation of concerns, reusability, coupling, and structure.

**Completed (follow-up):** Typed CheckInScreen; added `getEmotionLabelContrast` and `getEmotionFromPleasantnessAndEnergy` in `lib/emotionUtils.ts`; new theme tokens; extracted LastCheckInCard, QuickLinkCard, NextLessonCard; AuthContext + useAuth in AppNavigator, AuthScreen, AccountScreen.

---

## 1. What’s Working Well

### 1.1 Clear folder structure
- **`/theme`** — Single source for design tokens (`colors`, `fonts`, `fontSizes`, `spacing`, `borderRadius`) with `DESIGN_SYSTEM.md` backing it.
- **`/types`** — Central navigation types (`RootStackParamList`, `MainTabParamList`) and `Emotion` from constants.
- **`/constants`** — `emotions.ts` holds emotion model and grid data; used by components and screens.
- **`/components`** vs **`/screens`** — Screens compose components; no screens imported by other screens.

### 1.2 Reusable UI components
- **`Button`** — Variants/sizes, uses theme only; no screen-specific logic.
- **`PulseGrid`** — Configurable (`mode`, `data`, callbacks); used by CheckIn, MyPairs, Groups.
- **`EmotionSquare`** — Single responsibility (display + press/long-press); depends only on `Emotion` and theme-adjacent styling.
- **`CheckInSliderFlow`** — Encapsulates slider UX and emotion mapping; exposes `onComplete` / `onCancel`.

### 1.3 Consistent import patterns
- Screens import from `../theme`, `../components`, `../constants`, `../types` — no circular dependencies observed.
- Navigation imports screens by path; types live in one place.

### 1.4 Theme usage where applied
- Many files use `colors`, `fonts`, `fontSizes`, `borderRadius`, `spacing` from `theme/index.ts` as intended.

---

## 2. Modularity Issues & Recommendations

### 2.1 Design system violations (theme leakage)

**Issue:** Many components and screens still use raw Tailwind color classes or hex values instead of theme tokens.

| Location | Example | Recommendation |
|----------|---------|----------------|
| `AppNavigator.tsx` | `color="#16A34A"`, `bg-cream` | Use `colors.primary`, `colors.background` (and add `cream` to theme if it’s canonical). |
| `MyPulseScreen.tsx` | `#A8B896`, `#3B82F6`, `#93C5FD`, `#BFDBFE`, `#FDE68A`, `#1E40AF`, `#92400E`, `#78350F`, `#E5E7EB`, `#A7F3D0`, `#065F46`, `bg-blue-100`, `bg-orange-100` | Define semantic tokens (e.g. `cardGradientEnd`, `supportCardPrimary`, `lessonCardPrimary`) or reuse existing; use `colors.*` and `spacing`/`borderRadius`. |
| `EmotionDetailScreen.tsx` | `text-[#5F6F4D]`, `bg-cream`, `bg-gray-*` | Use `colors.textPrimary` (or new token) and theme surface/background. |
| `ValerieScreen.tsx` | `#9333EA`, `bg-green-100`, `bg-green-600`, `bg-white` | Use theme tokens; ensure “chat” and “send” colors are defined in theme. |
| `AccountScreen.tsx` | `#4B5563`, `#D8DECF`, `bg-green-500` | Use `colors.textSecondary` and theme surface/primary variants. |
| `UserProfileScreen.tsx` | Many hex and Tailwind colors (`#D1E7D2`, `#EAD4CD`, `#C2410C`, `#8CAB8D`, etc.) | Move palette to theme; use tokens everywhere. |
| `CheckInSliderFlow.tsx` | `bg-gray-200`, `text-gray-*` in JSX | Prefer theme (e.g. `colors.border`, `colors.textMuted`). |
| `RecentCheckIns.tsx` | Only Tailwind classes; no theme import | Import theme and use `colors.*`, `fontSizes`, `fonts`. |
| `EngagementScore.tsx` | `bg-white`, `bg-gray-*`, `text-primary` (Tailwind) | Use `colors.surface`, `colors.textPrimary`, etc. |
| `PulseGrid.tsx` | `bg-cream`, `bg-gray-200`, `bg-white` | Use `colors.background`, `colors.border`, `colors.surface`. |

**Action:**  
- Add any missing semantic tokens to `theme/index.ts` (e.g. card gradients, chat bubbles).  
- Do a project-wide pass: replace hex and Tailwind color classes with theme tokens.  
- Optionally add a lint rule or script that flags hex and non-theme color class names outside `theme/`.

---

### 2.2 Duplicated “emotion label contrast” logic

**Issue:** The rule “use white text on dark emotion tiles, dark text on light” is implemented in three places with different arrays:

- **`EmotionSquare.tsx`:** `['depressed', 'blissful', 'enraged', 'ecstatic']`
- **`CheckInSliderFlow.tsx`:** `['enraged', 'angry', 'ecstatic', 'excited', 'overwhelmed']`
- **`EmotionDetailScreen.tsx`:** `['enraged', 'angry', 'ecstatic', 'excited', 'overwhelmed']`

So the same concept is repeated and the lists are inconsistent.

**Recommendation:**  
- Add a small shared helper, e.g. in `constants/emotions.ts` or `lib/emotionUtils.ts`:

  ```ts
  export function getEmotionLabelContrast(emotionId: string): 'light' | 'dark' {
    const LIGHT_LABEL_IDS = ['enraged', 'angry', 'ecstatic', 'excited', 'overwhelmed', 'depressed', 'blissful'];
    return LIGHT_LABEL_IDS.includes(emotionId) ? 'light' : 'dark';
  }
  ```

- Use it in `EmotionSquare`, `CheckInSliderFlow`, and `EmotionDetailScreen` (and any future emotion tiles) so there is one source of truth.

---

### 2.3 Inconsistent screen props (navigation typing)

**Issue:** Most screens use `useNavigation<...>()` and are type-safe. `CheckInScreen` receives navigation via props and uses `any`:

```ts
export default function CheckInScreen({ navigation }: any) {
```

**Recommendation:**  
Use the same pattern as other stack screens:

```ts
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckIn'>;
export default function CheckInScreen({ navigation }: Props) {
```

This keeps navigation typing consistent and improves modularity (clear contract at the boundary).

---

### 2.4 No shared data/hooks layer

**Issue:**  
- **Auth:** `AppNavigator` holds `isAuthenticated` in local `useState`; no shared auth state or hook.  
- **Check-ins / user data:** Screens use local state or mock data (e.g. `RecentCheckIns` MOCK_PAIRS, MyPulseScreen “Reflective” and placeholders).  
- **API:** `lib/xano.ts` is a thin placeholder; no shared data-fetching or caching.

So “modularity” of features is limited: each screen could easily re-fetch or re-implement the same logic.

**Recommendation:**  
- Introduce a small auth module (e.g. context or zustand store) and use it in `AppNavigator` and any screen that needs auth.  
- Add a `hooks/` (or `stores/`) layer for check-ins, user, and notifications so screens consume `useCheckIns()`, `useCurrentUser()`, etc., instead of local mocks.  
- Keep `lib/xano.ts` as the API client and call it from hooks/stores only, so screens stay UI-only and modular.

---

### 2.5 Large, monolithic screens

**Issue:**  
- **MyPulseScreen:** Header, last check-in card, quick links (Check In, Get Support, Lessons), suggested check-ins, next lesson, and a modal all in one ~200-line file.  
- **UserProfileScreen:** Profile header, stats, legend, multiple cards, and list in one component.

This makes it harder to test or reuse pieces (e.g. “last check-in card” or “quick link strip”) in other screens.

**Recommendation:**  
- Extract presentational subcomponents, e.g. `LastCheckInCard`, `QuickLinkCard`, `SuggestedCheckIns`, `NextLessonCard`, and use them in `MyPulseScreen`.  
- Similarly, extract `ProfileStats`, `EmotionLegend`, `ProfileSectionCard` (or similar) from `UserProfileScreen`.  
- Keep screens as thin orchestrators: data (or hooks) + composition of these components. This improves modularity and reuse.

---

### 2.6 Mixed styling approaches

**Issue:**  
- Some files use `StyleSheet.create` with theme imports (e.g. `CheckInScreen`, `Button`).  
- Others rely on `className` with Tailwind (e.g. `MyPulseScreen`, `EmotionSquare`, `PulseGrid`).  
- Same file sometimes mixes both (e.g. `CheckInSliderFlow`).

That’s acceptable for a transition period, but it can make it unclear where to change styling and can duplicate values (e.g. radius, spacing) between theme and Tailwind.

**Recommendation:**  
- Prefer one primary approach: either theme + StyleSheet everywhere, or theme + Tailwind with a strict mapping (e.g. `bg-cream` → theme `background`).  
- Document the choice in `DESIGN_SYSTEM.md` and, if using Tailwind, consider a small set of custom utilities that map to theme tokens so design changes stay in one place.

---

### 2.7 Tight coupling to emotion grid structure

**Issue:**  
- `CheckInSliderFlow` embeds the mapping from pleasantness/energy to grid (row/col) and uses `EMOTIONS` and grid indices.  
- That logic is specific to the current 4×4 layout; if the grid or emotion set changes, multiple places may need updates.

**Recommendation:**  
- Move “pleasantness/energy → emotion” into a pure function in `constants/emotions.ts` or `lib/emotionUtils.ts`, e.g. `getEmotionFromPleasantnessAndEnergy(pleasantness: number, energy: number): Emotion`.  
- Have `CheckInSliderFlow` call that function only. That keeps grid layout and emotion set as the single source of truth and improves modularity.

---

### 2.8 No barrel exports

**Issue:**  
There are no `index.ts` barrels for `components/`, `screens/`, or `hooks/`. Imports are always deep paths (e.g. `../components/PulseGrid`).

**Recommendation:**  
Optional: add minimal barrels if you want shorter imports and a clear public API, e.g.:

- `components/index.ts` re-exporting `Button`, `PulseGrid`, `EmotionSquare`, etc.  
- Same for `screens` if you prefer `import { CheckInScreen } from '../screens'`.

Not required for modularity, but can simplify refactors and document “public” modules.

---

## 3. Summary Table

| Area | Status | Action |
|------|--------|--------|
| Folder structure | Good | Keep; consider barrels only if desired. |
| Theme as single source | Partial | Enforce theme tokens; remove hex/Tailwind colors outside theme. |
| Reusable components | Good | Keep; extract more subcomponents from large screens. |
| Shared “emotion label” logic | Weak | Centralize in one helper. |
| Navigation typing | Good except CheckInScreen | Type `CheckInScreen` props. |
| Data / auth layer | Missing | Add auth + data hooks/stores; keep API in `lib`. |
| Screen size / composition | Mixed | Break up MyPulseScreen, UserProfileScreen into smaller components. |
| Styling approach | Mixed | Standardize on theme + one styling method; document. |
| Emotion grid / slider logic | Coupled | Extract pleasantness/energy → emotion to shared util. |

---

## 4. Suggested Order of Work

1. **Quick wins:** Type `CheckInScreen` navigation props; add `getEmotionLabelContrast` and use it in all three places.  
2. **Theme compliance:** Replace hex and non-theme Tailwind colors with tokens; add missing tokens to theme.  
3. **Extract subcomponents:** LastCheckInCard, QuickLinkCard, etc., from MyPulseScreen and UserProfileScreen.  
4. **Data layer:** Auth store/context and 1–2 hooks for check-ins (and optionally user) so screens stay dumb.  
5. **Slider logic:** Move pleasantness/energy → emotion into `constants/emotions.ts` or `lib/emotionUtils.ts`.  
6. **Styling:** Decide theme+StyleSheet vs theme+Tailwind and document; then gradually align existing files.

This order improves modularity with minimal risk and sets the base for scaling the app.
