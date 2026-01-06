# AppBlocker Native Plugin Setup

This folder contains the native Android code for the AppBlocker Capacitor plugin.

## Setup Instructions

After running `npx cap add android`, follow these steps:

### 1. Copy Plugin Files

Copy the Kotlin files to your Android project:

```bash
# From your project root
cp android-plugin/app-blocker/*.kt android/app/src/main/java/app/lovable/f84e62a560cb4db59ded2b07c99a786f/plugins/
```

Create the plugins directory if it doesn't exist:

```bash
mkdir -p android/app/src/main/java/app/lovable/f84e62a560cb4db59ded2b07c99a786f/plugins
```

### 2. Update AndroidManifest.xml

Add these permissions to `android/app/src/main/AndroidManifest.xml` inside the `<manifest>` tag:

```xml
<!-- Usage Stats Permission -->
<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" 
    tools:ignore="ProtectedPermissions" />

<!-- Overlay Permission (for blocking overlay) -->
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

<!-- Foreground Service -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />

<!-- Query installed packages -->
<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" 
    tools:ignore="QueryAllPackagesPermission" />
```

Add the namespace for tools at the top of the manifest:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">
```

Register the service inside the `<application>` tag:

```xml
<service
    android:name=".plugins.AppBlockerService"
    android:exported="false"
    android:foregroundServiceType="specialUse">
    <property
        android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
        android:value="appBlocker" />
</service>
```

### 3. Register the Plugin

In `android/app/src/main/java/app/lovable/f84e62a560cb4db59ded2b07c99a786f/MainActivity.kt`, register the plugin:

```kotlin
package app.lovable.f84e62a560cb4db59ded2b07c99a786f

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import app.lovable.f84e62a560cb4db59ded2b07c99a786f.plugins.AppBlockerPlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(AppBlockerPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
```

### 4. Build and Run

```bash
# Sync the project
npx cap sync android

# Run on device/emulator
npx cap run android
```

## How It Works

### Usage Stats
- Uses Android's `UsageStatsManager` to get app usage data
- Requires "Usage Access" permission granted in system settings
- Tracks only social media apps defined in the plugin

### App Blocking
- Runs a foreground service that monitors the current foreground app
- When a blocked app is opened, shows a full-screen overlay
- Automatically navigates user back to home screen
- Shows remaining time in the detox session

### Permissions Required

1. **PACKAGE_USAGE_STATS**: Access app usage statistics
2. **SYSTEM_ALERT_WINDOW**: Show overlay on top of other apps
3. **FOREGROUND_SERVICE**: Run background monitoring service
4. **QUERY_ALL_PACKAGES**: Get list of installed apps

## User Flow

1. User taps "Enable Usage Access" in the app
2. Android opens Settings → Usage Access
3. User enables toggle for NeuroLoop Pro
4. Returns to app → usage data is now available

For blocking:
1. User starts a detox session
2. Plugin starts foreground service
3. Service monitors foreground app every 500ms
4. If blocked app detected → show overlay → go to home
