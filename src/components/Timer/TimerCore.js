import {
    TIMER_DEFAULTS,
    SESSION_TYPES,
    BREAK_TYPES,
    UI_TIMING
} from '../../utils/constants.js';
import { EventEmitter } from '../../utils/EventEmitter.js';

export class TimerCore extends EventEmitter {
    constructor(settings = {}) {
        super();

        // Timer state
        this.isRunning = false;
        this.isPaused = false;
        this.currentTime = 0;
        this.totalTime = 0;
        this.sessionCount = 0;
        this.completedSessions = 0;
        this.totalTimeSpent = 0;
        this.currentSessionType = SESSION_TYPES.WORK;
        this.timerInterval = null;

        // Settings
        this.workDuration = settings.workDuration || TIMER_DEFAULTS.WORK_DURATION;
        this.shortBreakDuration = settings.shortBreakDuration || TIMER_DEFAULTS.SHORT_BREAK_DURATION;
        this.longBreakDuration = settings.longBreakDuration || TIMER_DEFAULTS.LONG_BREAK_DURATION;
        this.autoBreak = settings.autoBreak || false;
        this.autoWork = settings.autoWork || false;
        this.breakType = settings.breakType || BREAK_TYPES.NORMAL;

        // Initialize timer
        this._setTimerForCurrentSession();
    }

    // Timer control methods
    start() {
        if (this.isRunning) return;

        if (!this.isPaused) {
            // Starting fresh
            this._setTimerForCurrentSession();
        }

        this.isRunning = true;
        this.isPaused = false;

        this.emit('timer:started', {
            sessionType: this.currentSessionType,
            currentTime: this.currentTime,
            totalTime: this.totalTime
        });

        this.timerInterval = setInterval(() => {
            this.currentTime--;

            this.emit('timer:tick', {
                currentTime: this.currentTime,
                totalTime: this.totalTime,
                progress: this._getProgress()
            });

            if (this.currentTime <= 0) {
                this._completeSession();
            }
        }, TIMER_DEFAULTS.TICK_INTERVAL);
    }

    pause() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.isPaused = true;
        clearInterval(this.timerInterval);

        this.emit('timer:paused', {
            sessionType: this.currentSessionType,
            currentTime: this.currentTime,
            totalTime: this.totalTime
        });
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timerInterval);

        this._setTimerForCurrentSession();

        this.emit('timer:reset', {
            sessionType: this.currentSessionType,
            currentTime: this.currentTime,
            totalTime: this.totalTime
        });
    }

    resetSession() {
        // Reset the entire pomodoro session
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timerInterval);

        // Reset session data
        this.sessionCount = 0;
        this.currentSessionType = SESSION_TYPES.WORK;

        this._setTimerForCurrentSession();

        this.emit('session:reset', {
            sessionType: this.currentSessionType,
            currentTime: this.currentTime,
            totalTime: this.totalTime,
            sessionCount: this.sessionCount
        });
    }

    skip() {
        // Stop current timer
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timerInterval);

        const previousSessionType = this.currentSessionType;
        let nextSessionType = '';

        if (this.currentSessionType === SESSION_TYPES.WORK) {
            // Skip work session - go to break
            this.completedSessions++;
            this.sessionCount++;
            nextSessionType = this._getNextBreakType();
        } else {
            // Skip break session - go to work
            nextSessionType = SESSION_TYPES.WORK;
        }

        this.currentSessionType = nextSessionType;
        this._setTimerForCurrentSession();

        this.emit('session:skipped', {
            previousSessionType,
            nextSessionType,
            currentTime: this.currentTime,
            totalTime: this.totalTime,
            sessionCount: this.sessionCount,
            completedSessions: this.completedSessions
        });
    }

    // Private methods
    _completeSession() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timerInterval);

        // Add to total time spent
        this.totalTimeSpent += this.totalTime;

        const previousSessionType = this.currentSessionType;
        let nextSessionType = '';

        if (this.currentSessionType === SESSION_TYPES.WORK) {
            this.completedSessions++;
            this.sessionCount++;
            nextSessionType = this._getNextBreakType();
        } else {
            nextSessionType = SESSION_TYPES.WORK;
        }

        this.currentSessionType = nextSessionType;

        this.emit('session:completed', {
            previousSessionType,
            nextSessionType,
            completedSessions: this.completedSessions,
            sessionCount: this.sessionCount,
            totalTimeSpent: this.totalTimeSpent
        });

        // Reset timer for next session
        this._setTimerForCurrentSession();

        this.emit('timer:reset', {
            sessionType: this.currentSessionType,
            currentTime: this.currentTime,
            totalTime: this.totalTime
        });

        // Auto-start next session if enabled
        if (this._shouldAutoStart(nextSessionType)) {
            setTimeout(() => {
                this.start();
            }, TIMER_DEFAULTS.AUTO_START_DELAY);
        }
    }

    _setTimerForCurrentSession() {
        switch (this.currentSessionType) {
            case SESSION_TYPES.WORK:
                this.currentTime = this.workDuration * 60;
                this.totalTime = this.workDuration * 60;
                break;
            case SESSION_TYPES.SHORT_BREAK:
                this.currentTime = this.shortBreakDuration * 60;
                this.totalTime = this.shortBreakDuration * 60;
                break;
            case SESSION_TYPES.LONG_BREAK:
                this.currentTime = this.longBreakDuration * 60;
                this.totalTime = this.longBreakDuration * 60;
                break;
        }
    }

    _getNextBreakType() {
        if (this.breakType === BREAK_TYPES.SHORT) {
            return SESSION_TYPES.SHORT_BREAK;
        } else if (this.breakType === BREAK_TYPES.LONG) {
            return SESSION_TYPES.LONG_BREAK;
        } else {
            // Normal cycle
            return (this.sessionCount % TIMER_DEFAULTS.POMODORO_CYCLE_LENGTH === 0)
                ? SESSION_TYPES.LONG_BREAK
                : SESSION_TYPES.SHORT_BREAK;
        }
    }

    _shouldAutoStart(sessionType) {
        return (sessionType !== SESSION_TYPES.WORK && this.autoBreak) ||
            (sessionType === SESSION_TYPES.WORK && this.autoWork);
    }

    _getProgress() {
        if (this.totalTime === 0) return 0;
        return (this.totalTime - this.currentTime) / this.totalTime;
    }

    // Public getters
    get state() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            currentTime: this.currentTime,
            totalTime: this.totalTime,
            sessionType: this.currentSessionType,
            sessionCount: this.sessionCount,
            completedSessions: this.completedSessions,
            totalTimeSpent: this.totalTimeSpent,
            progress: this._getProgress()
        };
    }

    get settings() {
        return {
            workDuration: this.workDuration,
            shortBreakDuration: this.shortBreakDuration,
            longBreakDuration: this.longBreakDuration,
            autoBreak: this.autoBreak,
            autoWork: this.autoWork,
            breakType: this.breakType
        };
    }

    // Settings update methods
    updateSettings(newSettings) {
        const wasRunning = this.isRunning;

        // Update durations
        if (newSettings.workDuration !== undefined) {
            this.workDuration = newSettings.workDuration;
        }
        if (newSettings.shortBreakDuration !== undefined) {
            this.shortBreakDuration = newSettings.shortBreakDuration;
        }
        if (newSettings.longBreakDuration !== undefined) {
            this.longBreakDuration = newSettings.longBreakDuration;
        }
        if (newSettings.autoBreak !== undefined) {
            this.autoBreak = newSettings.autoBreak;
        }
        if (newSettings.autoWork !== undefined) {
            this.autoWork = newSettings.autoWork;
        }
        if (newSettings.breakType !== undefined) {
            this.breakType = newSettings.breakType;
        }

        // Reset timer if not running and duration might have changed
        if (!wasRunning) {
            this._setTimerForCurrentSession();
            this.emit('timer:updated', this.state);
        }

        this.emit('settings:updated', this.settings);
    }

    // Statistics methods
    updateStats(stats) {
        if (stats.completedSessions !== undefined) {
            this.completedSessions = stats.completedSessions;
        }
        if (stats.totalTimeSpent !== undefined) {
            this.totalTimeSpent = stats.totalTimeSpent;
        }
        if (stats.sessionCount !== undefined) {
            this.sessionCount = stats.sessionCount;
        }

        this.emit('stats:updated', {
            completedSessions: this.completedSessions,
            totalTimeSpent: this.totalTimeSpent,
            sessionCount: this.sessionCount
        });
    }

    clearStats() {
        this.completedSessions = 0;
        this.totalTimeSpent = 0;
        this.sessionCount = 0;
        this.currentSessionType = SESSION_TYPES.WORK;

        // Reset timer if running
        if (this.isRunning || this.isPaused) {
            this.reset();
        }

        this._setTimerForCurrentSession();

        this.emit('stats:cleared', {
            completedSessions: this.completedSessions,
            totalTimeSpent: this.totalTimeSpent,
            sessionCount: this.sessionCount
        });
    }

    // Cleanup
    destroy() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.removeAllListeners();
    }
} 