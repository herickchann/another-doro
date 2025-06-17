# Auto-Update Feature

This document explains the auto-update feature implemented in AnotherDoro.

## Overview

The auto-update feature allows the app to automatically check for updates from GitHub releases and install them seamlessly. This feature uses `electron-updater` to handle the update process.

## How It Works

### 1. Automatic Update Checks
- The app checks for updates automatically when it starts (in production mode)
- It also checks for updates every 4 hours while running
- Updates are only checked when the app is built for production (not in development mode)

### 2. Update Process
1. **Check**: App checks GitHub releases for newer versions
2. **Download**: If an update is available, it's downloaded in the background
3. **Install**: User can choose to install the update (app will restart)

### 3. User Interface
- **Update Banner**: Shows when an update is available
- **Settings Tab**: "Updates" tab in settings shows version info and manual update checking
- **Progress Indicators**: Shows download progress when updating

## Configuration

### GitHub Repository Setup

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

### Building and Publishing

1. **Build the app**:
```bash
npm run build
```

2. **Publish to GitHub**:
```bash
npm run publish
```

This will build the app and create a GitHub release with the built files.

## Development vs Production

- **Development**: Auto-updates are disabled to prevent interference with development
- **Production**: Auto-updates are enabled and check GitHub releases

## Manual Update Checking

Users can manually check for updates by:
1. Opening Settings (⚙️ icon or settings hotkey)
2. Going to the "Updates" tab
3. Clicking "Check for Updates"

## Update States

The app shows different states during the update process:

- **Checking**: Looking for updates
- **Available**: Update found and ready to download
- **Downloading**: Update is being downloaded (with progress)
- **Downloaded**: Update ready to install
- **Error**: Something went wrong

## Files Modified

### Main Process (`main.js`)
- Added `electron-updater` integration
- Update checking and downloading logic
- IPC handlers for renderer communication

### Renderer Process (`renderer.js`)
- Update UI management
- User interaction handling
- Status display and progress tracking

### UI (`index.html` & `styles.css`)
- Update banner for notifications
- Updates tab in settings modal
- Progress indicators and status displays

## Security

The auto-updater verifies update signatures to ensure updates come from the legitimate source. Updates are only downloaded from the configured GitHub repository.

## Troubleshooting

### Updates Not Working
1. Check that you're not in development mode
2. Verify GitHub repository configuration in package.json
3. Ensure the app has internet connectivity
4. Check the console for error messages

### Manual Testing
You can test the update functionality by:
1. Creating a test release on GitHub with a higher version number
2. Building the app with a lower version number
3. Running the built app and checking for updates

## Version Management

Remember to update the version number in `package.json` before creating releases:
```json
{
  "version": "1.1.0"
}
```

The auto-updater compares this version with the latest GitHub release to determine if an update is available. 