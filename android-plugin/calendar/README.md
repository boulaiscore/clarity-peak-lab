# Calendar Context (Android)

Privacy-safe Calendar Provider connector. It reads event times on-device and
returns only daily schedule density and free-window aggregates.

1. Copy `CalendarContextPlugin.kt` into the app's native plugin package.
2. Add `<uses-permission android:name="android.permission.READ_CALENDAR" />`.
3. Register `CalendarContextPlugin` in `MainActivity` alongside the existing
   Health and AppBlocker plugins.

Titles, notes, locations, attendees, URLs and calendar identities are never
queried and therefore cannot reach the web layer or Supabase.
