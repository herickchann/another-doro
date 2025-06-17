# Release Management Guide

This guide explains how to use AnotherDoro's centralized release management system, which eliminates duplication and makes release notes easy to edit.

## 🎯 Overview

The release system has been centralized to avoid hardcoding and duplication across publish scripts. All release metadata is now managed from a single source.

## 📁 Key Files

- **`scripts/release-config.js`** - Centralized release configuration and GitHub API handling
- **`RELEASE_NOTES.md`** - Editable release notes template (this file!)
- **`scripts/edit-release-notes.js`** - Helper script for editing release notes
- **`scripts/publish-mac.js`** - macOS publishing (now uses centralized config)
- **`scripts/publish-android.js`** - Android publishing (now uses centralized config)

## 🖊️ Editing Release Notes

### Method 1: Using the Helper Script (Recommended)
```bash
# Edit release notes in your default editor
npm run edit-release-notes --edit

# Preview how the release will look on GitHub
npm run edit-release-notes --preview
```

### Method 2: Direct Editing
Simply edit the `RELEASE_NOTES.md` file directly in your text editor.

## 📝 Release Notes Format

The `RELEASE_NOTES.md` file uses this structure:

```markdown
# Release Notes Template

## ✨ What's New
- Feature 1
- Feature 2

## 🔧 Technical Improvements
- Improvement 1
- Improvement 2

## 🐛 Bug Fixes
- Fix 1
- Fix 2

## 🎯 Known Issues
- Issue 1 (if any)

---

Instructions section (automatically excluded from releases)
```

## 🚀 Publishing Workflow

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

## 🔧 Configuration

### Repository Settings
Edit `scripts/release-config.js` to change:
- GitHub owner/repo
- Release naming conventions
- Prerelease detection logic

### Release Body Template
The system automatically generates:
- Version header
- Multi-platform download instructions
- Custom release notes from `RELEASE_NOTES.md`
- Installation instructions
- Auto-update information

## 🎨 Customization

### Adding New Platforms
1. Update `getReleaseBody()` in `scripts/release-config.js`
2. Add platform-specific download instructions
3. Update the multi-platform section

### Changing Release Format
1. Modify `getReleaseBody()` method in `scripts/release-config.js`
2. Update `RELEASE_NOTES.md` template structure
3. Test with `npm run edit-release-notes --preview`

## 🧪 Testing

Always preview your changes before publishing:
```bash
npm run edit-release-notes --preview
```

This shows exactly how your release will appear on GitHub.

## 🔄 Migration Benefits

✅ **Before**: Hardcoded release notes in multiple scripts
❌ **After**: Single source of truth for all release metadata

✅ **Before**: Manual editing of JavaScript files
❌ **After**: Simple Markdown editing with preview

✅ **Before**: Risk of inconsistent releases
❌ **After**: Guaranteed consistency across all platforms

✅ **Before**: Duplicate maintenance overhead
❌ **After**: Edit once, use everywhere

## 💡 Tips

- Always preview releases before publishing
- Keep release notes concise but informative
- Use emojis for visual appeal and categorization
- Update release notes for each version
- The system automatically handles version numbers and dates 