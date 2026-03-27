# CheckIn Screen Redesign — Grid + Slider Experiences

## Context
The current CheckInScreen uses a full 4x4 CircumplexGrid for the grid mode and a 2-step sequential slider (pleasantness → energy) for slider mode. The goal is to replace both with more engaging, intuitive experiences:
- **Grid**: A 2x2 quadrant-first approach (pick zone → pick emotion → confirm)
- **Slider**: A 2D mesh gradient palette with finger-drag, haptic feedback, and axis labels

## Data Model Notes
- `XanoEmotionState` does NOT have `zone_name`/`zone_label` — those exist only on `XanoRecentCheckInEmotion`
- We derive quadrants from the `energy` + `pleasantness` fields already on each `MappedEmotion` (from `useEmotionStates`)
- Each quadrant has 4 emotions (4x4 grid → 2x2 quadrants of 4 each)

### Quadrant Mapping
| Position | Energy | Pleasantness | Color | Emotions |
|----------|--------|-------------|-------|----------|
| Top-Left | High | Unpleasant | #CA501C | Enraged, Angry, Overwhelmed, Strained |
| Top-Right | High | Pleasant | #6FAD42 | Excited, Ecstatic, Engaged, Happy |
| Bottom-Left | Low | Unpleasant | #9B9D93 | Anxious, Flat, Depressed, Sad |
| Bottom-Right | Low | Pleasant | #7EA8BE | Reflective, Content, Calm, Blissful |

---

## Implementation Plan

### Step 1: Create `QuadrantGrid` component
**New file**: `src/components/checkin/QuadrantGrid.tsx`

A 3-step flow component:
1. **Quadrant Selection** — 2x2 grid of large colored tiles with quadrant labels. Each tile uses the quadrant color above. On press, transitions to step 2.
2. **Emotion Selection** — Shows the 4 emotions within the selected quadrant as tiles (using `emotionColour` from API data). User taps one to select. A "Back" link returns to step 1.
3. **Confirmation** — Shows selected emotion name/color. "Continue" button (active only when emotion selected) calls `onComplete`. Also show emotion description if available.

Props: `{ emotions: MappedEmotion[], onComplete: (emotion: MappedEmotion) => void }`

Group emotions using: `energy === 'high'/'low'` + `pleasantness === 'high'/'low'`.

### Step 2: Create `MeshGradientSlider` component
**New file**: `src/components/checkin/MeshGradientSlider.tsx`

A 2D touch surface replacing the sequential slider:
1. Render a square/rectangular view with 4-corner gradient (using `LinearGradient` from `expo-linear-gradient` or layered semi-transparent views). Each corner is one quadrant's `themeColour` fading to transparent center.
2. **PanResponder** tracks finger position → maps X to pleasantness, Y to energy (inverted: top = high energy).
3. **Haptic feedback** via `expo-haptics` (`selectionAsync()`) triggered on quadrant boundary crossings during drag.
4. **Axis labels**: Y-axis left side "High Energy" (top) / "Low Energy" (bottom). X-axis bottom "Unpleasant" (left) / "Pleasant" (right).
5. On finger lift: determine closest emotion from coordinates → show emotion name overlay → "Confirm" button.
6. Show a draggable indicator/cursor that follows the finger.

Props: `{ emotions: MappedEmotion[], onComplete: (emotion: MappedEmotion) => void }`

For the mesh gradient effect: layer 4 `LinearGradient` views (one per corner), each going from the quadrant color at its corner to transparent at the center/opposite corner. This creates a natural 4-color blend.

### Step 3: Update `CheckInScreen.tsx`
**Modify**: `src/screens/CheckInScreen/CheckInScreen.tsx`

- Replace `CircumplexGrid` usage with `QuadrantGrid`
- Replace `CheckInSliderFlow` usage with `MeshGradientSlider`
- Pass `emotionStates` (from `useEmotionStates`) to both components
- Keep existing tab switching (Slider/Grid), header, and navigation logic
- Remove the `Alert.alert` confirmation — both new components handle confirmation internally
- Keep `createCheckIn` call on confirmation

### Step 4: Create shared checkin directory
**New file**: `src/components/checkin/index.ts` — barrel export for the new components

---

## Files Modified
- `src/screens/CheckInScreen/CheckInScreen.tsx` — rewire to new components
- **New**: `src/components/checkin/QuadrantGrid.tsx`
- **New**: `src/components/checkin/MeshGradientSlider.tsx`
- **New**: `src/components/checkin/index.ts`

## Dependencies
- `expo-haptics` — already installed (v15.0.8), not yet used
- `expo-linear-gradient` — need to verify if installed; fallback to layered colored Views with opacity if not

## Verification
- Run `npx expo start` and navigate to CheckIn screen
- Test Grid tab: tap quadrant → see 4 emotions → select one → confirm
- Test Slider tab: drag finger across gradient → see haptic feedback → lift → confirm emotion
- Verify `createCheckIn` is called correctly on both flows
