# Device Activity (iOS)

Privacy-preserving Screen Time connector. The user selects attention-heavy apps
or categories in Apple's protected `FamilyActivityPicker`; LOOMA never receives
their identities. A DeviceActivity monitor records only the highest 15-minute
aggregate threshold reached each day.

## Project wiring

The Capacitor iOS project already includes `DeviceUsagePlugin` in the app target,
embeds a `DeviceActivityMonitorExtension` target, and shares only aggregate
thresholds through `group.com.looma.shared`.

## Required Apple Developer setup

1. Request the Family Controls distribution entitlement in the Apple Developer portal.
2. Enable Family Controls for both `com.looma` and
   `com.looma.DeviceActivityMonitorExtension`.
3. Register this App Group for both identifiers:
   `group.com.looma.shared`.
4. Regenerate/download provisioning profiles before creating a signed archive.

Until Apple grants the entitlement and it is present in a signed build, the app
must treat iOS device-use data as unavailable. Do not replace it with estimates.
