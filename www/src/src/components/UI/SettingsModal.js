import { Storage } from '../../utils/storage.js';
import { NotificationService } from '../../services/NotificationService.js';
import { AudioService } from '../../services/AudioService.js';
import { Environment } from '../../utils/environment.js';

export class SettingsModal {
    constructor(app) {
        this.app = app;
        this.isOpen = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.open();
            });
        }

        // Settings modal controls
        const settingsModal = document.getElementById('settingsModal');
        const closeSettingsBtn = document.getElementById('closeSettings');
        const saveSettingsBtn = document.getElementById('saveSettings');
        const restoreDefaultsBtn = document.getElementById('restoreDefaults');

        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                this.close();
            });
        }

        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        if (restoreDefaultsBtn) {
            restoreDefaultsBtn.addEventListener('click', () => {
                this.restoreDefaultSettings();
            });
        }

        // Close modal when clicking outside
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    this.close();
                }
            });
        }

        // Settings tabs
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });

        // Volume slider
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.getElementById('volumeValue');
        if (volumeSlider && volumeValue) {
            volumeSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                volumeValue.textContent = `${value}%`;
                AudioService.setVolume(value / 100);
            });
        }

        // Test sound button
        const testSoundBtn = document.getElementById('testSoundBtn');
        if (testSoundBtn) {
            testSoundBtn.addEventListener('click', () => {
                AudioService.testSound();
            });
        }

        // Clear sessions button
        const clearSessionsBtn = document.getElementById('clearAllSessions');
        if (clearSessionsBtn) {
            clearSessionsBtn.addEventListener('click', () => {
                this.clearAllSessions();
            });
        }

        // Update check button
        const checkUpdatesBtn = document.getElementById('checkUpdatesBtn');
        if (checkUpdatesBtn) {
            checkUpdatesBtn.addEventListener('click', () => {
                this.checkForUpdates();
            });
        }

        // Hotkey inputs
        this.setupHotkeyInputs();
    }

    setupHotkeyInputs() {
        const hotkeyInputs = [
            { id: 'hotkeyStartPause', key: 'startPause', clearId: 'clearStartPause' },
            { id: 'hotkeyReset', key: 'reset', clearId: 'clearReset' },
            { id: 'hotkeySettings', key: 'settings', clearId: 'clearSettings' },
            { id: 'hotkeyAddGoal', key: 'addGoal', clearId: 'clearAddGoal' }
        ];

        hotkeyInputs.forEach(({ id, key, clearId }) => {
            const input = document.getElementById(id);
            const clearBtn = document.getElementById(clearId);

            if (input) {
                input.addEventListener('click', () => {
                    this.recordHotkey(input, key);
                });
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    this.clearHotkey(input, key);
                });
            }
        });
    }

    recordHotkey(input, key) {
        input.value = 'Press key combination...';
        input.classList.add('recording');

        const recordKeydown = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const modifiers = [];
            if (e.ctrlKey) modifiers.push('Ctrl');
            if (e.altKey) modifiers.push('Alt');
            if (e.shiftKey) modifiers.push('Shift');
            if (e.metaKey) modifiers.push('Cmd');

            let keyName = e.code;

            // Convert common keys to readable format
            const keyMap = {
                'Space': 'Space',
                'Enter': 'Enter',
                'Escape': 'Esc',
                'Comma': 'Comma',
                'Period': 'Period',
                'Slash': 'Slash'
            };

            if (keyMap[keyName]) {
                keyName = keyMap[keyName];
            } else if (keyName.startsWith('Key')) {
                keyName = keyName.replace('Key', '');
            } else if (keyName.startsWith('Digit')) {
                keyName = keyName.replace('Digit', '');
            }

            const hotkeyString = modifiers.length > 0 ? `${modifiers.join('+')}+${keyName}` : keyName;

            input.value = hotkeyString;
            input.classList.remove('recording');

            // Update settings
            if (!this.app.currentSettings.hotkeys) {
                this.app.currentSettings.hotkeys = {};
            }
            this.app.currentSettings.hotkeys[key] = hotkeyString;

            document.removeEventListener('keydown', recordKeydown, true);
        };

        document.addEventListener('keydown', recordKeydown, true);

        // Timeout after 10 seconds
        setTimeout(() => {
            document.removeEventListener('keydown', recordKeydown, true);
            if (input.classList.contains('recording')) {
                input.classList.remove('recording');
                input.value = this.app.currentSettings.hotkeys?.[key] || '';
            }
        }, 10000);
    }

    clearHotkey(input, key) {
        input.value = '';
        if (this.app.currentSettings.hotkeys) {
            delete this.app.currentSettings.hotkeys[key];
        }
    }

    open() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            this.loadSettingsIntoForm();
            settingsModal.style.display = 'flex';
            settingsModal.classList.add('show');
            this.isOpen = true;
        }
    }

    close() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.style.display = 'none';
            settingsModal.classList.remove('show');
            this.isOpen = false;
        }
    }

    loadSettingsIntoForm() {
        const settings = this.app.currentSettings;

        // Timer settings
        this.setInputValue('workDurationInput', settings.workDuration);
        this.setInputValue('shortBreakDurationInput', settings.shortBreakDuration);
        this.setInputValue('longBreakDurationInput', settings.longBreakDuration);
        this.setCheckboxValue('autoBreak', settings.autoBreak);
        this.setCheckboxValue('autoWork', settings.autoWork);
        this.setSelectValue('themeSelector', settings.theme);

        // Audio settings
        this.setCheckboxValue('soundEnabled', settings.soundEnabled);
        this.setInputValue('volumeSlider', Math.round(settings.volume * 100));
        this.setTextContent('volumeValue', `${Math.round(settings.volume * 100)}%`);
        this.setSelectValue('soundSelector', settings.currentSound);

        // Update settings
        this.setCheckboxValue('autoUpdateCheck', settings.autoUpdateCheck);
        this.setSelectValue('updateCheckInterval', settings.updateCheckInterval);

        // Hotkeys
        const hotkeys = settings.hotkeys || {};
        this.setInputValue('hotkeyStartPause', hotkeys.startPause || '');
        this.setInputValue('hotkeyReset', hotkeys.reset || '');
        this.setInputValue('hotkeySettings', hotkeys.settings || '');
        this.setInputValue('hotkeyAddGoal', hotkeys.addGoal || '');
    }

    setInputValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.value = value;
    }

    setCheckboxValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.checked = value;
    }

    setSelectValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.value = value;
    }

    setTextContent(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    async saveSettings() {
        try {
            // Collect settings from form
            const newSettings = {
                workDuration: parseInt(document.getElementById('workDurationInput')?.value) || 25,
                shortBreakDuration: parseInt(document.getElementById('shortBreakDurationInput')?.value) || 5,
                longBreakDuration: parseInt(document.getElementById('longBreakDurationInput')?.value) || 15,
                autoBreak: document.getElementById('autoBreak')?.checked || false,
                autoWork: document.getElementById('autoWork')?.checked || false,
                theme: document.getElementById('themeSelector')?.value || 'neon',
                soundEnabled: document.getElementById('soundEnabled')?.checked || true,
                volume: parseInt(document.getElementById('volumeSlider')?.value) / 100 || 0.7,
                currentSound: document.getElementById('soundSelector')?.value || 'timer-finish.wav',
                hotkeys: this.app.currentSettings.hotkeys || {},
                autoUpdateCheck: document.getElementById('autoUpdateCheck')?.checked || true,
                updateCheckInterval: parseInt(document.getElementById('updateCheckInterval')?.value) || 24
            };

            // Update current settings
            this.app.currentSettings = { ...this.app.currentSettings, ...newSettings };

            // Save to storage
            Storage.saveSettings(this.app.currentSettings);

            // Update services
            await AudioService.updateSettings(this.app.currentSettings);

            // Update timer
            this.app.timer.updateSettings(this.app.currentSettings);

            // Apply theme
            this.app.applyTheme(this.app.currentSettings.theme);

            // Show notification
            await NotificationService.showSettingsSaved();

            // Close modal
            this.close();

        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    async restoreDefaultSettings() {
        if (confirm('Reset all settings to default values?\n\nThis action cannot be undone.')) {
            try {
                // Clear storage to get defaults
                Storage.remove('pomodoroSettings');
                this.app.currentSettings = Storage.loadSettings();

                // Update services
                await AudioService.updateSettings(this.app.currentSettings);

                // Update timer
                this.app.timer.updateSettings(this.app.currentSettings);

                // Apply theme
                this.app.applyTheme(this.app.currentSettings.theme);

                // Reload form
                this.loadSettingsIntoForm();

                // Show notification
                await NotificationService.showSettingsReset();

            } catch (error) {
                console.error('Failed to restore default settings:', error);
            }
        }
    }

    switchTab(tabName) {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        // Remove active class from all tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.classList.remove('active');
        });

        // Show selected tab content
        const selectedTab = document.getElementById(`${tabName}-tab`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Add active class to selected button
        const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
    }

    async clearAllSessions() {
        if (confirm('Are you sure you want to clear all session data?\n\nThis will reset:\n• Completed sessions count\n• Total time spent\n• Session counter\n\nThis action cannot be undone.')) {
            try {
                // Clear stats in timer
                this.app.timer.clearStats();

                // Update display
                this.app.updateStatsDisplay();

                // Show notification
                await NotificationService.showSessionsCleared();

            } catch (error) {
                console.error('Failed to clear sessions:', error);
            }
        }
    }

    async checkForUpdates() {
        if (Environment.canAutoUpdate()) {
            try {
                await Environment.invokeIPC('check-for-updates-manual');
            } catch (error) {
                console.error('Failed to check for updates:', error);
            }
        } else {
            alert('Updates not available in this environment');
        }
    }
} 