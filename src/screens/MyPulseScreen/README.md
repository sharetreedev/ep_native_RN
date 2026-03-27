# MyPulseScreen

Main dashboard of the application, providing a high-level overview of the user's emotional state and quick access to key features.

## Features

### Last Check-In Widget
- **Visuals**: Displays a dynamic chart (similar to Chart.js) showing the pleasantness and energy trend.
- **Data Range**: Axis range is -4 to 4 for both X and Y axis.
- **Scope**: Truncated to the last 7 check-ins of the user.
- **Dynamic Styling**: The card background uses a gradient of `emotionColour` & `themeColour` found in `emotion/get_all_states`, reflecting the most recent emotion the user checked in to.

### Quick Links
- Fast access to:
  - **Check In**
  - **Getting Support**
  - **Lessons**

### Suggested Check-Ins
- **Purpose**: Lists pairs who require attention or haven't interacted recently.
- **Logic**: 
  - Pairs where a state coordinate is marked `needs_attention: true` in the last 7 days.
  - Pairs who haven't checked in at all within the last 7 days.

### Next Lesson Card
- Shows the user's next scheduled lesson.
- **Navigation**: Navigates to the `LessonScreen`.
- **Imagery**: Uses `assets/Ep - App - Imageryt.webp` as the holder image.

---

## API & Data Rules

### Caching
- All data must be cached for easy re-use and performance.
- Cache must be overridden on page reload and app reload to ensure fresh data.

### Loading Strategy
- Use the `api_docs` folder as the reference for loading and handling data logic.

### Feature Data Sources

| Feature | Endpoint | Filter / Param Details |
| :--- | :--- | :--- |
| **Last Check-In Widget** | `/auth/me` | Uses `recentStateEmotion_data` to identify and title the last emotion. |
| | `/checkins/get_all` | Chart data pulled from nested `items` object, truncated to the first 7. |
| **Suggested Check-Ins** | `/pairs` | GET filtered by users where nested `active.other_user.needs_attention` is true. |
| **Next Lesson Card** | `/courses/next_lesson` | Fetches the specific next lesson details. |

## Navigation
- `SupportRequests`
- `Notifications`
- `Account`
- `UserProfile` (Trend view)
- `CheckIn`
- `EmergencyServices`
- `LessonScreen` (from Next Lesson Card)
- `Pairs`

