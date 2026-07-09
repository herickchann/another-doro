import { DOM_IDS, CSS_CLASSES, getElementById } from '../../utils/domConstants.js';
import { ALARM_ALERT } from '../../utils/strings.js';
import { AudioService } from '../../services/AudioService.js';

export class AlarmAlert {
    constructor() {
        this.element = getElementById(DOM_IDS.ALARM_ALERT);
        this.messageEl = getElementById(DOM_IDS.ALARM_MESSAGE);
        this.stopBtn = getElementById(DOM_IDS.STOP_ALARM_BTN);
        this.onStop = null;

        this.stopBtn?.addEventListener('click', () => this._handleStop());
        AudioService.onStop(() => this.hide());
    }

    show(sessionType, nextSessionType = null) {
        if (!this.element) {
            return;
        }

        const message = this._getMessage(sessionType, nextSessionType);
        if (this.messageEl) {
            this.messageEl.textContent = message;
        }

        this.element.hidden = false;
        requestAnimationFrame(() => {
            this.element.classList.add(CSS_CLASSES.VISIBLE);
        });
    }

    hide() {
        if (!this.element || this.element.hidden) {
            return;
        }

        this.element.classList.remove(CSS_CLASSES.VISIBLE);

        const setHidden = () => {
            if (!this.element.classList.contains(CSS_CLASSES.VISIBLE)) {
                this.element.hidden = true;
            }
        };

        this.element.addEventListener('transitionend', setHidden, { once: true });
        setTimeout(setHidden, 400);
    }

    _handleStop() {
        this.onStop?.();
    }

    _getMessage(sessionType, nextSessionType) {
        const messages = ALARM_ALERT.MESSAGES;
        if (sessionType === 'work') {
            return nextSessionType
                ? messages.WORK_COMPLETE(nextSessionType)
                : messages.WORK_COMPLETE_DEFAULT;
        }
        if (sessionType === 'shortBreak') {
            return messages.BREAK_COMPLETE;
        }
        if (sessionType === 'longBreak') {
            return messages.LONG_BREAK_COMPLETE;
        }
        return messages.WORK_COMPLETE_DEFAULT;
    }
}
