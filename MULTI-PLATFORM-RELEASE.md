# Multi-Platform Release Guide

This guide explains how to publish both Android APK and macOS DMG releases simultaneously to GitHub, just like your [existing v1.0.0 release](https://github.com/herickchann/another-doro/releases/tag/v1.0.0).

## 🚀 Quick Release Commands

### One-Command Release (Recommended)
```bash
# Build and publish both platforms
npm run publish:all
```

### Step-by-Step Release
```bash
# 1. Build both platforms
npm run build:all

# 2. Publish Mac desktop version
npm run publish

# 3. Publish Android APK
npm run publish:android
```

## 📋 Prerequisites

### 1. GitHub Personal Access Token
```bash
export GH_TOKEN=your_github_personal_access_token
```

**Token Requirements:**
- `repo` scope for repository access
- `write:packages` for publishing releases

### 2. Android Development Setup
Make sure you have Android development tools configured:
- Android SDK
- Java JDK
- Capacitor CLI

### 3. macOS Development Setup
For building Mac apps:
- Xcode Command Line Tools
- Code signing certificate (for distribution)

## 🔧 Release Process Details

### What `npm run publish:all` Does

1. **Builds macOS app** (`npm run build:mac`)
   - Creates `.dmg` installer
   - Signs the application (if certificates are configured)
   - Outputs to `dist/` directory

2. **Builds Android APK** (`npm run build:android-release`)
   - Creates release APK
   - Signs the APK (if keystore is configured)
   - Outputs to `android/app/build/outputs/apk/release/`

3. **Publishes Mac version** (`npm run publish`)
   - Uses `electron-builder` to upload to GitHub
   - Creates or updates the release

4. **Publishes Android APK** (`npm run publish:android`)
   - Uses custom script to upload APK
   - Adds to the same release as Mac version
   - Creates beautiful release notes

## 📱 Platform-Specific Features

### Desktop (macOS) Features
- ✅ **Auto-updates**: Seamless automatic updates
- ✅ **Native notifications**: macOS notification center
- ✅ **Menu bar integration**: Quick access from tray
- ✅ **Keyboard shortcuts**: System-wide hotkeys

### Android Features
- ✅ **Responsive design**: Mobile-optimized UI
- ✅ **Touch interactions**: Gesture-friendly controls
- ✅ **Background operation**: Continues running when minimized
- ✅ **Android notifications**: Native Android alerts

## 🔄 Version Management

### Before Publishing
1. **Update version** in `package.json`:
   ```json
   {
     "version": "1.1.0"
   }
   ```

2. **Update Android version** in `android/app/build.gradle`:
   ```gradle
   android {
       defaultConfig {
           versionCode 2
           versionName "1.1.0"
       }
   }
   ```

### Release Naming Convention
- **Tag**: `v1.1.0`
- **Release Title**: `AnotherDoro v1.1.0`
- **Assets**: 
  - `AnotherDoro-1.1.0.dmg` (macOS)
  - `AnotherDoro-v1.1.0-android.apk` (Android)

## 📊 Release Assets Example

Your releases will include these assets (like in your [v1.0.0 release](https://github.com/herickchann/another-doro/releases/tag/v1.0.0)):

```
📦 Release Assets (4 files)
├── 🖥️ AnotherDoro-1.1.0.dmg          (macOS installer)
├── 🖥️ AnotherDoro-1.1.0-mac.zip      (macOS app bundle)
├── 📱 AnotherDoro-v1.1.0-android.apk (Android APK)
└── 📄 latest-mac.yml                  (Auto-updater manifest)
```

## 🛠️ Troubleshooting

### Android Build Issues
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..

# Rebuild Android
npm run build:android-release
```

### macOS Build Issues
```bash
# Clean Electron build cache
npm run dist -- --publish=never

# Rebuild Mac app
npm run build:mac
```

### GitHub Upload Issues
- Verify `GH_TOKEN` is set correctly
- Check repository permissions
- Ensure GitHub repository exists and is accessible

## 🔐 Code Signing (Optional but Recommended)

### macOS Code Signing
1. **Get Apple Developer Certificate**
2. **Configure electron-builder** in `package.json`:
   ```json
   "build": {
     "mac": {
       "identity": "Developer ID Application: Your Name (XXXXXXXXXX)"
     }
   }
   ```

### Android APK Signing
1. **Create keystore**:
   ```bash
   keytool -genkey -v -keystore release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing** in `android/app/build.gradle`

## 📈 Auto-Update Behavior

### Desktop Auto-Updates
- ✅ Works for macOS builds
- ✅ Automatic update checking every 4 hours
- ✅ User-controlled installation
- ✅ Progress indicators during download

### Android Updates
- ❌ No automatic updates (APK limitation)
- ✅ Manual update notifications in app
- ✅ Direct download links to latest APK
- ✅ Version comparison in settings

## 🎯 Best Practices

1. **Version Consistency**: Keep version numbers synchronized across platforms
2. **Release Notes**: Always include clear, helpful release notes
3. **Testing**: Test both platforms before publishing
4. **Backup**: Keep local copies of signed builds
5. **Documentation**: Update documentation with each release

## Example Workflow

```bash
# 1. Update version numbers
vim package.json
vim android/app/build.gradle

# 2. Test builds locally
npm run build:all

# 3. Publish everything
export GH_TOKEN=your_token
npm run publish:all

# 4. Verify release on GitHub
open https://github.com/herickchannn/another-doro/releases
```

Your users will now be able to download both desktop and mobile versions from the same GitHub release, providing a seamless cross-platform experience! 🎉 