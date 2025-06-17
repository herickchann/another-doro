import { STORAGE_KEYS, TIMER_DEFAULTS, DEFAULT_HOTKEYS, AUDIO_DEFAULTS, UPDATE_DEFAULTS, THEMES } from './constants.js';
import { Environment } from './environment.js';

class StorageManager {
    constructor() {
        this.prefix = Environment.getStoragePrefix();
    }

    _getKey(key) {
        return `${this.prefix}${key}`;
    }

    _safeParseJSON(value, defaultValue = null) {
        try {
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.warn('Failed to parse JSON from storage:', error);
            return defaultValue;
        }
    }

    _safeStringifyJSON(value) {
        try {
            return JSON.stringify(value);
        } catch (error) {
            console.warn('Failed to stringify JSON for storage:', error);
            return null;
        }
    }

    // Generic storage methods
    get(key, defaultValue = null) {
        if (!Environment.canUseLocalStorage()) {
            return defaultValue;
        }

        try {
            const value = localStorage.getItem(this._getKey(key));
            return value !== null ? value : defaultValue;
        } catch (error) {
            console.warn('Failed to get item from storage:', error);
            return defaultValue;
        }
    }

    getJSON(key, defaultValue = null) {
        if (!Environment.canUseLocalStorage()) {
            return defaultValue;
        }

        try {
            const value = localStorage.getItem(this._getKey(key));
            return this._safeParseJSON(value, defaultValue);
        } catch (error) {
            console.warn('Failed to get JSON from storage:', error);
            return defaultValue;
        }
    }

    set(key, value) {
        if (!Environment.canUseLocalStorage()) {
            return false;
        }

        try {
            localStorage.setItem(this._getKey(key), value);
            return true;
        } catch (error) {
            console.warn('Failed to set item in storage:', error);
            return false;
        }
    }

    setJSON(key, value) {
        if (!Environment.canUseLocalStorage()) {
            return false;
        }

        try {
            const jsonString = this._safeStringifyJSON(value);
            if (jsonString !== null) {
                localStorage.setItem(this._getKey(key), jsonString);
                return true;
            }
        } catch (error) {
            console.warn('Failed to set JSON in storage:', error);
        }
        return false;
    }

    remove(key) {
        if (!Environment.canUseLocalStorage()) {
            return false;
        }

        try {
            localStorage.removeItem(this._getKey(key));
            return true;
        } catch (error) {
            console.warn('Failed to remove item from storage:', error);
            return false;
        }
    }

    clear() {
        if (!Environment.canUseLocalStorage()) {
            return false;
        }

        try {
            // Only clear items with our prefix
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.warn('Failed to clear storage:', error);
            return false;
        }
    }

    // Specific data methods
    loadSettings() {
        const defaultSettings = {
            workDuration: TIMER_DEFAULTS.WORK_DURATION,
            shortBreakDuration: TIMER_DEFAULTS.SHORT_BREAK_DURATION,
            longBreakDuration: TIMER_DEFAULTS.LONG_BREAK_DURATION,
            theme: THEMES.NEON,
            autoBreak: false,
            autoWork: false,
            breakType: 'normal',
            hotkeys: { ...DEFAULT_HOTKEYS },
            soundEnabled: AUDIO_DEFAULTS.ENABLED,
            volume: AUDIO_DEFAULTS.VOLUME,
            currentSound: AUDIO_DEFAULTS.DEFAULT_SOUND,
            autoUpdateCheck: UPDATE_DEFAULTS.AUTO_CHECK,
            updateCheckInterval: UPDATE_DEFAULTS.CHECK_INTERVAL_HOURS,
            lastUpdateCheck: null
        };

        const savedSettings = this.getJSON(STORAGE_KEYS.SETTINGS, {});
        return { ...defaultSettings, ...savedSettings };
    }

    saveSettings(settings) {
        return this.setJSON(STORAGE_KEYS.SETTINGS, settings);
    }

    loadStats() {
        return this.getJSON(STORAGE_KEYS.STATS, {
            completedSessions: 0,
            totalTimeSpent: 0,
            sessionCount: 0
        });
    }

    saveStats(stats) {
        return this.setJSON(STORAGE_KEYS.STATS, stats);
    }

    loadGoals() {
        return this.getJSON(STORAGE_KEYS.GOALS, []);
    }

    saveGoals(goals) {
        return this.setJSON(STORAGE_KEYS.GOALS, goals);
    }

    loadTheme() {
        return this.get(STORAGE_KEYS.THEME, THEMES.NEON);
    }

    saveTheme(theme) {
        return this.set(STORAGE_KEYS.THEME, theme);
    }

    // Bulk operations
    exportData() {
        if (!Environment.canUseLocalStorage()) {
            return null;
        }

        try {
            const data = {
                settings: this.loadSettings(),
                stats: this.loadStats(),
                goals: this.loadGoals(),
                theme: this.loadTheme(),
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };
            return data;
        } catch (error) {
            console.warn('Failed to export data:', error);
            return null;
        }
    }

    importData(data) {
        if (!Environment.canUseLocalStorage()) {
            return false;
        }

        try {
            if (data.settings) this.saveSettings(data.settings);
            if (data.stats) this.saveStats(data.stats);
            if (data.goals) this.saveGoals(data.goals);
            if (data.theme) this.saveTheme(data.theme);
            return true;
        } catch (error) {
            console.warn('Failed to import data:', error);
            return false;
        }
    }

    // Data cleanup
    clearAllData() {
        return this.clear();
    }

    clearStats() {
        return this.remove(STORAGE_KEYS.STATS);
    }

    clearGoals() {
        return this.remove(STORAGE_KEYS.GOALS);
    }

    resetToDefaults() {
        this.clearAllData();
        return true;
    }
}

// Create singleton instance
export const Storage = new StorageManager();

// Export convenience methods
export const loadSettings = () => Storage.loadSettings();
export const saveSettings = (settings) => Storage.saveSettings(settings);
export const loadStats = () => Storage.loadStats();
export const saveStats = (stats) => Storage.saveStats(stats);
export const loadGoals = () => Storage.loadGoals();
export const saveGoals = (goals) => Storage.saveGoals(goals);
export const loadTheme = () => Storage.loadTheme();
export const saveTheme = (theme) => Storage.saveTheme(theme); 