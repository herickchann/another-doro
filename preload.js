const { contextBridge, ipcRenderer } = require('electron');

const IPC_CHANNELS = {
    invoke: new Set([
        'show-notification',
        'update-tray-title',
        'toggle-devtools',
        'check-for-updates-manual',
        'check-for-updates',
        'download-update',
        'install-update',
        'get-app-version',
        'get-platform-info',
        'set-tray-tooltip',
        'show-main-window',
        'quit-app'
    ]),
    on: new Set([
        'update-status',
        'open-settings',
        'toggle-timer',
        'reset-timer',
        'add-goal',
        'tray-clicked',
        'tray-right-clicked'
    ])
};

contextBridge.exposeInMainWorld('electronAPI', {
    invoke: (channel, ...args) => {
        if (!IPC_CHANNELS.invoke.has(channel)) {
            return Promise.reject(new Error(`IPC invoke channel not allowed: ${channel}`));
        }
        return ipcRenderer.invoke(channel, ...args);
    },

    on: (channel, callback) => {
        if (!IPC_CHANNELS.on.has(channel)) {
            console.warn(`IPC listen channel not allowed: ${channel}`);
            return () => {};
        }

        const listener = (_event, ...args) => callback(...args);
        ipcRenderer.on(channel, listener);
        return () => ipcRenderer.removeListener(channel, listener);
    },

    platform: process.platform,
    isDev: process.env.NODE_ENV === 'development'
});
