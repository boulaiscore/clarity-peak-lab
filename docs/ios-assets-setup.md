# iOS Assets Setup Guide

## App Icon (1024x1024)

The app icon is located at `public/ios-icon-1024.png`. This is the master icon that Xcode will use to generate all required sizes.

### Steps to configure in Xcode:

1. Open the iOS project: `npx cap open ios`
2. In Xcode, navigate to **App → Assets.xcassets → AppIcon**
3. Drag and drop `ios-icon-1024.png` into the **App Store iOS 1024pt** slot
4. Xcode will automatically generate all required sizes, OR you can use a tool like [App Icon Generator](https://appicon.co/) to generate the full set

## Splash Screen / Launch Screen

Two splash images are provided:
- `public/ios-splash-portrait.png` (1080x1920) - Portrait orientation
- `public/ios-splash-landscape.png` (1920x1080) - Landscape orientation

### Option A: Launch Screen Storyboard (Recommended)

The default Capacitor iOS project uses a Launch Screen Storyboard. To customize:

1. Open Xcode: `npx cap open ios`
2. Navigate to **App → App → LaunchScreen.storyboard**
3. Add an ImageView and set the image to your splash PNG
4. Set constraints to fill the screen with proper aspect ratio

### Option B: Simple Color + Spinner

The `capacitor.config.ts` is already configured with:
- Background color: `#0f0f1a` (dark indigo)
- Duration: 2 seconds
- Fade out: 500ms

## Asset Locations

| Asset | Path | Size |
|-------|------|------|
| App Icon | `public/ios-icon-1024.png` | 1024x1024 |
| Splash Portrait | `public/ios-splash-portrait.png` | 1080x1920 |
| Splash Landscape | `public/ios-splash-landscape.png` | 1920x1080 |

## After Making Changes

Always run:
```bash
npm run build
npx cap sync ios
npx cap open ios
```

Then build and run from Xcode to test on a simulator or device.
