import { Environment } from '../../utils/environment.js';
import { DEFAULT_HOTKEYS } from '../../utils/constants.js';
import { getDefaultHotkeys } from '../../utils/platformHotkeys.js';
import { DOM_IDS, CSS_CLASSES, getElementById } from '../../utils/domConstants.js';

export class HotkeyManager {
    constructor() {
        this.hotkeys = { ...DEFAULT_HOTKEYS };
        this.actions = new Map();
        this.isEnabled = Environment.capabilities.hasKeyboardShortcuts;

        if (this.isEnabled) {
            this.setupGlobalListeners();
        }
    }

    initialize(hotkeys = {}) {
        this.hotkeys = { ...DEFAULT_HOTKEYS, ...hotkeys };
    }

    // Update hotkeys immediately without requiring restart
    updateHotkeys(newHotkeys = {}) {
        this.hotkeys = { ...DEFAULT_HOTKEYS, ...newHotkeys };
        console.log('Hotkeys updated:', this.hotkeys);
    }

    setupGlobalListeners() {
        if (!this.isEnabled) return;

        document.addEventListener('keydown', (e) => {
            if (this.shouldSkipKeyEvent(e)) return;
            this.handleKeyDown(e);
        });
    }

    static isTextEditingContext(element = document.activeElement) {
        if (!element || element === document.body || element === document.documentElement) {
            return false;
        }

        if (element.matches?.('input, textarea, [contenteditable=""], [contenteditable="true"]')) {
            return true;
        }

        if (element.isContentEditable) {
            return true;
        }

        if (element.classList?.contains(CSS_CLASSES.GOAL_EDIT_INPUT)) {
            return true;
        }

        if (element.closest?.(`#${DOM_IDS.ADD_GOAL_FORM}`)) {
            return true;
        }

        return false;
    }

    static isNativeTextEditingShortcut(event) {
        if (!event?.key) {
            return false;
        }

        if (!(event.metaKey || event.ctrlKey)) {
            return false;
        }

        const nativeKeys = new Set(['a', 'c', 'v', 'x', 'z', 'y']);
        return nativeKeys.has(event.key.toLowerCase());
    }

    static isGoalEditingFlowActive() {
        if (document.body.classList.contains(CSS_CLASSES.GOAL_EDITING_ACTIVE)) {
            return true;
        }

        const addGoalForm = getElementById(DOM_IDS.ADD_GOAL_FORM);
        if (addGoalForm && addGoalForm.style.display !== 'none' && !addGoalForm.hidden) {
            return true;
        }

        return Boolean(window.goalsManager?.isInGoalEditingFlow?.());
    }

    static shouldBlockAppShortcuts(target = document.activeElement) {
        if (HotkeyManager.isTextEditingContext(target)) {
            return true;
        }

        if (HotkeyManager.isGoalEditingFlowActive()) {
            return true;
        }

        const settingsDrawer = getElementById(DOM_IDS.SIDE_DRAWER);
        if (settingsDrawer?.classList.contains('show')) {
            return true;
        }

        return false;
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
        const focusTarget = document.activeElement;
        if (
            HotkeyManager.shouldBlockAppShortcuts(focusTarget) ||
            HotkeyManager.shouldBlockAppShortcuts(e.target)
        ) {
            return true;
        }

        if (HotkeyManager.isNativeTextEditingShortcut(e)) {
            return true;
        }

        // Skip if recording hotkeys in settings
        if (e.target.classList?.contains('recording')) {
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
        this.hotkeys = getDefaultHotkeys();
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