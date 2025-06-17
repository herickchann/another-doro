import { Environment } from '../../utils/environment.js';

export class TrayManager {
    constructor() {
        this.isElectron = Environment.isElectron();
        this.currentTitle = '';
        this.isEnabled = this.isElectron;
    }

    async initialize() {
        if (!this.isElectron) {
            console.log('TrayManager: Not in Electron environment, skipping initialization');
            return false;
        }

        try {
            // Initialize tray if available
            if (Environment.canUseIPC()) {
                await this.setupTray();
                return true;
            }
        } catch (error) {
            console.warn('Failed to initialize tray:', error);
        }

        return false;
    }

    async setupTray() {
        if (!Environment.canUseIPC()) return;

        try {
            // Set up tray event listeners
            Environment.onIPC('tray-clicked', () => {
                this.handleTrayClick();
            });

            Environment.onIPC('tray-right-clicked', () => {
                this.handleTrayRightClick();
            });

            console.log('Tray manager initialized');
        } catch (error) {
            console.warn('Failed to setup tray:', error);
        }
    }

    async updateTitle(title = '') {
        if (!this.isEnabled || !Environment.canUseIPC()) return;

        try {
            this.currentTitle = title;
            await Environment.invokeIPC('update-tray-title', title);
        } catch (error) {
            console.warn('Failed to update tray title:', error);
        }
    }

    async updateTimerDisplay(currentTime, isRunning, isPaused) {
        if (!this.isEnabled) return;

        let title = '';

        if (isRunning) {
            const minutes = Math.floor(currentTime / 60);
            const seconds = currentTime % 60;
            title = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else if (isPaused) {
            title = '⏸';
        }

        await this.updateTitle(title);
    }

    async updateSessionType(sessionType) {
        if (!this.isEnabled) return;

        const sessionIcons = {
            work: '🍅',
            shortBreak: '☕',
            longBreak: '🌟'
        };

        const icon = sessionIcons[sessionType] || '🍅';

        try {
            await Environment.invokeIPC('update-tray-icon', icon);
        } catch (error) {
            console.warn('Failed to update tray icon:', error);
        }
    }

    async showNotification(title, body, options = {}) {
        if (!this.isEnabled || !Environment.canUseIPC()) return;

        try {
            await Environment.invokeIPC('show-tray-notification', {
                title,
                body,
                ...options
            });
        } catch (error) {
            console.warn('Failed to show tray notification:', error);
        }
    }

    async setTooltip(tooltip) {
        if (!this.isEnabled || !Environment.canUseIPC()) return;

        try {
            await Environment.invokeIPC('set-tray-tooltip', tooltip);
        } catch (error) {
            console.warn('Failed to set tray tooltip:', error);
        }
    }

    handleTrayClick() {
        // Handle single click on tray icon
        if (Environment.canUseIPC()) {
            try {
                Environment.invokeIPC('show-main-window');
            } catch (error) {
                console.warn('Failed to show main window:', error);
            }
        }
    }

    handleTrayRightClick() {
        // Handle right click on tray icon
        // Could show context menu or perform other actions
        console.log('Tray right-clicked');
    }

    // Timer integration methods
    onTimerStart() {
        this.setTooltip('Timer is running');
    }

    onTimerPause() {
        this.setTooltip('Timer is paused');
    }

    onTimerReset() {
        this.updateTitle('');
        this.setTooltip('AnotherDoro - Ready to focus');
    }

    onSessionComplete(sessionType, nextSessionType) {
        const messages = {
            work: 'Work session completed! Time for a break.',
            shortBreak: 'Break over! Ready to focus again?',
            longBreak: 'Long break finished! Let\'s get back to work.'
        };

        this.showNotification(
            'Session Complete',
            messages[sessionType] || 'Session completed!',
            { silent: false }
        );

        this.updateSessionType(nextSessionType);
    }

    // Context menu actions
    async createContextMenu() {
        if (!this.isEnabled || !Environment.canUseIPC()) return;

        const menuTemplate = [
            {
                label: 'Show AnotherDoro',
                click: () => this.handleTrayClick()
            },
            { type: 'separator' },
            {
                label: 'Start/Pause Timer',
                click: () => this.triggerTimerAction('toggle')
            },
            {
                label: 'Reset Timer',
                click: () => this.triggerTimerAction('reset')
            },
            { type: 'separator' },
            {
                label: 'Settings',
                click: () => this.triggerAppAction('settings')
            },
            { type: 'separator' },
            {
                label: 'Quit',
                click: () => this.triggerAppAction('quit')
            }
        ];

        try {
            await Environment.invokeIPC('create-tray-menu', menuTemplate);
        } catch (error) {
            console.warn('Failed to create tray context menu:', error);
        }
    }

    triggerTimerAction(action) {
        // Communicate with main app to trigger timer actions
        if (window.app) {
            switch (action) {
                case 'toggle':
                    if (window.app.timer.isRunning) {
                        window.app.timer.pause();
                    } else {
                        window.app.timer.start();
                    }
                    break;
                case 'reset':
                    window.app.timer.reset();
                    break;
            }
        }
    }

    triggerAppAction(action) {
        if (Environment.canUseIPC()) {
            try {
                switch (action) {
                    case 'settings':
                        Environment.invokeIPC('show-main-window');
                        // Open settings modal
                        setTimeout(() => {
                            if (window.app?.settingsModal) {
                                window.app.settingsModal.open();
                            }
                        }, 500);
                        break;
                    case 'quit':
                        Environment.invokeIPC('quit-app');
                        break;
                }
            } catch (error) {
                console.warn(`Failed to trigger app action '${action}':`, error);
            }
        }
    }

    // Status methods
    isAvailable() {
        return this.isElectron && Environment.canUseIPC();
    }

    getCurrentTitle() {
        return this.currentTitle;
    }

    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
        this.updateTitle('');
    }

    // Integration with app components
    bindToTimer(timer) {
        if (!timer || !this.isEnabled) return;

        timer.on('timer:started', () => this.onTimerStart());
        timer.on('timer:paused', () => this.onTimerPause());
        timer.on('timer:reset', () => this.onTimerReset());

        timer.on('timer:tick', (data) => {
            this.updateTimerDisplay(data.currentTime, timer.isRunning, timer.isPaused);
        });

        timer.on('session:completed', (data) => {
            this.onSessionComplete(data.previousSessionType, data.nextSessionType);
        });
    }

    // Cleanup
    destroy() {
        if (this.isEnabled) {
            this.updateTitle('');
            this.setTooltip('AnotherDoro');
        }
        this.isEnabled = false;
        this.currentTitle = '';
    }

    // Debug helpers
    debugInfo() {
        return {
            isElectron: this.isElectron,
            isEnabled: this.isEnabled,
            canUseIPC: Environment.canUseIPC(),
            currentTitle: this.currentTitle
        };
    }
} 