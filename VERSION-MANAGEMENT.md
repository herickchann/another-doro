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
6. ✅ Build both macOS and Android
7. ✅ Publish to GitHub releases
8. ✅ Push changes and tags to remote

## 📋 Available Commands

### **Publishing with Auto-Version**
```bash
npm run publish:patch    # 1.0.0 → 1.0.1 (bug fixes)
npm run publish:minor    # 1.0.0 → 1.1.0 (new features)
npm run publish:major    # 1.0.0 → 2.0.0 (breaking changes)
npm run publish:now      # Alias for publish:patch
```

### **Manual Version Management**
```bash
npm run version:show     # Show current versions
npm run version:patch    # Increment patch version only
npm run version:minor    # Increment minor version only  
npm run version:major    # Increment major version only
```

### **Advanced Publishing Options**
```bash
# Publish with options
node scripts/publish-with-version.js patch --skip-push
node scripts/publish-with-version.js minor --skip-commit
node scripts/publish-with-version.js major --skip-git-check
```

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
- ✅ Changes pushed to remote

## 📊 Version Comparison

| Command | Before | After | Use Case |
|---------|--------|-------|----------|
| `publish:patch` | 1.0.0 | 1.0.1 | Bug fixes, small improvements |
| `publish:minor` | 1.0.0 | 1.1.0 | New features, additions |
| `publish:major` | 1.0.0 | 2.0.0 | Breaking changes, rewrites |

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

## 🔧 Example Workflow

### **Standard Release Process**
```bash
# 1. Check current status
npm run version:show

# 2. Publish with automatic version bump
npm run publish:now

# 3. Verify release
open https://github.com/herickchannn/another-doro/releases
```

### **Development Workflow**
```bash
# During development - manual version check
npm run version:show

# When ready to release
npm run publish:patch    # For bug fixes
npm run publish:minor    # For new features
npm run publish:major    # For breaking changes
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

### **1. Regular Patch Releases**
```bash
# For most releases
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
# Test version increment without publishing
npm run version:patch
git log --oneline -n 1  # Check the commit
npm run version:show    # Verify versions
```

## ✨ Benefits

### **For Developers**
- ✅ **No manual version management** - Fully automated
- ✅ **No version conflicts** - Guaranteed unique versions
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

## 🎉 Summary

The automatic version management system ensures that:

1. **Every release has a unique version number**
2. **Both platforms stay synchronized**
3. **Git history is clean and trackable**
4. **Publishing is a single command**
5. **No human errors in version numbering**

Just run `npm run publish:now` and everything is handled automatically! 🚀 