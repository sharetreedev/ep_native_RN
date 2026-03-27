# EmotionDetailScreen

## Purpose
The `EmotionDetailScreen` provides users with deep insights into a specific emotion, including its description and practical strategies for emotional regulation.

## Key Features
- **Educational Deep Dive**: Shows a clear, long-form description of what the emotion represents.
- **Regulation Guidance**: Offers a specific "How to shift state" strategy, helping users move toward more resourceful emotional states.
- **Adaptive Visuals**: The screen dynamically adjusts its theme and text colors based on the specific emotion being viewed, ensuring high contrast and accessibility.
- **Visual Branding**: Displays the emotion's representative color and name in a prominent, recognizable card format.

## Data Dependencies
- **Route Parameters**: Expects an `emotion` object (conforming to the `Emotion` type) passed during navigation.
- `getEmotionLabelContrast`: A utility helper that determines whether to use light or dark text on the emotion's background color to maintain accessibility standards.

## Navigation Context
- **Accessible from**: Triggered via long-press on an emotion in the `CheckInScreen` or from other emotion-based lists.
- **Navigates to**:
    - `goBack`: Returns to the previous screen (e.g., the Check-In grid).
