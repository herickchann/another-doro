import { DOM_IDS, CSS_CLASSES, getElementById } from '../../utils/domConstants.js';

export const APP_VIEWS = {
    TIMER: 'timer',
    HISTORY: 'history'
};

export class NavigationDrawer {
    constructor(app) {
        this.app = app;
        this.isOpen = false;
        this.currentView = APP_VIEWS.TIMER;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const menuBtn = getElementById(DOM_IDS.MENU_BTN);
        const drawerCloseBtn = getElementById(DOM_IDS.DRAWER_CLOSE_BTN);
        const drawerOverlay = getElementById(DOM_IDS.DRAWER_OVERLAY);
        const drawerSettingsBtn = getElementById(DOM_IDS.DRAWER_SETTINGS_BTN);
        const navItems = document.querySelectorAll('.drawer-nav-item[data-view]');

        if (menuBtn) {
            menuBtn.addEventListener('click', () => this.open());
        }

        if (drawerCloseBtn) {
            drawerCloseBtn.addEventListener('click', () => this.close());
        }

        if (drawerOverlay) {
            drawerOverlay.addEventListener('click', () => this.close());
        }

        if (drawerSettingsBtn) {
            drawerSettingsBtn.addEventListener('click', async () => {
                this.close();
                await this.app.openSettings();
            });
        }

        navItems.forEach((item) => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                if (view) {
                    this.navigateTo(view);
                }
                this.close();
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    open() {
        this.isOpen = true;
        getElementById(DOM_IDS.SIDE_DRAWER)?.classList.add(CSS_CLASSES.SHOW);
        getElementById(DOM_IDS.DRAWER_OVERLAY)?.classList.add(CSS_CLASSES.SHOW);
    }

    close() {
        this.isOpen = false;
        getElementById(DOM_IDS.SIDE_DRAWER)?.classList.remove(CSS_CLASSES.SHOW);
        getElementById(DOM_IDS.DRAWER_OVERLAY)?.classList.remove(CSS_CLASSES.SHOW);
    }

    navigateTo(view) {
        if (!Object.values(APP_VIEWS).includes(view)) {
            return;
        }

        this.currentView = view;

        document.querySelectorAll('.app-view').forEach((el) => {
            el.classList.toggle(CSS_CLASSES.ACTIVE, el.dataset.view === view);
        });

        document.querySelectorAll('.drawer-nav-item[data-view]').forEach((el) => {
            el.classList.toggle(CSS_CLASSES.ACTIVE, el.dataset.view === view);
        });

        if (view === APP_VIEWS.HISTORY) {
            this.app.sessionHistoryDisplay?.refresh();
        }
    }
}
