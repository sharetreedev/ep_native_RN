# AccountScreen

## Purpose
The `AccountScreen` provides a central hub for users to manage their personal account settings, view their profile information, and log out of the application.

## Key Features
- **Profile Overview**: Displays user avatar and email.
- **Navigation to Profile Editing**: Direct link to the `UserProfile` screen.
- **Notification Settings**: Access to the `Notifications` screen for managing reminders.
- **Billing Info**: Provides information on how to access billing through the web platform.
- **Authentication Management**: Secure log out functionality with a confirmation dialog.

## Data Dependencies
- `useAuth`: Used to retrieve the current user's email and provide the `logout` function.

## Navigation Context
- **Accessible from**: Main application navigation.
- **Navigates to**:
    - `Lessons`: Via the book icon in the header.
    - `UserProfile`: For editing profile details.
    - `Notifications`: For managing application reminders.
    - `goBack`: Basic navigation back to the previous screen.
