import { Storage } from '../../utils/storage.js';
import { DOM_IDS, getElementById } from '../../utils/domConstants.js';

export class StatsDisplay {
    constructor() {
        this.stats = {
            completedSessions: 0,
            totalTimeSpent: 0,
            sessionCount: 0
        };
    }

    initialize(stats = {}) {
        this.stats = {
            completedSessions: stats.completedSessions || 0,
            totalTimeSpent: stats.totalTimeSpent || 0
        };
        this.updateDisplay();
    }

    updateStats(stats) {
        this.stats = { ...this.stats, ...stats };
        this.saveToStorage();
        this.updateDisplay();
    }

    updateDisplay() {
        this.updateCompletedSessions();
        this.updateTotalTime();
    }

    updateCompletedSessions() {
        const completedSessionsElement = getElementById(DOM_IDS.COMPLETED_SESSIONS);
        if (completedSessionsElement) {
            completedSessionsElement.textContent = this.stats.completedSessions;
        }
    }

    updateTotalTime() {
        const totalTimeElement = getElementById(DOM_IDS.TOTAL_TIME);
        if (totalTimeElement) {
            const hours = Math.floor(this.stats.totalTimeSpent / 3600);
            const minutes = Math.floor((this.stats.totalTimeSpent % 3600) / 60);
            totalTimeElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
    }

    formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Individual stat updates
    incrementCompletedSessions() {
        this.stats.completedSessions++;
        this.saveToStorage();
        this.updateCompletedSessions();
    }

    addTimeSpent(seconds) {
        this.stats.totalTimeSpent += seconds;
        this.saveToStorage();
        this.updateTotalTime();
    }

    incrementSessionCount() {
        this.stats.sessionCount++;
        this.saveToStorage();
    }

    // Bulk operations
    clearStats() {
        this.stats = {
            completedSessions: 0,
            totalTimeSpent: 0,
            sessionCount: 0
        };
        this.saveToStorage();
        this.updateDisplay();
    }

    // Getters
    getStats() {
        return { ...this.stats };
    }

    getCompletedSessions() {
        return this.stats.completedSessions;
    }

    getTotalTimeSpent() {
        return this.stats.totalTimeSpent;
    }

    getSessionCount() {
        return this.stats.sessionCount;
    }

    // Advanced stats
    getAverageSessionTime() {
        if (this.stats.completedSessions === 0) return 0;
        return Math.round(this.stats.totalTimeSpent / this.stats.completedSessions);
    }

    getFormattedAverageSessionTime() {
        const avgSeconds = this.getAverageSessionTime();
        return this.formatTime(avgSeconds);
    }

    getProductivityScore() {
        // Simple productivity score based on completed sessions
        const completedSessions = this.stats.completedSessions;
        if (completedSessions === 0) return 0;
        if (completedSessions < 5) return 'Getting Started';
        if (completedSessions < 15) return 'Building Momentum';
        if (completedSessions < 30) return 'Focused';
        if (completedSessions < 50) return 'Productive';
        return 'Pomodoro Master';
    }

    // Storage operations
    saveToStorage() {
        Storage.saveStats(this.stats);
    }

    loadFromStorage() {
        this.stats = Storage.loadStats();
        this.updateDisplay();
    }

    // Export/Import
    exportStats() {
        return {
            stats: this.stats,
            exportDate: new Date().toISOString(),
            averageSessionTime: this.getAverageSessionTime(),
            productivityScore: this.getProductivityScore()
        };
    }

    importStats(statsData) {
        if (statsData && statsData.stats) {
            this.stats = { ...this.stats, ...statsData.stats };
            this.saveToStorage();
            this.updateDisplay();
            return true;
        }
        return false;
    }

    // Display helpers for extended stats views
    renderExtendedStats(container) {
        if (!container) return;

        const extendedHTML = `
            <div class="extended-stats">
                <div class="stat-row">
                    <span class="stat-label">Completed Sessions:</span>
                    <span class="stat-value">${this.stats.completedSessions}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Total Time:</span>
                    <span class="stat-value">${this.formatTime(this.stats.totalTimeSpent)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Average Session:</span>
                    <span class="stat-value">${this.getFormattedAverageSessionTime()}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Productivity Level:</span>
                    <span class="stat-value">${this.getProductivityScore()}</span>
                </div>
            </div>
        `;

        container.innerHTML = extendedHTML;
    }

    destroy() {
        // Cleanup if needed
        this.stats = {
            completedSessions: 0,
            totalTimeSpent: 0,
            sessionCount: 0
        };
    }
} 