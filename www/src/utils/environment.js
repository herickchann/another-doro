import { ENVIRONMENTS } from './constants.js';

class EnvironmentDetector {
    constructor() {
        this._environment = null;
        this._ipcRenderer = null;
        this._capabilities = null;
        this._detectEnvironment();
    }

    _detectEnvironment() {
        // Try to detect Electron environment
        try {
            if (typeof window !== 'undefined' && window.require) {
                const electron = window.require('electron');
                this._ipcRenderer = electron.ipcRenderer;
                this._environment = process.env.NODE_ENV === 'development'
                    ? ENVIRONMENTS.DEVELOPMENT
                    : ENVIRONMENTS.ELECTRON;
            }
        } catch (error) {
            console.log('Not running in Electron environment');
        }

        // Fallback to web/mobile detection
        if (!this._environment) {
            const isMobile = this._detectMobile();
            this._environment = isMobile ? ENVIRONMENTS.MOBILE : ENVIRONMENTS.WEB;
        }

        // Detect capabilities
        this._capabilities = this._detectCapabilities();
    }

    _detectMobile() {
        // Check for touch capability and screen size
        const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;
        const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        return hasTouchScreen && (isSmallScreen || isMobileUserAgent);
    }

    _detectCapabilities() {
        return {
            // IPC capabilities (Electron only)
            hasIPC: !!this._ipcRenderer,

            // Notification capabilities
            hasNativeNotifications: this.isElectron(),
            hasWebNotifications: 'Notification' in window,

            // Audio capabilities
            hasAudioContext: !!(window.AudioContext || window.webkitAudioContext),
            hasAudioElement: typeof Audio !== 'undefined',

            // Storage capabilities
            hasLocalStorage: typeof Storage !== 'undefined',

            // UI capabilities
            canAutoHideScrollbars: !this.isMobile(),
            hasKeyboardShortcuts: !this.isMobile(),
            hasDevTools: this.isDevelopment(),

            // Update capabilities
            hasAutoUpdater: this.isElectron() && !this.isDevelopment(),

            // Platform-specific features
            hasTrayIcon: this.isElectron(),
            hasWindowManagement: this.isElectron(),
            hasMenuBar: this.isElectron()
        };
    }

    // Public getters
    get environment() {
        return this._environment;
    }

    get ipcRenderer() {
        return this._ipcRenderer;
    }

    get capabilities() {
        return this._capabilities;
    }

    // Environment checks
    isElectron() {
        return this._environment === ENVIRONMENTS.ELECTRON || this._environment === ENVIRONMENTS.DEVELOPMENT;
    }

    isMobile() {
        return this._environment === ENVIRONMENTS.MOBILE;
    }

    isWeb() {
        return this._environment === ENVIRONMENTS.WEB;
    }

    isDevelopment() {
        return this._environment === ENVIRONMENTS.DEVELOPMENT;
    }

    // Capability checks
    canUseIPC() {
        return this._capabilities.hasIPC;
    }

    canShowNotifications() {
        return this._capabilities.hasNativeNotifications || this._capabilities.hasWebNotifications;
    }

    canPlayAudio() {
        return this._capabilities.hasAudioContext || this._capabilities.hasAudioElement;
    }

    canUseLocalStorage() {
        return this._capabilities.hasLocalStorage;
    }

    canUseKeyboardShortcuts() {
        return this._capabilities.hasKeyboardShortcuts;
    }

    canAutoUpdate() {
        return this._capabilities.hasAutoUpdater;
    }

    // Platform-specific methods
    async invokeIPC(method, ...args) {
        if (!this.canUseIPC()) {
            throw new Error('IPC not available in this environment');
        }
        return await this._ipcRenderer.invoke(method, ...args);
    }

    onIPC(channel, callback) {
        if (!this.canUseIPC()) {
            console.warn('IPC not available in this environment');
            return;
        }
        this._ipcRenderer.on(channel, callback);
    }

    offIPC(channel, callback) {
        if (!this.canUseIPC()) {
            return;
        }
        this._ipcRenderer.off(channel, callback);
    }

    // Adaptive UI methods
    getOptimalTimerSize() {
        if (this.isMobile()) {
            return { width: 200, height: 200 };
        }
        return { width: 250, height: 250 };
    }

    getOptimalButtonSize() {
        if (this.isMobile()) {
            return 'large';
        }
        return 'normal';
    }

    shouldUseSwipeGestures() {
        return this.isMobile();
    }

    shouldAutoHideUI() {
        return this.isMobile();
    }

    getStoragePrefix() {
        return this.isMobile() ? 'mobile_' : 'desktop_';
    }
}

// Create singleton instance
export const Environment = new EnvironmentDetector();

// Export individual functions for convenience
export const isElectron = () => Environment.isElectron();
export const isMobile = () => Environment.isMobile();
export const isWeb = () => Environment.isWeb();
export const isDevelopment = () => Environment.isDevelopment();

// Export capabilities
export const capabilities = Environment.capabilities; 