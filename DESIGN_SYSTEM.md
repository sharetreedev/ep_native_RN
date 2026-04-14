# Pulse 4.0 — Design System

> **All colours, fonts, spacing, and border-radius values MUST be sourced from
> `src/theme/index.ts`.** Never hard-code hex strings or magic numbers.

---

## Colours

| Token | Hex | Usage |
|-------|-----|-------|
| `colors.primary` | `#91A27D` | **Meadow Green** — core brand green. Buttons, active states, tab indicator, icons, gradients |
| `colors.primaryLight` | `rgba(145,162,125,0.2)` | Light primary tint for backgrounds |
| `colors.destructive` | `#D08A6E` | **Soft Terracotta** — destructive / negative actions |
| `colors.alert` | `#FDA33A` | Warnings and alert banners |
| `colors.background` | `#EDE9E4` | App-wide background colour |
| `colors.surface` | `#FFFFFF` | Cards, modals, input backgrounds |
| `colors.surfaceMuted` | `#F3F0EB` | Muted surface variant |
| `colors.textPrimary` | `#1F2937` | Primary text (headings, body) |
| `colors.textSecondary` | `#4B5563` | Secondary text, icons |
| `colors.textMuted` | `#6B7280` | Muted / inactive text |
| `colors.textPlaceholder` | `#9CA3AF` | Input placeholders, hints |
| `colors.textOnPrimary` | `#FFFFFF` | Text on primary-coloured backgrounds |
| `colors.border` | `#E5E7EB` | Borders and dividers |

---

## Typography

| Role | Font Family | Token |
|------|-------------|-------|
| **Headers** | Quicksand (Bold) | `fonts.heading` |
| **Headers — lighter weights** | Quicksand (SemiBold / Medium / Regular) | `fonts.headingSemiBold`, `fonts.headingMedium`, `fonts.headingRegular` |
| **Body** | Manrope (Regular) | `fonts.body` |
| **Body — bolder weights** | Manrope (Medium / SemiBold / Bold) | `fonts.bodyMedium`, `fonts.bodySemiBold`, `fonts.bodyBold` |

Fonts are loaded via `@expo-google-fonts/quicksand` and `@expo-google-fonts/manrope` in `App.tsx`.

### Font Size Scale

`fontSizes.xs` (14) → `sm` (14) → `md` (14) → `base` (16) → `lg` (18) → `xl` (20) → `2xl` (24) → `3xl` (30)

---

## Buttons

- **Background**: `colors.primary` (`#91A27D`)
- **Border Radius**: `borderRadius.button` = **16px**
- **Font**: `fonts.bodyBold` (Manrope Bold)
- **Variants**: `primary` | `destructive` | `outline`
- **Component**: `src/components/Button.tsx`

```tsx
import Button from '../components/Button';

<Button title="Continue" onPress={handlePress} />
<Button title="Delete" onPress={handleDelete} variant="destructive" />
```

---

## Spacing Scale

`spacing.xs` (4) → `sm` (8) → `md` (12) → `base` (16) → `lg` (20) → `xl` (24) → `2xl` (32) → `3xl` (40) → `4xl` (48)

---

## Border Radius Scale

`borderRadius.sm` (8) → `md` (12) → `button` (16) → `lg` (20) → `xl` (24) → `full` (999)

---

## Usage Examples

```tsx
import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';

// In a StyleSheet
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    title: {
        fontSize: fontSizes['2xl'],
        fontFamily: fonts.heading,
        color: colors.textPrimary,
    },
    body: {
        fontSize: fontSizes.base,
        fontFamily: fonts.body,
        color: colors.textSecondary,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.base,
    },
});

// Inline icon colours
<ArrowLeftIcon color={colors.textSecondary} size={24} />
```
