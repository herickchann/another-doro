import { Environment } from '../utils/environment.js';
import { ASSETS, ERROR_MESSAGES } from '../utils/constants.js';

class NotificationServiceClass {
    constructor() {
        this.permissionRequested = false;
    }

    async initialize() {
        // Request permission for web notifications if available
        if (Environment.capabilities.hasWebNotifications && !Environment.isElectron()) {
            await this._requestWebNotificationPermission();
        }
    }

    async _requestWebNotificationPermission() {
        if (Notification.permission === 'default') {
            try {
                const permission = await Notification.requestPermission();
                this.permissionRequested = true;
                return permission === 'granted';
            } catch (error) {
                console.warn('Failed to request notification permission:', error);
                return false;
            }
        }
        return Notification.permission === 'granted';
    }

    async show(title, body, options = {}) {
        try {
            if (Environment.capabilities.hasNativeNotifications) {
                return await this._showNativeNotification(title, body, options);
            } else if (Environment.capabilities.hasWebNotifications) {
                return await this._showWebNotification(title, body, options);
            } else {
                console.log(`📢 ${title}: ${body}`);
                return true;
            }
        } catch (error) {
            console.error('Failed to show notification:', error);
            return false;
        }
    }

    async _showNativeNotification(title, body, options) {
        try {
            await Environment.invokeIPC('show-notification', title, body, options);
            return true;
        } catch (error) {
            console.error('Failed to show native notification:', error);
            return false;
        }
    }

    async _showWebNotification(title, body, options) {
        // Ensure we have permission
        const hasPermission = await this._requestWebNotificationPermission();
        if (!hasPermission) {
            console.log(`📢 ${title}: ${body}`);
            return false;
        }

        try {
            const notification = new Notification(title, {
                body,
                icon: options.icon || ASSETS.ICON,
                tag: options.tag || 'pomodoro-timer',
                requireInteraction: options.requireInteraction || false,
                silent: options.silent || false,
                ...options
            });

            // Auto-close after delay if specified
            if (options.autoClose) {
                setTimeout(() => {
                    notification.close();
                }, options.autoClose);
            }

            return true;
        } catch (error) {
            console.error('Failed to show web notification:', error);
            console.log(`📢 ${title}: ${body}`);
            return false;
        }
    }

    // Convenience methods for common notification types
    async showTimerComplete(sessionType, nextSessionType = null) {
        const notifications = {
            work: {
                title: 'Work Session Complete!',
                body: nextSessionType
                    ? `Time for a ${nextSessionType}! ${nextSessionType === 'long break' ? '🌟' : '☕'}`
                    : 'Great work! Time for a break! ☕'
            },
            shortBreak: {
                title: 'Break Complete!',
                body: 'Time to focus! 🎯'
            },
            longBreak: {
                title: 'Long Break Complete!',
                body: 'Ready to start fresh! 🚀'
            }
        };

        const notification = notifications[sessionType] || notifications.work;
        return await this.show(notification.title, notification.body, {
            tag: 'timer-complete',
            autoClose: 5000
        });
    }

    async showSessionSkipped(sessionType, nextSessionType) {
        const title = sessionType === 'work' ? 'Work Session Skipped' : 'Break Skipped';
        const body = sessionType === 'work'
            ? `Moving to ${nextSessionType}! ${nextSessionType === 'long break' ? '🌟' : '☕'}`
            : 'Back to work! Time to focus! 🎯';

        return await this.show(title, body, {
            tag: 'session-skipped',
            autoClose: 3000
        });
    }

    async showSessionReset() {
        return await this.show(
            'Session Reset',
            'Pomodoro session has been reset to the beginning! 🔄',
            {
                tag: 'session-reset',
                autoClose: 3000
            }
        );
    }

    async showSettingsSaved() {
        return await this.show(
            'Settings Saved',
            'Your preferences have been updated! ⚙️',
            {
                tag: 'settings-saved',
                autoClose: 2000
            }
        );
    }

    async showSettingsReset() {
        return await this.show(
            'Settings Reset',
            'All settings have been reset to defaults! 🔄',
            {
                tag: 'settings-reset',
                autoClose: 3000
            }
        );
    }

    async showSessionsCleared() {
        return await this.show(
            'Sessions Cleared',
            'All session data has been reset. Ready for a fresh start! 🌟',
            {
                tag: 'sessions-cleared',
                autoClose: 3000
            }
        );
    }

    async showUpdateAvailable(version) {
        return await this.show(
            '🚀 Update Available',
            `Version ${version} is ready to install`,
            {
                tag: 'update-available',
                requireInteraction: true
            }
        );
    }

    // Check if notifications are supported and enabled
    isSupported() {
        return Environment.canShowNotifications();
    }

    hasPermission() {
        if (Environment.capabilities.hasNativeNotifications) {
            return true; // Native notifications don't need explicit permission
        }

        if (Environment.capabilities.hasWebNotifications) {
            return Notification.permission === 'granted';
        }

        return false;
    }

    getStatus() {
        return {
            supported: this.isSupported(),
            hasPermission: this.hasPermission(),
            permissionRequested: this.permissionRequested,
            type: Environment.capabilities.hasNativeNotifications ? 'native' : 'web'
        };
    }
}

// Create singleton instance
export const NotificationService = new NotificationServiceClass(); 