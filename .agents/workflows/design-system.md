---
description: How to follow the Pulse 4.0 design system when building or modifying UI
---

# Pulse 4.0 Design System Workflow

Follow these steps whenever creating or modifying a screen or component in `mobile/src/`.

1. **Read the design system reference** at `mobile/DESIGN_SYSTEM.md` before making any changes.

2. **Import theme tokens** at the top of your file:
   ```tsx
   import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';
   ```

3. **Use colour tokens** — never hard-code hex strings:
   - Green: `colors.primary` (`#91A27D`)
   - Destructive: `colors.destructive` (`#D08A6E`)
   - Alert: `colors.alert` (`#FDA33A`)
   - Background: `colors.background` (`#EDE9E4`)

4. **Apply fonts**:
   - Headers: `fontFamily: fonts.heading` (Quicksand Bold)
   - Body: `fontFamily: fonts.body` (Manrope Regular)
   - Buttons: `fontFamily: fonts.bodyBold` (Manrope Bold)

5. **Use the Button component** for all interactive buttons:
   ```tsx
   import Button from '../components/Button';
   <Button title="Submit" onPress={handleSubmit} />
   ```
   - All buttons use 16px border radius by default.

6. **Use spacing and border radius tokens** from theme instead of raw numbers.

7. **Verify** your changes render correctly by previewing in Expo Go.
