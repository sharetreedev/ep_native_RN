# EmergencyServicesScreen

## Purpose
The `EmergencyServicesScreen` is a critical safety feature that provides users with immediate access to professional crisis support services, emergency contacts, and Employee Assistance Programs (EAP).

## Key Features
- **Crisis Hotlines**: Direct access to services like Lifeline, Beyond Blue, and Kids Helpline.
- **Categorized Support**: Contacts are logically grouped into Emergency, EAP, and General Support categories for quick scanning.
- **Direct Dial Integration**: Uses the device's native dialer to facilitate immediate calls.
- **Safety Disclaimer**: A prominent header and scrollable disclaimer ensuring users in high distress know to call local emergency services (000) first.
- **EAP Accessibility**: Dedicated section for organization-specific mental health support.

## Data Dependencies
- **Static Assets**: Currently uses a hardcoded list of Australian-based support services.

## Navigation Context
- **Accessible from**: Primarily linked from the `Valerie` chat assistant and support-related menus.
- **Navigates to**:
    - `goBack`: Returns to the previous context.
    - **External**: Opens the system phone application via `Linking`.
