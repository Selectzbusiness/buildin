#!/bin/bash

echo "🚀 Building Selectz Native App..."

# Build the React app
echo "📦 Building React app..."
npm run build

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync

# Add iOS platform if it doesn't exist
if [ ! -d "ios" ]; then
    echo "📱 Adding iOS platform..."
    npx cap add ios
fi

# Add Android platform if it doesn't exist
if [ ! -d "android" ]; then
    echo "🤖 Adding Android platform..."
    npx cap add android
fi

echo "✅ Build completed!"
echo ""
echo "To open in Android Studio:"
echo "  npx cap open android"
echo ""
echo "To open in Xcode:"
echo "  npx cap open ios"
echo ""
echo "To run on Android device/emulator:"
echo "  npx cap run android"
echo ""
echo "To run on iOS device/simulator:"
echo "  npx cap run ios" 