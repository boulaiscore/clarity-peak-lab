# Device Activity (iOS)

Privacy-preserving Screen Time connector. The user selects attention-heavy apps
or categories in Apple's protected `FamilyActivityPicker`; LOOMA never receives
their identities. A DeviceActivity monitor records only the highest 15-minute
aggregate threshold reached each day.

## Required Apple setup

1. Request the Family Controls distribution entitlement in the Apple Developer portal.
2. Add Family Controls and App Groups to the app target.
3. Add a Device Activity Monitor Extension target containing
   `LoomaDeviceActivityMonitor.swift`.
4. Give the app and extension this App Group:
   `group.com.looma.shared`.
5. Add `DeviceUsagePlugin.swift` and `DeviceUsagePlugin.m` to the main app target.

Until the entitlement and extension are present in a signed build, the app must
treat iOS device-use data as unavailable. Do not replace it with estimates.
