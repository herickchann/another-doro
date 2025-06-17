const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, Notification } = require('electron');
const path = require('path');
const windowStateKeeper = require('electron-window-state');

let mainWindow;
let tray;
let mainWindowState;

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
        width: 420,
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

function createWindow() {
    // Load manual window state as backup
    const manualState = loadManualWindowState();

    // Load the previous window state or set defaults
    mainWindowState = windowStateKeeper({
        defaultWidth: manualState.width,
        defaultHeight: manualState.height,
        minWidth: 380,
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
        width: windowOptions.width || 427,
        height: windowOptions.height || 949,
        x: windowOptions.x,
        y: windowOptions.y,
        minWidth: 380,
        minHeight: 620,
        resizable: true,
        fullscreenable: false,
        titleBarStyle: 'hiddenInset',
        title: 'AnotherDoro',
        icon: path.join(__dirname, 'assets', 'tray-icon.png'),
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
app.whenReady().then(() => {
    createWindow();
    createTray();

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