# AnotherDoro Development Guide

## Project Structure

AnotherDoro uses a **single-source architecture** to avoid code duplication across different platforms.

### File Organization

```
another-doro/
├── index.html          # Main HTML file (source of truth)
├── styles.css          # Main CSS file (source of truth)  
├── renderer.js         # Main renderer script (source of truth)
├── src/                # Source components and utilities
├── assets/             # Static assets (images, sounds)
├── main.js             # Electron main process
├── www/                # Generated directory for mobile builds (DO NOT EDIT)
├── android/            # Android/Capacitor project
└── scripts/            # Build and utility scripts
```

### Key Principles

1. **Single Source of Truth**: All source files live in the project root
2. **Generated www/**: The `www/` directory is automatically generated for mobile builds
3. **No Manual Editing**: Never manually edit files in `www/` - they will be overwritten

### Development Workflow

#### For Electron Development
```bash
npm start              # Run Electron app directly from root files
npm run dev           # Run in development mode
```

#### For Mobile Development  
```bash
npm run sync:www      # Sync root files to www/ for Capacitor
npm run build:android # Build Android APK (includes sync)
```

#### Cleaning Up
```bash
npm run clean:www     # Remove generated www/ directory
```

### Why This Structure?

**Before**: We had duplicate files in root and `www/` directories that needed to be manually kept in sync.

**After**: 
- ✅ Single source of truth in root directory
- ✅ Automatic synchronization for mobile builds  
- ✅ No risk of inconsistencies between platforms
- ✅ Easier maintenance and development
- ✅ `www/` is ignored by git (build artifact)

### Build Process

1. **Electron builds** use files directly from root
2. **Mobile builds** automatically sync root files to `www/` before building
3. The `scripts/sync-www.js` script handles the synchronization
4. All build scripts use the centralized sync process

### Important Notes

- The `www/` directory is in `.gitignore` and should not be committed
- Always make changes to files in the root directory
- Mobile builds will automatically sync the latest changes
- If you see duplicate files, use `npm run clean:www` and re-sync

### Troubleshooting

**Problem**: Changes not appearing in mobile build
**Solution**: Run `npm run sync:www` to refresh the www directory

**Problem**: www directory has old files  
**Solution**: Run `npm run clean:www` then `npm run sync:www`

**Problem**: Git shows www files as modified
**Solution**: The www directory should be in .gitignore - check your git configuration 