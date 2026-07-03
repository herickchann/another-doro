import {
    TIMER_DEFAULTS,
    SESSION_TYPES,
    BREAK_TYPES,
    DURATION_LIMITS,
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
        this.pendingSessionSeconds = null;

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

        this.pendingSessionSeconds = null;
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

        this.currentSessionType = SESSION_TYPES.WORK;
        this.pendingSessionSeconds = null;

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
        this.pendingSessionSeconds = null;
        this._setTimerForCurrentSession();

        this.emit('session:skipped', {
            previousSessionType,
            nextSessionType,
            currentTime: this.currentTime,
            totalTime: this.totalTime,
            sessionDurationSeconds: previousSessionType === SESSION_TYPES.WORK
                ? this.totalTime - this.currentTime
                : this.totalTime - this.currentTime,
            sessionCount: this.sessionCount,
            completedSessions: this.completedSessions
        });
    }

    // Private methods
    _completeSession() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timerInterval);

        const previousSessionType = this.currentSessionType;
        const sessionDurationSeconds = this.totalTime;

        // Add to total time spent
        this.totalTimeSpent += this.totalTime;

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
            sessionDurationSeconds,
            completedSessions: this.completedSessions,
            sessionCount: this.sessionCount,
            totalTimeSpent: this.totalTimeSpent
        });

        // Reset timer for next session (defaults for new session type)
        this.pendingSessionSeconds = null;
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
        const seconds = this._getDurationSecondsForCurrentSession();
        this.currentTime = seconds;
        this.totalTime = seconds;
    }

    _getDefaultDurationMinutes(sessionType) {
        switch (sessionType) {
            case SESSION_TYPES.WORK:
                return this.workDuration;
            case SESSION_TYPES.SHORT_BREAK:
                return this.shortBreakDuration;
            case SESSION_TYPES.LONG_BREAK:
                return this.longBreakDuration;
            default:
                return this.workDuration;
        }
    }

    _getDurationLimits(sessionType = this.currentSessionType) {
        return DURATION_LIMITS[sessionType] || DURATION_LIMITS.work;
    }

    _getDurationSecondsForCurrentSession() {
        if (this.pendingSessionSeconds !== null) {
            return this.pendingSessionSeconds;
        }
        return this._getDefaultDurationMinutes(this.currentSessionType) * 60;
    }

    _getMinMaxSeconds(sessionType = this.currentSessionType) {
        const { min, max } = this._getDurationLimits(sessionType);
        return { minSeconds: min * 60, maxSeconds: max * 60 };
    }

    _clampDurationSeconds(totalSeconds, sessionType = this.currentSessionType) {
        const { minSeconds, maxSeconds } = this._getMinMaxSeconds(sessionType);
        return Math.min(maxSeconds, Math.max(minSeconds, Math.round(totalSeconds)));
    }

    canAdjustDuration() {
        return !this.isRunning && !this.isPaused;
    }

    getSessionDurationSeconds() {
        return this.currentTime;
    }

    getDurationLimits() {
        return this._getDurationLimits();
    }

    setSessionTimeSeconds(totalSeconds) {
        if (!this.canAdjustDuration()) return false;

        const clamped = this._clampDurationSeconds(totalSeconds);
        this.pendingSessionSeconds = clamped;
        this.currentTime = clamped;
        this.totalTime = clamped;

        this.emit('duration:changed', {
            totalSeconds: clamped,
            sessionType: this.currentSessionType,
            isOverride: true
        });

        return true;
    }

    setSessionDuration(minutes) {
        return this.setSessionTimeSeconds(minutes * 60);
    }

    adjustSessionDuration(deltaMinutes) {
        if (!this.canAdjustDuration()) return false;
        return this.setSessionTimeSeconds(this.currentTime + deltaMinutes * 60);
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
            sessionNumber: this.sessionCount + 1,
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
            if (this.pendingSessionSeconds === null) {
                this._setTimerForCurrentSession();
            }
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
        this.pendingSessionSeconds = null;

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