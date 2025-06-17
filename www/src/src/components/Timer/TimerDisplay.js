import { PROGRESS_RING } from '../../utils/constants.js';
import { UI_TEXT } from '../../utils/strings.js';
import { Environment } from '../../utils/environment.js';

export class TimerDisplay {
    constructor(container) {
        this.container = container;
        this.elements = {};
        this.circumference = 0;
        this.isInitialized = false;

        this._initializeElements();
        this._setupProgressRing();
    }

    _initializeElements() {
        // Find all required elements
        this.elements = {
            timeDisplay: this.container.querySelector('#timeDisplay'),
            sessionType: this.container.querySelector('#sessionType'),
            sessionNumber: this.container.querySelector('#sessionNumber'),
            progressCircle: this.container.querySelector('#progressCircle'),
            timerCircle: this.container.querySelector('.timer-circle'),
            startPauseBtn: this.container.querySelector('#startPauseBtn'),
            resetBtn: this.container.querySelector('#resetBtn'),
            skipBtn: this.container.querySelector('#skipBtn')
        };

        // Check if all elements exist
        const missingElements = Object.entries(this.elements)
            .filter(([key, element]) => !element)
            .map(([key]) => key);

        if (missingElements.length > 0) {
            console.warn('Missing timer display elements:', missingElements);
        }
    }

    _setupProgressRing() {
        if (!this.elements.progressCircle || !this.elements.progressCircle.r) return;

        try {
            const radius = this.elements.progressCircle.r.baseVal.value;
            this.circumference = 2 * Math.PI * radius;
            this.elements.progressCircle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
            this.elements.progressCircle.style.strokeDashoffset = this.circumference;
            this.isInitialized = true;
        } catch (error) {
            console.warn('Failed to setup progress ring:', error);
        }
    }

    // Update methods
    updateTime(currentTime) {
        if (!this.elements.timeDisplay) return;

        const minutes = Math.floor(currentTime / 60);
        const seconds = currentTime % 60;
        const newTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Only animate if the time actually changed
        if (this.elements.timeDisplay.textContent !== newTime) {
            this._animateTimeChange(newTime);
        }
    }

    _animateTimeChange(newTime) {
        // Add animation class
        this.elements.timeDisplay.classList.add('changing');

        // Update the text at the peak of the scale animation
        setTimeout(() => {
            this.elements.timeDisplay.textContent = newTime;
        }, 150); // Half of the animation duration for smooth text change

        // Remove animation class after animation completes
        setTimeout(() => {
            this.elements.timeDisplay.classList.remove('changing');
        }, 300);
    }

    updateSessionType(sessionType) {
        if (!this.elements.sessionType) return;

        const sessionTypeText = UI_TEXT.SESSION_TYPES[sessionType.toUpperCase()] || sessionType;
        this.elements.sessionType.textContent = sessionTypeText;
    }

    updateSessionNumber(sessionCount) {
        if (!this.elements.sessionNumber) return;

        // Calculate display session number (1-4 repeating cycle)
        const displayNumber = Math.floor(sessionCount / 4) * 4 + Math.min(sessionCount % 4 + 1, 4);
        this.elements.sessionNumber.textContent = displayNumber;
    }

    updateProgress(progress, sessionType) {
        if (!this.isInitialized || !this.elements.progressCircle) return;

        const offset = this.circumference - (progress * this.circumference);
        this.elements.progressCircle.style.strokeDashoffset = offset;

        // Update progress ring color based on session type
        this._updateProgressColor(sessionType);
    }

    _updateProgressColor(sessionType) {
        if (!this.elements.progressCircle) return;

        let colorVar = '--progress-work';
        switch (sessionType) {
            case 'shortBreak':
                colorVar = '--progress-short-break';
                break;
            case 'longBreak':
                colorVar = '--progress-long-break';
                break;
        }

        const color = getComputedStyle(document.documentElement).getPropertyValue(colorVar).trim();
        if (color) {
            this.elements.progressCircle.setAttribute('stroke', color);
        }
    }

    updateButtonStates(isRunning, isPaused) {
        if (!this.elements.startPauseBtn) return;

        // Update start/pause button
        let buttonText = UI_TEXT.BUTTONS.START;
        if (isRunning) {
            buttonText = UI_TEXT.BUTTONS.PAUSE;
        } else if (isPaused) {
            buttonText = UI_TEXT.BUTTONS.RESUME;
        }

        const buttonTextElement = this.elements.startPauseBtn.querySelector('.btn-text');
        if (buttonTextElement) {
            buttonTextElement.textContent = buttonText;
        }

        // Update timer circle active state
        if (this.elements.timerCircle) {
            if (isRunning) {
                this.elements.timerCircle.classList.add('active');
            } else {
                this.elements.timerCircle.classList.remove('active');
            }
        }
    }

    // Event binding methods
    onStartPause(callback) {
        if (this.elements.startPauseBtn) {
            this.elements.startPauseBtn.addEventListener('click', callback);
        }
    }

    onReset(callback) {
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', callback);
        }
    }

    onSkip(callback) {
        if (this.elements.skipBtn) {
            this.elements.skipBtn.addEventListener('click', callback);
        }
    }

    // Adaptive sizing for different environments
    adaptToEnvironment() {
        if (!Environment.isMobile()) return;

        const timerSize = Environment.getOptimalTimerSize();
        const progressRing = this.container.querySelector('.progress-ring');

        if (progressRing) {
            progressRing.setAttribute('width', timerSize.width);
            progressRing.setAttribute('height', timerSize.height);

            // Recalculate circumference for new size
            setTimeout(() => {
                this._setupProgressRing();
            }, 100);
        }
    }

    // Cleanup method
    destroy() {
        // Remove event listeners if needed
        // This would be expanded if we stored listener references
    }

    // Full state update
    updateState(state) {
        this.updateTime(state.currentTime);
        this.updateSessionType(state.sessionType);
        this.updateSessionNumber(state.sessionCount);
        this.updateProgress(state.progress, state.sessionType);
        this.updateButtonStates(state.isRunning, state.isPaused);
    }

    // Initialize display with state
    initialize(state) {
        this.adaptToEnvironment();
        this.updateState(state);

        // Ensure progress ring is properly initialized
        setTimeout(() => {
            if (!this.isInitialized) {
                this._setupProgressRing();
                this.updateProgress(state.progress, state.sessionType);
            }
        }, 200);
    }
} 