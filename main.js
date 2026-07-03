const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, Notification } = require('electron');
const path = require('path');
const windowStateKeeper = require('electron-window-state');
const WINDOW_CONFIG = require('./window-config');

let autoUpdater;
function getAutoUpdater() {
    if (!autoUpdater) {
        autoUpdater = require('electron-updater').autoUpdater;
    }
    return autoUpdater;
}

let mainWindow;
let tray;
let mainWindowState;
let updateCheckResult = null;

// Enable live reload for development
if (process.env.NODE_ENV === 'development') {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
        hardResetMethod: 'exit'
    });
}

// Configure auto-updater
function configureAutoUpdater() {
    const updater = getAutoUpdater();
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
            updater.checkForUpdatesAndNotify().catch(error => {
                console.log('Periodic update check failed (non-critical):', error.message);
            });
        } catch (error) {
            console.log('Periodic update check error (non-critical):', error.message);
        }
    }, 4 * 60 * 60 * 1000);

    // Auto-updater event handlers
    updater.on('checking-for-update', () => {
        console.log('Checking for updates...');
        if (mainWindow) {
            mainWindow.webContents.send('update-status', 'checking');
        }
    });

    updater.on('update-available', (info) => {
        console.log('Update available:', info.version);
        if (mainWindow) {
            mainWindow.webContents.send('update-status', 'available', info);
        }
    });

    updater.on('update-not-available', (info) => {
        console.log('Update not available');
        if (mainWindow) {
            mainWindow.webContents.send('update-status', 'not-available', info);
        }
    });

    updater.on('error', (err) => {
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

    updater.on('download-progress', (progressObj) => {
        let log_message = "Download speed: " + progressObj.bytesPerSecond;
        log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
        log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
        console.log(log_message);
        if (mainWindow) {
            mainWindow.webContents.send('update-status', 'downloading', progressObj);
        }
    });

    updater.on('update-downloaded', (info) => {
        console.log('Update downloaded:', info.version);
        if (mainWindow) {
            mainWindow.webContents.send('update-status', 'downloaded', info);
        }
    });

    // Error handling is already set up above
}

function sendToRenderer(channel) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel);
    }
}

function createApplicationMenu() {
    const isMac = process.platform === 'darwin';

    const timerMenu = {
        label: 'Timer',
        submenu: [
            {
                label: 'Start/Pause',
                click: () => sendToRenderer('toggle-timer')
            },
            {
                label: 'Reset Timer',
                click: () => sendToRenderer('reset-timer')
            },
            { type: 'separator' },
            {
                label: 'Add Goal',
                click: () => sendToRenderer('add-goal')
            }
        ]
    };

    const template = [
        ...(isMac ? [{
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                {
                    label: 'Settings...',
                    click: () => sendToRenderer('open-settings')
                },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }] : [{
            label: 'File',
            submenu: [
                {
                    label: 'Add Goal',
                    click: () => sendToRenderer('add-goal')
                },
                { type: 'separator' },
                {
                    label: 'Settings...',
                    click: () => sendToRenderer('open-settings')
                },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }]),
        timerMenu,
        {
            label: 'View',
            submenu: [
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                ...(isMac ? [{ type: 'separator' }, { role: 'front' }] : [{ role: 'close' }])
            ]
        }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function getWindowOptions() {
    const baseOptions = {
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minWidth: WINDOW_CONFIG.MIN_WIDTH,
        minHeight: WINDOW_CONFIG.MIN_HEIGHT,
        resizable: true,
        minimizable: true,
        maximizable: true,
        closable: true,
        fullscreenable: false,
        title: 'AnotherDoro',
        icon: path.join(__dirname, 'assets', 'tray-icon.png'),
        backgroundColor: WINDOW_CONFIG.BACKGROUND_COLOR,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        },
        show: false
    };

    if (process.platform === 'darwin') {
        return {
            ...baseOptions,
            titleBarStyle: 'hiddenInset',
            trafficLightPosition: { x: 14, y: 14 }
        };
    }

    return baseOptions;
}

function saveWindowState() {
    if (mainWindowState && mainWindow && !mainWindow.isDestroyed()) {
        mainWindowState.saveState(mainWindow);
    }
}

function showMainWindow() {
    if (!mainWindow || mainWindow.isDestroyed()) {
        createWindow();
        return;
    }

    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }

    mainWindow.show();
    mainWindow.focus();
}

function createWindow() {
    mainWindowState = windowStateKeeper({
        defaultWidth: WINDOW_CONFIG.DEFAULT_WIDTH,
        defaultHeight: WINDOW_CONFIG.DEFAULT_HEIGHT,
        file: WINDOW_CONFIG.STATE_FILE
    });

    mainWindow = new BrowserWindow(getWindowOptions());
    mainWindowState.manage(mainWindow);

    mainWindow.loadFile('index.html');

    mainWindow.once('ready-to-show', () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        mainWindow.show();
    });

    // macOS: red close button hides to tray; yellow minimize uses native minimize
    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            saveWindowState();
            mainWindow.hide();
        }
    });

    mainWindow.on('minimize', () => {
        saveWindowState();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
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
                showMainWindow();
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
        if (!mainWindow || mainWindow.isDestroyed()) return;

        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            showMainWindow();
        }
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
    createApplicationMenu();
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
                updater.checkForUpdatesAndNotify().catch(error => {
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
            showMainWindow();
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
    saveWindowState();
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
            getAutoUpdater().checkForUpdates(),
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
            getAutoUpdater().checkForUpdates(),
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
            getAutoUpdater().downloadUpdate(),
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
        getAutoUpdater().quitAndInstall(false, true);
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

ipcMain.handle('set-tray-tooltip', async (event, tooltip) => {
    if (tray && !tray.isDestroyed()) {
        tray.setToolTip(tooltip);
        return { success: true };
    }
    return { success: false, error: 'Tray not available' };
});

ipcMain.handle('show-main-window', async () => {
    showMainWindow();
    return { success: true };
});

ipcMain.handle('quit-app', async () => {
    app.isQuiting = true;
    app.quit();
    return { success: true };
}); 