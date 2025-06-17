const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, Notification } = require('electron');
const path = require('path');
const windowStateKeeper = require('electron-window-state');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let tray;
let mainWindowState;
let updateCheckResult = null;

// Manual window state backup
function saveManualWindowState() {
    if (mainWindow) {
        const bounds = mainWindow.getBounds();
        const state = {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            isMaximized: mainWindow.isMaximized()
        };

        const fs = require('fs');
        const path = require('path');
        const { app } = require('electron');
        const userDataPath = app.getPath('userData');
        const statePath = path.join(userDataPath, 'manual-window-state.json');

        fs.writeFileSync(statePath, JSON.stringify(state));
    }
}

function loadManualWindowState() {
    try {
        const fs = require('fs');
        const path = require('path');
        const { app } = require('electron');
        const userDataPath = app.getPath('userData');
        const statePath = path.join(userDataPath, 'manual-window-state.json');

        if (fs.existsSync(statePath)) {
            const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
            return state;
        }
    } catch (error) {
        // Silently handle loading errors
    }

    return {
        x: undefined,
        y: undefined,
        width: 440,
        height: 680,
        isMaximized: false
    };
}

// Enable live reload for development
if (process.env.NODE_ENV === 'development') {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
        hardResetMethod: 'exit'
    });
}

// Configure auto-updater
function configureAutoUpdater() {
    // Don't check for updates in development
    if (process.env.NODE_ENV === 'development') {
        console.log('Auto-updater disabled in development mode');
        return;
    }

    // Only enable auto-updater for packaged apps
    if (!app.isPackaged) {
        console.log('Auto-updater disabled for unpackaged app');
        return;
    }

    // Configure auto-updater (non-blocking)
    console.log('Configuring auto-updater for GitHub releases');

    // Don't check immediately on configuration to avoid blocking startup

    // Check for updates every 4 hours (background, non-blocking)
    setInterval(async () => {
        try {
            console.log('Periodic update check (background)...');
            autoUpdater.checkForUpdatesAndNotify().catch(error => {
                console.log('Periodic update check failed (non-critical):', error.message);
            });
        } catch (error) {
            console.log('Periodic update check error (non-critical):', error.message);
        }
    }, 4 * 60 * 60 * 1000);

    // Auto-updater event handlers
    autoUpdater.on('checking-for-update', () => {
        console.log('Checking for updates...');
        if (mainWindow) {
            mainWindow.webContents.send('update-status', 'checking');
        }
    });

    autoUpdater.on('update-available', (info) => {
        console.log('Update available:', info.version);
        if (mainWindow) {
            mainWindow.webContents.send('update-status', 'available', info);
        }
    });

    autoUpdater.on('update-not-available', (info) => {
        console.log('Update not available');
        if (mainWindow) {
            mainWindow.webContents.send('update-status', 'not-available', info);
        }
    });

    autoUpdater.on('error', (err) => {
        console.error('Auto-updater error:', err);
        if (mainWindow) {
            // Sanitize error message to avoid displaying HTML/SVG content
            let errorMessage = err.message || 'Unknown error occurred';

            // Check if error message contains HTML or base64 content
            if (errorMessage.includes('<html>') ||
                errorMessage.includes('data:image') ||
                errorMessage.includes('base64') ||
                errorMessage.length > 200) {

                if (err.code === 'ENOTFOUND' || errorMessage.includes('getaddrinfo')) {
                    errorMessage = 'Network connection failed';
                } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
                    errorMessage = 'GitHub servers are temporarily unavailable';
                } else if (errorMessage.includes('timeout')) {
                    errorMessage = 'Request timed out';
                } else {
                    errorMessage = 'Update check failed';
                }
            }

            mainWindow.webContents.send('update-status', 'error', errorMessage);
        }
    });

    autoUpdater.on('download-progress', (progressObj) => {
        let log_message = "Download speed: " + progressObj.bytesPerSecond;
        log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
        log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
        console.log(log_message);
        if (mainWindow) {
            mainWindow.webContents.send('update-status', 'downloading', progressObj);
        }
    });

    autoUpdater.on('update-downloaded', (info) => {
        console.log('Update downloaded:', info.version);
        if (mainWindow) {
            mainWindow.webContents.send('update-status', 'downloaded', info);
        }
    });

    // Error handling is already set up above
}

function createWindow() {
    // Load manual window state as backup
    const manualState = loadManualWindowState();

    // Load the previous window state or set defaults
    mainWindowState = windowStateKeeper({
        defaultWidth: manualState.width,
        defaultHeight: manualState.height,
        minWidth: 400,
        minHeight: 620,
        file: 'window-state.json',
        maximize: false,
        fullScreen: false
    });

    // Use manual state if electron-window-state fails
    const windowOptions = {
        x: mainWindowState.x || manualState.x,
        y: mainWindowState.y || manualState.y,
        width: mainWindowState.width || manualState.width,
        height: mainWindowState.height || manualState.height
    };



    // Create the browser window
    mainWindow = new BrowserWindow({
        width: windowOptions.width || 447,
        height: windowOptions.height || 949,
        x: windowOptions.x,
        y: windowOptions.y,
        minWidth: 400,
        minHeight: 620,
        resizable: true,
        fullscreenable: false,
        titleBarStyle: 'hiddenInset',
        title: 'AnotherDoro',
        icon: path.join(__dirname, 'assets', 'tray-icon.png'),
        backgroundColor: '#0f0f0f',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSecurity: false
        },
        show: false
    });

    // Let windowStateKeeper manage the window
    mainWindowState.manage(mainWindow);

    // Add window event listeners for state saving
    let saveTimeout;
    mainWindow.on('resize', () => {
        // Debounce saving during resize
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveManualWindowState();
        }, 500);
    });

    mainWindow.on('move', () => {
        // Debounce saving during move
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveManualWindowState();
        }, 500);
    });

    // Load the app
    mainWindow.loadFile('index.html');

    // Show the window immediately to display loading screen
    mainWindow.show();

    // Hide the window instead of closing it
    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            // Save window state before hiding
            mainWindowState.saveState();
            saveManualWindowState();
            mainWindow.hide();
        } else {
            // Allow the app to quit for updates
            console.log('App is quitting (possibly for update)');
        }
    });

    // Save window state before closing
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // DevTools will be toggled via UI button in development mode
}

function createTray() {
    // Create a tray icon
    const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
    tray = new Tray(nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 }));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'AnotherDoro',
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Show App',
            click: () => {
                mainWindow.show();
            }
        },
        {
            label: 'Quit',
            click: () => {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('AnotherDoro - Pomodoro Timer');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
    // Create window and tray immediately for fast startup
    createWindow();
    createTray();

    // Configure auto-updater in background (non-blocking)
    setImmediate(() => {
        try {
            configureAutoUpdater();
        } catch (error) {
            console.log('Auto-updater configuration failed (non-critical):', error.message);
        }
    });

    // Check for updates on startup (asynchronously, non-blocking, with longer delay)
    setTimeout(async () => {
        if (process.env.NODE_ENV !== 'development' && app.isPackaged) {
            try {
                console.log('Checking for updates on startup (background)...');
                // Run update check asynchronously without blocking
                autoUpdater.checkForUpdatesAndNotify().catch(error => {
                    console.log('Background update check failed (non-critical):', error.message);
                });
            } catch (error) {
                console.log('Background update check error (non-critical):', error.message);
            }
        }
    }, 10000); // Increased to 10 seconds to ensure app is fully loaded

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else {
            mainWindow.show();
        }
    });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Ensure window state is saved before app quits
app.on('before-quit', () => {
    app.isQuiting = true;
    // Explicitly save window state
    if (mainWindow && mainWindowState) {
        mainWindowState.saveState();
        saveManualWindowState();
    }
});

// IPC handlers for timer functionality
ipcMain.handle('show-notification', async (event, title, body) => {
    if (Notification.isSupported()) {
        new Notification({
            title: title,
            body: body,
            sound: true
        }).show();
    }
});

ipcMain.handle('update-tray-title', async (event, title) => {
    if (tray) {
        tray.setTitle(title);
    }
});

ipcMain.handle('toggle-devtools', async (event) => {
    if (mainWindow) {
        if (mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.webContents.closeDevTools();
        } else {
            mainWindow.webContents.openDevTools();
        }
    }
});

// Auto-updater IPC handlers
ipcMain.handle('check-for-updates-manual', async () => {
    if (process.env.NODE_ENV === 'development') {
        return { available: false, message: 'Updates not available in development mode' };
    }

    if (!app.isPackaged) {
        return { available: false, message: 'Updates only work in packaged app builds' };
    }

    try {
        console.log('Manual update check requested...');

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Update check timed out')), 15000); // 15 second timeout
        });

        updateCheckResult = await Promise.race([
            autoUpdater.checkForUpdates(),
            timeoutPromise
        ]);

        if (updateCheckResult && updateCheckResult.updateInfo) {
            const currentVersion = app.getVersion();
            const newVersion = updateCheckResult.updateInfo.version;
            console.log(`Update check result: ${currentVersion} vs ${newVersion}`);
            return {
                available: newVersion !== currentVersion,
                version: newVersion,
                currentVersion: currentVersion
            };
        } else {
            return { available: false, message: 'No update information available' };
        }
    } catch (error) {
        console.error('Error checking for updates:', error);

        // Sanitize error message to avoid displaying HTML/SVG content
        let errorMessage = error.message || 'Unknown error occurred';

        // Check if error message contains HTML or base64 content (common in GitHub 500 errors)
        if (errorMessage.includes('<html>') ||
            errorMessage.includes('data:image') ||
            errorMessage.includes('base64') ||
            errorMessage.length > 200) {

            // Provide a user-friendly error message instead
            if (error.code === 'ENOTFOUND' || errorMessage.includes('getaddrinfo')) {
                errorMessage = 'Network connection failed - please check your internet connection';
            } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
                errorMessage = 'GitHub servers are temporarily unavailable - please try again later';
            } else if (errorMessage.includes('timeout')) {
                errorMessage = 'Request timed out - please try again';
            } else {
                errorMessage = 'Unable to check for updates - please try again later';
            }
        }

        return { available: false, error: errorMessage };
    }
});

ipcMain.handle('check-for-updates', async () => {
    if (process.env.NODE_ENV === 'development') {
        return { available: false, message: 'Updates not available in development mode' };
    }

    if (!app.isPackaged) {
        return { available: false, message: 'Updates only work in packaged app builds' };
    }

    try {
        console.log('Manual update check requested...');

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Update check timed out')), 15000); // 15 second timeout
        });

        updateCheckResult = await Promise.race([
            autoUpdater.checkForUpdates(),
            timeoutPromise
        ]);

        if (updateCheckResult && updateCheckResult.updateInfo) {
            const currentVersion = app.getVersion();
            const newVersion = updateCheckResult.updateInfo.version;
            console.log(`Update check result: ${currentVersion} vs ${newVersion}`);
            return {
                available: newVersion !== currentVersion,
                version: newVersion,
                currentVersion: currentVersion
            };
        } else {
            return { available: false, message: 'No update information available' };
        }
    } catch (error) {
        console.error('Error checking for updates:', error);

        // Sanitize error message to avoid displaying HTML/SVG content
        let errorMessage = error.message || 'Unknown error occurred';

        // Check if error message contains HTML or base64 content (common in GitHub 500 errors)
        if (errorMessage.includes('<html>') ||
            errorMessage.includes('data:image') ||
            errorMessage.includes('base64') ||
            errorMessage.length > 200) {

            // Provide a user-friendly error message instead
            if (error.code === 'ENOTFOUND' || errorMessage.includes('getaddrinfo')) {
                errorMessage = 'Network connection failed - please check your internet connection';
            } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
                errorMessage = 'GitHub servers are temporarily unavailable - please try again later';
            } else if (errorMessage.includes('timeout')) {
                errorMessage = 'Request timed out - please try again';
            } else {
                errorMessage = 'Unable to check for updates - please try again later';
            }
        }

        return { available: false, error: errorMessage };
    }
});

ipcMain.handle('download-update', async () => {
    if (process.env.NODE_ENV === 'development') {
        return { success: false, message: 'Updates not available in development mode' };
    }

    try {
        console.log('Starting update download...');

        // Add timeout for download (5 minutes)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Download timed out')), 5 * 60 * 1000);
        });

        await Promise.race([
            autoUpdater.downloadUpdate(),
            timeoutPromise
        ]);

        console.log('Update download completed');
        return { success: true };
    } catch (error) {
        console.error('Error downloading update:', error);

        // Sanitize error message to avoid displaying HTML/SVG content
        let errorMessage = error.message || 'Unknown error occurred';

        // Check if error message contains HTML or base64 content
        if (errorMessage.includes('<html>') ||
            errorMessage.includes('data:image') ||
            errorMessage.includes('base64') ||
            errorMessage.length > 200) {

            if (error.code === 'ENOTFOUND' || errorMessage.includes('getaddrinfo')) {
                errorMessage = 'Network connection failed during download';
            } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
                errorMessage = 'GitHub servers are temporarily unavailable';
            } else if (errorMessage.includes('timeout')) {
                errorMessage = 'Download timed out - please try again';
            } else {
                errorMessage = 'Download failed - please try again later';
            }
        }

        return { success: false, error: errorMessage };
    }
});

ipcMain.handle('install-update', async () => {
    if (process.env.NODE_ENV === 'development') {
        return { success: false, message: 'Updates not available in development mode' };
    }

    try {
        console.log('Installing update...');
        // Set the flag to allow quitting
        app.isQuiting = true;
        // Install the update and restart the app
        autoUpdater.quitAndInstall(false, true);
        return { success: true };
    } catch (error) {
        console.error('Error installing update:', error);
        app.isQuiting = false; // Reset flag if installation fails

        // Sanitize error message to avoid displaying HTML/SVG content
        let errorMessage = error.message || 'Unknown error occurred';

        // Check if error message contains HTML or base64 content
        if (errorMessage.includes('<html>') ||
            errorMessage.includes('data:image') ||
            errorMessage.includes('base64') ||
            errorMessage.length > 200) {

            errorMessage = 'Installation failed - please try downloading the update again';
        }

        return { success: false, error: errorMessage };
    }
});

ipcMain.handle('get-app-version', async () => {
    return app.getVersion();
});

ipcMain.handle('get-platform-info', async () => {
    return {
        platform: process.platform,
        arch: process.arch,
        isElectron: true,
        version: app.getVersion()
    };
}); 