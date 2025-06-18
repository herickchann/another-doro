// Unified renderer for both desktop and mobile environments
import { Environment } from './src/utils/environment.js';
import { Storage } from './src/utils/storage.js';
import { UI_TIMING } from './src/utils/constants.js';
import { NotificationService } from './src/services/NotificationService.js';
import { AudioService } from './src/services/AudioService.js';
import { TimerCore } from './src/components/Timer/TimerCore.js';
import { TimerDisplay } from './src/components/Timer/TimerDisplay.js';
import { SettingsModal } from './src/components/UI/SettingsModal.js';
import { GoalsManager } from './src/components/UI/GoalsManager.js';
import { StatsDisplay } from './src/components/UI/StatsDisplay.js';
import { ThemeManager } from './src/components/UI/ThemeManager.js';
import { HotkeyManager } from './src/components/UI/HotkeyManager.js';
import { LoadingScreen } from './src/components/UI/LoadingScreen.js';
import { TrayManager } from './src/components/Electron/TrayManager.js';

class PomodoroApp {
    constructor() {
        // Core components
        this.timer = null;
        this.display = null;

        // UI components
        this.settingsModal = null;
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

        // Load stats
        this.currentStats = Storage.loadStats();

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
            this.display.initialize(this.timer.state);
            console.log('TimerDisplay initialized');

            // Initialize UI components
            console.log('Creating UI components...');
            this.settingsModal = new SettingsModal(this);
            this.goalsManager = new GoalsManager();
            this.goalsManager.initialize(this.currentGoals);
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

        this.timer.on('timer:started', (data) => {
            this.display.updateButtonStates(true, false);
            this.updateTrayTitle();
        });

        this.timer.on('timer:paused', (data) => {
            this.display.updateButtonStates(false, true);
            this.updateTrayTitle();
        });

        this.timer.on('timer:reset', (data) => {
            this.display.updateState(this.timer.state);
            this.updateTrayTitle();
        });

        this.timer.on('session:completed', async (data) => {
            // Show notification
            await NotificationService.showTimerComplete(data.previousSessionType, data.nextSessionType);

            // Play sound
            await AudioService.play();

            // Update display
            this.display.updateState(this.timer.state);

            // Save stats
            this.currentStats = {
                completedSessions: data.completedSessions,
                totalTimeSpent: data.totalTimeSpent,
                sessionCount: data.sessionCount
            };
            Storage.saveStats(this.currentStats);
            this.statsDisplay.updateStats(this.currentStats);

            this.updateTrayTitle();
        });

        this.timer.on('session:skipped', async (data) => {
            // Show notification
            await NotificationService.showSessionSkipped(data.previousSessionType, data.nextSessionType);

            // Update display
            this.display.updateState(this.timer.state);

            // Save stats if work session was skipped
            if (data.previousSessionType === 'work') {
                this.currentStats = {
                    completedSessions: data.completedSessions,
                    totalTimeSpent: this.currentStats.totalTimeSpent,
                    sessionCount: data.sessionCount
                };
                Storage.saveStats(this.currentStats);
                this.statsDisplay.updateStats(this.currentStats);
            }
        });

        this.timer.on('session:reset', async (data) => {
            await NotificationService.showSessionReset();
            this.display.updateState(this.timer.state);
        });

        this.timer.on('stats:cleared', (data) => {
            this.currentStats = data;
            Storage.saveStats(this.currentStats);
            this.statsDisplay.updateStats(this.currentStats);
            this.display.updateState(this.timer.state);
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

        // Register hotkey actions
        this.hotkeyManager.registerAction('startPause', () => {
            if (this.timer.isRunning) {
                this.timer.pause();
            } else {
                this.timer.start();
            }
        });

        this.hotkeyManager.registerAction('reset', () => {
            this.timer.resetSession();
        });

        this.hotkeyManager.registerAction('settings', () => {
            if (this.settingsModal) {
                this.settingsModal.open();
            }
        });

        this.hotkeyManager.registerAction('addGoal', () => {
            if (this.goalsManager) {
                this.goalsManager.showAddGoalForm();
            }
        });
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
                    this.display.updateState(this.timer.state);
                }, 100);
            }
        });
    }



    async initializeElectronFeatures() {
        if (!Environment.canUseIPC()) return;

        try {
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
        const devtoolsToggle = document.getElementById('devtoolsToggle');
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
        Environment.onIPC('update-status', (event, status, data) => {
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
        const loadingScreen = document.getElementById('loadingScreen');
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
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen && loadingScreen.style.display !== 'none') {
        console.warn('Loading screen timeout - forcing hide');
        loadingScreen.style.display = 'none';
    }
}, 10000);