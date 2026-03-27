# PulseGrid Component

The `PulseGrid` component renders a 4x4 grid of emotion tiles, representing the 16 emotional states defined in the Pulse 4.0 system.

## Features

- **Dynamic Data**: Fetches emotion names, descriptions, and colors (hex values) from the Xano backend via the `useEmotionStates` hook.
- **Visual Feedback**: Displays each emotion in its assigned quadrant color with appropriate text contrast (light/dark).
- **Selection**: Supports selecting an emotion, which highlights the tile.
- **Overlays**: Supports social overlays for displaying group counts and peer activity.
- **Simplified Structure**: Removed previous complex coordinate and sub-quadrant logic in favor of a clean, responsive 16-tile grid.

## Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `onEmotionSelect` | `(emotion: Emotion) => void` | Callback triggered when an emotion tile is tapped. |
| `externalSelectedEmotion` | `Emotion \| null` | The currently selected emotion to highlight in the grid. |
| `pairs` | `Array<{ emotionId: string; userNames: string[] }>` | (Optional) List of peer activities to overlay on specific tiles. |
| `group` | `Record<string, number>` | (Optional) Mapping of emotion IDs to counts for group view overlays. |
| `onPairSelect` | `(emotionId: string) => void` | (Optional) Callback triggered when a peer activity overlay is tapped. |

## Data Flow

The component uses the `useEmotionStates` hook to retrieve the full list of emotional states. These states are merged with local fallback definitions to ensure the UI remains functional even if the network is unavailable.

## Usage Example

```tsx
<PulseGrid
  onEmotionSelect={(emotion) => console.log('Selected:', emotion.name)}
  externalSelectedEmotion={currentEmotion}
/>
```

## Styling

The grid is designed to be responsive, following a `square` aspect ratio. Individual tiles use the hex colors provided by the API, falling back to Tailwind classes (`bg-emotional-*`) defined in the `tailwind.config.js`.
