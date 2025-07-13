@echo off
echo 🚀 Building Selectz Native App...

REM Build the React app
echo 📦 Building React app...
call npm run build

REM Sync with Capacitor
echo 🔄 Syncing with Capacitor...
call npx cap sync

REM Add iOS platform if it doesn't exist
if not exist "ios" (
    echo 📱 Adding iOS platform...
    call npx cap add ios
)

REM Add Android platform if it doesn't exist
if not exist "android" (
    echo 🤖 Adding Android platform...
    call npx cap add android
)

echo ✅ Build completed!
echo.
echo To open in Android Studio:
echo   npx cap open android
echo.
echo To open in Xcode:
echo   npx cap open ios
echo.
echo To run on Android device/emulator:
echo   npx cap run android
echo.
echo To run on iOS device/simulator:
echo   npx cap run ios
pause 