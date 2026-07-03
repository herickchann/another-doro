#!/usr/bin/env node
/**
 * Headless window behavior checks for Electron.
 * Run: node scripts/test-window.js
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const WINDOW_CONFIG = require('../window-config');

const results = [];

function record(name, passed, detail = '') {
    results.push({ name, passed, detail });
    const status = passed ? 'PASS' : 'FAIL';
    console.log(`${status}: ${name}${detail ? ` — ${detail}` : ''}`);
}

function getMacWindowOptions() {
    const base = {
        width: WINDOW_CONFIG.DEFAULT_WIDTH,
        height: WINDOW_CONFIG.DEFAULT_HEIGHT,
        minWidth: WINDOW_CONFIG.MIN_WIDTH,
        minHeight: WINDOW_CONFIG.MIN_HEIGHT,
        resizable: true,
        minimizable: true,
        maximizable: true,
        closable: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, '..', 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    };

    if (process.platform === 'darwin') {
        return {
            ...base,
            titleBarStyle: 'hiddenInset',
            trafficLightPosition: { x: 14, y: 14 }
        };
    }

    return base;
}

app.whenReady().then(async () => {
    const win = new BrowserWindow(getMacWindowOptions());

    record('window is resizable', win.isResizable());
    record('window is minimizable', win.isMinimizable());
    record('window is maximizable', win.isMaximizable());
    record('window is closable', win.isClosable());

    const minWidth = win.getMinimumSize()[0];
    const minHeight = win.getMinimumSize()[1];
    record('min width matches config', minWidth === WINDOW_CONFIG.MIN_WIDTH, `got ${minWidth}`);
    record('min height matches config', minHeight === WINDOW_CONFIG.MIN_HEIGHT, `got ${minHeight}`);

    const targetWidth = WINDOW_CONFIG.DEFAULT_WIDTH + 80;
    const targetHeight = WINDOW_CONFIG.DEFAULT_HEIGHT + 60;
    win.setSize(targetWidth, targetHeight);
    const afterResize = win.getBounds();
    record('setSize increases width', afterResize.width === targetWidth, `got ${afterResize.width}`);
    record('setSize increases height', afterResize.height === targetHeight, `got ${afterResize.height}`);

    win.setSize(WINDOW_CONFIG.MIN_WIDTH, WINDOW_CONFIG.MIN_HEIGHT);
    const atMin = win.getBounds();
    record('can shrink to minimum width', atMin.width === WINDOW_CONFIG.MIN_WIDTH, `got ${atMin.width}`);
    record('can shrink to minimum height', atMin.height === WINDOW_CONFIG.MIN_HEIGHT, `got ${atMin.height}`);

    win.show();
    win.minimize();
    await new Promise((resolve) => setTimeout(resolve, 300));
    record('minimize() works', win.isMinimized());

    win.restore();
    await new Promise((resolve) => setTimeout(resolve, 200));
    record('restore() works', !win.isMinimized() && win.isVisible());

    await win.loadFile(path.join(__dirname, '..', 'index.html'));
    await new Promise((resolve) => setTimeout(resolve, 500));

    const dragStyles = await win.webContents.executeJavaScript(`
        (function () {
            const body = document.body;
            const timerDisplay = document.querySelector('.timer-display');
            const startBtn = document.querySelector('#startPauseBtn');
            return {
                bodyDrag: body ? getComputedStyle(body).webkitAppRegion : 'n/a',
                timerDisplayDrag: timerDisplay ? getComputedStyle(timerDisplay).webkitAppRegion : 'n/a',
                buttonDrag: startBtn ? getComputedStyle(startBtn).webkitAppRegion : 'n/a',
                isElectron: document.documentElement.classList.contains('is-electron'),
                hasElectronAPI: !!window.electronAPI
            };
        })()
    `);

    record('renderer tagged as electron', dragStyles.isElectron);
    record('electronAPI exposed in renderer', dragStyles.hasElectronAPI);
    record('body is a drag region', dragStyles.bodyDrag === 'drag', dragStyles.bodyDrag);
    record('timer display inherits drag', dragStyles.timerDisplayDrag !== 'no-drag', dragStyles.timerDisplayDrag);
    record('buttons stay no-drag', dragStyles.buttonDrag === 'no-drag', dragStyles.buttonDrag);

    win.destroy();

    const failed = results.filter((r) => !r.passed);
    if (failed.length > 0) {
        console.error(`\n${failed.length} check(s) failed.`);
        app.exit(1);
    } else {
        console.log(`\nAll ${results.length} checks passed.`);
        app.exit(0);
    }
});

app.on('window-all-closed', () => {
    app.quit();
});
