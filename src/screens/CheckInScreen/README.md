# CheckInScreen

## Purpose
The `CheckInScreen` is a core component of the Pulse application, allowing users to pause, reflect, and log their current emotional state through interactive visualizations and guided flows.

## Key Features
- **Dual Interaction Modes**:
    - **Slider Flow**: A guided, multi-step interface for users who prefer to identify their emotions by sliding through different dimensions (Valence/Arousal).
    - **Visual Grid**: An interactive `CircumplexGrid` that provides a complete map of emotions for quick, direct selection.
- **Emotion Logging**: Seamlessly creates a 'Check-In' record upon confirmation of an emotional state.
- **Deep Dive**: Support for long-press gestures on emotions to view detailed descriptions on the `EmotionDetail` screen.
- **Contextual Guidance**: Provides visual prompts like "How are you feeling right now?" to encourage mindfulness.

## Data Dependencies
- `useCheckIns`: Custom hook used to persist the selected emotion to the backend/store.
- `useEmotionStates`: Provides the necessary mapping between the visual grid coordinates and the backend data models.
- `findEmotionAtCoordinate`: Utility function to map screen touches to specific emotional definitions.

## Navigation Context
- **Accessible from**: The 'Pulse' button or main dashboard.
- **Navigates to**:
    - `Main`: Redirects back to the main application view after a successful check-in.
    - `EmotionDetail`: Triggered via long-press on an emotion in the grid.
    - `goBack`: Cancellable via the header close button.
