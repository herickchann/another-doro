# 🍅 AnotherDoro Android Build Guide

This guide will help you build the AnotherDoro app for Android devices.

## Prerequisites

Before building, make sure you have:

1. **Android SDK** installed via Android Studio or command line tools
2. **ANDROID_HOME** environment variable set
3. **Java Development Kit (JDK)** installed
4. **Node.js** and **npm** installed

## Quick Build Commands

### Debug APK (for testing)
```bash
npm run build:android
```

### Release APK (for distribution)
```bash
npm run build:android-release
```

## What the Build Script Does

The build script automatically:

1. **Syncs web assets** - Copies `index.html`, `styles.css`, and `assets/` to the `www/` directory
2. **Syncs Capacitor** - Updates the Android project with latest web assets
3. **Builds APK** - Compiles the Android application
4. **Moves APK to dist** - Places the final APK in the `dist/` folder with a clean name

## Output Files

- **Debug build**: `dist/AnotherDoro-1.0.0-debug.apk` (~4-5 MB)
- **Release build**: `dist/AnotherDoro-1.0.0-release.apk` (~4-5 MB)

## Installing the APK

### On Android Device:
1. Enable "Unknown Sources" in Settings > Security
2. Transfer the APK to your device
3. Tap the APK file to install

### Using ADB:
```bash
adb install dist/AnotherDoro-1.0.0-debug.apk
```

## Troubleshooting

### Build Fails with "ANDROID_HOME not set"
```bash
export ANDROID_HOME=/path/to/android/sdk
# Add to your ~/.zshrc or ~/.bashrc for permanent setup
```

### Build Fails with "SDK not found"
Check your `android/local.properties` file:
```
sdk.dir=/path/to/android/sdk
```

### Capacitor Issues
```bash
# Check Capacitor configuration
npx cap doctor

# Clean and rebuild
npx cap clean android
npx cap sync android
```

### Gradle Issues
```bash
# Clean gradle cache
cd android
./gradlew clean
cd ..
```

## Release APK Signing

⚠️ **Important**: Release APKs need to be signed for distribution on Google Play Store.

### Generate a signing key:
```bash
keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

### Sign the APK:
```bash
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore dist/AnotherDoro-1.0.0-release.apk my-key-alias
```

## Build Times

- **First build**: ~2-5 minutes (downloads dependencies)
- **Subsequent builds**: ~30 seconds - 2 minutes

## File Sizes

- **Debug APK**: ~4-5 MB (includes debugging symbols)
- **Release APK**: ~3-4 MB (optimized and minified)

---

**Happy Building! 🚀** 