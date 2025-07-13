# Native App Setup Guide

This guide will help you build and deploy the Selectz app as a native mobile application for both Android and iOS.

## Prerequisites

### For Android Development:
- Node.js (v16 or higher)
- Android Studio
- Android SDK
- Java Development Kit (JDK)

### For iOS Development:
- macOS (required for iOS development)
- Xcode (latest version)
- iOS Simulator or physical iOS device
- Node.js (v16 or higher)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the React App

```bash
npm run build
```

### 3. Add Capacitor Platforms

```bash
# Add Android platform
npx cap add android

# Add iOS platform (macOS only)
npx cap add ios
```

### 4. Sync Capacitor

```bash
npx cap sync
```

## Building for Android

### Using Android Studio:

1. Open Android Studio
2. Open the `android` folder from your project
3. Wait for Gradle sync to complete
4. Connect an Android device or start an emulator
5. Click the "Run" button

### Using Command Line:

```bash
# Build and run on connected device/emulator
npx cap run android

# Open in Android Studio
npx cap open android
```

## Building for iOS

### Using Xcode:

1. Open Xcode
2. Open the `ios/App.xcworkspace` file
3. Select your target device or simulator
4. Click the "Run" button

### Using Command Line:

```bash
# Build and run on connected device/simulator
npx cap run ios

# Open in Xcode
npx cap open ios
```

## Quick Build Scripts

### Windows:
```bash
build-native.bat
```

### macOS/Linux:
```bash
chmod +x build-native.sh
./build-native.sh
```

## Configuration Files

### Capacitor Config (`capacitor.config.ts`)
- Configures app behavior, plugins, and platform-specific settings
- Handles navigation and security settings

### Android Manifest (`android/app/src/main/AndroidManifest.xml`)
- Defines app permissions and activity configuration
- Prevents web-like behavior

### iOS Info.plist (`ios/App/App/Info.plist`)
- Configures iOS-specific settings and permissions
- Handles app transport security

## Troubleshooting

### Common Issues:

1. **iOS Build Fails:**
   - Ensure you're on macOS
   - Update Xcode to latest version
   - Clean build folder: `npx cap clean ios`

2. **Android Build Fails:**
   - Update Android Studio and SDK
   - Clean build: `npx cap clean android`
   - Check Java version compatibility

3. **App Behaves Like Website:**
   - Ensure all configuration files are properly set
   - Check that native platform files are generated
   - Verify Capacitor sync completed successfully

4. **Permissions Issues:**
   - Check Android manifest permissions
   - Verify iOS Info.plist settings
   - Ensure proper usage descriptions for iOS

### Debug Commands:

```bash
# Check Capacitor status
npx cap doctor

# Clean and rebuild
npx cap clean
npx cap sync

# Check platform status
npx cap ls
```

## Production Build

### Android APK:
1. Open Android Studio
2. Build → Generate Signed Bundle/APK
3. Follow the signing process
4. Generate APK file

### iOS IPA:
1. Open Xcode
2. Product → Archive
3. Follow App Store Connect process
4. Generate IPA file

## Platform-Specific Notes

### Android:
- Minimum SDK: API 22 (Android 5.1)
- Target SDK: API 33 (Android 13)
- Supports both ARM and x86 architectures

### iOS:
- Minimum iOS version: 13.0
- Supports iPhone and iPad
- Requires Apple Developer account for distribution

## Security Features

- HTTPS-only connections
- Network security configuration
- App transport security (iOS)
- Secure file provider configuration

## Performance Optimizations

- Disabled web dev tools in production
- Optimized web view configuration
- Native splash screen and status bar
- Proper memory management

## Support

For issues specific to Capacitor, refer to the [official documentation](https://capacitorjs.com/docs).

For platform-specific issues:
- Android: [Android Developer Documentation](https://developer.android.com/)
- iOS: [Apple Developer Documentation](https://developer.apple.com/) 