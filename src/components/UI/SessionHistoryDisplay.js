import { Storage } from '../../utils/storage.js';
import { SESSION_TYPES } from '../../utils/constants.js';
import { DOM_IDS, CSS_CLASSES, getElementById } from '../../utils/domConstants.js';
import { UI_TEXT, HISTORY_TEXT } from '../../utils/strings.js';

const SHEET_EXPANDED_RATIO = 0.9;
const SHEET_COLLAPSED_RATIO = 0.55;
const SHEET_DISMISS_EXTRA_RATIO = 0.12;

export class SessionHistoryDisplay {
    constructor(app) {
        this.app = app;
        this.sessions = [];
        this.isOpen = false;
        this.isExpanded = false;
        this.isDragging = false;
        this.currentOffset = 0;
        this.sheetHeight = 0;
        this.dragStartY = 0;
        this.dragStartOffset = 0;
        this.pointerMoved = false;
        this.boundPointerMove = this.onPointerMove.bind(this);
        this.boundPointerUp = this.onPointerUp.bind(this);
    }

    initialize() {
        this.sessions = Storage.loadSessionHistory();
        this.setupEventListeners();
        this.setupSheetDrag();
        this.render();
    }

    getSheetHeights() {
        const viewportHeight = window.innerHeight;
        return {
            expanded: Math.round(viewportHeight * SHEET_EXPANDED_RATIO),
            collapsed: Math.round(viewportHeight * SHEET_COLLAPSED_RATIO)
        };
    }

    getDismissThreshold() {
        return Math.round(window.innerHeight * SHEET_DISMISS_EXTRA_RATIO);
    }

    applySheetGeometry({ height, translateY, animate = true }) {
        const sheet = this.getSheetElement();
        if (!sheet) {
            return;
        }

        sheet.classList.toggle('is-dragging', !animate);
        sheet.style.height = `${height}px`;
        sheet.style.maxHeight = `${height}px`;
        sheet.style.transform = `translateY(${translateY}px)`;
        this.sheetHeight = height;
        this.currentOffset = translateY;
    }

    snapToExpanded(animate = true) {
        const { expanded } = this.getSheetHeights();
        this.isExpanded = true;
        this.applySheetGeometry({ height: expanded, translateY: 0, animate });
        this.updateExpandedState();
    }

    snapToCollapsed(animate = true) {
        const { collapsed } = this.getSheetHeights();
        this.isExpanded = false;
        this.applySheetGeometry({ height: collapsed, translateY: 0, animate });
        this.updateExpandedState();
    }

    snapClosed(animate = true) {
        const height = this.sheetHeight || this.getSheetHeights().collapsed;
        this.applySheetGeometry({ height, translateY: height, animate });
    }

    setupSheetDrag() {
        const dragZone = getElementById(DOM_IDS.HISTORY_SHEET_DRAG_ZONE);
        if (!dragZone) {
            return;
        }

        dragZone.addEventListener('pointerdown', (e) => {
            if (!this.isOpen || e.button !== 0) {
                return;
            }

            if (e.target.closest('.history-clear-link')) {
                return;
            }

            this.isDragging = true;
            this.pointerMoved = false;
            this.dragStartY = e.clientY;
            this.dragStartOffset = this.currentOffset;
            dragZone.setPointerCapture(e.pointerId);
            this.getSheetElement()?.classList.add('is-dragging');
        });

        dragZone.addEventListener('pointermove', this.boundPointerMove);
        dragZone.addEventListener('pointerup', this.boundPointerUp);
        dragZone.addEventListener('pointercancel', this.boundPointerUp);

        dragZone.addEventListener('click', (e) => {
            if (this.pointerMoved) {
                this.pointerMoved = false;
                return;
            }

            this.toggleExpanded();
        });

        window.addEventListener('resize', () => {
            if (!this.isOpen) {
                return;
            }

            if (this.isExpanded) {
                this.snapToExpanded(false);
            } else {
                this.snapToCollapsed(false);
            }
        });
    }

    onPointerMove(e) {
        if (!this.isDragging) {
            return;
        }

        const delta = e.clientY - this.dragStartY;
        if (Math.abs(delta) > 4) {
            this.pointerMoved = true;
        }

        const heights = this.getSheetHeights();
        const baseHeight = this.isExpanded ? heights.expanded : heights.collapsed;
        const maxDrag = baseHeight + this.getDismissThreshold();
        const translateY = Math.max(0, Math.min(this.dragStartOffset + delta, maxDrag));

        this.applySheetGeometry({
            height: baseHeight,
            translateY,
            animate: false
        });
    }

    onPointerUp(e) {
        if (!this.isDragging) {
            return;
        }

        this.isDragging = false;
        getElementById(DOM_IDS.HISTORY_SHEET_DRAG_ZONE)?.releasePointerCapture(e.pointerId);
        this.getSheetElement()?.classList.remove('is-dragging');

        const heights = this.getSheetHeights();
        const dismissThreshold = this.getDismissThreshold();

        if (this.currentOffset >= dismissThreshold) {
            this.close();
            return;
        }

        if (this.isExpanded) {
            const collapseThreshold = Math.max(48, (heights.expanded - heights.collapsed) * 0.35);
            if (this.currentOffset > collapseThreshold) {
                this.snapToCollapsed();
            } else {
                this.snapToExpanded();
            }
            return;
        }

        this.snapToCollapsed();
    }

    updateExpandedState() {
        this.getSheetElement()?.classList.toggle('expanded', this.isExpanded);
    }

    getSheetElement() {
        return getElementById(DOM_IDS.HISTORY_SHEET);
    }

    toggleExpanded() {
        if (!this.isOpen) {
            return;
        }

        if (this.isExpanded) {
            this.snapToCollapsed();
        } else {
            this.snapToExpanded();
        }
    }

    setupEventListeners() {
        const clearBtn = getElementById(DOM_IDS.CLEAR_HISTORY_SESSIONS);
        const overlay = getElementById(DOM_IDS.HISTORY_SHEET_OVERLAY);

        if (clearBtn) {
            const label = clearBtn.querySelector('.history-clear-label');
            if (label) {
                label.textContent = UI_TEXT.BUTTONS.CLEAR_ALL;
            }
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.app?.clearAllSessions();
            });
        }

        const empty = getElementById(DOM_IDS.NO_HISTORY_MESSAGE);
        const emptyText = empty?.querySelector('p');
        if (emptyText) {
            emptyText.textContent = HISTORY_TEXT.EMPTY;
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                this.close();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                e.preventDefault();
                this.close();
            }
        });
    }

    open() {
        const sheet = this.getSheetElement();
        const overlay = getElementById(DOM_IDS.HISTORY_SHEET_OVERLAY);
        if (!sheet || !overlay) {
            return;
        }

        this.refresh();
        const { collapsed } = this.getSheetHeights();
        this.isExpanded = false;
        sheet.classList.remove('expanded');
        this.applySheetGeometry({ height: collapsed, translateY: collapsed, animate: false });
        sheet.classList.add(CSS_CLASSES.SHOW);
        overlay.classList.add(CSS_CLASSES.SHOW);
        sheet.setAttribute('aria-hidden', 'false');
        this.isOpen = true;
        this.updateTriggerState(true);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.snapToCollapsed();
            });
        });
    }

    close() {
        const sheet = this.getSheetElement();
        const overlay = getElementById(DOM_IDS.HISTORY_SHEET_OVERLAY);
        if (!sheet || !overlay) {
            return;
        }

        const finishClose = () => {
            sheet.classList.remove(CSS_CLASSES.SHOW, 'expanded', 'is-dragging');
            overlay.classList.remove(CSS_CLASSES.SHOW);
            sheet.setAttribute('aria-hidden', 'true');
            sheet.style.transform = '';
            sheet.style.height = '';
            sheet.style.maxHeight = '';
            this.isOpen = false;
            this.isExpanded = false;
            this.currentOffset = 0;
            this.sheetHeight = 0;
            this.updateTriggerState(false);
        };

        this.snapClosed();
        sheet.addEventListener('transitionend', finishClose, { once: true });
    }

    refresh() {
        this.sessions = Storage.loadSessionHistory();
        this.render();
    }

    formatDuration(seconds) {
        const totalSeconds = Math.max(0, seconds || 0);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        if (minutes > 0) {
            return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
        }
        return `${secs}s`;
    }

    formatDateShort(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        if (date.toDateString() === now.toDateString()) {
            return `Today, ${timeStr}`;
        }

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${timeStr}`;
        }

        const dateStr = date.toLocaleDateString([], {
            month: 'short',
            day: 'numeric'
        });
        return `${dateStr}, ${timeStr}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateTriggerState(isOpen) {
        const trigger = getElementById(DOM_IDS.VIEW_SESSION_HISTORY_BTN);
        if (trigger) {
            trigger.setAttribute('aria-expanded', String(isOpen));
        }
    }

    getSummaryText() {
        if (this.sessions.length === 0) {
            return HISTORY_TEXT.NO_SESSIONS_SUMMARY;
        }

        const workSessions = this.sessions.filter((session) => this.isWorkSession(session));
        const breakSessions = this.sessions.filter((session) => this.isBreakSession(session));
        const totalSeconds = this.sessions.reduce((sum, session) => sum + (session.durationSeconds || 0), 0);
        const parts = [];

        if (workSessions.length > 0) {
            parts.push(HISTORY_TEXT.FOCUS_COUNT(workSessions.length));
        }

        if (breakSessions.length > 0) {
            parts.push(HISTORY_TEXT.BREAK_COUNT(breakSessions.length));
        }

        if (parts.length === 0) {
            parts.push(HISTORY_TEXT.NO_SESSIONS_SUMMARY);
        }

        return `${parts.join(' · ')} · ${this.formatDuration(totalSeconds)}`;
    }

    isWorkSession(session) {
        return !session.type || session.type === SESSION_TYPES.WORK;
    }

    isBreakSession(session) {
        return session.type === SESSION_TYPES.SHORT_BREAK || session.type === SESSION_TYPES.LONG_BREAK;
    }

    getSessionTypeLabel(sessionType) {
        if (sessionType === SESSION_TYPES.SHORT_BREAK) {
            return HISTORY_TEXT.SHORT_BREAK;
        }
        if (sessionType === SESSION_TYPES.LONG_BREAK) {
            return HISTORY_TEXT.LONG_BREAK;
        }
        return HISTORY_TEXT.SHORT_BREAK;
    }

    renderGoals(goals) {
        if (!goals || goals.length === 0) {
            return '';
        }

        return goals.map((goal) => {
            const completedClass = goal.completed ? ' completed' : '';
            const mark = goal.completed ? '✓ ' : '';
            return `<span class="history-goal-chip${completedClass}">${mark}${this.escapeHtml(goal.text)}</span>`;
        }).join('');
    }

    render() {
        const list = getElementById(DOM_IDS.SESSION_HISTORY_LIST);
        const empty = getElementById(DOM_IDS.NO_HISTORY_MESSAGE);
        const clearBtn = getElementById(DOM_IDS.CLEAR_HISTORY_SESSIONS);
        const summary = getElementById(DOM_IDS.HISTORY_SUMMARY);
        const heading = document.querySelector('.history-heading');

        if (!list) {
            return;
        }

        if (heading) {
            heading.textContent = HISTORY_TEXT.TITLE;
        }

        if (summary) {
            summary.textContent = this.getSummaryText();
        }

        if (clearBtn) {
            clearBtn.hidden = this.sessions.length === 0;
        }

        if (this.sessions.length === 0) {
            list.innerHTML = '';
            if (empty) {
                empty.style.display = 'flex';
            }
            return;
        }

        if (empty) {
            empty.style.display = 'none';
        }

        list.innerHTML = this.sessions.map((session, index) => {
            const isWork = this.isWorkSession(session);
            const totalWorkSessions = this.sessions.filter((entry) => this.isWorkSession(entry)).length;
            const workSessionsBefore = this.sessions
                .slice(0, index + 1)
                .filter((entry) => this.isWorkSession(entry))
                .length;
            const sessionNumber = session.sessionNumber ?? (totalWorkSessions - workSessionsBefore + 1);
            const goalsMarkup = isWork ? this.renderGoals(session.goals) : '';
            const skippedBadge = session.source === 'skipped'
                ? `<span class="history-row-badge">${HISTORY_TEXT.SKIPPED}</span>`
                : '';
            const rowClass = isWork ? 'history-row' : `history-row is-break is-${session.type}`;
            const leadingLabel = isWork
                ? `<span class="history-row-session">#${sessionNumber}</span>`
                : `<span class="history-row-type">${this.getSessionTypeLabel(session.type)}</span>`;

            return `
            <article class="${rowClass}">
                <div class="history-row-main">
                    <div class="history-row-leading">
                        ${leadingLabel}
                        <span class="history-row-duration">${this.formatDuration(session.durationSeconds)}</span>
                    </div>
                    <div class="history-row-trailing">
                        ${skippedBadge}
                        <span class="history-row-date">${this.formatDateShort(session.completedAt)}</span>
                    </div>
                </div>
                ${goalsMarkup ? `<div class="history-row-goals">${goalsMarkup}</div>` : ''}
            </article>
        `;
        }).join('');
    }
}
