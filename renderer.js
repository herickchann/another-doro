// Unified renderer for both desktop and mobile environments
import { Environment } from './src/utils/environment.js';
import { Storage } from './src/utils/storage.js';
import { SESSION_TYPES, UI_TIMING } from './src/utils/constants.js';
import { DOM_IDS, getElementById } from './src/utils/domConstants.js';
import { CONFIRMATIONS } from './src/utils/strings.js';
import { NotificationService } from './src/services/NotificationService.js';
import { AudioService } from './src/services/AudioService.js';
import { TimerCore } from './src/components/Timer/TimerCore.js';
import { TimerDisplay } from './src/components/Timer/TimerDisplay.js';
import { SettingsModal } from './src/components/UI/SettingsModal.js';
import { NavigationDrawer } from './src/components/UI/NavigationDrawer.js';
import { SessionHistoryDisplay } from './src/components/UI/SessionHistoryDisplay.js';
import { GoalsManager } from './src/components/UI/GoalsManager.js';
import { StatsDisplay } from './src/components/UI/StatsDisplay.js';
import { ThemeManager } from './src/components/UI/ThemeManager.js';
import { HotkeyManager } from './src/components/UI/HotkeyManager.js';
import { LoadingScreen } from './src/components/UI/LoadingScreen.js';
import { TrayManager } from './src/components/Electron/TrayManager.js';
import { ConfirmModal } from './src/components/UI/ConfirmModal.js';

class PomodoroApp {
    constructor() {
        // Core components
        this.timer = null;
        this.display = null;

        // UI components
        this.settingsModal = null;
        this.navigationDrawer = null;
        this.sessionHistoryDisplay = null;
        this.goalsManager = null;
        this.statsDisplay = null;
        this.themeManager = null;
        this.hotkeyManager = null;
        this.loadingScreen = null;

        // Platform-specific components
        this.trayManager = null;

        // State
        this.isInitialized = false;
        this.currentSettings = {};
        this.currentStats = {};
        this.currentGoals = [];
        this.currentTheme = '';

        this.initializeApp();
    }

    async initializeApp() {
        try {
            console.log(`Initializing AnotherDoro in ${Environment.environment} mode...`);

            // Initialize services
            console.log('Initializing services...');
            await this.initializeServices();

            // Load data
            console.log('Loading data...');
            await this.loadData();

            // Initialize components
            console.log('Initializing components...');
            this.initializeComponents();

            // Setup event listeners
            console.log('Setting up event listeners...');
            this.setupEventListeners();

            // Apply theme
            console.log('Applying theme...');
            this.applyTheme(this.currentTheme);

            // Electron-only features (devtools toggle, update listeners)
            await this.initializeElectronFeatures();

            // Hide loading screen
            console.log('Hiding loading screen...');
            setTimeout(() => {
                this.hideLoadingScreen();
            }, UI_TIMING.LOADING_SCREEN_DURATION);

            this.isInitialized = true;
            console.log('AnotherDoro initialized successfully');

        } catch (error) {
            console.error('Failed to initialize app:', error);
            console.error('Error stack:', error.stack);
            this.showFallbackMessage();
        }
    }

    async initializeServices() {
        // Initialize notification service
        await NotificationService.initialize();

        // Initialize audio service
        await AudioService.initialize(this.currentSettings);

        console.log('Services initialized:', {
            notifications: NotificationService.getStatus(),
            audio: AudioService.getStatus()
        });
    }

    async loadData() {
        // Load settings
        this.currentSettings = Storage.loadSettings();

        // Load stats and align session count with history
        this.currentStats = Storage.loadStats();
        this.syncSessionCountFromHistory();

        // Load goals
        this.currentGoals = Storage.loadGoals();

        // Load theme
        this.currentTheme = Storage.loadTheme();

        console.log('Data loaded:', {
            settings: Object.keys(this.currentSettings),
            stats: this.currentStats,
            goalsCount: this.currentGoals.length,
            theme: this.currentTheme
        });
    }

    initializeComponents() {
        try {
            // Initialize loading screen first
            console.log('Creating LoadingScreen...');
            this.loadingScreen = new LoadingScreen();

            // Initialize core timer components
            console.log('Creating TimerCore with settings:', this.currentSettings);
            this.timer = new TimerCore(this.currentSettings);
            console.log('TimerCore created, updating stats...');
            this.timer.updateStats(this.currentStats);
            console.log('Timer state:', this.timer.state);

            // Initialize timer display
            console.log('Finding app container...');
            const appContainer = document.querySelector('.app-container') || document.body;
            console.log('App container found:', !!appContainer);

            console.log('Creating TimerDisplay...');
            this.display = new TimerDisplay(appContainer);
            console.log('TimerDisplay created, initializing with state...');
            this.display.initialize(this.timer.state, this.timer);
            console.log('TimerDisplay initialized');

            // Initialize UI components
            console.log('Creating UI components...');
            this.settingsModal = new SettingsModal(this);
            this.navigationDrawer = new NavigationDrawer(this);
            this.sessionHistoryDisplay = new SessionHistoryDisplay(this);
            this.sessionHistoryDisplay.initialize();
            this.goalsManager = new GoalsManager();
            this.goalsManager.initialize(this.currentGoals, this.timer.state.sessionType);
            this.statsDisplay = new StatsDisplay();
            this.statsDisplay.initialize(this.currentStats);
            this.themeManager = new ThemeManager();
            this.themeManager.initialize(this.currentTheme);

            // Initialize hotkey manager if supported
            if (Environment.capabilities.hasKeyboardShortcuts) {
                console.log('Creating HotkeyManager...');
                this.hotkeyManager = new HotkeyManager();
                this.hotkeyManager.initialize(this.currentSettings.hotkeys);
                this.setupHotkeyActions();
            }

            // Initialize platform-specific components
            if (Environment.isElectron()) {
                console.log('Creating TrayManager...');
                this.trayManager = new TrayManager();
                this.trayManager.initialize();
                this.trayManager.bindToTimer(this.timer);
            }

            // Set up global references for HTML onclick handlers
            window.goalsManager = this.goalsManager;
            window.statsDisplay = this.statsDisplay;
            window.themeManager = this.themeManager;

            console.log('Components initialized successfully');
        } catch (error) {
            console.error('Failed to initialize components:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Timer core events
        this.timer.on('timer:tick', (data) => {
            this.display.updateTime(data.currentTime);
            this.display.updateProgress(data.progress, this.timer.state.sessionType);
            this.updateTrayTitle();
        });

        this.timer.on('duration:changed', () => {
            this.display.durationControl?.syncFromTimer();
            this.refreshSessionUI();
        });

        this.timer.on('timer:updated', () => {
            this.refreshSessionUI();
        });

        this.timer.on('timer:started', (data) => {
            this.display.updateButtonStates(true, false);
            this.updateTrayTitle();
        });

        this.timer.on('timer:paused', (data) => {
            this.display.updateButtonStates(false, true);
            this.updateTrayTitle();
        });

        this.timer.on('timer:reset', (data) => {
            this.refreshSessionUI();
            this.updateTrayTitle();
        });

        this.timer.on('session:completed', async (data) => {
            // Show notification
            await NotificationService.showTimerComplete(data.previousSessionType, data.nextSessionType);

            // Play sound
            await AudioService.play();

            // Update display
            this.refreshSessionUI();

            // Save stats
            this.currentStats = {
                completedSessions: data.completedSessions,
                totalTimeSpent: data.totalTimeSpent,
                sessionCount: data.sessionCount
            };
            Storage.saveStats(this.currentStats);
            this.statsDisplay.updateStats(this.currentStats);
            this.recordSession(data.previousSessionType, data.sessionDurationSeconds, 'completed');

            this.updateTrayTitle();
        });

        this.timer.on('session:skipped', async (data) => {
            // Show notification
            await NotificationService.showSessionSkipped(data.previousSessionType, data.nextSessionType);

            // Update display
            this.refreshSessionUI();

            // Save stats if work session was skipped
            if (data.previousSessionType === SESSION_TYPES.WORK) {
                this.currentStats = {
                    completedSessions: data.completedSessions,
                    totalTimeSpent: this.currentStats.totalTimeSpent,
                    sessionCount: data.sessionCount
                };
                Storage.saveStats(this.currentStats);
                this.statsDisplay.updateStats(this.currentStats);
            }

            this.recordSession(data.previousSessionType, data.sessionDurationSeconds, 'skipped');
        });

        this.timer.on('session:reset', async (data) => {
            await NotificationService.showSessionReset();
            this.refreshSessionUI();
        });

        this.timer.on('stats:cleared', (data) => {
            this.currentStats = data;
            Storage.saveStats(this.currentStats);
            Storage.clearSessionHistory();
            this.syncSessionCountFromHistory();
            this.statsDisplay.updateStats(this.currentStats);
            this.sessionHistoryDisplay?.refresh();
            this.refreshSessionUI();
        });

        // Display events
        this.display.onStartPause(() => {
            if (this.timer.isRunning) {
                this.timer.pause();
            } else {
                this.timer.start();
            }
        });

        this.display.onReset(() => {
            this.timer.resetSession();
        });

        this.display.onSkip(() => {
            this.timer.skip();
        });

        // Window/document events
        this.setupWindowEventListeners();
    }

    setupHotkeyActions() {
        if (!this.hotkeyManager) return;

        this.hotkeyManager.registerAction('startPause', () => this.runIfShortcutAllowed(() => this.toggleTimer()));
        this.hotkeyManager.registerAction('reset', () => this.runIfShortcutAllowed(() => this.resetTimer()));
        this.hotkeyManager.registerAction('settings', () => this.runIfShortcutAllowed(() => this.openSettings()));
        this.hotkeyManager.registerAction('addGoal', () => this.runIfShortcutAllowed(() => this.addGoal()));
    }

    runIfShortcutAllowed(action) {
        if (HotkeyManager.shouldBlockAppShortcuts()) {
            return;
        }
        action();
    }

    toggleTimer() {
        if (!this.timer) return;

        if (this.timer.isRunning) {
            this.timer.pause();
        } else {
            this.timer.start();
        }
    }

    resetTimer() {
        if (this.timer) {
            this.timer.resetSession();
        }
    }

    openSettings() {
        if (this.settingsModal) {
            this.settingsModal.open();
        }
    }

    refreshSessionUI() {
        if (!this.timer || !this.display) {
            return;
        }

        const state = this.timer.state;
        this.display.updateState(state);
        this.goalsManager?.setSessionType(state.sessionType);
    }

    recordSession(sessionType, durationSeconds, source) {
        const isWork = sessionType === SESSION_TYPES.WORK;
        const record = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: sessionType,
            completedAt: new Date().toISOString(),
            durationSeconds: Math.max(0, durationSeconds || 0),
            source
        };

        if (isWork) {
            const goals = this.goalsManager?.getGoals() || [];
            record.sessionNumber = Storage.getCompletedWorkSessionCount() + 1;
            record.goals = goals.map((goal) => ({
                id: goal.id,
                text: goal.text,
                completed: goal.completed
            }));
        }

        Storage.appendSessionRecord(record);

        if (isWork) {
            this.syncSessionCountFromHistory();
            this.goalsManager?.clearCompleted();
        }

        this.sessionHistoryDisplay?.refresh();
        this.refreshSessionUI();
    }

    syncSessionCountFromHistory() {
        const workSessionCount = Storage.getCompletedWorkSessionCount();
        this.currentStats = {
            ...this.currentStats,
            sessionCount: workSessionCount,
            completedSessions: workSessionCount
        };

        if (this.timer) {
            this.timer.sessionCount = workSessionCount;
        }

        Storage.saveStats(this.currentStats);
    }

    async clearAllSessions() {
        const config = Environment.isMobile()
            ? CONFIRMATIONS.CLEAR_SESSIONS_MOBILE
            : CONFIRMATIONS.CLEAR_SESSIONS;

        const confirmed = await ConfirmModal.show(config);
        if (!confirmed) {
            return;
        }

        try {
            this.timer.clearStats();
            await NotificationService.showSessionsCleared();
        } catch (error) {
            console.error('Failed to clear sessions:', error);
        }
    }

    addGoal() {
        if (this.timer?.state?.sessionType !== SESSION_TYPES.WORK) {
            return;
        }

        if (this.goalsManager) {
            this.goalsManager.showAddGoalForm();
        }
    }

    setupMenuActionListeners() {
        if (!Environment.canUseIPC()) return;

        Environment.onIPC('open-settings', () => this.runIfShortcutAllowed(() => this.openSettings()));
        Environment.onIPC('toggle-timer', () => this.runIfShortcutAllowed(() => this.toggleTimer()));
        Environment.onIPC('reset-timer', () => this.runIfShortcutAllowed(() => this.resetTimer()));
        Environment.onIPC('add-goal', () => this.runIfShortcutAllowed(() => this.addGoal()));
    }

    setupWindowEventListeners() {
        // Handle window focus/blur for better UX
        window.addEventListener('focus', () => {
            document.body.style.opacity = '1';
            // Ensure progress ring is properly displayed when window gains focus
            setTimeout(() => {
                this.display.updateProgress(this.timer.state.progress, this.timer.state.sessionType);
            }, 50);
        });

        window.addEventListener('blur', () => {
            document.body.style.opacity = '0.9';
        });

        // Handle document visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // App became visible, ensure display is properly rendered
                setTimeout(() => {
                    this.refreshSessionUI();
                }, 100);
            }
        });
    }

    async initializeElectronFeatures() {
        if (!Environment.canUseIPC()) return;

        try {
            this.setupMenuActionListeners();

            // Initialize DevTools toggle if in development
            if (Environment.isDevelopment()) {
                this.initializeDevTools();
            }

            // Initialize update service if available
            if (Environment.canAutoUpdate()) {
                await this.initializeUpdateService();
            }

        } catch (error) {
            console.warn('Failed to initialize Electron features:', error);
        }
    }

    initializeDevTools() {
        const devtoolsToggle = getElementById(DOM_IDS.DEVTOOLS_TOGGLE);
        if (devtoolsToggle) {
            devtoolsToggle.style.display = 'flex';
            devtoolsToggle.addEventListener('click', async () => {
                try {
                    await Environment.invokeIPC('toggle-devtools');
                } catch (error) {
                    console.error('Failed to toggle DevTools:', error);
                }
            });
        }
    }

    async initializeUpdateService() {
        // Set up update event listeners
        Environment.onIPC('update-status', (status, data) => {
            this.handleUpdateStatus(status, data);
        });
    }

    handleUpdateStatus(status, data) {
        // Handle update status changes
        console.log('Update status:', status, data);

        // Forward to settings modal if it exists and is open
        if (this.settingsModal) {
            this.settingsModal.handleUpdateStatus(status, data);
        }
    }

    // Theme management (delegated to ThemeManager)
    applyTheme(themeName) {
        if (this.themeManager) {
            this.themeManager.applyTheme(themeName);
            this.currentTheme = themeName;
        }
    }

    // Stats display update (delegated to StatsDisplay)
    updateStatsDisplay() {
        if (this.statsDisplay) {
            this.statsDisplay.updateStats(this.currentStats);
        }
    }

    // Tray title update (delegated to TrayManager)
    async updateTrayTitle() {
        if (this.trayManager) {
            await this.trayManager.updateTimerDisplay(
                this.timer.currentTime,
                this.timer.isRunning,
                this.timer.isPaused
            );
        }
    }

    // Loading screen management (delegated to LoadingScreen)
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.hide();
        }
    }

    showFallbackMessage() {
        if (this.loadingScreen) {
            this.loadingScreen.showError('Failed to load. Please refresh the page.');
        }
    }

    // Goals functionality (delegated to GoalsManager)
    removeGoal(goalId) {
        if (this.goalsManager) {
            this.goalsManager.removeGoal(goalId);
            this.currentGoals = this.goalsManager.getGoals();
        }
    }

    // Cleanup
    destroy() {
        // Core components
        if (this.timer) {
            this.timer.destroy();
        }
        if (this.display) {
            this.display.destroy();
        }

        // UI components
        if (this.goalsManager) {
            this.goalsManager.destroy();
        }
        if (this.statsDisplay) {
            this.statsDisplay.destroy();
        }
        if (this.themeManager) {
            this.themeManager.destroy();
        }
        if (this.hotkeyManager) {
            this.hotkeyManager.destroy();
        }
        if (this.loadingScreen) {
            this.loadingScreen.destroy();
        }

        // Platform-specific components
        if (this.trayManager) {
            this.trayManager.destroy();
        }

        // Services
        AudioService.destroy();

        // Clear global references
        window.goalsManager = null;
        window.statsDisplay = null;
        window.themeManager = null;
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating PomodoroApp...');
    try {
        app = new PomodoroApp();
        // Global reference for debugging
        window.app = app;
        console.log('PomodoroApp created successfully');
    } catch (error) {
        console.error('Failed to create PomodoroApp:', error);

        // Show error message instead of loading screen
        const loadingScreen = getElementById(DOM_IDS.LOADING_SCREEN);
        if (loadingScreen) {
            const loadingText = loadingScreen.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = `Error: ${error.message}`;
                loadingText.style.color = '#ff6b6b';
            }
        }
    }
});

// Fallback: Force hide loading screen after 10 seconds
setTimeout(() => {
    const loadingScreen = getElementById(DOM_IDS.LOADING_SCREEN);
    if (loadingScreen && loadingScreen.style.display !== 'none') {
        console.warn('Loading screen timeout - forcing hide');
        loadingScreen.style.display = 'none';
    }
}, 10000);