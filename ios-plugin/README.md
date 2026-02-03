# HealthKit Plugin Setup (iOS)

This folder contains the native iOS code for the NeuroLoop Pro HealthKit Capacitor plugin.

## Data Types Used

| Data | HealthKit Identifier | Unit |
|------|---------------------|------|
| **Sleep** | `HKCategoryTypeIdentifier.sleepAnalysis` | Category |
| **HRV** | `HKQuantityTypeIdentifier.heartRateVariabilitySDNN` | ms (SDNN) |
| **Resting HR** | `HKQuantityTypeIdentifier.restingHeartRate` | bpm |

## Setup Instructions

After running `npx cap add ios`, follow these steps:

### 1. Copy Plugin Files

Copy the Swift and Objective-C files to your iOS project:

```bash
# From your project root
mkdir -p ios/App/App/Plugins
cp ios-plugin/health/HealthPlugin.swift ios/App/App/Plugins/
cp ios-plugin/health/HealthPlugin.m ios/App/App/Plugins/
```

### 2. Enable HealthKit Capability

In Xcode:
1. Open `ios/App/App.xcworkspace`
2. Select the App target
3. Go to **Signing & Capabilities**
4. Click **+ Capability**
5. Add **HealthKit**

This will automatically add the entitlement to your `App.entitlements` file:
```xml
<key>com.apple.developer.healthkit</key>
<true/>
```

> **Note**: Do NOT add `com.apple.developer.healthkit.access = health-records`. That's for Clinical Health Records and not needed for standard sleep/HRV/RHR.

### 3. Update Info.plist

Add the usage description to `ios/App/App/Info.plist`:

```xml
<key>NSHealthShareUsageDescription</key>
<string>LOOMA uses your sleep, HRV, and resting heart rate data to calculate your Cognitive Readiness score and deliver personalized cognitive performance insights.</string>
```

### 4. Register the Plugin

In `ios/App/App/AppDelegate.swift`, register the plugin (Capacitor typically auto-registers plugins in the Plugins folder, but verify it works):

```swift
// No manual registration usually needed if files are in the Plugins folder
// and the .m file has the correct CAP_PLUGIN macro
```

### 5. Build and Run

```bash
# Sync the project
npx cap sync ios

# Open in Xcode
npx cap open ios

# Build and run on a physical device (HealthKit requires real device)
```

## How It Works

### Permission Flow

1. App calls `requestPermissions()`
2. iOS shows the HealthKit authorization sheet
3. User selects which data types to share
4. App can then read the authorized data types

### Data Reading

- **Sleep**: Reads `sleepAnalysis` samples and aggregates them into sessions. On iOS 16+, includes sleep stages (REM, Deep, Core, Awake). On older iOS, only distinguishes between asleep and awake.

- **HRV (SDNN)**: Reads `heartRateVariabilitySDNN` samples. Each sample represents an HRV measurement in milliseconds. Note: This is SDNN, not RMSSD (Android uses RMSSD).

- **Resting HR**: Reads `restingHeartRate` samples in beats per minute.

### Source Prioritization

The plugin reads all samples from the requested time range. It does not filter by source, so data from Apple Watch, manual entries, and third-party apps are all included.

## Permissions & Entitlements Location

| File | Content |
|------|---------|
| `ios/App/App/Info.plist` | `NSHealthShareUsageDescription` |
| `ios/App/App/App.entitlements` | `com.apple.developer.healthkit = true` |
| Xcode Target | HealthKit capability enabled |

## Known Limitations

| Limitation | Details |
|------------|---------|
| **Physical device required** | HealthKit does not work in Simulator |
| **Apple Watch for HRV** | SDNN data requires Apple Watch or compatible heart rate monitor |
| **iOS 13+ required** | HealthKit sleep stages require iOS 16+; basic sleep works on iOS 13+ |
| **User must grant permission** | Cannot read data without explicit user consent |
| **Read-only** | This plugin only reads data; it does not write to HealthKit |

## Testing

To test the integration:

1. Build and run on a physical iPhone
2. Ensure you have an Apple Watch paired (for HRV data)
3. Let the app request permissions
4. Grant access to sleep, HRV, and heart rate
5. Verify data appears in the app

For testing without real data, you can add sample data via the Health app or use HKSampleDataGenerator in development builds.

## Troubleshooting

### "HealthKit is not available"
- Ensure you're running on a physical device, not Simulator
- Check that HealthKit capability is enabled in Xcode

### No HRV data
- HRV SDNN requires Apple Watch or compatible monitor
- Check if user has any HRV data in the Health app

### Permission denied
- User may have denied permission
- Check Settings → Privacy → Health → LOOMA Pro
- User can re-enable permissions there
