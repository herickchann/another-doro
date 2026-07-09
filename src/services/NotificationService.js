import { Environment } from '../utils/environment.js';
import { ASSETS } from '../utils/constants.js';
import { ALARM_ALERT } from '../utils/strings.js';

class NotificationServiceClass {
    constructor() {
        this.permissionRequested = false;
        this.serviceWorkerRegistration = null;
        this.activeTimerNotification = null;
        this._stopAlarmCallback = null;
    }

    async initialize() {
        if (Environment.capabilities.hasWebNotifications && !Environment.isElectron()) {
            await this._requestWebNotificationPermission();
            await this._registerServiceWorker();
            this._listenForServiceWorkerMessages();
        }

        if (Environment.isElectron()) {
            Environment.onIPC('stop-alarm', () => {
                this._stopAlarmCallback?.();
            });
        }
    }

    async _registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            return;
        }

        try {
            this.serviceWorkerRegistration = await navigator.serviceWorker.register('sw.js');
        } catch (error) {
            console.warn('Service worker registration failed:', error);
        }
    }

    _listenForServiceWorkerMessages() {
        navigator.serviceWorker?.addEventListener('message', (event) => {
            if (event.data?.type === 'stop-alarm') {
                this._stopAlarmCallback?.();
            }
        });
    }

    setStopAlarmCallback(callback) {
        this._stopAlarmCallback = callback;
    }

    closeTimerCompleteNotification() {
        if (this.activeTimerNotification) {
            this.activeTimerNotification.close();
            this.activeTimerNotification = null;
        }

        if (this.serviceWorkerRegistration) {
            this.serviceWorkerRegistration.getNotifications({ tag: 'timer-complete' })
                .then((notifications) => {
                    notifications.forEach((notification) => notification.close());
                })
                .catch((error) => {
                    console.warn('Failed to close service worker notifications:', error);
                });
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
        const hasPermission = await this._requestWebNotificationPermission();
        if (!hasPermission) {
            console.log(`📢 ${title}: ${body}`);
            return false;
        }

        try {
            const notificationOptions = {
                body,
                icon: options.icon || ASSETS.ICON,
                tag: options.tag || 'pomodoro-timer',
                requireInteraction: options.requireInteraction ?? false,
                silent: options.silent || false,
                ...options
            };

            if (options.actions) {
                notificationOptions.actions = options.actions;
            }

            if (this.serviceWorkerRegistration) {
                await this.serviceWorkerRegistration.showNotification(title, notificationOptions);
                return true;
            }

            const notification = new Notification(title, notificationOptions);
            this._trackTimerNotification(notification, options);

            notification.onclick = () => {
                if (options.stopOnClick) {
                    this._stopAlarmCallback?.();
                }
                notification.close();
                window.focus();
            };

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

    _trackTimerNotification(notification, options) {
        if (options.tag === 'timer-complete') {
            this.activeTimerNotification = notification;
            notification.onclose = () => {
                if (this.activeTimerNotification === notification) {
                    this.activeTimerNotification = null;
                }
            };
        }
    }

    async showTimerComplete(sessionType, nextSessionType = null, { onStop } = {}) {
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
        const stopAction = {
            action: 'stop-alarm',
            title: ALARM_ALERT.NOTIFICATION_STOP_ACTION
        };

        if (onStop) {
            this.setStopAlarmCallback(onStop);
        }

        return await this.show(notification.title, notification.body, {
            tag: 'timer-complete',
            requireInteraction: true,
            stopOnClick: true,
            actions: [stopAction],
            hasStopAction: true
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

    isSupported() {
        return Environment.canShowNotifications();
    }

    hasPermission() {
        if (Environment.capabilities.hasNativeNotifications) {
            return true;
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

export const NotificationService = new NotificationServiceClass();
