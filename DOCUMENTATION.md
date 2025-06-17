# AnotherDoro Documentation

This comprehensive guide covers all aspects of building, releasing, and managing the AnotherDoro application across multiple platforms.

## Table of Contents

- [Auto-Update Feature](#auto-update-feature)
- [Version Management](#version-management)
- [Release Management](#release-management)
- [Android Build Guide](#android-build-guide)
- [Multi-Platform Release Guide](#multi-platform-release-guide)
- [Release Notes Template](#release-notes-template)

---

## Auto-Update Feature

The auto-update feature allows the app to automatically check for updates from GitHub releases and install them seamlessly. This feature uses `electron-updater` to handle the update process.

### How It Works

#### 1. Automatic Update Checks
- The app checks for updates automatically when it starts (in production mode)
- It also checks for updates every 4 hours while running
- Updates are only checked when the app is built for production (not in development mode)

#### 2. Update Process
1. **Check**: App checks GitHub releases for newer versions
2. **Download**: If an update is available, it's downloaded in the background
3. **Install**: User can choose to install the update (app will restart)

#### 3. User Interface
- **Update Banner**: Shows when an update is available
- **Settings Tab**: "Updates" tab in settings shows version info and manual update checking
- **Progress Indicators**: Shows download progress when updating

### Configuration

#### GitHub Repository Setup

1. **Update package.json**: Make sure to update the GitHub repository information:
```json
"build": {
  "publish": [
    {
      "provider": "github",
      "owner": "your-github-username",
      "repo": "another-doro"
    }
  ]
}
```

2. **GitHub Token**: For publishing releases, you'll need a GitHub personal access token:
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Create a token with `repo` permissions
   - Set it as environment variable: `export GH_TOKEN=your_token_here`

#### Building and Publishing

1. **Build the app**:
```bash
npm run build
```

2. **Publish to GitHub**:
```bash
npm run publish
```

This will build the app and create a GitHub release with the built files.

### Development vs Production

- **Development**: Auto-updates are disabled to prevent interference with development
- **Production**: Auto-updates are enabled and check GitHub releases

### Manual Update Checking

Users can manually check for updates by:
1. Opening Settings (⚙️ icon or settings hotkey)
2. Going to the "Updates" tab
3. Clicking "Check for Updates"

### Update States

The app shows different states during the update process:

- **Checking**: Looking for updates
- **Available**: Update found and ready to download
- **Downloading**: Update is being downloaded (with progress)
- **Downloaded**: Update ready to install
- **Error**: Something went wrong

### Files Modified

#### Main Process (`main.js`)
- Added `electron-updater` integration
- Update checking and downloading logic
- IPC handlers for renderer communication

#### Renderer Process (`renderer.js`)
- Update UI management
- User interaction handling
- Status display and progress tracking

#### UI (`index.html` & `styles.css`)
- Update banner for notifications
- Updates tab in settings modal
- Progress indicators and status displays

### Security

The auto-updater verifies update signatures to ensure updates come from the legitimate source. Updates are only downloaded from the configured GitHub repository.

### Troubleshooting

#### Updates Not Working
1. Check that you're not in development mode
2. Verify GitHub repository configuration in package.json
3. Ensure the app has internet connectivity
4. Check the console for error messages

#### Manual Testing
You can test the update functionality by:
1. Creating a test release on GitHub with a higher version number
2. Building the app with a lower version number
3. Running the built app and checking for updates

---

## Version Management

The automatic version management system ensures every release has a unique, properly incremented version number.

### 🚀 Quick Start

#### **Recommended: One-Command Publishing**
```bash
# Increment patch version and publish everything
npm run publish:now
```

This single command will:
1. ✅ Check git status
2. ✅ Increment version (1.0.1 → 1.0.2)
3. ✅ Update both `package.json` and Android `build.gradle`
4. ✅ Commit version changes to git
5. ✅ Create git tag (v1.0.2)
6. ✅ Build both macOS and Android (once each)
7. ✅ Publish to GitHub releases
8. ✅ Push changes and tags to remote

### 📋 Available Commands

#### **Publishing with Auto-Version (Recommended)**
```bash
npm run publish:patch    # 1.0.0 → 1.0.1 (bug fixes)
npm run publish:minor    # 1.0.0 → 1.1.0 (new features)
npm run publish:major    # 1.0.0 → 2.0.0 (breaking changes)
npm run publish:now      # Alias for publish:patch
```

#### **Manual Build + Publish (Advanced)**
```bash
npm run build:all        # Build both platforms to dist/v{version}/
npm run publish:mac      # Publish pre-built macOS files
npm run publish:android  # Publish pre-built Android APK
npm run publish:all      # Publish both (requires pre-built files)
```

#### **Version Management Only**
```bash
npm run version:show     # Show current versions
npm run version:patch    # Increment patch version only
npm run version:minor    # Increment minor version only  
npm run version:major    # Increment major version only
```

### 🔄 What Gets Updated

#### **Node.js Package (`package.json`)**
```json
{
  "version": "1.0.1"  // ← Automatically updated
}
```

#### **Android App (`android/app/build.gradle`)**
```gradle
android {
    defaultConfig {
        versionCode 2           // ← Auto-incremented
        versionName "1.0.1"     // ← Matches package.json
    }
}
```

#### **Git Repository**
- ✅ Automatic commit: `chore: bump version to 1.0.1`
- ✅ Git tag created: `v1.0.1`
- ✅ Single push: `git push origin main --tags`

### 📊 Command Comparison

| Command | What It Does | Build Count | Use Case |
|---------|-------------|-------------|----------|
| `publish:now` | Version bump + build + publish | 1x each | **Recommended** - Complete workflow |
| `publish:patch` | Same as publish:now | 1x each | Bug fixes, small improvements |
| `publish:minor` | Version bump + build + publish | 1x each | New features, additions |
| `publish:major` | Version bump + build + publish | 1x each | Breaking changes, rewrites |
| `publish:all` | Publish pre-built files | 0 (uses existing) | Manual workflow |

### 🛡️ Safety Features

#### **Git Status Check**
- Warns if working directory has uncommitted changes
- Prompts for confirmation before proceeding
- Can be skipped with `--skip-git-check`

#### **Version Validation**
- Ensures versions are incremented properly
- Prevents duplicate version numbers
- Validates semantic versioning format

#### **Build Validation**
- Fails fast if builds don't complete successfully
- Prevents publishing broken releases
- Clear error messages for debugging

### 🚨 Troubleshooting

#### **Git Issues**
```bash
# If git status is dirty
git add . && git commit -m "Save work in progress"
npm run publish:now

# If you want to skip git operations
node scripts/publish-with-version.js patch --skip-commit --skip-push
```

#### **Build Issues**
```bash
# Test builds without publishing
node scripts/publish-with-version.js patch --skip-build

# Clean and rebuild
npm run build:all
```

#### **Version Conflicts**
```bash
# Check what went wrong
npm run version:show

# Reset to last committed version
git checkout -- package.json android/app/build.gradle
```

---

## Release Management

The centralized release management system eliminates duplication and makes release notes easy to edit.

### 🎯 Overview

The release system has been centralized to avoid hardcoding and duplication across publish scripts. All release metadata is now managed from a single source.

### 📁 Key Files

- **`scripts/release-config.js`** - Centralized release configuration and GitHub API handling
- **`RELEASE_NOTES.md`** - Editable release notes template
- **`scripts/edit-release-notes.js`** - Helper script for editing release notes
- **`scripts/publish-mac.js`** - macOS publishing (now uses centralized config)
- **`scripts/publish-android.js`** - Android publishing (now uses centralized config)

### 🖊️ Editing Release Notes

#### Method 1: Using the Helper Script (Recommended)
```bash
# Edit release notes in your default editor
npm run edit-release-notes --edit

# Preview how the release will look on GitHub
npm run edit-release-notes --preview
```

#### Method 2: Direct Editing
Simply edit the `RELEASE_NOTES.md` file directly in your text editor.

### 🚀 Publishing Workflow

1. **Edit Release Notes**
   ```bash
   npm run edit-release-notes --edit
   ```

2. **Preview the Release**
   ```bash
   npm run edit-release-notes --preview
   ```

3. **Publish** (choose one):
   ```bash
   # Quick patch release
   npm run publish:now
   
   # Full workflow with version bump
   npm run publish:patch  # 1.0.0 → 1.0.1
   npm run publish:minor  # 1.0.0 → 1.1.0
   npm run publish:major  # 1.0.0 → 2.0.0
   
   # Manual build + publish
   npm run build:all
   npm run publish:all
   ```

### 🔧 Configuration

#### Repository Settings
Edit `scripts/release-config.js` to change:
- GitHub owner/repo
- Release naming conventions
- Prerelease detection logic

#### Release Body Template
The system automatically generates:
- Version header
- Multi-platform download instructions
- Custom release notes from `RELEASE_NOTES.md`
- Installation instructions
- Auto-update information

### 💡 Tips

- Always preview releases before publishing
- Keep release notes concise but informative
- Use emojis for visual appeal and categorization
- Update release notes for each version
- The system automatically handles version numbers and dates

---

## Android Build Guide

This guide will help you build the AnotherDoro app for Android devices.

### Prerequisites

Before building, make sure you have:

1. **Android SDK** installed via Android Studio or command line tools
2. **ANDROID_HOME** environment variable set
3. **Java Development Kit (JDK)** installed
4. **Node.js** and **npm** installed

### Quick Build Commands

#### Debug APK (for testing)
```bash
npm run build:android
```

#### Release APK (for distribution)
```bash
npm run build:android-release
```

### What the Build Script Does

The build script automatically:

1. **Syncs web assets** - Copies `index.html`, `styles.css`, and `assets/` to the `www/` directory
2. **Syncs Capacitor** - Updates the Android project with latest web assets
3. **Builds APK** - Compiles the Android application
4. **Moves APK to dist** - Places the final APK in the `dist/` folder with a clean name

### Output Files

- **Debug build**: `dist/AnotherDoro-1.0.0-debug.apk` (~4-5 MB)
- **Release build**: `dist/AnotherDoro-1.0.0-release.apk` (~4-5 MB)

### Installing the APK

#### On Android Device:
1. Enable "Unknown Sources" in Settings > Security
2. Transfer the APK to your device
3. Tap the APK file to install

#### Using ADB:
```bash
adb install dist/AnotherDoro-1.0.0-debug.apk
```

### Troubleshooting

#### Build Fails with "ANDROID_HOME not set"
```bash
export ANDROID_HOME=/path/to/android/sdk
# Add to your ~/.zshrc or ~/.bashrc for permanent setup
```

#### Build Fails with "SDK not found"
Check your `android/local.properties` file:
```
sdk.dir=/path/to/android/sdk
```

#### Capacitor Issues
```bash
# Check Capacitor configuration
npx cap doctor

# Clean and rebuild
npx cap clean android
npx cap sync android
```

#### Gradle Issues
```bash
# Clean gradle cache
cd android
./gradlew clean
cd ..
```

### Release APK Signing

⚠️ **Important**: Release APKs need to be signed for distribution on Google Play Store.

#### Generate a signing key:
```bash
keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

#### Sign the APK:
```bash
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore dist/AnotherDoro-1.0.0-release.apk my-key-alias
```

### Build Times

- **First build**: ~2-5 minutes (downloads dependencies)
- **Subsequent builds**: ~30 seconds - 2 minutes

### File Sizes

- **Debug APK**: ~4-5 MB (includes debugging symbols)
- **Release APK**: ~3-4 MB (optimized and minified)

---

## Multi-Platform Release Guide

This guide explains how to publish both Android APK and macOS DMG releases simultaneously to GitHub.

### 🚀 Quick Release Commands

#### One-Command Release (Recommended)
```bash
# Build and publish both platforms
npm run publish:all
```

#### Step-by-Step Release
```bash
# 1. Build both platforms
npm run build:all

# 2. Publish Mac desktop version
npm run publish

# 3. Publish Android APK
npm run publish:android
```

### 📋 Prerequisites

#### 1. GitHub Personal Access Token
```bash
export GH_TOKEN=your_github_personal_access_token
```

**Token Requirements:**
- `repo` scope for repository access
- `write:packages` for publishing releases

#### 2. Android Development Setup
Make sure you have Android development tools configured:
- Android SDK
- Java JDK
- Capacitor CLI

#### 3. macOS Development Setup
For building Mac apps:
- Xcode Command Line Tools
- Code signing certificate (for distribution)

### 🔧 Release Process Details

#### What `npm run publish:all` Does

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

### 📱 Platform-Specific Features

#### Desktop (macOS) Features
- ✅ **Auto-updates**: Seamless automatic updates
- ✅ **Native notifications**: macOS notification center
- ✅ **Menu bar integration**: Quick access from tray
- ✅ **Keyboard shortcuts**: System-wide hotkeys

#### Android Features
- ✅ **Responsive design**: Mobile-optimized UI
- ✅ **Touch interactions**: Gesture-friendly controls
- ✅ **Background operation**: Continues running when minimized
- ✅ **Android notifications**: Native Android alerts

### 🔄 Version Management

#### Before Publishing
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

#### Release Naming Convention
- **Tag**: `v1.1.0`
- **Release Title**: `AnotherDoro v1.1.0`
- **Assets**: 
  - `AnotherDoro-1.1.0.dmg` (macOS)
  - `AnotherDoro-v1.1.0-android.apk` (Android)

### 📊 Release Assets Example

Your releases will include these assets:

```
📦 Release Assets (4 files)
├── 🖥️ AnotherDoro-1.1.0.dmg          (macOS installer)
├── 🖥️ AnotherDoro-1.1.0-mac.zip      (macOS app bundle)
├── 📱 AnotherDoro-v1.1.0-android.apk (Android APK)
└── 📄 latest-mac.yml                  (Auto-updater manifest)
```

### 🛠️ Troubleshooting

#### Android Build Issues
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..

# Rebuild Android
npm run build:android-release
```

#### macOS Build Issues
```bash
# Clean Electron build cache
npm run dist -- --publish=never

# Rebuild Mac app
npm run build:mac
```

#### GitHub Upload Issues
- Verify `GH_TOKEN` is set correctly
- Check repository permissions
- Ensure GitHub repository exists and is accessible

### 🔐 Code Signing (Optional but Recommended)

#### macOS Code Signing
1. **Get Apple Developer Certificate**
2. **Configure electron-builder** in `package.json`:
   ```json
   "build": {
     "mac": {
       "identity": "Developer ID Application: Your Name (XXXXXXXXXX)"
     }
   }
   ```

#### Android APK Signing
1. **Create keystore**:
   ```bash
   keytool -genkey -v -keystore release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing** in `android/app/build.gradle`

### 📈 Auto-Update Behavior

#### Desktop Auto-Updates
- ✅ Works for macOS builds
- ✅ Automatic update checking every 4 hours
- ✅ User-controlled installation
- ✅ Progress indicators during download

#### Android Updates
- ❌ No automatic updates (APK limitation)
- ✅ Manual update notifications in app
- ✅ Direct download links to latest APK
- ✅ Version comparison in settings

### 🎯 Best Practices

1. **Version Consistency**: Keep version numbers synchronized across platforms
2. **Release Notes**: Always include clear, helpful release notes
3. **Testing**: Test both platforms before publishing
4. **Backup**: Keep local copies of signed builds
5. **Documentation**: Update documentation with each release

### Example Workflow

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
open https://github.com/your-username/another-doro/releases
```

---

## Release Notes Template

This template is used for generating release notes. Edit the content below for each new release:

### ✨ What's New
- 🚀 Auto-update functionality for seamless updates
- 🔄 Cross-platform synchronization
- 🎨 Enhanced user interface
- 🐛 Bug fixes and performance improvements
- 📊 Better session tracking and statistics

### 🔧 Technical Improvements
- Improved startup performance
- Enhanced error handling
- Better memory management
- Optimized build process

### 🐛 Bug Fixes
- Fixed timer accuracy issues
- Resolved notification problems
- Fixed window state persistence
- Corrected audio playback issues

### 🎯 Known Issues
- None at this time

---

## Additional Notes

Remember to update the version number in `package.json` before creating releases. The auto-updater compares this version with the latest GitHub release to determine if an update is available.

For security, the auto-updater verifies update signatures to ensure updates come from the legitimate source. Updates are only downloaded from the configured GitHub repository.

Just run `npm run publish:now` and everything is handled automatically! 🚀 