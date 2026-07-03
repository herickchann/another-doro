import { DOM_IDS, getElementById } from '../../utils/domConstants.js';

const DIGIT_PLACE_SECONDS = [600, 60, 10, 1];

export class TimerDurationControl {
    constructor(timer) {
        this.timer = timer;
        this.isEditing = false;
        this.isSyncing = false;

        this.elements = {
            wrapper: getElementById(DOM_IDS.TIMER_DISPLAY_WRAPPER),
            digitClock: getElementById(DOM_IDS.DIGIT_CLOCK),
            timeDisplay: getElementById(DOM_IDS.TIME_DISPLAY),
            timerCircle: document.querySelector('.timer-circle'),
            columns: [],
            inputs: [],
            upButtons: [],
            downButtons: []
        };

        if (this.elements.digitClock) {
            this.elements.columns = [...this.elements.digitClock.querySelectorAll('.digit-column')];
            this.elements.inputs = [...this.elements.digitClock.querySelectorAll('.digit-field')];
            this.elements.upButtons = [...this.elements.digitClock.querySelectorAll('.digit-triangle-up')];
            this.elements.downButtons = [...this.elements.digitClock.querySelectorAll('.digit-triangle-down')];
        }

        this._setupEventListeners();
        this.syncFromTimer();
        this.updateAdjustableState();
    }

    _setupEventListeners() {
        this.elements.upButtons.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._stepDigit(index, 1);
            });
        });

        this.elements.downButtons.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._stepDigit(index, -1);
            });
        });

        this.elements.inputs.forEach((input, index) => {
            input.addEventListener('focus', () => {
                this.isEditing = true;
                input.classList.add('is-focused');
                input.select();
            });

            input.addEventListener('blur', () => {
                input.classList.remove('is-focused');
                this._applyDigitsFromInputs();
                this.isEditing = this.elements.inputs.some((el) => el === document.activeElement);
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this._stepDigit(index, 1);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this._stepDigit(index, -1);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    input.blur();
                } else if (e.key === 'ArrowRight' && index < this.elements.inputs.length - 1) {
                    e.preventDefault();
                    this.elements.inputs[index + 1].focus();
                } else if (e.key === 'ArrowLeft' && index > 0) {
                    e.preventDefault();
                    this.elements.inputs[index - 1].focus();
                }
            });

            input.addEventListener('input', () => {
                const digit = input.value.replace(/\D/g, '').slice(-1);
                input.value = digit;
                if (digit) {
                    this._applyDigitsFromInputs(false);
                }
            });
        });
    }

    _secondsToDigits(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return [
            Math.floor(minutes / 10),
            minutes % 10,
            Math.floor(seconds / 10),
            seconds % 10
        ];
    }

    _digitsToSeconds(digits) {
        const minutes = digits[0] * 10 + digits[1];
        const seconds = digits[2] * 10 + digits[3];
        return minutes * 60 + seconds;
    }

    _readDigitsFromInputs() {
        return this.elements.inputs.map((input) => {
            const value = parseInt(input.value, 10);
            return Number.isNaN(value) ? 0 : value;
        });
    }

    _stepDigit(index, direction) {
        if (!this.timer.canAdjustDuration()) return;

        const delta = DIGIT_PLACE_SECONDS[index] * direction;
        this.timer.setSessionTimeSeconds(this.timer.getSessionDurationSeconds() + delta);
        this.syncFromTimer();
    }

    _applyDigitsFromInputs(shouldBlur = true) {
        if (!this.timer.canAdjustDuration() || this.isSyncing) return;

        const digits = this._readDigitsFromInputs();
        const totalSeconds = this._digitsToSeconds(digits);
        this.timer.setSessionTimeSeconds(totalSeconds);
        this.syncFromTimer();

        if (shouldBlur) {
            this.isEditing = false;
        }
    }

    syncFromTimer() {
        if (!this.elements.inputs.length) return;

        this.isSyncing = true;
        const digits = this._secondsToDigits(this.timer.getSessionDurationSeconds());
        this.elements.inputs.forEach((input, index) => {
            input.value = String(digits[index]);
        });
        this.isSyncing = false;
    }

    updateAdjustableState() {
        const adjustable = this.timer.canAdjustDuration();
        const { wrapper, digitClock, timeDisplay, timerCircle, inputs, upButtons, downButtons } = this.elements;

        wrapper?.classList.toggle('is-adjustable', adjustable);
        timerCircle?.classList.toggle('is-adjustable', adjustable);

        if (digitClock) {
            digitClock.hidden = !adjustable;
            digitClock.setAttribute('aria-hidden', adjustable ? 'false' : 'true');
        }

        if (timeDisplay) {
            timeDisplay.hidden = adjustable;
            timeDisplay.setAttribute('aria-hidden', adjustable ? 'true' : 'false');

            if (!adjustable) {
                const currentTime = this.timer.currentTime;
                const minutes = Math.floor(currentTime / 60);
                const seconds = currentTime % 60;
                timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }

        inputs.forEach((input) => {
            input.disabled = !adjustable;
            input.tabIndex = adjustable ? 0 : -1;
        });

        [...upButtons, ...downButtons].forEach((btn) => {
            btn.disabled = !adjustable;
        });

        if (adjustable) {
            this.syncFromTimer();
        } else {
            this.isEditing = false;
            inputs.forEach((input) => input.classList.remove('is-focused'));
        }
    }

    shouldSkipTimeDisplayUpdate() {
        return this.isEditing || this.timer.canAdjustDuration();
    }

    destroy() {
        this.isEditing = false;
    }
}
