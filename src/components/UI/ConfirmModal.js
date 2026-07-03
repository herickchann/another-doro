import { DOM_IDS, CSS_CLASSES, getElementById } from '../../utils/domConstants.js';

const CONFIRM_ICONS = {
    goals: `
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="40" cy="40" r="36" fill="currentColor" opacity="0.12"/>
            <rect x="22" y="20" width="36" height="44" rx="6" stroke="currentColor" stroke-width="2.5" fill="none"/>
            <path d="M30 32h24M30 40h18M30 48h22" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
            <circle cx="28" cy="32" r="3" fill="var(--primary-color)"/>
            <circle cx="28" cy="40" r="3" fill="var(--primary-color)" opacity="0.5"/>
            <path d="M48 52l8 8M56 52l-8 8" stroke="var(--error-color)" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
    `,
    sessions: `
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="40" cy="40" r="36" fill="currentColor" opacity="0.12"/>
            <circle cx="40" cy="40" r="22" stroke="currentColor" stroke-width="2.5" fill="none"/>
            <path d="M40 28v14l10 6" stroke="var(--primary-color)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M24 56c6-8 26-8 32 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
            <path d="M22 58l36 4" stroke="var(--error-color)" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
    `,
    reset: `
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="40" cy="40" r="36" fill="currentColor" opacity="0.12"/>
            <path d="M40 22v8M40 50v8M22 40h8M50 40h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
            <circle cx="40" cy="40" r="14" stroke="currentColor" stroke-width="2.5" fill="none"/>
            <path d="M34 34l-6-6M46 46l6 6M34 46l-6 6M46 34l6-6" stroke="var(--primary-color)" stroke-width="2" stroke-linecap="round"/>
            <path d="M48 26a16 16 0 0 1 4 10" stroke="var(--secondary-color)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            <path d="M52 22v6h-6" stroke="var(--secondary-color)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `
};

export class ConfirmModal {
    static activePromise = null;

    static show({
        title = 'Are you sure?',
        message = '',
        details = [],
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        variant = 'danger',
        icon = 'goals',
        footnote = ''
    } = {}) {
        if (ConfirmModal.activePromise) {
            return ConfirmModal.activePromise;
        }

        const overlay = getElementById(DOM_IDS.CONFIRM_OVERLAY);
        const titleEl = getElementById(DOM_IDS.CONFIRM_TITLE);
        const messageEl = getElementById(DOM_IDS.CONFIRM_MESSAGE);
        const detailsEl = getElementById(DOM_IDS.CONFIRM_DETAILS);
        const footnoteEl = getElementById(DOM_IDS.CONFIRM_FOOTNOTE);
        const iconEl = getElementById(DOM_IDS.CONFIRM_ICON);
        const confirmBtn = getElementById(DOM_IDS.CONFIRM_CONFIRM_BTN);
        const cancelBtn = getElementById(DOM_IDS.CONFIRM_CANCEL_BTN);
        const dialog = getElementById(DOM_IDS.CONFIRM_DIALOG);

        if (!overlay || !titleEl || !messageEl || !detailsEl || !footnoteEl || !iconEl || !confirmBtn || !cancelBtn || !dialog) {
            console.error('ConfirmModal: required DOM elements not found');
            return Promise.resolve(false);
        }

        titleEl.textContent = title;
        messageEl.textContent = message;
        messageEl.hidden = !message;

        detailsEl.replaceChildren();
        if (details.length > 0) {
            details.forEach((item) => {
                const li = document.createElement('li');
                li.textContent = item;
                detailsEl.appendChild(li);
            });
            detailsEl.hidden = false;
        } else {
            detailsEl.hidden = true;
        }

        footnoteEl.textContent = footnote;
        footnoteEl.hidden = !footnote;

        iconEl.innerHTML = CONFIRM_ICONS[icon] || CONFIRM_ICONS.goals;
        iconEl.className = `confirm-icon confirm-icon-${variant}`;

        confirmBtn.textContent = confirmText;
        cancelBtn.textContent = cancelText;

        confirmBtn.className = variant === 'danger'
            ? `${CSS_CLASSES.BTN} ${CSS_CLASSES.BTN_DANGER}`
            : `${CSS_CLASSES.BTN} ${CSS_CLASSES.BTN_PRIMARY}`;

        const previouslyFocused = document.activeElement;

        ConfirmModal.activePromise = new Promise((resolve) => {
            const cleanup = (result) => {
                overlay.classList.remove(CSS_CLASSES.SHOW);
                overlay.setAttribute('aria-hidden', 'true');
                document.removeEventListener('keydown', onKeyDown);
                overlay.removeEventListener('click', onOverlayClick);
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
                ConfirmModal.activePromise = null;

                if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                    previouslyFocused.focus();
                }

                resolve(result);
            };

            const onConfirm = () => cleanup(true);
            const onCancel = () => cleanup(false);
            const onOverlayClick = (e) => {
                if (e.target === overlay) {
                    onCancel();
                }
            };
            const onKeyDown = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancel();
                }
            };

            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
            overlay.addEventListener('click', onOverlayClick);
            document.addEventListener('keydown', onKeyDown);

            overlay.setAttribute('aria-hidden', 'false');
            overlay.classList.add(CSS_CLASSES.SHOW);
            cancelBtn.focus();
        });

        return ConfirmModal.activePromise;
    }
}
