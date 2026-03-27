# NotificationsScreen

A centralized hub for app-wide alerts, check-in requests, and system updates.

## Features
- **Integrated Tabs**: Toggle between 'Action Required' (unread) and 'All Notifications'.
- **Real-time Updates**: Integrates with Xano backend for fetching and marking notifications as read.
- **Pull-to-Refresh**: Easily update the list.

## Integration
- `Xano`: Fetches data from `getUserNotifications` and `markAsRead`.
