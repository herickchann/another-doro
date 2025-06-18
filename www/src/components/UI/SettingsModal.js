import { Storage } from '../../utils/storage.js';
import { NotificationService } from '../../services/NotificationService.js';
import { AudioService } from '../../services/AudioService.js';
import { Environment } from '../../utils/environment.js';
import { DOM_IDS, CSS_CLASSES, getElementById } from '../../utils/domConstants.js';

export class SettingsModal {
    constructor(app) {
        this.app = app;
        this.isOpen = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Settings button
        const settingsBtn = getElementById(DOM_IDS.SETTINGS_BTN);
        if (settingsBtn) {
            settingsBtn.addEventListener('click', async () => {
                await this.open();
            });
        }

        // Settings modal controls
        const settingsModal = getElementById(DOM_IDS.SETTINGS_MODAL);
        const closeSettingsBtn = getElementById(DOM_IDS.CLOSE_SETTINGS_BTN);
        const saveSettingsBtn = getElementById(DOM_IDS.SAVE_SETTINGS_BTN);
        const restoreDefaultsBtn = getElementById(DOM_IDS.RESTORE_DEFAULTS_BTN);

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

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                e.preventDefault();
                this.close();
            }
        });

        // Settings tabs
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });

        // Volume slider
        const volumeSlider = getElementById(DOM_IDS.VOLUME_SLIDER);
        const volumeValue = getElementById(DOM_IDS.VOLUME_VALUE);
        if (volumeSlider && volumeValue) {
            // Update volume slider visual
            const updateSliderBackground = (value) => {
                const percentage = value;
                volumeSlider.style.background = `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${percentage}%, var(--surface-color) ${percentage}%, var(--surface-color) 100%)`;
            };

            // Initial update
            updateSliderBackground(volumeSlider.value);

            volumeSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                volumeValue.textContent = `${value}%`;
                updateSliderBackground(value);
                AudioService.setVolume(value / 100);
            });
        }

        // Test sound button
        const testSoundBtn = getElementById(DOM_IDS.TEST_SOUND_BTN);
        if (testSoundBtn) {
            testSoundBtn.addEventListener('click', () => {
                AudioService.testSound();
            });
        }

        // Clear sessions button
        const clearSessionsBtn = getElementById(DOM_IDS.CLEAR_ALL_SESSIONS);
        if (clearSessionsBtn) {
            clearSessionsBtn.addEventListener('click', () => {
                this.clearAllSessions();
            });
        }

        // Update check button
        const checkUpdatesBtn = getElementById(DOM_IDS.CHECK_UPDATES_BTN);
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
            { id: DOM_IDS.HOTKEY_START_PAUSE, key: 'startPause', clearId: DOM_IDS.CLEAR_START_PAUSE },
            { id: DOM_IDS.HOTKEY_RESET, key: 'reset', clearId: DOM_IDS.CLEAR_RESET },
            { id: DOM_IDS.HOTKEY_SETTINGS, key: 'settings', clearId: DOM_IDS.CLEAR_SETTINGS },
            { id: DOM_IDS.HOTKEY_ADD_GOAL, key: 'addGoal', clearId: DOM_IDS.CLEAR_ADD_GOAL }
        ];

        hotkeyInputs.forEach(({ id, key, clearId }) => {
            const input = getElementById(id);
            const clearBtn = getElementById(clearId);

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
        input.classList.add(CSS_CLASSES.RECORDING);

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
            input.classList.remove(CSS_CLASSES.RECORDING);

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
            if (input.classList.contains(CSS_CLASSES.RECORDING)) {
                input.classList.remove(CSS_CLASSES.RECORDING);
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

    async open() {
        const settingsModal = getElementById(DOM_IDS.SETTINGS_MODAL);
        if (settingsModal) {
            await this.loadSettingsIntoForm();
            settingsModal.style.display = 'flex';
            settingsModal.classList.add(CSS_CLASSES.SHOW);
            this.isOpen = true;
        }
    }

    close() {
        const settingsModal = getElementById(DOM_IDS.SETTINGS_MODAL);
        if (settingsModal) {
            settingsModal.style.display = 'none';
            settingsModal.classList.remove(CSS_CLASSES.SHOW);
            this.isOpen = false;
        }
    }

    async loadSettingsIntoForm() {
        const settings = this.app.currentSettings;

        // Timer settings
        this.setInputValue(DOM_IDS.WORK_DURATION_INPUT, settings.workDuration);
        this.setInputValue(DOM_IDS.SHORT_BREAK_DURATION_INPUT, settings.shortBreakDuration);
        this.setInputValue(DOM_IDS.LONG_BREAK_DURATION_INPUT, settings.longBreakDuration);
        this.setCheckboxValue(DOM_IDS.AUTO_BREAK, settings.autoBreak);
        this.setCheckboxValue(DOM_IDS.AUTO_WORK, settings.autoWork);
        this.setSelectValue(DOM_IDS.THEME_SELECTOR, settings.theme);

        // Audio settings
        this.setCheckboxValue(DOM_IDS.SOUND_ENABLED, settings.soundEnabled);
        const volumeValue = Math.round(settings.volume * 100);
        this.setInputValue(DOM_IDS.VOLUME_SLIDER, volumeValue);
        this.setTextContent(DOM_IDS.VOLUME_VALUE, `${volumeValue}%`);
        this.setSelectValue(DOM_IDS.SOUND_SELECTOR, settings.currentSound);

        // Update volume slider visual
        const volumeSlider = getElementById(DOM_IDS.VOLUME_SLIDER);
        if (volumeSlider) {
            volumeSlider.style.background = `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${volumeValue}%, var(--surface-color) ${volumeValue}%, var(--surface-color) 100%)`;
        }

        // Update settings
        this.setCheckboxValue(DOM_IDS.AUTO_UPDATE_CHECK, settings.autoUpdateCheck);
        this.setSelectValue(DOM_IDS.UPDATE_CHECK_INTERVAL, settings.updateCheckInterval);

        // Load current version
        try {
            if (Environment.canAutoUpdate()) {
                const currentVersion = await Environment.invokeIPC('get-app-version');
                this.setTextContent(DOM_IDS.CURRENT_VERSION, currentVersion);
            }
        } catch (error) {
            console.error('Failed to load current version:', error);
        }

        // Hotkeys
        const hotkeys = settings.hotkeys || {};
        this.setInputValue(DOM_IDS.HOTKEY_START_PAUSE, hotkeys.startPause || '');
        this.setInputValue(DOM_IDS.HOTKEY_RESET, hotkeys.reset || '');
        this.setInputValue(DOM_IDS.HOTKEY_SETTINGS, hotkeys.settings || '');
        this.setInputValue(DOM_IDS.HOTKEY_ADD_GOAL, hotkeys.addGoal || '');
    }

    setInputValue(id, value) {
        const element = getElementById(id);
        if (element) element.value = value;
    }

    setCheckboxValue(id, value) {
        const element = getElementById(id);
        if (element) element.checked = value;
    }

    setSelectValue(id, value) {
        const element = getElementById(id);
        if (element) element.value = value;
    }

    setTextContent(id, value) {
        const element = getElementById(id);
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

            // Update hotkeys immediately - this is the key fix!
            if (this.app.hotkeyManager) {
                this.app.hotkeyManager.updateHotkeys(this.app.currentSettings.hotkeys || {});
            }

            // Update goals manager hotkey display
            if (this.app.goalsManager && this.app.currentSettings.hotkeys) {
                this.app.goalsManager.updateHotkey(this.app.currentSettings.hotkeys.addGoal || null);
            }

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

                // Update hotkeys immediately
                if (this.app.hotkeyManager) {
                    this.app.hotkeyManager.updateHotkeys(this.app.currentSettings.hotkeys || {});
                }

                // Update goals manager hotkey display
                if (this.app.goalsManager && this.app.currentSettings.hotkeys) {
                    this.app.goalsManager.updateHotkey(this.app.currentSettings.hotkeys.addGoal || null);
                }

                // Apply theme
                this.app.applyTheme(this.app.currentSettings.theme);

                // Reload form
                await this.loadSettingsIntoForm();

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
        if (!Environment.canAutoUpdate()) {
            this.showUpdateStatus('error', 'Updates not available in development mode');
            return;
        }

        const button = document.getElementById('checkUpdatesBtn');
        const statusElement = document.getElementById('updateStatus');
        const originalText = button.textContent;

        try {
            // Show loading state
            button.textContent = 'Checking...';
            button.disabled = true;
            this.showUpdateStatus('checking', 'Checking for updates...');
            this.hideProgressSection();

            const result = await Environment.invokeIPC('check-for-updates-manual');

            if (result.error) {
                this.showUpdateStatus('error', `Update check failed: ${result.error}`);
            } else if (result.available) {
                this.showUpdateStatus('available', `Update available: v${result.version}`);
                this.showUpdateInfo(result.version, result.releaseNotes || 'New version available with improvements and bug fixes.');
            } else {
                this.showUpdateStatus('not-available', result.message || 'You have the latest version');
            }
        } catch (error) {
            console.error('Failed to check for updates:', error);
            this.showUpdateStatus('error', `Failed to check for updates: ${error.message}`);
        } finally {
            // Restore button state
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    showUpdateStatus(type, message) {
        const statusElement = document.getElementById('updateStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `update-status ${type}`;
        }
    }

    showUpdateInfo(version, releaseNotes) {
        const infoSection = document.getElementById('updateInfoSection');
        const versionElement = document.getElementById('newVersion');
        const notesElement = document.getElementById('updateReleaseNotes');
        const downloadBtn = document.getElementById('downloadUpdateBtn');

        if (versionElement) versionElement.textContent = version;
        if (notesElement) notesElement.textContent = releaseNotes;
        if (downloadBtn) {
            downloadBtn.style.display = 'inline-block';
            downloadBtn.onclick = () => this.downloadUpdate();
        }
        if (infoSection) infoSection.style.display = 'block';
    }

    async downloadUpdate() {
        const downloadBtn = document.getElementById('downloadUpdateBtn');
        const installBtn = document.getElementById('installNowBtn');

        try {
            downloadBtn.textContent = 'Downloading...';
            downloadBtn.disabled = true;
            this.showProgressSection();
            this.updateProgress(0, 'Preparing download...');

            const result = await Environment.invokeIPC('download-update');

            if (result.success) {
                this.hideProgressSection();
                this.showUpdateStatus('ready', 'Update ready to install');
                downloadBtn.style.display = 'none';
                if (installBtn) {
                    installBtn.style.display = 'inline-block';
                    installBtn.onclick = () => this.installUpdate();
                }
            } else {
                this.hideProgressSection();
                this.showUpdateStatus('error', result.error || 'Download failed');
                downloadBtn.textContent = 'Download Update';
                downloadBtn.disabled = false;
            }
        } catch (error) {
            console.error('Download failed:', error);
            this.hideProgressSection();
            this.showUpdateStatus('error', `Download failed: ${error.message}`);
            downloadBtn.textContent = 'Download Update';
            downloadBtn.disabled = false;
        }
    }

    async installUpdate() {
        try {
            this.showUpdateStatus('installing', 'Installing update...');
            await Environment.invokeIPC('install-update');
        } catch (error) {
            console.error('Install failed:', error);
            this.showUpdateStatus('error', `Install failed: ${error.message}`);
        }
    }

    showProgressSection() {
        const progressSection = document.getElementById('updateProgressSection');
        if (progressSection) {
            progressSection.style.display = 'block';
        }
    }

    hideProgressSection() {
        const progressSection = document.getElementById('updateProgressSection');
        if (progressSection) {
            progressSection.style.display = 'none';
        }
    }

    updateProgress(percentage, text) {
        const progressFill = document.getElementById('settingsProgressFill');
        const progressText = document.getElementById('settingsProgressText');
        const progressPercent = document.getElementById('settingsProgressPercent');

        if (progressFill) {
            progressFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }
        if (progressText) {
            progressText.textContent = text || 'Downloading...';
        }
        if (progressPercent) {
            progressPercent.textContent = `${Math.round(percentage)}%`;
        }
    }

    // Method to handle update status from main process
    handleUpdateStatus(status, data) {
        console.log('Settings modal handling update status:', status, data);

        switch (status) {
            case 'checking':
                this.showUpdateStatus('checking', 'Checking for updates...');
                break;
            case 'available':
                this.showUpdateStatus('available', `Update available: v${data.version}`);
                this.showUpdateInfo(data.version, data.releaseNotes || 'New version available with improvements and bug fixes.');
                break;
            case 'not-available':
                this.showUpdateStatus('not-available', 'You have the latest version');
                break;
            case 'downloading':
                this.showProgressSection();
                this.updateProgress(data.percent || 0, `Downloading... ${Math.round(data.percent || 0)}%`);
                break;
            case 'downloaded':
                this.hideProgressSection();
                this.showUpdateStatus('ready', 'Update ready to install');
                const downloadBtn = document.getElementById('downloadUpdateBtn');
                const installBtn = document.getElementById('installNowBtn');
                if (downloadBtn) downloadBtn.style.display = 'none';
                if (installBtn) {
                    installBtn.style.display = 'inline-block';
                    installBtn.onclick = () => this.installUpdate();
                }
                break;
            case 'error':
                this.hideProgressSection();
                this.showUpdateStatus('error', data || 'Update error occurred');
                break;
        }
    }
} 