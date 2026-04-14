# OnboardingScreen

Multi-step onboarding flow new users see after signup. Collects profile
information, verifies contact channels, and walks the user through their
first check-in.

## Route

- Navigation name: `Onboarding`
- Params: none
- Entered from: `AuthScreen` after successful signup, or at app launch if `user.onboardingComplete === false`

## Step flow

Steps live in `src/screens/OnboardingScreen/steps/`. The parent screen owns
step index state and forwards `onComplete` callbacks.

1. **IntroSlidesStep** — welcome carousel
2. **ProfileStep** — name, country, avatar
3. **EmailVerificationStep** — 2FA code via `xanoAuth.verifyCode`
4. **PhoneVerificationStep** — 2FA code via `xanoAuth.verifyCode`
5. **FirstCheckInStep** — initial emotional check-in (delegates to `CheckInSliderFlow`)
6. **RemindersStep** — reminder frequency & time

## Data dependencies

- `useAuth()` — current user; onboarding writes progress via `xanoAuth.updateProfile`
- `xanoAuth.generateCode` / `verifyCode` — 2FA flow
- `createCheckIn` — first check-in submission

## Navigation targets

- On completion → root stack resets to `Main` (tab navigator)

## Notable gotchas

- Verification steps compare `result.verified === 'true' || '1'` — the Xano API returns strings, not booleans. Do not reintroduce `=== true`.
- The step index is stored in local state; if you add a step, make sure `Back` handling skips it correctly when the user has already completed it.
- Intro slides are marked seen via `intro_slides_seen` to avoid replaying on reinstall.
