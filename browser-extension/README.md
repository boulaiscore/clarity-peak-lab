# LOOMA Focus Sensor

Manifest V3 Chrome extension for passive, privacy-safe desktop work-block
detection.

## Privacy contract

- URLs and hostnames are read locally only to classify the active tab.
- The current hostname token lives only in `chrome.storage.session` and is used
  to count context switches.
- The sync queue contains only completed block aggregates: timestamps,
  durations, counts and confidence.
- Opening LOOMA while signed in pairs the sensor automatically. Queued blocks
  are isolated by account so a shared browser cannot attach them to another
  LOOMA user.
- Page content, titles, URLs, domains, searches and messages never enter the
  queue or Supabase.
- The bridge is injected only on the production LOOMA origin, Lovable preview
  origins and local development origins.

## Local install

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this folder.
4. Open LOOMA while signed in. Queued aggregates sync automatically.

The only manual action is the one-time browser permission/install step. Work
blocks start and stop automatically.

Implementation follows Chrome's current Manifest V3 service-worker, alarms,
idle and message-passing contracts:

- https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3
- https://developer.chrome.com/docs/extensions/reference/api/alarms
- https://developer.chrome.com/docs/extensions/reference/api/idle
- https://developer.chrome.com/docs/extensions/develop/concepts/messaging
