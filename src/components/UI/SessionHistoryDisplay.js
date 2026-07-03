import { Storage } from '../../utils/storage.js';
import { SESSION_TYPES } from '../../utils/constants.js';
import { DOM_IDS, getElementById } from '../../utils/domConstants.js';
import { UI_TEXT } from '../../utils/strings.js';

export class SessionHistoryDisplay {
    constructor(app) {
        this.app = app;
        this.sessions = [];
    }

    initialize() {
        this.sessions = Storage.loadSessionHistory();
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        const clearBtn = getElementById(DOM_IDS.CLEAR_HISTORY_SESSIONS);
        if (clearBtn) {
            clearBtn.textContent = UI_TEXT.BUTTONS.CLEAR_ALL_SESSIONS;
            clearBtn.addEventListener('click', () => {
                this.app?.clearAllSessions();
            });
        }
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

    formatDate(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        if (date.toDateString() === now.toDateString()) {
            return `Today at ${timeStr}`;
        }

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday at ${timeStr}`;
        }

        const dateStr = date.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        return `${dateStr} at ${timeStr}`;
    }

    formatSessionType(type) {
        switch (type) {
            case SESSION_TYPES.WORK:
                return 'Focus Session';
            case SESSION_TYPES.SHORT_BREAK:
                return 'Short Break';
            case SESSION_TYPES.LONG_BREAK:
                return 'Long Break';
            default:
                return 'Session';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    renderGoals(goals) {
        if (!goals || goals.length === 0) {
            return '<span class="history-no-goals">No goals set</span>';
        }

        const items = goals.map((goal) => {
            const completedClass = goal.completed ? ' completed' : '';
            return `<li class="history-goal-item${completedClass}">${this.escapeHtml(goal.text)}</li>`;
        }).join('');

        return `<ul class="history-goals-list">${items}</ul>`;
    }

    render() {
        const list = getElementById(DOM_IDS.SESSION_HISTORY_LIST);
        const empty = getElementById(DOM_IDS.NO_HISTORY_MESSAGE);
        const clearBtn = getElementById(DOM_IDS.CLEAR_HISTORY_SESSIONS);
        if (!list) {
            return;
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
            const sessionNumber = session.sessionNumber ?? (this.sessions.length - index);
            return `
            <article class="history-card">
                <div class="history-card-header">
                    <span class="history-type">${this.formatSessionType(session.type)}</span>
                    <div class="history-card-badges">
                        <span class="history-badge history-badge-session">Session #${sessionNumber}</span>
                        ${session.source === 'skipped' ? '<span class="history-badge history-badge-skipped">Skipped</span>' : ''}
                    </div>
                </div>
                <div class="history-meta">
                    <span class="history-date">${this.formatDate(session.completedAt)}</span>
                    <span class="history-duration">${this.formatDuration(session.durationSeconds)}</span>
                </div>
                <div class="history-goals">
                    <span class="history-goals-label">Goals</span>
                    ${this.renderGoals(session.goals)}
                </div>
            </article>
        `;
        }).join('');
    }
}
