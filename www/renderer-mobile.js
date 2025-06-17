class PomodoroTimer {
    constructor() {
        // Timer state
        this.workDuration = 25; // minutes
        this.shortBreakDuration = 5; // minutes
        this.longBreakDuration = 15; // minutes
        this.currentTime = this.workDuration * 60; // seconds
        this.totalTime = this.workDuration * 60; // seconds
        this.isRunning = false;
        this.isPaused = false;
        this.currentSessionType = 'work'; // 'work', 'shortBreak', 'longBreak'
        this.sessionCount = 0;
        this.completedSessions = 0;
        this.totalTimeSpent = 0;
        this.timerInterval = null;
        this.breakType = 'normal'; // 'normal', 'short', 'long'
        this.autoBreak = false;
        this.autoWork = false;

        // Theme
        this.currentTheme = 'neon';

        // Goals
        this.goals = [];
        this.goalIdCounter = 1;

        // Hotkeys
        this.hotkeys = {
            startPause: 'Space',
            reset: 'R',
            settings: 'Comma',
            addGoal: 'G'
        };
        this.isRecordingHotkey = false;

        // Progress ring
        this.circumference = 0;

        this.initializeElements();
        this.setupEventListeners();
        this.setupGoalEventListeners();
        this.setupThemeEventListener();
        this.setupHotkeyListeners();
        this.setupTabListeners();
        this.loadSettings();
        this.loadStats();
        this.loadGoals();
        this.loadTheme();
        this.updateDisplay();
        this.updateSessionDisplay();
        this.renderGoals();
        this.initializeProgressRing();

        // Hide loading screen after a brief delay to show the loading animation
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 1500); // Show loading screen for 1.5 seconds
    }

    initializeElements() {
        // Timer elements
        this.timeDisplay = document.getElementById('timeDisplay');
        this.sessionType = document.getElementById('sessionType');
        this.sessionNumber = document.getElementById('sessionNumber');
        this.startPauseBtn = document.getElementById('startPauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.skipBtn = document.getElementById('skipBtn');
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
        this.resetBtn.addEventListener('click', () => this.resetPomodoroSession());
        this.skipBtn.addEventListener('click', () => this.skipToNext());

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

        // Auto-start toggle listeners
        if (this.autoBreakToggle) {
            this.autoBreakToggle.addEventListener('change', () => {
                this.autoBreak = this.autoBreakToggle.checked;
                this.saveSettings();
            });
        }

        if (this.autoWorkToggle) {
            this.autoWorkToggle.addEventListener('change', () => {
                this.autoWork = this.autoWorkToggle.checked;
                this.saveSettings();
            });
        }
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
    }

    resetPomodoroSession() {
        // Reset the entire pomodoro session
        this.isRunning = false;
        this.isPaused = false;
        this.startPauseBtn.innerHTML = '<span class="btn-text">Start</span>';
        this.timerCircle.classList.remove('active');
        clearInterval(this.timerInterval);

        // Reset session data
        this.sessionCount = 0;
        this.currentSessionType = 'work';

        this.setTimerForCurrentSession();
        this.updateDisplay();
        this.updateProgressRing();
        this.updateSessionDisplay();

        this.showNotification('Session Reset', 'Pomodoro session has been reset to the beginning! 🔄');
    }

    skipToNext() {
        // Stop current timer
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timerInterval);
        this.timerCircle.classList.remove('active');
        this.startPauseBtn.innerHTML = '<span class="btn-text">Start</span>';

        // Determine next session type
        let nextSessionType = '';
        let notificationTitle = '';
        let notificationMessage = '';

        if (this.currentSessionType === 'work') {
            // Skip work session - go to break
            this.completedSessions++;
            this.sessionCount++;

            // Determine break type based on break type preference
            if (this.breakType === 'short') {
                nextSessionType = 'shortBreak';
            } else if (this.breakType === 'long') {
                nextSessionType = 'longBreak';
            } else {
                // Normal cycle
                if (this.sessionCount % 4 === 0) {
                    nextSessionType = 'longBreak';
                } else {
                    nextSessionType = 'shortBreak';
                }
            }

            const breakType = nextSessionType === 'longBreak' ? 'long break' : 'short break';
            notificationTitle = 'Work Session Skipped';
            notificationMessage = `Moving to ${breakType}! ${nextSessionType === 'longBreak' ? '🌟' : '☕'}`;
        } else {
            // Skip break session - go to work
            nextSessionType = 'work';
            notificationTitle = 'Break Skipped';
            notificationMessage = 'Back to work! Time to focus! 🎯';
        }

        // Update session type and timer
        this.currentSessionType = nextSessionType;
        this.setTimerForCurrentSession();
        this.updateDisplay();
        this.updateProgressRing();
        this.updateSessionDisplay();

        this.showNotification(notificationTitle, notificationMessage);
        this.saveStats();
        this.saveSettings();
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

        // Auto-start next session if enabled
        if ((this.currentSessionType !== 'work' && this.autoBreak) ||
            (this.currentSessionType === 'work' && this.autoWork)) {
            setTimeout(() => {
                this.startTimer();
            }, 2000); // 2 second delay
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateProgressRing() {
        if (!this.progressCircle || !this.circumference) return;

        const progress = (this.totalTime - this.currentTime) / this.totalTime;
        const offset = this.circumference - (progress * this.circumference);
        this.progressCircle.style.strokeDashoffset = offset;
    }

    updateSessionDisplay() {
        const sessionTypeMap = {
            'work': 'Focus Time',
            'shortBreak': 'Short Break',
            'longBreak': 'Long Break'
        };

        this.sessionType.textContent = sessionTypeMap[this.currentSessionType];
        this.sessionNumber.textContent = this.completedSessions + 1;

        // Update stats if elements exist
        if (this.completedSessionsDisplay) {
            this.completedSessionsDisplay.textContent = this.completedSessions;
        }
        if (this.totalTimeDisplay) {
            const hours = Math.floor(this.totalTimeSpent / 3600);
            const minutes = Math.floor((this.totalTimeSpent % 3600) / 60);
            this.totalTimeDisplay.textContent = `${hours}h ${minutes}m`;
        }
    }

    async showNotification(title, body) {
        // Use Web Notifications API for mobile
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, { body, icon: 'assets/icon.png' });
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    new Notification(title, { body, icon: 'assets/icon.png' });
                }
            }
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
        const saved = localStorage.getItem('pomodoroStats');
        if (saved) {
            const stats = JSON.parse(saved);
            this.completedSessions = stats.completedSessions || 0;
            this.totalTimeSpent = stats.totalTimeSpent || 0;
            this.sessionCount = stats.sessionCount || 0;
        }
    }

    // Goals functionality (simplified for mobile)
    setupGoalEventListeners() {
        if (this.addGoalBtn) {
            this.addGoalBtn.addEventListener('click', () => this.showAddGoalForm());
        }
        if (this.saveGoalBtn) {
            this.saveGoalBtn.addEventListener('click', () => this.saveGoal());
        }
        if (this.cancelGoalBtn) {
            this.cancelGoalBtn.addEventListener('click', () => this.hideAddGoalForm());
        }
        if (this.goalInput) {
            this.goalInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.saveGoal();
            });
        }
    }

    showAddGoalForm() {
        if (this.addGoalForm) {
            this.addGoalForm.style.display = 'block';
            this.goalInput.focus();
        }
    }

    hideAddGoalForm() {
        if (this.addGoalForm) {
            this.addGoalForm.style.display = 'none';
            this.goalInput.value = '';
        }
    }

    saveGoal() {
        const goalText = this.goalInput.value.trim();
        if (goalText) {
            const goal = {
                id: this.goalIdCounter++,
                text: goalText,
                completed: false,
                createdAt: new Date().toISOString()
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
        if (!this.goalsList) return;

        if (this.goals.length === 0) {
            if (this.noGoalsMessage) {
                this.noGoalsMessage.style.display = 'block';
            }
            this.goalsList.innerHTML = '';
            return;
        }

        if (this.noGoalsMessage) {
            this.noGoalsMessage.style.display = 'none';
        }

        this.goalsList.innerHTML = this.goals.map(goal => `
            <div class="goal-item ${goal.completed ? 'completed' : ''}">
                <input type="checkbox" ${goal.completed ? 'checked' : ''} 
                       onchange="timer.toggleGoal(${goal.id})">
                <span class="goal-text">${this.escapeHtml(goal.text)}</span>
                <button class="delete-goal" onclick="timer.deleteGoal(${goal.id})">&times;</button>
            </div>
        `).join('');
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
        const saved = localStorage.getItem('pomodoroGoals');
        if (saved) {
            this.goals = JSON.parse(saved);
            this.goalIdCounter = Math.max(...this.goals.map(g => g.id), 0) + 1;
        }
    }

    setupThemeEventListener() {
        if (this.modalThemeSelector) {
            this.modalThemeSelector.addEventListener('change', (e) => {
                this.changeTheme(e.target.value);
            });
        }
    }

    changeTheme(themeName) {
        this.currentTheme = themeName;
        document.documentElement.setAttribute('data-theme', themeName);
        this.updateProgressRingColors();
        this.saveTheme();
    }

    updateProgressRingColors() {
        const themes = {
            neon: { primary: '#00d4ff', secondary: '#c77dff' },
            classic: { primary: '#ff6b6b', secondary: '#4ecdc4' },
            forest: { primary: '#2ecc71', secondary: '#27ae60' },
            sunset: { primary: '#f39c12', secondary: '#e67e22' },
            ocean: { primary: '#3498db', secondary: '#2980b9' }
        };

        const theme = themes[this.currentTheme] || themes.neon;

        if (this.progressCircle) {
            this.progressCircle.style.stroke = theme.primary;
        }
    }

    saveTheme() {
        localStorage.setItem('pomodoroTheme', this.currentTheme);
    }

    loadTheme() {
        const saved = localStorage.getItem('pomodoroTheme');
        if (saved) {
            this.currentTheme = saved;
            this.changeTheme(this.currentTheme);
        } else {
            this.changeTheme('neon');
        }
    }

    initializeProgressRing() {
        setTimeout(() => {
            if (this.progressCircle && this.progressCircle.r && this.progressCircle.r.baseVal) {
                const radius = this.progressCircle.r.baseVal.value;
                this.circumference = 2 * Math.PI * radius;
                this.progressCircle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
                this.progressCircle.style.strokeDashoffset = this.circumference;
                this.updateProgressRing();
                this.updateProgressRingColors();
            }
        }, 100);
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    loadingScreen.remove();
                }, 500);
            }
        }, 800);
    }

    saveSettings() {
        const settings = {
            workDuration: this.workDuration,
            shortBreakDuration: this.shortBreakDuration,
            longBreakDuration: this.longBreakDuration,
            currentSessionType: this.currentSessionType,
            sessionCount: this.sessionCount,
            breakType: this.breakType,
            autoBreak: this.autoBreak,
            autoWork: this.autoWork,
            hotkeys: this.hotkeys
        };
        localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('pomodoroSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.workDuration = settings.workDuration || 25;
            this.shortBreakDuration = settings.shortBreakDuration || 5;
            this.longBreakDuration = settings.longBreakDuration || 15;
            this.currentSessionType = settings.currentSessionType || 'work';
            this.sessionCount = settings.sessionCount || 0;
            this.breakType = settings.breakType || 'normal';
            this.autoBreak = settings.autoBreak || false;
            this.autoWork = settings.autoWork || false;
            this.hotkeys = settings.hotkeys || {
                startPause: 'Space',
                reset: 'R',
                settings: 'Comma',
                addGoal: 'G'
            };
        }
    }

    playNotificationSound() {
        // Simple beep sound for mobile
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio not supported');
        }
    }

    showClearSessionsConfirmation() {
        const confirmed = confirm(
            'Clear all session data?\n\n' +
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
        this.completedSessions = 0;
        this.totalTimeSpent = 0;
        this.sessionCount = 0;
        this.saveStats();
        this.updateSessionDisplay();
        this.showNotification('Sessions Cleared', 'All session data has been cleared! 🗑️');
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

    // Simplified hotkey system for mobile (optional)
    setupHotkeyListeners() {
        // Basic keyboard shortcuts (simplified for mobile)
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' ||
                this.settingsModal.classList.contains('show')) {
                return;
            }

            const key = this.getKeyString(e);

            if (key === this.hotkeys.startPause) {
                e.preventDefault();
                this.toggleTimer();
            } else if (key === this.hotkeys.reset) {
                e.preventDefault();
                this.resetTimer();
            } else if (key === this.hotkeys.settings) {
                e.preventDefault();
                this.openSettingsModal();
            }
        });

        // Load hotkeys into inputs if they exist
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
            'Comma': 'Comma'
        };

        if (keyMap[key]) {
            key = keyMap[key];
        } else if (key.startsWith('Key')) {
            key = key.replace('Key', '');
        }

        return modifiers.length > 0 ? `${modifiers.join('+')}+${key}` : key;
    }

    updateHotkeyInputs() {
        // Update hotkey inputs if they exist
        if (this.hotkeyStartPause) this.hotkeyStartPause.value = this.hotkeys.startPause;
        if (this.hotkeyReset) this.hotkeyReset.value = this.hotkeys.reset;
        if (this.hotkeySettings) this.hotkeySettings.value = this.hotkeys.settings;
        if (this.hotkeyAddGoal) this.hotkeyAddGoal.value = this.hotkeys.addGoal;
    }
}

// Initialize the timer when the page loads
let timer;
document.addEventListener('DOMContentLoaded', () => {
    timer = new PomodoroTimer();
}); 