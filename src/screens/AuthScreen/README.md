# AuthScreen

## Purpose
The `AuthScreen` is the entry point for unauthenticated users. it handles both login and signup workflows to grant access to the application.

## Key Features
- **Dual Authentication Modes**: Easily toggle between 'Sign In' and 'Sign Up' views.
- **Login Workflow**: Minimal fields (email and password) for returning users.
- **Signup Workflow**: Comprehensive onboarding including first name, last name, and country.
- **SSO Integration (Planned)**: Placeholders and structure for Microsoft SSO and mobile-based authentication.
- **Error Handling**: Real-time feedback via alerts for missing fields or authentication failures.
- **Themed UI**: Consistent branding with logo, typography, and color palette from the design system.

## Data Dependencies
- `useAuth`: Orchestrates the authentication logic through `login`, `signup`, and `loginWithMicrosoft` functions.

## Navigation Context
- **Accessible from**: Automatic redirection when no valid session is detected.
- **Navigates to**: Transitions to the main application stack upon successful authentication.
