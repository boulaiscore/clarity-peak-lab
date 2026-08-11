# Calendar Context (iOS)

Privacy-safe EventKit connector for the LOOMA mobile app. It returns only daily
schedule density and open-window aggregates. It never returns event titles,
notes, locations, attendees, URLs or calendar names.

## Xcode setup

1. Add `CalendarContextPlugin.swift` and `CalendarContextPlugin.m` to the app target.
2. Add `NSCalendarsFullAccessUsageDescription` to `Info.plist` with a concise
   explanation that LOOMA uses schedule density to estimate cognitive load.
3. Build on a physical iPhone and grant calendar access once from the LOOMA
   connection screen.

On iOS 17+ the plugin requests full event access because it must read event
times. Older supported versions use EventKit's legacy event authorization.
