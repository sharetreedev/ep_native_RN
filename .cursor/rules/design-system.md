---
applyTo: "mobile/src/**/*.{ts,tsx}"
---

# Pulse 4.0 Design System Rules

When modifying any file in `mobile/src/`, you MUST follow the Pulse Design System.

## Colours
- **NEVER** hard-code hex colour strings (e.g. `#91A27D`, `#E5E7EB`).
- **ALWAYS** import from `src/theme` and use named tokens:
  ```ts
  import { colors } from '../theme';
  // Use: colors.primary, colors.background, colors.textPrimary, etc.
  ```
- Primary Green (Meadow Green): `colors.primary` → `#91A27D`
- Destructive (Soft Terracotta): `colors.destructive` → `#D08A6E`
- Alerts: `colors.alert` → `#FDA33A`
- App background: `colors.background` → `#EDE9E4`

## Typography
- **Headers**: Use `fontFamily: fonts.heading` (Quicksand Bold)
- **Body text**: Use `fontFamily: fonts.body` (Manrope Regular)
- **Buttons**: Use `fontFamily: fonts.bodyBold` (Manrope Bold)
- **Font sizes**: Use `fontSizes.xs | sm | md | base | lg | xl | 2xl | 3xl`

## Buttons
- Use the `<Button>` component from `src/components/Button.tsx`
- All buttons must have **16px border radius** (`borderRadius.button`)
- Default variant is `primary` (Meadow Green)

## Spacing & Radius
- Use `spacing.*` and `borderRadius.*` tokens from theme
- Never use raw pixel values for padding/margin without checking the spacing scale first

## Reference
See `mobile/DESIGN_SYSTEM.md` for the full design system documentation.
