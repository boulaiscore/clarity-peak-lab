# Health Connect Plugin Setup (Android)

This folder contains the native Android code for the NeuroLoop Pro Health Connect Capacitor plugin.

## Data Types Used

| Data | Health Connect Record Type | Unit |
|------|---------------------------|------|
| **Sleep** | `SleepSessionRecord` | Sessions with stages |
| **HRV** | `HeartRateVariabilityRmssdRecord` | ms (**RMSSD**, not SDNN) |
| **Resting HR** | `RestingHeartRateRecord` | bpm |

> ⚠️ **Important**: Android Health Connect provides HRV as **RMSSD**, not SDNN (which iOS uses). These are related but different metrics. The app's `HRVRecord.metric` field will be `\"rmssd\"` on Android.

## Setup Instructions

After running `npx cap add android`, follow these steps:

### 1. Copy Plugin Files

```bash
# From your project root
mkdir -p android/app/src/main/java/app/lovable/f84e62a560cb4db59ded2b07c99a786f/plugins
cp android-plugin/health/HealthPlugin.kt android/app/src/main/java/app/lovable/f84e62a560cb4db59ded2b07c99a786f/plugins/
```

### 2. Add Health Connect Dependency

Add to `android/app/build.gradle`:

```gradle
dependencies {
    // ... existing dependencies
    
    // Health Connect
    implementation "androidx.health.connect:connect-client:1.1.0-alpha07"
}
```

### 3. Update AndroidManifest.xml

Add these entries to `android/app/src/main/AndroidManifest.xml`:

Inside the `<manifest>` tag:
```xml
<!-- Health Connect permissions -->
<uses-permission android:name="android.permission.health.READ_SLEEP" />
<uses-permission android:name="android.permission.health.READ_HEART_RATE_VARIABILITY" />
<uses-permission android:name="android.permission.health.READ_RESTING_HEART_RATE" />

<!-- Query Health Connect package -->
<queries>
    <package android:name="com.google.android.apps.healthdata" />
</queries>
```

Inside the `<application>` tag, add an intent filter for the permission rationale:
```xml
<activity-alias
    android:name="ViewPermissionUsageActivity"
    android:exported="true"
    android:targetActivity=".MainActivity"
    android:permission="android.permission.START_VIEW_PERMISSION_USAGE">
    <intent-filter>
        <action android:name="android.intent.action.VIEW_PERMISSION_USAGE" />
        <category android:name="android.intent.category.HEALTH_PERMISSIONS" />
    </intent-filter>
</activity-alias>
```

### 4. Register the Plugin

In `android/app/src/main/java/app/lovable/f84e62a560cb4db59ded2b07c99a786f/MainActivity.kt`:

```kotlin
package app.lovable.f84e62a560cb4db59ded2b07c99a786f

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import app.lovable.f84e62a560cb4db59ded2b07c99a786f.plugins.HealthPlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(HealthPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
```

### 5. Build and Run

```bash
# Sync the project
npx cap sync android

# Run on device/emulator (Android 14+ preferred)
npx cap run android
```

## How It Works

### Permission Flow

1. App calls `requestPermissions()`
2. If Health Connect is not installed, user is directed to Play Store
3. Health Connect permission dialog appears
4. User grants access to specific data types
5. App can now read the authorized data

### Data Reading

- **Sleep**: Reads `SleepSessionRecord` including sleep stages (REM, Deep, Light, Awake)
- **HRV (RMSSD)**: Reads `HeartRateVariabilityRmssdRecord` in milliseconds
- **Resting HR**: Reads `RestingHeartRateRecord` in beats per minute

## Permissions & Manifest Location

| File | Content |
|------|---------|
| `AndroidManifest.xml` | `android.permission.health.READ_SLEEP` |
| `AndroidManifest.xml` | `android.permission.health.READ_HEART_RATE_VARIABILITY` |
| `AndroidManifest.xml` | `android.permission.health.READ_RESTING_HEART_RATE` |
| `AndroidManifest.xml` | `<queries>` for Health Connect package |
| `AndroidManifest.xml` | Permission usage activity alias |

## Known Limitations

| Limitation | Details |
|------------|---------|
| **Android 14+ native** | Health Connect is built into Android 14+. Older devices (Android 9-13) need the Health Connect app installed from Play Store |
| **HRV = RMSSD** | Android provides RMSSD, not SDNN like iOS. Different metric! |
| **Wearable sync required** | Data must first sync from wearable (Fitbit, Garmin, etc.) to Health Connect |
| **No HRV from all devices** | Not all wearables provide HRV data to Health Connect |
| **Resting HR availability** | Requires wearable that tracks resting heart rate |

---

## Google Play Release Checklist

### 1. Health Apps Declaration (Play Console)

Navigate to **App content** → **Health apps**:\

- [ ] Declare that the app accesses Health Connect
- [ ] Specify data types:
  - Sleep
  - Heart Rate Variability  
  - Resting Heart Rate
- [ ] Explain purpose: \"Calculate Cognitive Readiness score for personalized cognitive performance insights\"

### 2. Data Safety Section (Play Console)

Navigate to **App content** → **Data safety**:\

| Data Type | Collection | Sharing | Purpose |
|-----------|------------|---------|---------|
| Sleep data | Yes | No | App functionality, Personalization |
| Heart rate | Yes | No | App functionality, Personalization |
| Health info | Yes | No | App functionality, Personalization |

Additional declarations:
- [ ] Data is encrypted in transit
- [ ] Data can be deleted on request
- [ ] Data is NOT shared with third parties

### 3. Privacy Policy Requirements

Your privacy policy MUST include:

- [ ] Exact list of health data collected (sleep, HRV, resting HR)
- [ ] Purpose of collection (Cognitive Readiness calculation)
- [ ] How data is stored (encrypted, with user-level access control)
- [ ] Data retention period
- [ ] User rights (access, deletion, portability)
- [ ] Contact information for privacy requests
- [ ] **Specific section for Health Connect compliance**

Example text:
```
Health Data Collection

We collect the following health data through Health Connect:
- Sleep sessions and sleep stages
- Heart rate variability (RMSSD)
- Resting heart rate

This data is used exclusively to calculate your Cognitive Readiness 
score and provide personalized cognitive performance insights. 
Your health data is encrypted in transit and at rest, stored with 
user-level access controls, and is never shared with third parties.

You can revoke access at any time through Health Connect settings 
or by contacting us at privacy@neuroloop.app.
```

### 4. App Review Preparation

- [ ] Prepare test account with health data (or document testing instructions)
- [ ] Screenshots of permission flow
- [ ] Video demo of health functionality
- [ ] Prepare responses to common rejection reasons

### 5. Health Connect Specific Requirements

- [ ] Implement deep link for \"Manage permissions\" from Health Connect settings
- [ ] Handle permission revocation gracefully
- [ ] Show privacy policy link during permission request
- [ ] Support \"Delete my data\" flow
- [ ] Handle Health Connect not installed (redirect to Play Store)

---

## Troubleshooting

### \"Health Connect is not available\"
- On Android 9-13: Install Health Connect app from Play Store
- On Android 14+: Should be pre-installed
- Emulators may not support Health Connect

### No HRV data
- Check if the user's wearable supports HRV
- Verify wearable has synced to Health Connect
- Check Health Connect app for available data

### Permission denied
- User may have denied in Health Connect
- Guide user to Health Connect → Apps → LOOMA Pro → Manage permissions

### \"Health Connect app not installed\"
- Plugin will open Play Store automatically
- User needs to install and set up Health Connect first
