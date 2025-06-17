const { ipcRenderer } = require('electron');

class PomodoroTimer {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentTime = 0;
        this.totalTime = 0;
        this.sessionCount = 0;
        this.completedSessions = 0;
        this.totalTimeSpent = 0;
        this.currentSessionType = 'work'; // 'work', 'shortBreak', 'longBreak'
        this.timerInterval = null;
        this.goals = [];
        this.currentTheme = 'neon';

        // Settings
        this.workDuration = 25;
        this.shortBreakDuration = 5;
        this.longBreakDuration = 15;
        this.autoBreak = false;
        this.autoWork = false;
        this.breakType = 'normal'; // 'normal', 'short', 'long'

        // Hotkeys
        this.hotkeys = {
            startPause: 'Space',
            reset: 'KeyR',
            settings: 'Comma',
            addGoal: 'KeyG'
        };
        this.isRecordingHotkey = null;

        this.initializeElements();
        this.setupEventListeners();
        this.updateDisplay();
        this.updateProgressRing();
        this.loadStats();
        this.loadGoals();
        this.loadTheme();
        this.loadSettings();
        this.setupGoalEventListeners();
        this.setupThemeEventListener();
        this.setupHotkeyListeners();
        this.setupTabListeners();

        // Ensure progress ring is properly initialized after everything is loaded
        this.initializeProgressRing();

        // Hide loading screen after initialization
        this.hideLoadingScreen();
    }

    initializeElements() {
        this.timeDisplay = document.getElementById('timeDisplay');
        this.sessionType = document.getElementById('sessionType');
        this.sessionNumber = document.getElementById('sessionNumber');
        this.startPauseBtn = document.getElementById('startPauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.progressCircle = document.getElementById('progressCircle');
        this.timerCircle = document.querySelector('.timer-circle');

        // Settings modal elements
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettingsBtn = document.getElementById('closeSettings');
        this.saveSettingsBtn = document.getElementById('saveSettings');
        this.resetSettingsBtn = document.getElementById('restoreDefaults');
        this.clearSessionsBtn = document.getElementById('clearAllSessions');

        // Settings inputs (modal)
        this.modalThemeSelector = document.getElementById('themeSelector');
        this.modalWorkDurationInput = document.getElementById('workDurationInput');
        this.modalShortBreakDurationInput = document.getElementById('shortBreakDurationInput');
        this.modalLongBreakDurationInput = document.getElementById('longBreakDurationInput');
        this.autoBreakToggle = document.getElementById('autoStartBreaks');
        this.autoWorkToggle = document.getElementById('autoStartWork');
        this.breakTypeRadios = document.querySelectorAll('input[name="breakType"]');

        // Hotkey elements
        this.hotkeyStartPause = document.getElementById('hotkeyStartPause');
        this.hotkeyReset = document.getElementById('hotkeyReset');
        this.hotkeySettings = document.getElementById('hotkeySettings');
        this.hotkeyAddGoal = document.getElementById('hotkeyAddGoal');

        // Tab elements
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabContents = document.querySelectorAll('.tab-content');

        // Stats
        this.completedSessionsDisplay = document.getElementById('completedSessions');
        this.totalTimeDisplay = document.getElementById('totalTime');

        // Goals
        this.addGoalBtn = document.getElementById('addGoalBtn');
        this.goalsList = document.getElementById('goalsList');
        this.noGoalsMessage = document.getElementById('noGoalsMessage');
        this.addGoalForm = document.getElementById('addGoalForm');
        this.goalInput = document.getElementById('goalInput');
        this.saveGoalBtn = document.getElementById('saveGoalBtn');
        this.cancelGoalBtn = document.getElementById('cancelGoalBtn');

        // Set up progress ring (initial setup)
        if (this.progressCircle && this.progressCircle.r && this.progressCircle.r.baseVal) {
            const radius = this.progressCircle.r.baseVal.value;
            this.circumference = 2 * Math.PI * radius;
            this.progressCircle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
            this.progressCircle.style.strokeDashoffset = this.circumference;
        } else {
            console.warn('Progress circle not ready during initial setup');
        }
    }

    setupEventListeners() {
        this.startPauseBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());

        // Settings modal listeners
        this.settingsBtn.addEventListener('click', () => this.openSettingsModal());
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettingsFromModal());
        this.resetSettingsBtn.addEventListener('click', () => this.resetSettingsToDefaults());
        this.clearSessionsBtn.addEventListener('click', () => this.showClearSessionsConfirmation());

        // Close modal when clicking outside
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettingsModal();
            }
        });

        // Close modal when pressing Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.settingsModal.classList.contains('show')) {
                this.closeSettingsModal();
            }
        });
    }

    toggleTimer() {
        if (this.isRunning && !this.isPaused) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        if (!this.isRunning && !this.isPaused) {
            // Starting fresh
            this.setTimerForCurrentSession();
        }

        this.isRunning = true;
        this.isPaused = false;
        this.startPauseBtn.innerHTML = '<span class="btn-text">Pause</span>';
        this.timerCircle.classList.add('active');

        this.timerInterval = setInterval(() => {
            this.currentTime--;
            this.updateDisplay();
            this.updateProgressRing();
            this.updateTrayTitle();

            if (this.currentTime <= 0) {
                this.completeSession();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isRunning = false;
        this.isPaused = true;
        this.startPauseBtn.innerHTML = '<span class="btn-text">Resume</span>';
        this.timerCircle.classList.remove('active');
        clearInterval(this.timerInterval);
        this.updateTrayTitle();
    }

    resetTimer() {
        this.isRunning = false;
        this.isPaused = false;
        this.startPauseBtn.innerHTML = '<span class="btn-text">Start</span>';
        this.timerCircle.classList.remove('active');
        clearInterval(this.timerInterval);

        this.setTimerForCurrentSession();
        this.updateDisplay();
        this.updateProgressRing();
        this.updateTrayTitle();
    }

    setTimerForCurrentSession() {
        switch (this.currentSessionType) {
            case 'work':
                this.currentTime = this.workDuration * 60;
                this.totalTime = this.workDuration * 60;
                break;
            case 'shortBreak':
                this.currentTime = this.shortBreakDuration * 60;
                this.totalTime = this.shortBreakDuration * 60;
                break;
            case 'longBreak':
                this.currentTime = this.longBreakDuration * 60;
                this.totalTime = this.longBreakDuration * 60;
                break;
        }
    }

    completeSession() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timerInterval);
        this.timerCircle.classList.remove('active');

        // Add to total time spent
        this.totalTimeSpent += this.totalTime;

        if (this.currentSessionType === 'work') {
            this.completedSessions++;
            this.sessionCount++;

            // Determine next session type based on break type preference
            if (this.breakType === 'short') {
                this.currentSessionType = 'shortBreak';
            } else if (this.breakType === 'long') {
                this.currentSessionType = 'longBreak';
            } else {
                // Normal cycle
                if (this.sessionCount % 4 === 0) {
                    this.currentSessionType = 'longBreak';
                } else {
                    this.currentSessionType = 'shortBreak';
                }
            }

            const breakType = this.currentSessionType === 'longBreak' ? 'long break' : 'short break';
            this.showNotification('Work Session Complete!', `Time for a ${breakType}! ${this.currentSessionType === 'longBreak' ? '🌟' : '☕'}`);
            this.playNotificationSound();
        } else {
            this.currentSessionType = 'work';
            if (this.currentSessionType === 'longBreak') {
                this.showNotification('Long Break Complete!', 'Ready to start fresh! 🚀');
                this.playNotificationSound();
            } else {
                this.showNotification('Break Complete!', 'Time to focus! 🎯');
                this.playNotificationSound();
            }
        }

        this.updateSessionDisplay();
        this.resetTimer();
        this.saveStats();
        this.saveSettings();
        this.updateTrayTitle();

        // Auto-start next session if enabled
        if ((this.currentSessionType !== 'work' && this.autoBreak) ||
            (this.currentSessionType === 'work' && this.autoWork)) {
            setTimeout(() => {
                this.startTimer();
            }, 2000); // 2 second delay before auto-start
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateProgressRing() {
        if (this.totalTime === 0) return;

        const progress = (this.totalTime - this.currentTime) / this.totalTime;
        const offset = this.circumference - (progress * this.circumference);
        this.progressCircle.style.strokeDashoffset = offset;

        // Update colors based on session type and current theme
        let color = getComputedStyle(document.documentElement).getPropertyValue('--progress-work').trim();
        if (this.currentSessionType === 'shortBreak') {
            color = getComputedStyle(document.documentElement).getPropertyValue('--progress-short-break').trim();
        } else if (this.currentSessionType === 'longBreak') {
            color = getComputedStyle(document.documentElement).getPropertyValue('--progress-long-break').trim();
        }
        this.progressCircle.setAttribute('stroke', color);
    }

    updateSessionDisplay() {
        let sessionTypeText = '';
        switch (this.currentSessionType) {
            case 'work':
                sessionTypeText = 'Focus Time';
                break;
            case 'shortBreak':
                sessionTypeText = 'Short Break';
                break;
            case 'longBreak':
                sessionTypeText = 'Long Break';
                break;
        }

        this.sessionType.textContent = sessionTypeText;
        this.sessionNumber.textContent = Math.floor(this.sessionCount / 4) * 4 + Math.min(this.sessionCount % 4 + 1, 4);
        this.completedSessionsDisplay.textContent = this.completedSessions;

        const hours = Math.floor(this.totalTimeSpent / 3600);
        const minutes = Math.floor((this.totalTimeSpent % 3600) / 60);
        this.totalTimeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    async showNotification(title, body) {
        try {
            await ipcRenderer.invoke('show-notification', title, body);
        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }

    async updateTrayTitle() {
        let title = '';
        if (this.isRunning) {
            const minutes = Math.floor(this.currentTime / 60);
            const seconds = this.currentTime % 60;
            title = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else if (this.isPaused) {
            title = '⏸';
        } else {
            title = '';
        }

        try {
            await ipcRenderer.invoke('update-tray-title', title);
        } catch (error) {
            console.error('Failed to update tray title:', error);
        }
    }

    saveStats() {
        const stats = {
            completedSessions: this.completedSessions,
            totalTimeSpent: this.totalTimeSpent,
            sessionCount: this.sessionCount
        };
        localStorage.setItem('pomodoroStats', JSON.stringify(stats));
    }

    loadStats() {
        const savedStats = localStorage.getItem('pomodoroStats');
        if (savedStats) {
            const stats = JSON.parse(savedStats);
            this.completedSessions = stats.completedSessions || 0;
            this.totalTimeSpent = stats.totalTimeSpent || 0;
            this.sessionCount = stats.sessionCount || 0;
        }
        this.updateSessionDisplay();
    }

    setupGoalEventListeners() {
        this.addGoalBtn.addEventListener('click', () => this.showAddGoalForm());
        this.saveGoalBtn.addEventListener('click', () => this.saveGoal());
        this.cancelGoalBtn.addEventListener('click', () => this.hideAddGoalForm());

        this.goalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveGoal();
            } else if (e.key === 'Escape') {
                this.hideAddGoalForm();
            }
        });
    }

    showAddGoalForm() {
        this.addGoalForm.style.display = 'block';
        this.goalInput.focus();
        this.addGoalBtn.style.display = 'none';
    }

    hideAddGoalForm() {
        this.addGoalForm.style.display = 'none';
        this.goalInput.value = '';
        this.addGoalBtn.style.display = 'block';
    }

    saveGoal() {
        const goalText = this.goalInput.value.trim();
        if (goalText) {
            const goal = {
                id: Date.now(),
                text: goalText,
                completed: false
            };
            this.goals.push(goal);
            this.saveGoals();
            this.renderGoals();
            this.hideAddGoalForm();
        }
    }

    toggleGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            goal.completed = !goal.completed;
            this.saveGoals();
            this.renderGoals();
        }
    }

    deleteGoal(goalId) {
        this.goals = this.goals.filter(g => g.id !== goalId);
        this.saveGoals();
        this.renderGoals();
    }

    renderGoals() {
        const hasGoals = this.goals.length > 0;

        if (hasGoals) {
            this.noGoalsMessage.style.display = 'none';
            this.goalsList.innerHTML = this.goals.map(goal => `
                <div class="goal-item ${goal.completed ? 'completed' : ''}" data-goal-id="${goal.id}">
                    <div class="goal-checkbox ${goal.completed ? 'completed' : ''}" 
                         onclick="pomodoroTimer.toggleGoal(${goal.id})">
                    </div>
                    <div class="goal-text">${this.escapeHtml(goal.text)}</div>
                    <button class="goal-delete" onclick="pomodoroTimer.deleteGoal(${goal.id})"
                            title="Delete goal">×</button>
                </div>
            `).join('');
        } else {
            this.noGoalsMessage.style.display = 'flex';
            this.goalsList.innerHTML = '';
            this.goalsList.appendChild(this.noGoalsMessage);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveGoals() {
        localStorage.setItem('pomodoroGoals', JSON.stringify(this.goals));
    }

    loadGoals() {
        const savedGoals = localStorage.getItem('pomodoroGoals');
        if (savedGoals) {
            this.goals = JSON.parse(savedGoals);
        }
        this.renderGoals();
    }

    setupThemeEventListener() {
        // Theme is now handled through the settings modal
    }

    changeTheme(themeName) {
        this.currentTheme = themeName;
        document.documentElement.setAttribute('data-theme', themeName);
        this.saveTheme();
        this.saveSettings();
        this.updateProgressRingColors();
    }

    updateProgressRingColors() {
        // Update progress ring colors based on session type and theme
        let color = getComputedStyle(document.documentElement).getPropertyValue('--progress-work').trim();
        if (this.currentSessionType === 'shortBreak') {
            color = getComputedStyle(document.documentElement).getPropertyValue('--progress-short-break').trim();
        } else if (this.currentSessionType === 'longBreak') {
            color = getComputedStyle(document.documentElement).getPropertyValue('--progress-long-break').trim();
        }
        this.progressCircle.setAttribute('stroke', color);

        // Update progress ring glow effect
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
        this.progressCircle.parentElement.style.filter = `drop-shadow(0 0 20px ${primaryColor}30)`;
    }

    saveTheme() {
        localStorage.setItem('pomodoroTheme', this.currentTheme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('pomodoroTheme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
            // Set default theme
            this.currentTheme = 'neon';
            document.documentElement.setAttribute('data-theme', 'neon');
        }

        // Update progress ring colors after theme is loaded
        setTimeout(() => {
            this.updateProgressRingColors();
        }, 100);
    }

    initializeProgressRing() {
        // Wait for CSS to be fully loaded and applied
        setTimeout(() => {
            // Re-initialize progress ring properties
            const radius = this.progressCircle.r.baseVal.value;
            this.circumference = 2 * Math.PI * radius;
            this.progressCircle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
            this.progressCircle.style.strokeDashoffset = this.circumference;

            // Update display and progress ring
            this.updateDisplay();
            this.updateProgressRing();
            this.updateProgressRingColors();

            console.log('Progress ring initialized:', {
                radius,
                circumference: this.circumference,
                currentTime: this.currentTime,
                totalTime: this.totalTime
            });
        }, 200);
    }

    hideLoadingScreen() {
        // Wait a bit to ensure everything is rendered properly
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('fade-out');
                // Remove from DOM after fade animation
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 800); // Show loading for at least 800ms
    }

    saveSettings() {
        const settings = {
            workDuration: this.workDuration,
            shortBreakDuration: this.shortBreakDuration,
            longBreakDuration: this.longBreakDuration,
            theme: this.currentTheme,
            autoBreak: this.autoBreak,
            autoWork: this.autoWork,
            breakType: this.breakType,
            hotkeys: this.hotkeys
        };
        localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('pomodoroSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);

            // Load timer durations
            if (settings.workDuration) {
                this.workDuration = settings.workDuration;
            }
            if (settings.shortBreakDuration) {
                this.shortBreakDuration = settings.shortBreakDuration;
            }
            if (settings.longBreakDuration) {
                this.longBreakDuration = settings.longBreakDuration;
            }

            // Load auto-break settings
            if (settings.autoBreak !== undefined) {
                this.autoBreak = settings.autoBreak;
            }
            if (settings.autoWork !== undefined) {
                this.autoWork = settings.autoWork;
            }
            if (settings.breakType) {
                this.breakType = settings.breakType;
            }

            // Load hotkeys
            if (settings.hotkeys) {
                this.hotkeys = { ...this.hotkeys, ...settings.hotkeys };
                this.updateHotkeyInputs();
            }

            // Update timer display if not running
            if (!this.isRunning && !this.isPaused) {
                this.setTimerForCurrentSession();
                this.updateDisplay();
                this.updateProgressRing();
            }
        }
    }

    playNotificationSound() {
        // Create and play a notification sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Create a pleasant notification sound (two-tone chime)
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    showClearSessionsConfirmation() {
        const confirmed = confirm(
            'Are you sure you want to clear all session data?\n\n' +
            'This will reset:\n' +
            '• Completed sessions count\n' +
            '• Total time spent\n' +
            '• Session counter\n\n' +
            'This action cannot be undone.'
        );

        if (confirmed) {
            this.clearAllSessions();
        }
    }

    clearAllSessions() {
        // Reset all session data
        this.completedSessions = 0;
        this.totalTimeSpent = 0;
        this.sessionCount = 0;
        this.currentSessionType = 'work';

        // Reset timer if running
        if (this.isRunning || this.isPaused) {
            this.resetTimer();
        }

        // Update displays
        this.updateSessionDisplay();
        this.updateDisplay();
        this.updateProgressRing();

        // Save the cleared state
        this.saveStats();
        this.saveSettings();

        // Show confirmation
        this.showNotification('Sessions Cleared', 'All session data has been reset. Ready for a fresh start! 🌟');

        // Close settings modal if it's open
        this.closeSettingsModal();
    }

    openSettingsModal() {
        // Load current settings into modal
        this.modalThemeSelector.value = this.currentTheme;
        this.modalWorkDurationInput.value = this.workDuration;
        this.modalShortBreakDurationInput.value = this.shortBreakDuration;
        this.modalLongBreakDurationInput.value = this.longBreakDuration;
        this.autoBreakToggle.checked = this.autoBreak;
        this.autoWorkToggle.checked = this.autoWork;

        // Set radio button based on break type
        const breakTypeValue = this.breakType === 'normal' ? 'alternate' : this.breakType;
        this.breakTypeRadios.forEach(radio => {
            radio.checked = radio.value === breakTypeValue;
        });

        // Load hotkey values
        this.updateHotkeyInputs();

        this.settingsModal.classList.add('show');
    }

    closeSettingsModal() {
        this.settingsModal.classList.remove('show');
    }

    saveSettingsFromModal() {
        // Get values from modal
        const newTheme = this.modalThemeSelector.value;
        const newWorkDuration = parseInt(this.modalWorkDurationInput.value);
        const newShortBreakDuration = parseInt(this.modalShortBreakDurationInput.value);
        const newLongBreakDuration = parseInt(this.modalLongBreakDurationInput.value);
        const newAutoBreak = this.autoBreakToggle.checked;
        const newAutoWork = this.autoWorkToggle.checked;

        // Get selected radio button value
        let newBreakType = 'normal';
        this.breakTypeRadios.forEach(radio => {
            if (radio.checked) {
                newBreakType = radio.value === 'alternate' ? 'normal' : radio.value;
            }
        });

        // Apply settings
        if (newTheme !== this.currentTheme) {
            this.changeTheme(newTheme);
        }

        this.workDuration = newWorkDuration;
        this.shortBreakDuration = newShortBreakDuration;
        this.longBreakDuration = newLongBreakDuration;
        this.autoBreak = newAutoBreak;
        this.autoWork = newAutoWork;
        this.breakType = newBreakType;

        // Reset timer if not running and duration changed
        if (!this.isRunning && !this.isPaused) {
            this.resetTimer();
        }

        this.saveSettings();
        this.closeSettingsModal();
        this.showNotification('Settings Saved', 'Your preferences have been updated! ⚙️');
    }

    resetSettingsToDefaults() {
        const confirmed = confirm(
            'Reset all settings to default values?\n\n' +
            'This will reset:\n' +
            '• Theme to Neon Vibes\n' +
            '• Work duration to 25 minutes\n' +
            '• Short break to 5 minutes\n' +
            '• Long break to 15 minutes\n' +
            '• Auto-break settings to off\n\n' +
            'This action cannot be undone.'
        );

        if (confirmed) {
            // Reset to defaults
            this.currentTheme = 'neon';
            this.workDuration = 25;
            this.shortBreakDuration = 5;
            this.longBreakDuration = 15;
            this.autoBreak = false;
            this.autoWork = false;
            this.breakType = 'normal';

            // Update modal inputs
            this.modalThemeSelector.value = this.currentTheme;
            this.modalWorkDurationInput.value = this.workDuration;
            this.modalShortBreakDurationInput.value = this.shortBreakDuration;
            this.modalLongBreakDurationInput.value = this.longBreakDuration;
            this.autoBreakToggle.checked = this.autoBreak;
            this.autoWorkToggle.checked = this.autoWork;

            // Update radio buttons
            const breakTypeValue = this.breakType === 'normal' ? 'alternate' : this.breakType;
            this.breakTypeRadios.forEach(radio => {
                radio.checked = radio.value === breakTypeValue;
            });

            // Apply theme
            this.changeTheme(this.currentTheme);

            // Reset timer if not running
            if (!this.isRunning && !this.isPaused) {
                this.resetTimer();
            }

            this.saveSettings();
            this.showNotification('Settings Reset', 'All settings have been reset to defaults! 🔄');
        }
    }

    setupHotkeyListeners() {
        // Global hotkey listener
        document.addEventListener('keydown', (e) => {
            // Don't trigger hotkeys when typing in inputs or if modal is open
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' ||
                this.settingsModal.classList.contains('show')) {
                return;
            }

            const key = this.getKeyString(e);

            // Check if this key combination matches any hotkey
            if (key === this.hotkeys.startPause) {
                e.preventDefault();
                this.toggleTimer();
            } else if (key === this.hotkeys.reset) {
                e.preventDefault();
                this.resetTimer();
            } else if (key === this.hotkeys.settings) {
                e.preventDefault();
                this.openSettingsModal();
            } else if (key === this.hotkeys.addGoal) {
                e.preventDefault();
                this.showAddGoalForm();
            }
        });

        // Hotkey input listeners
        this.hotkeyStartPause.addEventListener('click', () => this.recordHotkey('startPause'));
        this.hotkeyReset.addEventListener('click', () => this.recordHotkey('reset'));
        this.hotkeySettings.addEventListener('click', () => this.recordHotkey('settings'));
        this.hotkeyAddGoal.addEventListener('click', () => this.recordHotkey('addGoal'));

        // Clear hotkey buttons
        document.getElementById('clearStartPause').addEventListener('click', () => this.clearHotkey('startPause'));
        document.getElementById('clearReset').addEventListener('click', () => this.clearHotkey('reset'));
        document.getElementById('clearSettings').addEventListener('click', () => this.clearHotkey('settings'));
        document.getElementById('clearAddGoal').addEventListener('click', () => this.clearHotkey('addGoal'));

        // Load hotkeys into inputs
        this.updateHotkeyInputs();
    }

    setupTabListeners() {
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Remove active class from all tabs and buttons
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to selected tab and button
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    getKeyString(event) {
        const modifiers = [];
        if (event.ctrlKey) modifiers.push('Ctrl');
        if (event.altKey) modifiers.push('Alt');
        if (event.shiftKey) modifiers.push('Shift');
        if (event.metaKey) modifiers.push('Cmd');

        let key = event.code;

        // Convert common keys to readable format
        const keyMap = {
            'Space': 'Space',
            'Enter': 'Enter',
            'Escape': 'Esc',
            'Backspace': 'Backspace',
            'Tab': 'Tab',
            'ArrowUp': '↑',
            'ArrowDown': '↓',
            'ArrowLeft': '←',
            'ArrowRight': '→'
        };

        if (keyMap[key]) {
            key = keyMap[key];
        } else if (key.startsWith('Key')) {
            key = key.replace('Key', '');
        } else if (key.startsWith('Digit')) {
            key = key.replace('Digit', '');
        }

        return modifiers.length > 0 ? `${modifiers.join('+')}+${key}` : key;
    }

    recordHotkey(action) {
        const input = this[`hotkey${action.charAt(0).toUpperCase() + action.slice(1)}`];

        this.isRecordingHotkey = action;
        input.classList.add('recording');
        input.value = 'Press any key combination...';
        input.focus();

        const recordKeydown = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const keyString = this.getKeyString(e);
            this.hotkeys[action] = keyString;
            input.value = keyString;
            input.classList.remove('recording');

            this.isRecordingHotkey = null;
            this.saveSettings();

            document.removeEventListener('keydown', recordKeydown, true);
        };

        document.addEventListener('keydown', recordKeydown, true);
    }

    clearHotkey(action) {
        this.hotkeys[action] = '';
        this[`hotkey${action.charAt(0).toUpperCase() + action.slice(1)}`].value = '';
        this.saveSettings();
    }

    updateHotkeyInputs() {
        this.hotkeyStartPause.value = this.hotkeys.startPause || '';
        this.hotkeyReset.value = this.hotkeys.reset || '';
        this.hotkeySettings.value = this.hotkeys.settings || '';
        this.hotkeyAddGoal.value = this.hotkeys.addGoal || '';
    }
}

// Initialize the timer when the page loads
let pomodoroTimer;
document.addEventListener('DOMContentLoaded', () => {
    pomodoroTimer = new PomodoroTimer();
});

// Handle window focus/blur for better UX
window.addEventListener('focus', () => {
    document.body.style.opacity = '1';
    // Ensure progress ring is properly displayed when window gains focus
    if (pomodoroTimer) {
        setTimeout(() => {
            pomodoroTimer.updateProgressRing();
            pomodoroTimer.updateProgressRingColors();
        }, 50);
    }

    // Hide loading screen if still visible (backup)
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen && loadingScreen.style.display !== 'none') {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
});

window.addEventListener('blur', () => {
    document.body.style.opacity = '0.9';
});

// Handle document visibility changes (when app is shown/hidden)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && pomodoroTimer) {
        // App became visible, ensure progress ring is properly rendered
        setTimeout(() => {
            pomodoroTimer.updateProgressRing();
            pomodoroTimer.updateProgressRingColors();
            console.log('Progress ring refreshed due to visibility change');
        }, 100);
    }
}); 