import { DOM_IDS, getElementById } from '../../utils/domConstants.js';
import { UI_TEXT } from '../../utils/strings.js';

export class NavigationDrawer {
    constructor(app) {
        this.app = app;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const settingsBtn = getElementById(DOM_IDS.SETTINGS_BTN);
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.app.openSettings();
            });
        }

        const viewHistoryBtn = getElementById(DOM_IDS.VIEW_SESSION_HISTORY_BTN);
        if (viewHistoryBtn) {
            const label = viewHistoryBtn.querySelector('.session-history-cta-label');
            if (label) {
                label.textContent = UI_TEXT.BUTTONS.VIEW_SESSION_HISTORY;
            }
            viewHistoryBtn.addEventListener('click', () => {
                this.app.sessionHistoryDisplay?.open();
            });
        }
    }
}
