@echo off
echo ========================================
echo Building Selectz Android APK
echo ========================================

REM Check if Java is installed
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java is not installed or not in PATH
    echo Please install Java JDK 11 or higher from: https://adoptium.net/
    echo Then set JAVA_HOME environment variable
    pause
    exit /b 1
)

echo Java found, proceeding with build...

REM Build React app
echo.
echo [1/4] Building React app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: React build failed
    pause
    exit /b 1
)

REM Sync Capacitor
echo.
echo [2/4] Syncing with Capacitor...
call npx cap sync
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed
    pause
    exit /b 1
)

REM Build Android APK
echo.
echo [3/4] Building Android APK...
cd android
call .\gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo ERROR: Android build failed
    cd ..
    pause
    exit /b 1
)

cd ..

REM Check if APK was created
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo.
    echo ========================================
    echo SUCCESS: APK built successfully!
    echo ========================================
    echo.
    echo APK Location: android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo You can now install this APK on Android devices
    echo.
) else (
    echo ERROR: APK file not found
    pause
    exit /b 1
)

echo Build completed successfully!
pause 