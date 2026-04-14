# Screen README Template

Every non-trivial screen under `src/screens/` should have a `README.md` alongside its `.tsx` file. These READMEs exist for two reasons:

1. **Agent discoverability** — AI agents (and new humans) can skim one file to understand a screen's purpose, data dependencies, and surface area without having to read a 600-line component.
2. **Refactoring safety** — when splitting a screen into subcomponents, the README captures intent so behavioural changes are obvious in review.

## When to add one

- Any screen over ~200 lines
- Any screen with non-trivial data fetching, mutations, or navigation fan-out
- Any screen involved in onboarding, auth, or a critical user flow

## Template

Copy the block below into `src/screens/YourScreen/README.md` and fill in each section. Keep it under ~40 lines — this is a map, not documentation.

```markdown
# YourScreen

One-sentence purpose. What does the user *see* and what can they *do* here?

## Route

- Navigation name: `YourScreen`
- Params: `{ userId: number }` (or "none")
- Typically entered from: `SomeOtherScreen`

## Data dependencies

- `useYourHook()` — what it loads
- `useAuth()` — current user
- Cached via `useCachedFetch(CACHE_KEYS.YOUR_KEY, ...)` if applicable

## Key subcomponents

- `<YourHeader />` — header with avatar + stats
- `<YourList />` — main list; handles empty state
- `<YourActionSheet />` — bottom sheet opened from list rows

## Navigation targets

- `SomeDetailScreen` — when the user taps a list row
- `SomeEditScreen` — from the header action button

## Notable gotchas

- Any non-obvious behaviour future-you will trip over (e.g. "refetches on focus because X", "order matters because Y").
```

## Example

See `src/screens/MyPairsScreen/README.md` for a concrete, complete example.
