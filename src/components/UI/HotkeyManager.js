import { DEFAULT_HOTKEYS } from '../../utils/constants.js';

export class HotkeyManager {
    constructor() {
        this.hotkeys = { ...DEFAULT_HOTKEYS };
        this.actions = new Map();
        this.isEnabled = true;
        this.setupEventListeners();
    }

    initialize(hotkeys = {}) {
        this.hotkeys = { ...DEFAULT_HOTKEYS, ...hotkeys };
    }

    // Update hotkeys immediately without requiring restart
    updateHotkeys(newHotkeys = {}) {
        this.hotkeys = { ...DEFAULT_HOTKEYS, ...newHotkeys };
        console.log('Hotkeys updated:', this.hotkeys);
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
    }

    handleKeyDown(e) {
        if (!this.isEnabled) return;

        // Skip if typing in inputs or if settings modal is open
        if (this.shouldSkipKeyEvent(e)) return;

        const keyString = this.getKeyString(e);
        const action = this.getActionForKey(keyString);

        if (action) {
            e.preventDefault();
            e.stopPropagation();
            this.executeAction(action, e);
        }
    }

    shouldSkipKeyEvent(e) {
        // Skip if typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return true;
        }

        // Skip if settings modal is open
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal && settingsModal.classList.contains('show')) {
            return true;
        }

        // Skip if recording hotkeys
        if (e.target.classList && e.target.classList.contains('recording')) {
            return true;
        }

        return false;
    }

    getKeyString(event) {
        const modifiers = [];
        if (event.ctrlKey) modifiers.push('Ctrl');
        if (event.altKey) modifiers.push('Alt');
        if (event.shiftKey) modifiers.push('Shift');
        if (event.metaKey) modifiers.push('Cmd');

        let key = event.code;

        // Convert common keys to readable format
        const keyMap = {
            'Space': 'Space',
            'Enter': 'Enter',
            'Escape': 'Esc',
            'Comma': 'Comma',
            'Period': 'Period',
            'Slash': 'Slash',
            'Backspace': 'Backspace',
            'Delete': 'Delete',
            'Tab': 'Tab'
        };

        if (keyMap[key]) {
            key = keyMap[key];
        } else if (key.startsWith('Key')) {
            key = key.replace('Key', '');
        } else if (key.startsWith('Digit')) {
            key = key.replace('Digit', '');
        } else if (key.startsWith('F') && key.length <= 3) {
            // Function keys F1-F12
            key = key;
        }

        return modifiers.length > 0 ? `${modifiers.join('+')}+${key}` : key;
    }

    getActionForKey(keyString) {
        for (const [action, hotkey] of Object.entries(this.hotkeys)) {
            if (hotkey === keyString) {
                return action;
            }
        }
        return null;
    }

    executeAction(action, event) {
        const actionCallback = this.actions.get(action);
        if (actionCallback && typeof actionCallback === 'function') {
            try {
                actionCallback(event);
            } catch (error) {
                console.error(`Error executing hotkey action '${action}':`, error);
            }
        }
    }

    // Action registration
    registerAction(action, callback) {
        if (typeof callback === 'function') {
            this.actions.set(action, callback);
            return true;
        }
        return false;
    }

    unregisterAction(action) {
        return this.actions.delete(action);
    }

    // Hotkey management
    setHotkey(action, keyString) {
        if (this.isValidKeyString(keyString)) {
            this.hotkeys[action] = keyString;
            return true;
        }
        return false;
    }

    clearHotkey(action) {
        if (this.hotkeys[action]) {
            this.hotkeys[action] = '';
            return true;
        }
        return false;
    }

    getHotkey(action) {
        return this.hotkeys[action] || '';
    }

    getAllHotkeys() {
        return { ...this.hotkeys };
    }

    isValidKeyString(keyString) {
        return typeof keyString === 'string' && keyString.length > 0;
    }

    isHotkeyInUse(keyString, excludeAction = null) {
        for (const [action, hotkey] of Object.entries(this.hotkeys)) {
            if (hotkey === keyString && action !== excludeAction) {
                return action;
            }
        }
        return false;
    }

    // Enable/disable hotkeys
    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
    }

    isHotkeyEnabled() {
        return this.isEnabled;
    }

    // Utility methods
    getHotkeyDisplayText(keyString) {
        if (!keyString) return '';

        // Replace key names with more user-friendly versions
        return keyString
            .replace('Ctrl', '⌃')
            .replace('Alt', '⌥')
            .replace('Shift', '⇧')
            .replace('Cmd', '⌘')
            .replace('Space', '␣')
            .replace('Enter', '↵')
            .replace('Esc', '⎋')
            .replace('Backspace', '⌫')
            .replace('Delete', '⌦')
            .replace('Tab', '⇥');
    }

    // Debug and monitoring
    getRegisteredActions() {
        return Array.from(this.actions.keys());
    }

    // Conflict detection
    findConflicts() {
        const conflicts = [];
        const seenHotkeys = new Map();

        for (const [action, hotkey] of Object.entries(this.hotkeys)) {
            if (hotkey && seenHotkeys.has(hotkey)) {
                conflicts.push({
                    hotkey,
                    actions: [seenHotkeys.get(hotkey), action]
                });
            } else if (hotkey) {
                seenHotkeys.set(hotkey, action);
            }
        }

        return conflicts;
    }

    // Reset to defaults
    resetToDefaults() {
        this.hotkeys = { ...DEFAULT_HOTKEYS };
    }

    // Export/Import
    exportHotkeys() {
        return {
            hotkeys: { ...this.hotkeys },
            isEnabled: this.isEnabled,
            exportDate: new Date().toISOString()
        };
    }

    importHotkeys(hotkeyData) {
        if (hotkeyData && hotkeyData.hotkeys) {
            this.hotkeys = { ...DEFAULT_HOTKEYS, ...hotkeyData.hotkeys };
            if (typeof hotkeyData.isEnabled === 'boolean') {
                this.isEnabled = hotkeyData.isEnabled;
            }
            return true;
        }
        return false;
    }

    // Cleanup
    destroy() {
        // Clear all actions
        this.actions.clear();

        // Reset hotkeys
        this.hotkeys = { ...DEFAULT_HOTKEYS };

        // Disable
        this.isEnabled = false;
    }
} 