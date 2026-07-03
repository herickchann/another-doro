import { ENVIRONMENTS } from './constants.js';

class EnvironmentDetector {
    constructor() {
        this._environment = null;
        this._electronAPI = null;
        this._ipcUnsubscribers = [];
        this._capabilities = null;
        this._detectEnvironment();
    }

    _detectEnvironment() {
        try {
            if (typeof window !== 'undefined' && window.electronAPI) {
                this._electronAPI = window.electronAPI;
                this._environment = window.electronAPI.isDev
                    ? ENVIRONMENTS.DEVELOPMENT
                    : ENVIRONMENTS.ELECTRON;
            }
        } catch (error) {
            console.log('Not running in Electron environment');
        }

        if (!this._environment) {
            const isMobile = this._detectMobile();
            this._environment = isMobile ? ENVIRONMENTS.MOBILE : ENVIRONMENTS.WEB;
        }

        this._capabilities = this._detectCapabilities();
    }

    _detectMobile() {
        const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;
        const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        return hasTouchScreen && (isSmallScreen || isMobileUserAgent);
    }

    _detectCapabilities() {
        return {
            hasIPC: !!this._electronAPI,
            hasNativeNotifications: this.isElectron(),
            hasWebNotifications: 'Notification' in window,
            hasAudioContext: !!(window.AudioContext || window.webkitAudioContext),
            hasAudioElement: typeof Audio !== 'undefined',
            hasLocalStorage: typeof Storage !== 'undefined',
            canAutoHideScrollbars: !this.isMobile(),
            hasKeyboardShortcuts: !this.isMobile(),
            hasDevTools: this.isDevelopment(),
            hasAutoUpdater: this.isElectron() && !this.isDevelopment(),
            hasTrayIcon: this.isElectron(),
            hasWindowManagement: this.isElectron(),
            hasMenuBar: this.isElectron()
        };
    }

    get environment() {
        return this._environment;
    }

    get electronAPI() {
        return this._electronAPI;
    }

    get capabilities() {
        return this._capabilities;
    }

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

    async invokeIPC(method, ...args) {
        if (!this.canUseIPC()) {
            throw new Error('IPC not available in this environment');
        }
        return await this._electronAPI.invoke(method, ...args);
    }

    onIPC(channel, callback) {
        if (!this.canUseIPC()) {
            console.warn('IPC not available in this environment');
            return;
        }

        const unsubscribe = this._electronAPI.on(channel, callback);
        if (typeof unsubscribe === 'function') {
            this._ipcUnsubscribers.push(unsubscribe);
        }
    }

    offIPC(channel, callback) {
        if (!this.canUseIPC()) {
            return;
        }

        this._ipcUnsubscribers = this._ipcUnsubscribers.filter((unsubscribe) => {
            unsubscribe();
            return false;
        });
    }

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

export const Environment = new EnvironmentDetector();

export const isElectron = () => Environment.isElectron();
export const isMobile = () => Environment.isMobile();
export const isWeb = () => Environment.isWeb();
export const isDevelopment = () => Environment.isDevelopment();

export const capabilities = Environment.capabilities;
