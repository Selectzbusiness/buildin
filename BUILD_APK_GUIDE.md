# Android APK Build Guide

This guide will help you build the Selectz Android APK file.

## Prerequisites

### 1. Install Java JDK 11 or higher

**Download from:** https://adoptium.net/
- Choose "Eclipse Temurin JDK 11" for Windows x64
- Download and install with default settings

### 2. Set JAVA_HOME Environment Variable

After installing Java, set the environment variable:

1. **Find Java installation path** (usually one of these):
   - `C:\Program Files\Eclipse Adoptium\jdk-11.x.x-hotspot`
   - `C:\Program Files\Java\jdk-11.x.x`
   - `C:\Program Files\OpenJDK\jdk-11.x.x`

2. **Set JAVA_HOME** (Run as Administrator):
   ```cmd
   setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-11.0.21.9-hotspot" /M
   ```

3. **Add Java to PATH**:
   ```cmd
   setx PATH "%PATH%;%JAVA_HOME%\bin" /M
   ```

4. **Restart your terminal/PowerShell**

### 3. Verify Java Installation

```bash
java -version
javac -version
echo $env:JAVA_HOME
```

## Building the APK

### Method 1: Using Gradle Wrapper (Recommended)

```bash
# Navigate to project directory
cd job-connect

# Build the React app first
npm run build

# Sync with Capacitor
npx cap sync

# Navigate to Android directory
cd android

# Build debug APK
.\gradlew.bat assembleDebug

# Build release APK (unsigned)
.\gradlew.bat assembleRelease
```

### Method 2: Using Android Studio

1. **Install Android Studio** from: https://developer.android.com/studio
2. **Open the project**:
   ```bash
   npx cap open android
   ```
3. **Build APK**:
   - Build → Build Bundle(s) / APK(s) → Build APK(s)

## APK Location

After successful build, find your APK at:
- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

## Troubleshooting

### Common Issues:

1. **JAVA_HOME not set**:
   ```bash
   echo $env:JAVA_HOME
   # If empty, set it as shown above
   ```

2. **Gradle build fails**:
   ```bash
   # Clean and rebuild
   cd android
   .\gradlew.bat clean
   .\gradlew.bat assembleDebug
   ```

3. **Permission denied**:
   - Run PowerShell as Administrator
   - Check file permissions

4. **Memory issues**:
   ```bash
   # Increase Gradle memory
   set GRADLE_OPTS="-Xmx2048m -XX:MaxPermSize=512m"
   ```

### Debug Commands:

```bash
# Check Java installation
java -version

# Check Gradle
cd android
.\gradlew.bat --version

# Check Capacitor status
npx cap doctor

# Clean build
cd android
.\gradlew.bat clean
.\gradlew.bat assembleDebug
```

## Quick Build Script

Create a file called `build-apk.bat` in your project root:

```batch
@echo off
echo Building Selectz APK...

REM Build React app
echo Building React app...
call npm run build

REM Sync Capacitor
echo Syncing with Capacitor...
call npx cap sync

REM Build Android APK
echo Building Android APK...
cd android
call .\gradlew.bat assembleDebug

echo APK built successfully!
echo Location: android\app\build\outputs\apk\debug\app-debug.apk
pause
```

## Next Steps

1. **Test the APK** on an Android device
2. **Sign the APK** for release (if needed)
3. **Distribute** the APK to users

## APK Signing (For Release)

For production release, you'll need to sign the APK:

1. **Generate keystore**:
   ```bash
   keytool -genkey -v -keystore selectz.keystore -alias selectz -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Sign the APK**:
   ```bash
   jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore selectz.keystore app-release-unsigned.apk selectz
   ```

3. **Optimize the APK**:
   ```bash
   zipalign -v 4 app-release-unsigned.apk selectz-release.apk
   ```

## Support

If you encounter issues:
1. Check Java installation
2. Verify environment variables
3. Clean and rebuild
4. Check Capacitor documentation: https://capacitorjs.com/docs 