# Automatic Version Management

This document explains the automatic version management system that ensures every release has a unique, properly incremented version number.

## 🚀 Quick Start

### **Recommended: One-Command Publishing**
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

## 📋 Available Commands

### **Publishing with Auto-Version (Recommended)**
```bash
npm run publish:patch    # 1.0.0 → 1.0.1 (bug fixes)
npm run publish:minor    # 1.0.0 → 1.1.0 (new features)
npm run publish:major    # 1.0.0 → 2.0.0 (breaking changes)
npm run publish:now      # Alias for publish:patch
```

### **Manual Build + Publish (Advanced)**
```bash
npm run build:all        # Build both platforms to dist/v{version}/
npm run publish:mac      # Publish pre-built macOS files
npm run publish:android  # Publish pre-built Android APK
npm run publish:all      # Publish both (requires pre-built files)
```

### **Version Management Only**
```bash
npm run version:show     # Show current versions
npm run version:patch    # Increment patch version only
npm run version:minor    # Increment minor version only  
npm run version:major    # Increment major version only
```

## 🔄 Optimized Workflow (No Duplicates)

### **Single Build Process**
- `build:all` → Builds both platforms once to `dist/v{version}/`
- `publish:mac` → Publishes pre-built macOS files (no rebuild)
- `publish:android` → Publishes pre-built Android APK (no rebuild)

### **Eliminated Duplicates**
- ❌ Removed old `publish` command (electron-builder direct)
- ❌ Merged duplicate `publish:all` and `publish:now` 
- ✅ `publish:now` now uses optimized version workflow
- ✅ All commands use pre-built files (no duplicate builds)

## 🔄 What Gets Updated

### **Node.js Package (`package.json`)**
```json
{
  "version": "1.0.1"  // ← Automatically updated
}
```

### **Android App (`android/app/build.gradle`)**
```gradle
android {
    defaultConfig {
        versionCode 2           // ← Auto-incremented
        versionName "1.0.1"     // ← Matches package.json
    }
}
```

### **Git Repository**
- ✅ Automatic commit: `chore: bump version to 1.0.1`
- ✅ Git tag created: `v1.0.1`
- ✅ Single push: `git push origin main --tags`

## 📊 Command Comparison

| Command | What It Does | Build Count | Use Case |
|---------|-------------|-------------|----------|
| `publish:now` | Version bump + build + publish | 1x each | **Recommended** - Complete workflow |
| `publish:patch` | Same as publish:now | 1x each | Bug fixes, small improvements |
| `publish:minor` | Version bump + build + publish | 1x each | New features, additions |
| `publish:major` | Version bump + build + publish | 1x each | Breaking changes, rewrites |
| `publish:all` | Publish pre-built files | 0 (uses existing) | Manual workflow |

## 🛡️ Safety Features

### **Git Status Check**
- Warns if working directory has uncommitted changes
- Prompts for confirmation before proceeding
- Can be skipped with `--skip-git-check`

### **Version Validation**
- Ensures versions are incremented properly
- Prevents duplicate version numbers
- Validates semantic versioning format

### **Build Validation**
- Fails fast if builds don't complete successfully
- Prevents publishing broken releases
- Clear error messages for debugging

### **No Duplicate Processes**
- Each platform builds exactly once
- Publishing uses pre-built files
- Single git push operation

## 🔧 Example Workflow

### **Standard Release Process**
```bash
# 1. Check current status
npm run version:show

# 2. Publish with automatic version bump
npm run publish:now

# 3. Verify release
open https://github.com/herickchann/another-doro/releases
```

### **Advanced Manual Workflow**
```bash
# 1. Build everything first
npm run build:all

# 2. Check builds
ls dist/v*/

# 3. Publish both platforms
npm run publish:all
```

## 📱 Platform Synchronization

Both platforms always stay in sync:

### **Before Publishing**
```
📊 Current Versions:
📦 Node.js (package.json): 1.0.0
📱 Android (build.gradle): 1.0.0 (code: 1)
```

### **After Publishing**
```
📊 Current Versions:
📦 Node.js (package.json): 1.0.1
📱 Android (build.gradle): 1.0.1 (code: 2)
```

## 🚨 Troubleshooting

### **Git Issues**
```bash
# If git status is dirty
git add . && git commit -m "Save work in progress"
npm run publish:now

# If you want to skip git operations
node scripts/publish-with-version.js patch --skip-commit --skip-push
```

### **Build Issues**
```bash
# Test builds without publishing
node scripts/publish-with-version.js patch --skip-build

# Clean and rebuild
npm run build:all
```

### **Version Conflicts**
```bash
# Check what went wrong
npm run version:show

# Reset to last committed version
git checkout -- package.json android/app/build.gradle
```

## 🎯 Best Practices

### **1. Use Automated Workflow**
```bash
# For most releases (recommended)
npm run publish:now
```

### **2. Feature Releases**
```bash
# When adding new functionality
npm run publish:minor
```

### **3. Major Updates**
```bash
# For breaking changes or major rewrites
npm run publish:major
```

### **4. Pre-Release Testing**
```bash
# Test builds without publishing
npm run build:all
ls dist/v*/  # Check files are created

# Test version increment without publishing
npm run version:patch
npm run version:show    # Verify versions
```

## ✨ Benefits

### **For Developers**
- ✅ **No manual version management** - Fully automated
- ✅ **No version conflicts** - Guaranteed unique versions
- ✅ **No duplicate builds** - Each platform builds once
- ✅ **Git integration** - Automatic commits and tags
- ✅ **Platform sync** - Both Node.js and Android updated together

### **For Users**
- ✅ **Reliable auto-updates** - Desktop apps get seamless updates
- ✅ **Clear versioning** - Easy to track what's new
- ✅ **Professional releases** - Consistent release numbering

### **For Releases**
- ✅ **Atomic operations** - All-or-nothing publishing
- ✅ **Rollback support** - Git tags make rollbacks easy
- ✅ **Audit trail** - Clear history of all version changes
- ✅ **Optimized performance** - No wasted build cycles

## 🎉 Summary

The optimized version management system ensures that:

1. **Every release has a unique version number**
2. **Both platforms stay synchronized**
3. **Git history is clean and trackable**
4. **Publishing is a single command**
5. **No human errors in version numbering**
6. **No duplicate build processes**
7. **Maximum efficiency with minimum commands**

Just run `npm run publish:now` and everything is handled automatically! 🚀 